/**
 * LIVE EVALUATION RUNNER — 270 DATASET (SIPW LLM FINALIZATION v1)
 * 
 * Supports batch limits (e.g. Sesi 1: 150 samples), spacing control,
 * incremental checkpointing, fail-closed terminal halts, and strict scoring metrics.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const {
  ALLOWED_CATEGORIES,
  ALLOWED_DEPARTMENTS,
  ALLOWED_PRIORITIES,
  validateSchema,
  parseRawOutput,
  computeMetrics
} = require('./runner.cjs');

// Parse CLI flags
const args = process.argv.slice(2);
let batchLimit = 150; // Default to Sesi 1 (150 samples)
let spacingMs = 4000;  // 4 seconds spacing between dispatches

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--batch-limit' && args[i + 1]) {
    batchLimit = parseInt(args[i + 1], 10);
    i++;
  } else if (args[i] === '--spacing-ms' && args[i + 1]) {
    spacingMs = parseInt(args[i + 1], 10);
    i++;
  }
}

// Read backend .env
const envPath = path.resolve(__dirname, '../../../backend/.env');
if (!fs.existsSync(envPath)) {
  console.error('ERROR: backend/.env not found');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const keyMatch = envContent.match(/^KIOSAPI_API_KEY=(.*)$/m);
if (!keyMatch || !keyMatch[1].trim()) {
  console.error('ERROR: KIOSAPI_API_KEY not found in backend/.env');
  process.exit(1);
}
const apiKey = keyMatch[1].trim();

const baseUrlMatch = envContent.match(/^KIOSAPI_BASE_URL=(.*)$/m);
const baseUrl = (baseUrlMatch ? baseUrlMatch[1].trim() : 'https://kiosapi.com/v1').replace(/\/+$/, '');

const modelMatch = envContent.match(/^KIOSAPI_CLASSIFICATION_MODEL=(.*)$/m);
const configuredModel = modelMatch ? modelMatch[1].trim() : 'minimax-m3.1-flash-free';

// Load dataset & registry
const datasetPath = path.resolve(__dirname, '../synthetic_final_v1/synthetic_dataset.json');
const registryPath = path.resolve(__dirname, '../synthetic_final_v1/synthetic_scenario_registry.json');

const dataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const registryRaw = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const registry = Array.isArray(registryRaw) ? registryRaw : (registryRaw.rows || []);

const targetMap = new Map(registry.map(r => [r.sample_id, r.target_category]));
const digest = (d) => crypto.createHash('sha256').update(d).digest('hex');

const DEFAULT_CATEGORIES = [
  { name: 'sampah', description: 'Pengelolaan sampah, kebersihan lingkungan, TPS, limbah' },
  { name: 'jalan_rusak', description: 'Kerusakan jalan raya, aspal bolong, trotoar, jembatan' },
  { name: 'banjir', description: 'Banjir, genangan air hujan, saluran air tersumbat, drainase meluap' },
  { name: 'listrik', description: 'Gangguan listrik PLN, pemadaman, kabel bahaya, lampu jalan mati' },
  { name: 'air_bersih', description: 'Distribusi air PDAM macet, air keruh, pipa bocor' },
  { name: 'keamanan', description: 'Kamtibmas, pencurian, pungli, premanisme, tawuran, patroli' },
  { name: 'kesehatan', description: 'Pelayanan puskesmas, posyandu, sanitasi, wabah, ambulans' },
  { name: 'pendidikan', description: 'Fasilitas sekolah, sarana belajar mengajar, gedung kelas rusak' },
  { name: 'lainnya', description: 'Pengaduan umum administratif atau masalah di luar kategori spesifik' }
];

const DEFAULT_DEPARTMENTS = [
  { code: 'DLH', name: 'Dinas Lingkungan Hidup' },
  { code: 'PUPR', name: 'Dinas Pekerjaan Umum & Tata Air' },
  { code: 'DISHUB', name: 'Dinas Perhubungan & Penerangan' },
  { code: 'SATPOLPP', name: 'Satuan Polisi Pamong Praja' },
  { code: 'DINKES', name: 'Dinas Kesehatan' },
  { code: 'DISDIK', name: 'Dinas Pendidikan' },
  { code: 'KELURAHAN', name: 'Sekretariat Kelurahan' }
];

const categoryCatalog = DEFAULT_CATEGORIES.map(c => `- "${c.name}": ${c.description}`).join('\n');
const departmentCatalog = DEFAULT_DEPARTMENTS.map(d => `- "${d.code}" (${d.name})`).join('\n');

const systemPrompt = `Anda adalah asisten AI klasifikasi pengaduan warga pada Sistem Informasi Pengaduan Warga (SIPW) di Indonesia.
Tugas Anda adalah menganalisis laporan masyarakat secara objektif dan mengelompokkannya secara akurat.

PANDUAN & ATURAN:
1. Pahami bahasa Indonesia sehari-hari, bahasa daerah populer, salah ketik (typo), kalimat panjang/pendek, dan nada emosional warga.
2. Pilih HANYA SATU kategori utama dari daftar kategori resmi berikut:
${categoryCatalog}
JANGAN PERNAH membuat nama kategori baru di luar daftar di atas. Jika tidak cocok atau ambigu, gunakan "lainnya".

3. Rekomendasikan OPD/Dinas yang berwenang dari daftar kode resmi berikut:
${departmentCatalog}
JANGAN PERNAH membuat kode instansi baru.

4. Rekomendasikan tingkat prioritas penanganan (hanya pilih satu):
- "darurat": Bahaya langsung keselamatan jiwa / bencana mendesak.
- "tinggi": Mengganggu fasilitas umum vital secara masif.
- "normal": Masalah reguler yang memerlukan perbaikan.
- "rendah": Masalah estetika ringan atau keluhan administratif umum.

5. Berikan estimasi keyakinan (confidence) berupa integer antara 0 s.d 100.
6. Tandai "needsHumanReview": true jika laporan ambigu, memiliki banyak masalah yang bertentangan, memiliki indikasi spam, atau tingkat keyakinan Anda < 60.

FORMAT KELUARAN WAJIB JSON (HANYA JSON murni, tanpa pengantar atau markdown lain):
{
  "category": "nama_kategori_resmi",
  "secondaryCategories": ["kategori_tambahan_jika_ada"],
  "suggestedDepartment": "KODE_OPD",
  "suggestedPriority": "rendah|normal|tinggi|darurat",
  "reason": "Alasan singkat dalam 1-2 kalimat bahasa Indonesia baku",
  "confidence": 85,
  "needsHumanReview": false
}`;

async function main() {
  const outputDir = path.resolve(__dirname, 'full_run');
  const reservationDir = path.join(outputDir, 'reservations');
  const resultsDir = path.join(outputDir, 'results');
  fs.mkdirSync(reservationDir, { recursive: true });
  fs.mkdirSync(resultsDir, { recursive: true });

  // Sync completed pilot files if not yet in full_run
  const pilotResultsDir = path.resolve(__dirname, 'pilot_run/results');
  const pilotResDir = path.resolve(__dirname, 'pilot_run/reservations');
  if (fs.existsSync(pilotResultsDir)) {
    for (const f of fs.readdirSync(pilotResultsDir)) {
      const dest = path.join(resultsDir, f);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(pilotResultsDir, f), dest);
      }
    }
  }
  if (fs.existsSync(pilotResDir)) {
    for (const f of fs.readdirSync(pilotResDir)) {
      const dest = path.join(reservationDir, f);
      if (!fs.existsSync(dest)) {
        fs.copyFileSync(path.join(pilotResDir, f), dest);
      }
    }
  }

  const lockPath = path.join(outputDir, '.runner.lock');
  if (fs.existsSync(lockPath)) {
    console.error('ERROR: Runner is currently locked. Another instance is active.');
    process.exit(1);
  }
  fs.writeFileSync(lockPath, JSON.stringify({ pid: process.pid, started_at: new Date().toISOString() }));

  console.log('=== SIPW LIVE EVALUATION RUNNER ===');
  console.log(`Total Planned Samples: ${dataset.length}`);
  console.log(`Configured Model: ${configuredModel}`);
  console.log(`Session Batch Limit: ${batchLimit}`);
  console.log(`Inter-dispatch Spacing: ${spacingMs}ms`);
  console.log(`Output Directory: ${outputDir}`);

  const processedResults = [];
  let terminalHalt = false;
  let haltReason = null;
  let requestsThisSession = 0;
  let lastDispatchTime = 0;

  try {
    for (let idx = 0; idx < dataset.length; idx++) {
      const item = dataset[idx];
      const sampleId = item.sample_id;
      const targetCategory = targetMap.get(sampleId);

      const resKey = digest(sampleId);
      const resFile = path.join(reservationDir, `${resKey}.reservation.json`);
      const resultFile = path.join(resultsDir, `${resKey}.result.json`);

      // 1. If already completed or finalized, load checkpoint
      if (fs.existsSync(resultFile)) {
        const existing = JSON.parse(fs.readFileSync(resultFile, 'utf8'));
        if (['COMPLETED', 'INVALID_SCHEMA', 'PARSE_FAILED'].includes(existing.status)) {
          processedResults.push(existing);
          continue;
        } else {
          // Stale/interrupted record from previous halted run; remove to allow clean retry in resumed session
          fs.unlinkSync(resultFile);
          if (fs.existsSync(resFile)) fs.unlinkSync(resFile);
        }
      }

      // 2. If terminal halt occurred earlier
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

      // 3. Check if session batch limit reached
      const totalAttemptedOrDone = processedResults.filter(r => r.attempted || ['COMPLETED', 'INVALID_SCHEMA', 'PARSE_FAILED'].includes(r.status)).length;
      if (totalAttemptedOrDone >= batchLimit) {
        terminalHalt = true;
        haltReason = `BATCH_LIMIT_${batchLimit}_REACHED_FOR_SESSION`;
        console.log(`[SESSION HALT] Batch limit of ${batchLimit} reached. Halting session cleanly.`);
        processedResults.push({
          sample_id: sampleId,
          target_category: targetCategory,
          attempted: false,
          status: 'UNATTEMPTED_DUE_TO_HALT',
          halt_reason: haltReason
        });
        continue;
      }

      // 4. Check for unhandled stale reservation
      if (fs.existsSync(resFile)) {
        terminalHalt = true;
        haltReason = `UNCERTAIN_PRIOR_RESERVATION_FOR_${sampleId}`;
        console.error(`[HALT] Uncertain prior reservation for ${sampleId}`);
        processedResults.push({
          sample_id: sampleId,
          target_category: targetCategory,
          attempted: false,
          status: 'UNCERTAIN_RESERVATION',
          halt_reason: haltReason
        });
        continue;
      }

      // 5. Reserve slot
      fs.writeFileSync(resFile, JSON.stringify({
        sample_id: sampleId,
        reserved_at: new Date().toISOString(),
        model: configuredModel
      }, null, 2) + '\n');

      // 6. Respect spacing
      const now = Date.now();
      const elapsed = now - lastDispatchTime;
      if (lastDispatchTime > 0 && elapsed < spacingMs) {
        const wait = spacingMs - elapsed;
        await new Promise(r => setTimeout(r, wait));
      }
      lastDispatchTime = Date.now();

      // 7. Dispatch HTTP request
      requestsThisSession++;
      const currentProgress = `[${idx + 1}/${dataset.length}]`;
      console.log(`${currentProgress} Dispatching ${sampleId} (req #${requestsThisSession} in session)...`);

      const complaintText = item.complaint_text || `Judul: ${item.title || ''}\nDeskripsi: ${item.description || ''}`.trim();
      const payload = {
        model: configuredModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Analisis laporan berikut:\n${complaintText}` }
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      };

      const endpoint = `${baseUrl}/chat/completions`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      const startTime = performance.now();

      let transportRes = null;
      let transportErr = null;

      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const resText = await res.text();
        let body = null;
        try {
          body = JSON.parse(resText);
        } catch (_) {}

        if (!res.ok) {
          const errMsg = body?.error?.message || body?.message || `HTTP_${res.status}`;
          const err = new Error(errMsg);
          err.status = res.status;
          throw err;
        }

        transportRes = {
          http_status: res.status,
          model_id: body?.model || configuredModel,
          raw_text: body?.choices?.[0]?.message?.content || '',
          usage: body?.usage || null
        };
      } catch (err) {
        clearTimeout(timeoutId);
        transportErr = err;
      }
      const durationMs = performance.now() - startTime;

      // 8. Process result record
      const record = {
        sample_id: sampleId,
        target_category: targetCategory,
        attempted: true,
        dispatched_at: new Date().toISOString(),
        duration_ms: durationMs,
        model_id: transportRes?.model_id || configuredModel,
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
        record.transport_error = transportErr ? (transportErr.name === 'AbortError' ? 'TIMEOUT_20000MS' : transportErr.message) : `HTTP_${transportRes?.http_status}`;
        record.status = 'TRANSPORT_FAILED';
        terminalHalt = true;
        haltReason = `TERMINAL_TRANSPORT_FAILURE: ${record.transport_error}`;
        console.error(`[HALT] ${sampleId} Transport error: ${record.transport_error}`);
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

      // Redact literal apiKey
      let recordStr = JSON.stringify(record, null, 2);
      if (apiKey) {
        recordStr = recordStr.split(apiKey).join('[REDACTED]');
      }
      const sanitizedRecord = JSON.parse(recordStr);

      fs.writeFileSync(resultFile, recordStr + '\n');
      processedResults.push(sanitizedRecord);

      const matchSign = sanitizedRecord.is_semantic_match ? '✓' : (sanitizedRecord.status === 'COMPLETED' ? '✗' : '!');
      console.log(`   -> [${sanitizedRecord.status}] ${sampleId} pred=${sanitizedRecord.predicted_category || '-'} tgt=${targetCategory} ${matchSign} (${durationMs.toFixed(0)}ms)`);

      // 9. If terminal halt occurred on this item, record remaining as unattempted sentinels
      if (terminalHalt) {
        for (let j = idx + 1; j < dataset.length; j++) {
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

  // Compute metrics with strict P=270 denominator
  const metrics = computeMetrics(processedResults, dataset.length);

  // Write aggregate JSONL
  const jsonlPath = path.join(outputDir, 'llm_predictions.jsonl');
  const jsonlStream = processedResults.map(r => JSON.stringify(r)).join('\n') + '\n';
  fs.writeFileSync(jsonlPath, jsonlStream);

  // Write metrics JSON
  const metricsPath = path.join(outputDir, 'llm_metrics.json');
  fs.writeFileSync(metricsPath, JSON.stringify(metrics, null, 2) + '\n');

  // Write confusion matrix CSV
  const cmCsvPath = path.join(outputDir, 'confusion_matrix_llm.csv');
  const cmCols = [...ALLOWED_CATEGORIES, '__invalid__', '__missing__', '__no_prediction__'];
  let cmCsv = 'actual/predicted,' + cmCols.join(',') + ',total\n';
  for (const t of ALLOWED_CATEGORIES) {
    const row = [t];
    let rowTotal = 0;
    for (const p of cmCols) {
      const count = metrics.confusion_matrix[t]?.[p] || 0;
      row.push(count);
      rowTotal += count;
    }
    row.push(rowTotal);
    cmCsv += row.join(',') + '\n';
  }
  fs.writeFileSync(cmCsvPath, cmCsv);

  // Write category metrics CSV
  const catCsvPath = path.join(outputDir, 'category_metrics_llm.csv');
  let catCsv = 'category,support,tp,fp,fn,predicted,precision,recall,f1\n';
  for (const c of metrics.per_category) {
    catCsv += `${c.category},${c.support},${c.tp},${c.fp},${c.fn},${c.predicted},${c.precision.toFixed(6)},${c.recall.toFixed(6)},${c.f1.toFixed(6)}\n`;
  }
  fs.writeFileSync(catCsvPath, catCsv);

  // Write Summary Markdown
  const summaryPath = path.join(outputDir, 'evaluation_summary.md');
  const completedCount = processedResults.filter(r => r.status === 'COMPLETED').length;
  const attemptedCount = processedResults.filter(r => r.attempted).length;
  const matchCount = processedResults.filter(r => r.is_semantic_match).length;

  const summaryMd = `# Evaluasi Kinerja Large Language Model (${configuredModel})

**Tanggal Evaluasi**: ${new Date().toISOString()}  
**Model**: \`${configuredModel}\`  
**Total Dataset**: 270 sampel terencana  
**Sampel Selesai**: ${completedCount} / 270  
**Sampel Dicoba**: ${attemptedCount} / 270  
**Prediksi Benar (Match)**: ${matchCount}  
**Status Terminal**: ${terminalHalt ? 'TERHENTI (' + haltReason + ')' : 'SELESAI PENUH'}

---

## 1. Metrik Keseluruhan (Denominator P=270)

- **Akurasi Global**: ${(metrics.accuracy * 100).toFixed(2)}% (${metrics.total_correct} / ${metrics.total_planned})
- **Macro Precision**: ${(metrics.macro_precision * 100).toFixed(2)}%
- **Macro Recall**: ${(metrics.macro_recall * 100).toFixed(2)}%
- **Macro F1-Score**: ${(metrics.macro_f1 * 100).toFixed(2)}%
- **Tingkat Validitas Format (Strict Valid Rate)**: ${(metrics.strict_valid_rate * 100).toFixed(2)}% (${metrics.total_strict_valid} / ${processedResults.length})

---

## 2. Kinerja Per Kategori

| Kategori | Target (Support) | TP | FP | FN | Diprediksi | Precision | Recall | F1-Score |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
${metrics.per_category.map(c => `| \`${c.category}\` | ${c.support} | ${c.tp} | ${c.fp} | ${c.fn} | ${c.predicted} | ${(c.precision * 100).toFixed(2)}% | ${(c.recall * 100).toFixed(2)}% | ${(c.f1 * 100).toFixed(2)}% |`).join('\n')}
| **Macro Average** | 270 | - | - | - | ${metrics.per_category.reduce((a, b) => a + b.predicted, 0)} | **${(metrics.macro_precision * 100).toFixed(2)}%** | **${(metrics.macro_recall * 100).toFixed(2)}%** | **${(metrics.macro_f1 * 100).toFixed(2)}%** |

---

## 3. Matriks Konfusi

\`\`\`
${cmCsv}
\`\`\`
`;
  fs.writeFileSync(summaryPath, summaryMd);

  console.log('\n=== EVALUATION BATCH FINISHED ===');
  console.log(`Completed: ${completedCount} / 270`);
  console.log(`Accuracy: ${(metrics.accuracy * 100).toFixed(2)}%`);
  console.log(`Macro F1: ${(metrics.macro_f1 * 100).toFixed(2)}%`);
  console.log(`Summary written to: ${summaryPath}`);
}

main().catch(err => {
  console.error('CRITICAL RUNNER ERROR:', err);
  process.exit(1);
});
