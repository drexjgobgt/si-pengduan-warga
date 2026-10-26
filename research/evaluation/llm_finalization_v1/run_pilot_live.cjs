/**
 * LIVE PILOT RUNNER — 3 SAMPLES (SIPW LLM FINALIZATION v1)
 * 
 * Target: SIPW-SYN-0001, SIPW-SYN-0031, SIPW-SYN-0061
 * Model: minimax-m3.1-flash-free via Kios API
 */

const fs = require('fs');
const path = require('path');
const { executeEvaluation } = require('./runner.cjs');

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

// Load synthetic dataset & registry
const datasetPath = path.resolve(__dirname, '../synthetic_final_v1/synthetic_dataset.json');
const registryPath = path.resolve(__dirname, '../synthetic_final_v1/synthetic_scenario_registry.json');

const allDataset = JSON.parse(fs.readFileSync(datasetPath, 'utf8'));
const allRegistryRaw = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
const allRegistry = Array.isArray(allRegistryRaw) ? allRegistryRaw : (allRegistryRaw.rows || []);

const pilotIds = ['SIPW-SYN-0001', 'SIPW-SYN-0031', 'SIPW-SYN-0061'];
const pilotDataset = allDataset.filter(d => pilotIds.includes(d.sample_id));
const pilotRegistry = allRegistry.filter(r => pilotIds.includes(r.sample_id));

if (pilotDataset.length !== 3 || pilotRegistry.length !== 3) {
  console.error(`ERROR: Expected 3 pilot samples, got dataset=${pilotDataset.length}, registry=${pilotRegistry.length}`);
  process.exit(1);
}

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

let lastDispatchTime = 0;

async function liveTransportFn(item) {
  // Spacing of at least 15 seconds between requests as specified in protocol
  const now = Date.now();
  const elapsedSinceLast = now - lastDispatchTime;
  if (lastDispatchTime > 0 && elapsedSinceLast < 15000) {
    const waitTime = 15000 - elapsedSinceLast;
    console.log(`[SPACING] Waiting ${(waitTime / 1000).toFixed(1)}s before dispatching ${item.sample_id}...`);
    await new Promise(r => setTimeout(r, waitTime));
  }
  lastDispatchTime = Date.now();

  const complaintText = item.complaint_text || `Judul: ${item.title || ''}\nDeskripsi: ${item.description || ''}`.trim();
  const userContent = `Analisis laporan berikut:\n${complaintText}`;

  const payload = {
    model: configuredModel,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent }
    ],
    temperature: 0.1,
    max_tokens: 500,
    response_format: { type: 'json_object' }
  };

  const endpoint = `${baseUrl}/chat/completions`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);

  console.log(`[DISPATCH] Sending request for ${item.sample_id} to ${endpoint} (model: ${configuredModel})...`);

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
    console.log(`[RESPONSE] ${item.sample_id} HTTP ${res.status}`);

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

    const choice = body?.choices?.[0];
    const rawContent = choice?.message?.content || '';
    const returnedModel = body?.model || configuredModel;

    return {
      model_id: returnedModel,
      http_status: res.status,
      raw_text: rawContent,
      usage: body?.usage || null
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const tErr = new Error('TIMEOUT_20000MS');
      tErr.code = 'TIMEOUT';
      throw tErr;
    }
    throw err;
  }
}

async function run() {
  const outputDir = path.resolve(__dirname, 'pilot_run');
  console.log('=== STARTING 3-SAMPLE LIVE PILOT EVALUATION ===');
  console.log(`Dataset size: ${pilotDataset.length}`);
  console.log(`Output dir: ${outputDir}`);
  console.log(`Model: ${configuredModel}`);

  const evalResult = await executeEvaluation({
    dataset: pilotDataset,
    registry: pilotRegistry,
    outputDir,
    transportFn: liveTransportFn,
    config: { modelId: configuredModel },
    secretToRedact: apiKey
  });

  console.log('=== PILOT EVALUATION EXECUTION COMPLETE ===');
  console.log('Summary:', JSON.stringify(evalResult.summary, null, 2));
  console.log('Metrics:', JSON.stringify({
    total_planned: evalResult.metrics.total_planned,
    total_attempted: evalResult.metrics.total_attempted,
    total_completed: evalResult.metrics.total_completed,
    total_correct: evalResult.metrics.total_correct,
    accuracy: evalResult.metrics.accuracy,
    strict_valid_rate: evalResult.metrics.strict_valid_rate
  }, null, 2));

  // Write detailed pilot report
  const reportPath = path.join(outputDir, 'pilot_report.md');
  const results = evalResult.results;
  
  let reportContent = `# Laporan Hasil Eksekusi Pilot Live LLM (3 Sampel)

**Tanggal/Waktu**: ${new Date().toISOString()}  
**Target Model**: \`${configuredModel}\`  
**Provider**: Kios API (\`${baseUrl}\`)  
**Status Eksekusi**: ${evalResult.summary.terminal_halt ? 'TERMINAL_HALT' : 'COMPLETED'}

---

## 1. Rincian Hasil Per Sampel

| Sample ID | Target Category | Prediksi LLM | Match? | HTTP Status | Durasi (ms) | Schema Valid? | Pure JSON? | Status Rekord |
|---|---|---|:---:|:---:|:---:|:---:|:---:|---|
`;

  for (const r of results) {
    const isMatch = r.predicted_category === r.target_category ? '✅ YES' : '❌ NO';
    const dur = r.duration_ms ? r.duration_ms.toFixed(0) : '-';
    reportContent += `| \`${r.sample_id}\` | \`${r.target_category}\` | \`${r.predicted_category || '-'}\` | ${isMatch} | ${r.http_status || '-'} | ${dur} | ${r.schema_valid ? '✅' : '❌'} | ${r.is_pure_json ? '✅' : '❌'} | \`${r.status}\` |\n`;
  }

  reportContent += `\n## 2. Analisis Output & Verifikasi Payload\n\n`;
  for (const r of results) {
    reportContent += `### Sampel: \`${r.sample_id}\`\n`;
    reportContent += `- **Target**: \`${r.target_category}\`\n`;
    reportContent += `- **Status**: \`${r.status}\` (HTTP ${r.http_status})\n`;
    reportContent += `- **Returned Model**: \`${r.model_id}\`\n`;
    reportContent += `- **Parsed Output**:\n\`\`\`json\n${JSON.stringify(r.parsed_output, null, 2)}\n\`\`\`\n\n`;
  }

  const allHttp200 = results.every(r => r.http_status === 200);
  const allSchemaValid = results.every(r => r.schema_valid);
  const allCompleted = results.every(r => r.status === 'COMPLETED');
  const goDecision = allHttp200 && allSchemaValid && allCompleted && !evalResult.summary.terminal_halt;

  reportContent += `## 3. Keputusan Go / No-Go\n\n`;
  reportContent += `- [${allHttp200 ? 'x' : ' '}] HTTP 200 OK untuk seluruh 3 sampel.\n`;
  reportContent += `- [${allSchemaValid ? 'x' : ' '}] Format JSON valid dengan 7 atribut skema wajib.\n`;
  reportContent += `- [${allCompleted ? 'x' : ' '}] Kategori keluaran berada dalam 9 kategori resmi SIPW.\n`;
  reportContent += `- [${!evalResult.summary.terminal_halt ? 'x' : ' '}] Bebas kegagalan terminal transport / timeout.\n\n`;
  reportContent += `**Keputusan Akhir**: **${goDecision ? 'GO (LULUS PILOT)' : 'NO-GO (GAGAL PILOT)'}**\n`;

  fs.writeFileSync(reportPath, reportContent);
  console.log(`Pilot report saved to: ${reportPath}`);
  console.log(`GO/NO-GO DECISION: ${goDecision ? 'GO' : 'NO-GO'}`);
}

run().catch(err => {
  console.error('CRITICAL PILOT ERROR:', err);
  process.exit(1);
});
