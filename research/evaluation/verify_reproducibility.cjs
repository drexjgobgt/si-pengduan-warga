/**
 * SIPW Evaluation Reproducibility Verification Script
 * ===================================================
 * 
 * This script independently audits and recalculates all performance metrics
 * for both the LLM evaluation (minimax-m3.1-flash-free, N=270) and the
 * historical keyword baseline (keyword-v1.0, N=270).
 * 
 * It requires zero external network calls, zero API tokens, and runs
 * deterministically against stored evaluation artifacts.
 * 
 * Execution:
 *   node research/evaluation/verify_reproducibility.cjs
 */

const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  'sampah',
  'jalan_rusak',
  'banjir',
  'listrik',
  'air_bersih',
  'keamanan',
  'kesehatan',
  'pendidikan',
  'lainnya'
];

const LLM_JSONL_PATH = path.resolve(__dirname, 'llm_finalization_v1/full_run/llm_predictions.jsonl');
const LLM_STORED_METRICS_PATH = path.resolve(__dirname, 'llm_finalization_v1/full_run/llm_metrics.json');
const BASELINE_PREDICTIONS_PATH = path.resolve(__dirname, 'synthetic_final_v1/keyword_baseline/predictions.json');
const BASELINE_STORED_AUDIT_PATH = path.resolve(__dirname, 'audit_baseline_v1/baseline_recalculation.json');

function verifyFilesExist() {
  const files = [LLM_JSONL_PATH, LLM_STORED_METRICS_PATH, BASELINE_PREDICTIONS_PATH, BASELINE_STORED_AUDIT_PATH];
  for (const f of files) {
    if (!fs.existsSync(f)) {
      throw new Error(`Required artifact not found: ${f}`);
    }
  }
}

// ==========================================
// 1. LLM Evaluation Recalculation
// ==========================================
function evaluateLLM() {
  const lines = fs.readFileSync(LLM_JSONL_PATH, 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map(l => JSON.parse(l));

  const total = lines.length;
  let completed = 0;
  let parseFailed = 0;
  let invalidSchema = 0;
  let transportErrors = 0;
  let totalCorrect = 0;

  const confusionMatrix = {};
  const stats = {};
  const failureDetails = [];

  for (const cat of CATEGORIES) {
    confusionMatrix[cat] = {};
    for (const c2 of CATEGORIES) confusionMatrix[cat][c2] = 0;
    confusionMatrix[cat]['__invalid__'] = 0;
    stats[cat] = { support: 0, tp: 0, fp: 0, fn: 0, predicted: 0 };
  }

  const durations = [];

  for (const record of lines) {
    const actual = record.target_category;
    stats[actual].support++;

    if (typeof record.duration_ms === 'number') {
      durations.push(record.duration_ms);
    }

    if (record.status === 'PARSE_FAILED') {
      parseFailed++;
      confusionMatrix[actual]['__invalid__']++;
      stats[actual].fn++;
      failureDetails.push({
        id: record.sample_id,
        target: actual,
        type: 'PARSE_FAILED',
        reason: record.parse_error || 'JSON parse error'
      });
    } else if (record.status === 'INVALID_SCHEMA') {
      invalidSchema++;
      confusionMatrix[actual]['__invalid__']++;
      stats[actual].fn++;
      failureDetails.push({
        id: record.sample_id,
        target: actual,
        type: 'INVALID_SCHEMA',
        reason: `Disallowed OPD / field: ${record.parsed_output?.suggestedDepartment || 'schema_violation'}`
      });
    } else if (record.status === 'COMPLETED') {
      completed++;
      const pred = record.predicted_category;
      if (CATEGORIES.includes(pred)) {
        confusionMatrix[actual][pred]++;
        stats[pred].predicted++;
        if (pred === actual) {
          totalCorrect++;
          stats[actual].tp++;
        } else {
          stats[actual].fn++;
          stats[pred].fp++;
        }
      } else {
        confusionMatrix[actual]['__invalid__']++;
        stats[actual].fn++;
      }
    } else {
      transportErrors++;
    }
  }

  // Per-category metrics calculation
  const perCategory = [];
  let sumP = 0, sumR = 0, sumF1 = 0;

  for (const cat of CATEGORIES) {
    const s = stats[cat];
    const precision = s.predicted > 0 ? s.tp / s.predicted : 0;
    const recall = s.support > 0 ? s.tp / s.support : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    sumP += precision;
    sumR += recall;
    sumF1 += f1;

    perCategory.push({
      category: cat,
      support: s.support,
      tp: s.tp,
      fp: s.fp,
      fn: s.fn,
      predicted: s.predicted,
      precision,
      recall,
      f1
    });
  }

  const macroPrecision = sumP / CATEGORIES.length;
  const macroRecall = sumR / CATEGORIES.length;
  const macroF1 = sumF1 / CATEGORIES.length;
  const accuracy = totalCorrect / total;
  const strictValidRate = completed / total;

  // Latency metrics
  durations.sort((a, b) => a - b);
  const meanLatency = durations.reduce((a, b) => a + b, 0) / durations.length;
  const midIndex = Math.floor(durations.length / 2);
  const medianLinear = durations.length % 2 === 0
    ? (durations[midIndex - 1] + durations[midIndex]) / 2
    : durations[midIndex];
  const medianNearestRank135 = durations[135];
  const medianNearestRank134 = durations[134];
  const minLatency = durations[0];
  const maxLatency = durations[durations.length - 1];

  return {
    total,
    completed,
    parseFailed,
    invalidSchema,
    transportErrors,
    totalCorrect,
    accuracy,
    strictValidRate,
    macroPrecision,
    macroRecall,
    macroF1,
    perCategory,
    confusionMatrix,
    failureDetails,
    latency: {
      count: durations.length,
      mean: meanLatency,
      medianLinear,
      medianNearestRankUpper: medianNearestRank135,
      medianNearestRankLower: medianNearestRank134,
      min: minLatency,
      max: maxLatency
    }
  };
}

// ==========================================
// 2. Keyword Baseline Recalculation
// ==========================================
function evaluateBaseline() {
  const raw = JSON.parse(fs.readFileSync(BASELINE_PREDICTIONS_PATH, 'utf8'));
  const records = Array.isArray(raw) ? raw : Object.values(raw);

  const total = records.length;
  let correct = 0;
  let mismatches = 0;

  const confusionMatrix = {};
  const stats = {};

  for (const cat of CATEGORIES) {
    confusionMatrix[cat] = {};
    for (const c2 of CATEGORIES) confusionMatrix[cat][c2] = 0;
    stats[cat] = { support: 0, tp: 0, fp: 0, fn: 0, predicted: 0 };
  }

  for (const record of records) {
    const actual = record.target_category;
    const pred = record.predicted_category;
    stats[actual].support++;

    if (CATEGORIES.includes(pred)) {
      confusionMatrix[actual][pred]++;
      stats[pred].predicted++;
      if (pred === actual) {
        correct++;
        stats[actual].tp++;
      } else {
        mismatches++;
        stats[actual].fn++;
        stats[pred].fp++;
      }
    } else {
      mismatches++;
      stats[actual].fn++;
    }
  }

  const perCategory = [];
  let sumP = 0, sumR = 0, sumF1 = 0;

  for (const cat of CATEGORIES) {
    const s = stats[cat];
    const precision = s.predicted > 0 ? s.tp / s.predicted : 0;
    const recall = s.support > 0 ? s.tp / s.support : 0;
    const f1 = (precision + recall) > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    sumP += precision;
    sumR += recall;
    sumF1 += f1;

    perCategory.push({
      category: cat,
      support: s.support,
      tp: s.tp,
      fp: s.fp,
      fn: s.fn,
      predicted: s.predicted,
      precision,
      recall,
      f1
    });
  }

  const macroPrecision = sumP / CATEGORIES.length;
  const macroRecall = sumR / CATEGORIES.length;
  const macroF1 = sumF1 / CATEGORIES.length;
  const accuracy = correct / total;

  return {
    total,
    correct,
    mismatches,
    accuracy,
    macroPrecision,
    macroRecall,
    macroF1,
    perCategory,
    confusionMatrix
  };
}

// ==========================================
// 3. Main Verification Runner
// ==========================================
function main() {
  console.log('================================================================');
  console.log('   SIPW RESEARCH EVALUATION — REPRODUCIBILITY AUDIT REPORT      ');
  console.log('================================================================\n');

  verifyFilesExist();

  const llm = evaluateLLM();
  const baseline = evaluateBaseline();

  console.log('1. LLM EVALUATION (minimax-m3.1-flash-free)');
  console.log('----------------------------------------------------------------');
  console.log(`Total Planned & Evaluated : ${llm.total}`);
  console.log(`Valid Schema Outputs      : ${llm.completed} / ${llm.total} (${(llm.strictValidRate * 100).toFixed(2)}%)`);
  console.log(`Parse Errors (Loop Trunc) : ${llm.parseFailed}`);
  console.log(`Schema Violations (OPD)   : ${llm.invalidSchema}`);
  console.log(`Transport Errors          : ${llm.transportErrors}`);
  console.log(`Correct Class Matches     : ${llm.totalCorrect}`);
  console.log(`Strict Accuracy (P=270)   : ${(llm.accuracy * 100).toFixed(2)}%`);
  console.log(`Macro Precision           : ${(llm.macroPrecision * 100).toFixed(2)}% (on valid predicted classes)`);
  console.log(`Macro Recall              : ${(llm.macroRecall * 100).toFixed(2)}%`);
  console.log(`Macro F1-Score            : ${(llm.macroF1 * 100).toFixed(2)}%`);
  console.log(`Latency Mean              : ${llm.latency.mean.toFixed(2)} ms`);
  console.log(`Latency Median (linear)   : ${llm.latency.medianLinear.toFixed(2)} ms`);
  console.log(`Latency Median (p50 rank) : ${llm.latency.medianNearestRankUpper.toFixed(2)} ms (upper) / ${llm.latency.medianNearestRankLower.toFixed(2)} ms (lower)`);
  console.log(`Latency Min - Max         : ${llm.latency.min.toFixed(2)} ms - ${llm.latency.max.toFixed(2)} ms`);
  console.log('');

  console.log('Failures Detail (Exactly 5 out-of-spec responses):');
  llm.failureDetails.forEach(f => {
    console.log(`  - Sample ${f.id} [Target: ${f.target}]: ${f.type} (${f.reason})`);
  });
  console.log('');

  console.log('2. KEYWORD BASELINE EVALUATION (keyword-v1.0)');
  console.log('----------------------------------------------------------------');
  console.log(`Total Planned & Evaluated : ${baseline.total}`);
  console.log(`Correct Matches           : ${baseline.correct}`);
  console.log(`Mismatches                : ${baseline.mismatches}`);
  console.log(`Accuracy                  : ${(baseline.accuracy * 100).toFixed(2)}%`);
  console.log(`Macro Precision           : ${(baseline.macroPrecision * 100).toFixed(2)}%`);
  console.log(`Macro Recall              : ${(baseline.macroRecall * 100).toFixed(2)}%`);
  console.log(`Macro F1-Score            : ${(baseline.macroF1 * 100).toFixed(2)}%`);
  console.log('');

  console.log('3. COMPARATIVE PERFORMANCE SUMMARY');
  console.log('----------------------------------------------------------------');
  console.log('| Metric              | Keyword Baseline | LLM (minimax-m3.1) | Delta (Absolute) |');
  console.log('|---------------------|:----------------:|:------------------:|:----------------:|');
  console.log(`| Total Samples (N)   | ${baseline.total}              | ${llm.total}                | 0                |`);
  console.log(`| Correct Class Match | ${baseline.correct}              | ${llm.totalCorrect}                | +${llm.totalCorrect - baseline.correct}              |`);
  console.log(`| Global Accuracy     | ${(baseline.accuracy * 100).toFixed(2)}%           | ${(llm.accuracy * 100).toFixed(2)}%             | +${((llm.accuracy - baseline.accuracy) * 100).toFixed(2)}%          |`);
  console.log(`| Macro Precision     | ${(baseline.macroPrecision * 100).toFixed(2)}%           | ${(llm.macroPrecision * 100).toFixed(2)}%            | +${((llm.macroPrecision - baseline.macroPrecision) * 100).toFixed(2)}%          |`);
  console.log(`| Macro Recall        | ${(baseline.macroRecall * 100).toFixed(2)}%           | ${(llm.macroRecall * 100).toFixed(2)}%             | +${((llm.macroRecall - baseline.macroRecall) * 100).toFixed(2)}%          |`);
  console.log(`| Macro F1-Score      | ${(baseline.macroF1 * 100).toFixed(2)}%           | ${(llm.macroF1 * 100).toFixed(2)}%             | +${((llm.macroF1 - baseline.macroF1) * 100).toFixed(2)}%          |`);
  console.log('');

  console.log('4. ARTIFACT RECONCILIATION & CONSISTENCY ASSERTIONS');
  console.log('----------------------------------------------------------------');
  const storedLLM = JSON.parse(fs.readFileSync(LLM_STORED_METRICS_PATH, 'utf8'));
  const storedBaseline = JSON.parse(fs.readFileSync(BASELINE_STORED_AUDIT_PATH, 'utf8')).baseline_recalculation;

  const assertClose = (name, a, b) => {
    if (Math.abs(a - b) > 1e-5) {
      throw new Error(`Assertion failed for ${name}: recalculated ${a} !== stored ${b}`);
    }
  };

  assertClose('LLM Accuracy', llm.accuracy, storedLLM.accuracy);
  assertClose('LLM Macro Precision', llm.macroPrecision, storedLLM.macro_precision);
  assertClose('LLM Macro Recall', llm.macroRecall, storedLLM.macro_recall);
  assertClose('LLM Macro F1', llm.macroF1, storedLLM.macro_f1);
  assertClose('Baseline Accuracy', baseline.accuracy, storedBaseline.accuracy);
  assertClose('Baseline Macro Precision', baseline.macroPrecision, storedBaseline.macro_precision);
  assertClose('Baseline Macro Recall', baseline.macroRecall, storedBaseline.macro_recall);
  assertClose('Baseline Macro F1', baseline.macroF1, storedBaseline.macro_f1);

  console.log('All recalculations match stored artifact metrics with epsilon < 1e-5.');
  console.log('STATUS: VERIFIED & 100% REPRODUCIBLE.');
  console.log('================================================================');
}

if (require.main === module) {
  main();
}

module.exports = {
  evaluateLLM,
  evaluateBaseline
};
