/**
 * AI Complaint Classification Service
 *
 * Utilizes Real LLM via Kios API to classify civic complaints into
 * structured categories, departments, and priority recommendations.
 * Enforces strict validation, confidence scoring, and manual review flagging.
 * No silent keyword-matching fallback.
 */

const { KIOSAPI_CONFIG, callKiosChatCompletion } = require("../config/kiosApi");

// Authoritative Fallback Definition if DB is temporarily unreachable
const DEFAULT_CATEGORIES = [
  { name: "sampah", description: "Pengelolaan sampah, kebersihan lingkungan, TPS, limbah" },
  { name: "jalan_rusak", description: "Kerusakan jalan raya, aspal bolong, trotoar, jembatan" },
  { name: "banjir", description: "Banjir, genangan air hujan, saluran air tersumbat, drainase meluap" },
  { name: "listrik", description: "Gangguan listrik PLN, pemadaman, kabel bahaya, lampu jalan mati" },
  { name: "air_bersih", description: "Distribusi air PDAM macet, air keruh, pipa bocor" },
  { name: "keamanan", description: "Kamtibmas, pencurian, pungli, premanisme, tawuran, patroli" },
  { name: "kesehatan", description: "Pelayanan puskesmas, posyandu, sanitasi, wabah, ambulans" },
  { name: "pendidikan", description: "Fasilitas sekolah, sarana belajar mengajar, gedung kelas rusak" },
  { name: "lainnya", description: "Pengaduan umum administratif atau masalah di luar kategori spesifik" },
];

const DEFAULT_DEPARTMENTS = [
  { code: "DLH", name: "Dinas Lingkungan Hidup" },
  { code: "PUPR", name: "Dinas Pekerjaan Umum & Tata Air" },
  { code: "DISHUB", name: "Dinas Perhubungan & Penerangan" },
  { code: "SATPOLPP", name: "Satuan Polisi Pamong Praja" },
  { code: "DINKES", name: "Dinas Kesehatan" },
  { code: "DISDIK", name: "Dinas Pendidikan" },
  { code: "KELURAHAN", name: "Sekretariat Kelurahan" },
];

const VALID_PRIORITIES = ["rendah", "normal", "tinggi", "darurat"];
const CONFIDENCE_THRESHOLD = 60; // Di bawah 60% ditandai perlu tinjauan manusia

/**
 * Fetch active categories and departments from database if available
 */
async function getActiveContext(pool) {
  if (!pool) {
    return {
      categories: DEFAULT_CATEGORIES,
      departments: DEFAULT_DEPARTMENTS,
    };
  }

  try {
    const [catRes, deptRes] = await Promise.all([
      pool.query("SELECT name, description FROM categories WHERE is_active = TRUE"),
      pool.query("SELECT code, name, description FROM departments"),
    ]);

    return {
      categories: catRes.rows.length > 0 ? catRes.rows : DEFAULT_CATEGORIES,
      departments: deptRes.rows.length > 0 ? deptRes.rows : DEFAULT_DEPARTMENTS,
    };
  } catch (err) {
    console.warn("⚠️ Warning: Gagal membaca kategori/departemen dari DB, menggunakan data default:", err.message);
    return {
      categories: DEFAULT_CATEGORIES,
      departments: DEFAULT_DEPARTMENTS,
    };
  }
}

/**
 * Sanitize and validate LLM output JSON
 */
function validateAndNormalizeLLMOutput(rawText, validCategories, validDepartments) {
  let parsed = null;

  try {
    // Attempt direct parse
    parsed = JSON.parse(rawText);
  } catch (_) {
    // Extract first JSON block enclosed in { ... }
    const match = rawText.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (jsonErr) {
        throw new Error("Gagal mengurai respons JSON dari model: " + jsonErr.message);
      }
    } else {
      throw new Error("Format keluaran LLM bukan JSON yang valid.");
    }
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("Keluaran LLM kosong atau tidak bertipe objek.");
  }

  const allowedCatNames = validCategories.map((c) => c.name.toLowerCase());
  const allowedDeptCodes = validDepartments.map((d) => d.code.toUpperCase());

  // 1. Category validation
  let category = String(parsed.category || "").toLowerCase().trim();
  let needsHumanReview = Boolean(parsed.needsHumanReview);

  if (!allowedCatNames.includes(category)) {
    // Hallucinated or unknown category -> route to 'lainnya' and flag for review
    category = "lainnya";
    needsHumanReview = true;
  }

  // 2. Department validation
  let suggestedDepartment = String(parsed.suggestedDepartment || "").toUpperCase().trim();
  const matchedDept = validDepartments.find(
    (d) => d.code.toUpperCase() === suggestedDepartment || d.name.toLowerCase() === suggestedDepartment.toLowerCase()
  );

  if (matchedDept) {
    suggestedDepartment = matchedDept.code;
  } else {
    // Hallucinated department -> set to default KELURAHAN
    suggestedDepartment = "KELURAHAN";
    needsHumanReview = true;
  }

  // 3. Priority validation
  let suggestedPriority = String(parsed.suggestedPriority || "normal").toLowerCase().trim();
  if (!VALID_PRIORITIES.includes(suggestedPriority)) {
    suggestedPriority = "normal";
    needsHumanReview = true;
  }

  // 4. Confidence validation
  let confidence = parseInt(parsed.confidence, 10);
  if (isNaN(confidence)) {
    confidence = 50;
    needsHumanReview = true;
  } else {
    confidence = Math.min(Math.max(confidence, 0), 100);
  }

  if (confidence < CONFIDENCE_THRESHOLD) {
    needsHumanReview = true;
  }

  // 5. Secondary categories
  const secondaryCategories = Array.isArray(parsed.secondaryCategories)
    ? parsed.secondaryCategories
        .map((c) => String(c).toLowerCase().trim())
        .filter((c) => allowedCatNames.includes(c) && c !== category)
    : [];

  return {
    category,
    secondaryCategories,
    suggestedDepartment,
    suggestedPriority,
    reason: String(parsed.reason || "Klasifikasi otomatis oleh LLM").slice(0, 500),
    confidence,
    needsHumanReview,
  };
}

/**
 * Main AI Complaint Classification Function
 * Uses real LLM via Kios API.
 * Never silently falls back to keyword matching.
 *
 * @param {string} title - Judul laporan warga
 * @param {string} description - Deskripsi rinci laporan warga
 * @param {object} [pool=null] - PostgreSQL connection pool
 * @returns {Promise<object>} Result matching SIPW classification schema
 */
async function classifyComplaint(title, description, pool = null) {
  const startTime = Date.now();

  // Combine title and description safely (never include personal user data)
  const reportText = `Judul: ${title || ""}\nDeskripsi: ${description || ""}`.trim();

  const { categories, departments } = await getActiveContext(pool);

  // Format catalog for prompt
  const categoryCatalog = categories
    .map((c) => `- "${c.name}": ${c.description || ""}`)
    .join("\n");

  const departmentCatalog = departments
    .map((d) => `- "${d.code}" (${d.name}): ${d.description || ""}`)
    .join("\n");

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
- "darurat": Bahaya langsung keselamatan jiwa / bencana mendesak (contoh: tiang listrik roboh berasap, banjir bandang setinggi 2 meter, jalan amblas putus).
- "tinggi": Mengganggu fasilitas umum vital secara masif (contoh: lampu merah persimpangan padam total, sampah menumpuk menutup akses jalan).
- "normal": Masalah reguler yang memerlukan perbaikan (contoh: jalan berlubang sedang, sampah belum diangkut 2 hari).
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

  try {
    const llmResponse = await callKiosChatCompletion({
      model: KIOSAPI_CONFIG.classificationModel,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Analisis laporan berikut:\n${reportText}` },
      ],
      temperature: 0.1, // Rendah untuk konsistensi klasifikasi terstruktur
      max_tokens: KIOSAPI_CONFIG.classificationMaxTokens,
      jsonMode: true,
    });

    const validated = validateAndNormalizeLLMOutput(
      llmResponse.content,
      categories,
      departments
    );

    const processingTime = Date.now() - startTime;

    return {
      category: validated.category,
      secondaryCategories: validated.secondaryCategories,
      suggestedDepartment: validated.suggestedDepartment,
      suggestedPriority: validated.suggestedPriority,
      reason: validated.reason,
      confidence: validated.confidence,
      needsHumanReview: validated.needsHumanReview,
      scores: {
        [validated.category]: validated.confidence,
      },
      allScores: [
        { category: validated.category, score: validated.confidence },
        ...validated.secondaryCategories.map((cat) => ({ category: cat, score: Math.round(validated.confidence * 0.7) })),
      ],
      processingTime,
      timestamp: new Date().toISOString(),
      modelVersion: `kiosapi/${llmResponse.model}`,
      classificationSource: "real_llm",
      status: "success",
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;

    console.error("⚠️ AI Classification Error (Kios API):", {
      message: error.message,
      code: error.code,
      status: error.status,
      isQuotaError: error.isQuotaError,
    });

    // Per requirements:
    // Jika model gagal, laporan TETAP DISIMPAN. Tandai klasifikasi sebagai tertunda/perlu pemeriksaan manual.
    // JANGAN mengaktifkan fallback keyword matching secara diam-diam.
    return {
      category: "lainnya",
      secondaryCategories: [],
      suggestedDepartment: "KELURAHAN",
      suggestedPriority: "normal",
      reason: error.isQuotaError
        ? "Kuota AI gratis provider sedang tidak tersedia. Pengaduan ditandai untuk peninjauan manual petugas."
        : "Layanan klasifikasi AI sedang offline. Pengaduan ditandai untuk peninjauan manual petugas.",
      confidence: 0,
      needsHumanReview: true,
      scores: {},
      allScores: [],
      processingTime,
      timestamp: new Date().toISOString(),
      modelVersion: "manual-review-pending",
      classificationSource: "manual_fallback",
      status: "needs_manual_review",
      error: error.message,
    };
  }
}

/**
 * Record feedback / human review result for model evaluation
 */
async function recordFeedback(complaintId, actualCategory, predictedCategory, pool) {
  if (!pool) return { success: false, error: "Pool not available" };

  try {
    const match = actualCategory === predictedCategory;

    await pool.query(
      `INSERT INTO classification_logs 
         (complaint_id, predicted_category, model_version)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING`,
      [complaintId, predictedCategory, `kiosapi/${KIOSAPI_CONFIG.classificationModel}`]
    );

    return {
      success: true,
      match: match,
      accuracy: match ? 100 : 0,
    };
  } catch (error) {
    console.error("Error recording feedback:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Get classification monitoring stats
 */
async function getClassificationStats(pool) {
  if (!pool) return null;
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_classifications,
        ROUND(AVG(confidence_score)::numeric, 1) as avg_confidence,
        COUNT(CASE WHEN confidence_score >= 80 THEN 1 END) as high_confidence,
        COUNT(CASE WHEN confidence_score >= 60 AND confidence_score < 80 THEN 1 END) as medium_confidence,
        COUNT(CASE WHEN confidence_score < 60 OR confidence_score IS NULL THEN 1 END) as low_confidence
      FROM complaints
    `);

    return result.rows[0];
  } catch (error) {
    console.error("Error getting classification stats:", error);
    return null;
  }
}

module.exports = {
  classifyComplaint,
  recordFeedback,
  getClassificationStats,
  validateAndNormalizeLLMOutput,
};
