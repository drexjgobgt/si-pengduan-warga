/**
 * RUNNER EVALUASI MANDIRI — SIPW LLM FINALIZATION v1
 * 
 * Implementasi runner evaluasi fail-closed, inkremental, dan durabel.
 * Terisolasi penuh dari runtime produksi. Bebas koneksi jaringan eksternal.
 * Mendukung transport mock lokal untuk pengujian offline dan verifikasi regresi.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_CATEGORIES = Object.freeze([
  'sampah',
  'jalan_rusak',
  'banjir',
  'listrik',
  'air_bersih',
  'keamanan',
  'kesehatan',
  'pendidikan',
  'lainnya'
]);

const ALLOWED_DEPARTMENTS = Object.freeze([
  'DLH',
  'PUPR',
  'DISHUB',
  'SATPOLPP',
  'DINKES',
  'DISDIK',
  'KELURAHAN'
]);

const ALLOWED_PRIORITIES = Object.freeze([
  'rendah',
  'normal',
  'tinggi',
  'darurat'
]);

const digest = (data) => crypto.createHash('sha256').update(data).digest('hex');

const sanitizeObject = (obj, secretPattern) => {
  if (Array.isArray(obj)) return obj.map((x) => sanitizeObject(x, secretPattern));
  if (obj && typeof obj === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(obj)) {
      if (/authorization|api.?key|password|secret|cookie|token/i.test(k)) {
        continue;
      }
      clean[k] = sanitizeObject(v, secretPattern);
    }
    return clean;
  }
  if (typeof obj === 'string' && secretPattern) {
    return obj.split(secretPattern).join('[REDACTED]');
  }
  return obj;
};

function validateSchema(parsed) {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return { valid: false, reason: 'NOT_AN_OBJECT' };
  }

  const has = (k) => Object.prototype.hasOwnProperty.call(parsed, k);

  if (!has('category') || typeof parsed.category !== 'string' || !ALLOWED_CATEGORIES.includes(parsed.category)) {
    return { valid: false, reason: 'INVALID_CATEGORY_FIELD' };
  }

  if (
    !has('secondaryCategories') ||
    !Array.isArray(parsed.secondaryCategories) ||
    !parsed.secondaryCategories.every((c) => typeof c === 'string' && ALLOWED_CATEGORIES.includes(c)) ||
    new Set(parsed.secondaryCategories).size !== parsed.secondaryCategories.length ||
    parsed.secondaryCategories.includes(parsed.category)
  ) {
    return { valid: false, reason: 'INVALID_SECONDARY_CATEGORIES' };
  }

  if (
    !has('suggestedDepartment') ||
    typeof parsed.suggestedDepartment !== 'string' ||
    !ALLOWED_DEPARTMENTS.includes(parsed.suggestedDepartment)
  ) {
    return { valid: false, reason: 'INVALID_SUGGESTED_DEPARTMENT' };
  }

  if (
    !has('suggestedPriority') ||
    typeof parsed.suggestedPriority !== 'string' ||
    !ALLOWED_PRIORITIES.includes(parsed.suggestedPriority)
  ) {
    return { valid: false, reason: 'INVALID_SUGGESTED_PRIORITY' };
  }

  if (
    !has('reason') ||
    typeof parsed.reason !== 'string' ||
    parsed.reason.trim().length === 0 ||
    parsed.reason.length > 500
  ) {
    return { valid: false, reason: 'INVALID_REASON_FIELD' };
  }

  if (
    !has('confidence') ||
    !Number.isInteger(parsed.confidence) ||
    parsed.confidence < 0 ||
    parsed.confidence > 100
  ) {
    return { valid: false, reason: 'INVALID_CONFIDENCE_FIELD' };
  }

  if (!has('needsHumanReview') || typeof parsed.needsHumanReview !== 'boolean') {
    return { valid: false, reason: 'INVALID_NEEDS_HUMAN_REVIEW_FIELD' };
  }

  return { valid: true };
}

function parseRawOutput(rawText) {
  if (typeof rawText !== 'string' || !rawText.trim()) {
    return { parsed: null, parse_mode: 'empty', is_pure_json: false };
  }

  try {
    const val = JSON.parse(rawText.trim());
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return { parsed: val, parse_mode: 'pure_json', is_pure_json: true };
    }
  } catch (_) {}

  const block = rawText.match(/\{[\s\S]*\}/);
  if (block) {
    try {
      const val = JSON.parse(block[0]);
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return { parsed: val, parse_mode: 'recovered_block', is_pure_json: false };
      }
    } catch (_) {}
  }

  return { parsed: null, parse_mode: 'parse_failed', is_pure_json: false };
}

function computeMetrics(results, totalPlanned = 270) {
  const categories = ALLOWED_CATEGORIES;
  const matrix = {};
  for (const t of categories) {
    matrix[t] = {};
    for (const p of [...categories, '__invalid__', '__missing__', '__no_prediction__']) {
      matrix[t][p] = 0;
    }
  }

  let totalCorrect = 0;
  let totalMismatches = 0;
  let totalTransportErrors = 0;
  let totalParseErrors = 0;
  let totalInvalidOutputs = 0;
  let totalStrictValid = 0;

  for (const r of results) {
    const target = r.target_category;
    let predCol;

    if (!r.attempted) {
      predCol = '__no_prediction__';
    } else if (r.transport_error) {
      predCol = '__missing__';
      totalTransportErrors++;
    } else if (r.parse_error) {
      predCol = '__invalid__';
      totalParseErrors++;
    } else if (!r.schema_valid) {
      predCol = '__invalid__';
      totalInvalidOutputs++;
    } else {
      predCol = r.predicted_category;
      if (r.is_pure_json && r.schema_valid && r.http_status === 200) {
        totalStrictValid++;
      }
    }

    if (matrix[target]) {
      matrix[target][predCol] = (matrix[target][predCol] || 0) + 1;
    }

    if (predCol === target) {
      totalCorrect++;
    } else {
      totalMismatches++;
    }
  }

  const perCategory = categories.map((c) => {
    const tp = matrix[c][c] || 0;
    const support = Object.values(matrix[c]).reduce((a, b) => a + b, 0);
    const predicted = categories.reduce((sum, t) => sum + (matrix[t][c] || 0), 0);
    const fp = predicted - tp;
    const fn = support - tp;
    const precision = predicted > 0 ? tp / predicted : 0;
    const recall = support > 0 ? tp / support : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;
    return {
      category: c,
      support,
      tp,
      fp,
      fn,
      predicted,
      precision,
      recall,
      f1
    };
  });

  const macroPrecision = perCategory.reduce((a, b) => a + b.precision, 0) / categories.length;
  const macroRecall = perCategory.reduce((a, b) => a + b.recall, 0) / categories.length;
  const macroF1 = perCategory.reduce((a, b) => a + b.f1, 0) / categories.length;
  const accuracy = totalPlanned > 0 ? totalCorrect / totalPlanned : 0;

  return {
    total_planned: totalPlanned,
    total_attempted: results.filter((r) => r.attempted).length,
    total_completed: results.filter((r) => r.status === 'COMPLETED').length,
    total_correct: totalCorrect,
    total_mismatches: totalMismatches,
    total_transport_errors: totalTransportErrors,
    total_parse_errors: totalParseErrors,
    total_invalid_outputs: totalInvalidOutputs,
    total_strict_valid: totalStrictValid,
    strict_valid_rate: results.length > 0 ? totalStrictValid / results.length : 0,
    accuracy,
    macro_precision: macroPrecision,
    macro_recall: macroRecall,
    macro_f1: macroF1,
    per_category: perCategory,
    confusion_matrix: matrix
  };
}

async function executeEvaluation({
  dataset,
  registry,
  outputDir,
  transportFn,
  config = {},
  secretToRedact = null
}) {
  if (!Array.isArray(dataset) || !Array.isArray(registry)) {
    throw new Error('INVALID_DATASET_OR_REGISTRY_INPUT');
  }

  if (typeof transportFn !== 'function') {
    throw new Error('TRANSPORT_FUNCTION_REQUIRED');
  }

  const plannedTotal = dataset.length;
  fs.mkdirSync(outputDir, { recursive: true });

  const lockPath = path.join(outputDir, '.runner.lock');
  if (fs.existsSync(lockPath)) {
    throw new Error('RUNNER_LOCKED_ANOTHER_INSTANCE_ACTIVE');
  }

  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));

  const targetMap = new Map(registry.map((r) => [r.sample_id, r.target_category]));
  const reservationDir = path.join(outputDir, 'reservations');
  const resultsDir = path.join(outputDir, 'results');
  fs.mkdirSync(reservationDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  const processedResults = [];
  let terminalHalt = false;
  let haltReason = null;

  try {
    for (const item of dataset) {
      const sampleId = item.sample_id;
      const targetCategory = targetMap.get(sampleId);

      if (!targetCategory || !ALLOWED_CATEGORIES.includes(targetCategory)) {
        throw new Error(`MISSING_OR_INVALID_TARGET_CATEGORY_FOR_${sampleId}`);
      }

      const resKey = digest(sampleId);
      const resFile = path.join(reservationDir, `${resKey}.reservation.json`);
      const resultFile = path.join(resultsDir, `${resKey}.result.json`);

      if (fs.existsSync(resultFile)) {
        const existing = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        processedResults.push(existing);
        continue;
      }

      if (terminalHalt) {
        processedResults.push({
          sample_id: sampleId,
          target_category: targetCategory,
          attempted: false,
          status: 'UNATTEMPTED_DUE_TO_HALT',
          halt_reason: haltReason
        });
        continue;
      }

      if (fs.existsSync(resFile)) {
        terminalHalt = true;
        haltReason = `UNCERTAIN_PRIOR_RESERVATION_NO_REPLAY_FOR_${sampleId}`;
        processedResults.push({
          sample_id: sampleId,
          target_category: targetCategory,
          attempted: false,
          status: 'UNCERTAIN_RESERVATION',
          halt_reason: haltReason
        });
        continue;
      }

      const reservationData = {
        sample_id: sampleId,
        reserved_at: new Date().toISOString(),
        config_model: config.modelId || 'minimax-m3.1-flash-free'
      };
      fs.writeFileSync(resFile, JSON.stringify(reservationData, null, 2) + '\n');

      const startTime = performance.now();
      let transportRes = null;
      let transportErr = null;

      try {
        transportRes = await transportFn({
          sample_id: sampleId,
          title: item.title,
          description: item.description,
          complaint_text: item.complaint_text
        });
      } catch (err) {
        transportErr = err;
      }
      const durationMs = performance.now() - startTime;

      const record = {
        sample_id: sampleId,
        target_category: targetCategory,
        attempted: true,
        dispatched_at: new Date().toISOString(),
        duration_ms: durationMs,
        model_id: transportRes?.model_id || config.modelId || null,
        http_status: transportRes?.http_status || null,
        transport_error: null,
        parse_error: null,
        schema_valid: false,
        is_pure_json: false,
        raw_text: transportRes?.raw_text ? transportRes.raw_text.slice(0, 4096) : null,
        parsed_output: null,
        predicted_category: null,
        usage: transportRes?.usage || null,
        status: 'PENDING'
      };

      if (transportErr || !transportRes || transportRes.http_status !== 200) {
        record.transport_error = transportErr ? transportErr.message : `HTTP_${transportRes?.http_status || 'UNKNOWN'}`;
        record.status = 'TRANSPORT_FAILED';
        terminalHalt = true;
        haltReason = `TERMINAL_TRANSPORT_FAILURE: ${record.transport_error}`;
      } else {
        const parseRes = parseRawOutput(transportRes.raw_text);
        record.is_pure_json = parseRes.is_pure_json;

        if (!parseRes.parsed) {
          record.parse_error = parseRes.parse_mode;
          record.status = 'PARSE_FAILED';
        } else {
          record.parsed_output = parseRes.parsed;
          const schemaRes = validateSchema(parseRes.parsed);
          record.schema_valid = schemaRes.valid;

          if (!schemaRes.valid) {
            record.status = 'INVALID_SCHEMA';
            record.schema_error = schemaRes.reason;
          } else {
            record.predicted_category = parseRes.parsed.category;
            record.status = 'COMPLETED';
            record.is_semantic_match = parseRes.parsed.category === targetCategory;
          }
        }
      }

      const sanitizedRecord = sanitizeObject(record, secretToRedact);
      fs.writeFileSync(resultFile, JSON.stringify(sanitizedRecord, null, 2) + '\n');
      processedResults.push(sanitizedRecord);

      if (terminalHalt) {
        const currentIndex = dataset.indexOf(item);
        for (let j = currentIndex + 1; j < dataset.length; j++) {
          const remItem = dataset[j];
          processedResults.push({
            sample_id: remItem.sample_id,
            target_category: targetMap.get(remItem.sample_id),
            attempted: false,
            status: 'UNATTEMPTED_DUE_TO_HALT',
            halt_reason: haltReason
          });
        }
        break;
      }
    }
  } finally {
    if (fs.existsSync(lockPath)) {
      fs.unlinkSync(lockPath);
    }
  }

  const metrics = computeMetrics(processedResults, plannedTotal);

  return {
    summary: {
      total_dataset: plannedTotal,
      total_processed: processedResults.length,
      terminal_halt: terminalHalt,
      halt_reason: haltReason
    },
    metrics,
    results: processedResults
  };
}

module.exports = {
  ALLOWED_CATEGORIES,
  ALLOWED_DEPARTMENTS,
  ALLOWED_PRIORITIES,
  validateSchema,
  parseRawOutput,
  computeMetrics,
  executeEvaluation
};
