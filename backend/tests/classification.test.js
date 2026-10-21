const test = require("node:test");
const assert = require("node:assert");
const {
  validateAndNormalizeLLMOutput,
  classifyComplaint,
} = require("../services/classificationService");

const MOCK_CATEGORIES = [
  { name: "sampah", description: "Kebersihan dan persampahan" },
  { name: "jalan_rusak", description: "Infrastruktur jalan" },
  { name: "banjir", description: "Banjir dan drainase" },
  { name: "listrik", description: "Penerangan dan listrik" },
  { name: "air_bersih", description: "Air bersih PDAM" },
  { name: "keamanan", description: "Ketertiban dan keamanan" },
  { name: "kesehatan", description: "Layanan kesehatan" },
  { name: "pendidikan", description: "Sarana pendidikan" },
  { name: "lainnya", description: "Pengaduan umum" },
];

const MOCK_DEPARTMENTS = [
  { code: "DLH", name: "Dinas Lingkungan Hidup" },
  { code: "PUPR", name: "Dinas Pekerjaan Umum & Tata Air" },
  { code: "DISHUB", name: "Dinas Perhubungan & Penerangan" },
  { code: "SATPOLPP", name: "Satuan Polisi Pamong Praja" },
  { code: "DINKES", name: "Dinas Kesehatan" },
  { code: "DISDIK", name: "Dinas Pendidikan" },
  { code: "KELURAHAN", name: "Sekretariat Kelurahan" },
];

test("Classification - Valid structured LLM output is parsed correctly", () => {
  const sampleLLMOutput = JSON.stringify({
    category: "jalan_rusak",
    secondaryCategories: ["keamanan"],
    suggestedDepartment: "PUPR",
    suggestedPriority: "tinggi",
    reason: "Jalan berlubang besar membahayakan pengendara motor di malam hari.",
    confidence: 88,
    needsHumanReview: false,
  });

  const result = validateAndNormalizeLLMOutput(
    sampleLLMOutput,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.category, "jalan_rusak");
  assert.deepStrictEqual(result.secondaryCategories, ["keamanan"]);
  assert.strictEqual(result.suggestedDepartment, "PUPR");
  assert.strictEqual(result.suggestedPriority, "tinggi");
  assert.strictEqual(result.confidence, 88);
  assert.strictEqual(result.needsHumanReview, false);
});

test("Classification - Hallucinated or unknown category falls back to 'lainnya' and flags for human review", () => {
  const sampleWithFakeCategory = JSON.stringify({
    category: "alien_invasion", // Hallucinated
    suggestedDepartment: "PUPR",
    suggestedPriority: "normal",
    confidence: 90,
    needsHumanReview: false,
  });

  const result = validateAndNormalizeLLMOutput(
    sampleWithFakeCategory,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.category, "lainnya");
  assert.strictEqual(result.needsHumanReview, true);
});

test("Classification - Hallucinated department falls back to 'KELURAHAN' and flags for human review", () => {
  const sampleWithFakeDept = JSON.stringify({
    category: "sampah",
    suggestedDepartment: "KEMENTERIAN_SIHIR", // Hallucinated
    suggestedPriority: "normal",
    confidence: 85,
    needsHumanReview: false,
  });

  const result = validateAndNormalizeLLMOutput(
    sampleWithFakeDept,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.suggestedDepartment, "KELURAHAN");
  assert.strictEqual(result.needsHumanReview, true);
});

test("Classification - Invalid priority falls back to 'normal'", () => {
  const sampleWithInvalidPriority = JSON.stringify({
    category: "sampah",
    suggestedDepartment: "DLH",
    suggestedPriority: "ultra_super_urgent", // Invalid
    confidence: 80,
    needsHumanReview: false,
  });

  const result = validateAndNormalizeLLMOutput(
    sampleWithInvalidPriority,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.suggestedPriority, "normal");
  assert.strictEqual(result.needsHumanReview, true);
});

test("Classification - Low confidence (< 60%) automatically flags for human review", () => {
  const sampleLowConf = JSON.stringify({
    category: "listrik",
    suggestedDepartment: "DISHUB",
    suggestedPriority: "normal",
    confidence: 45, // Below 60% threshold
    needsHumanReview: false,
  });

  const result = validateAndNormalizeLLMOutput(
    sampleLowConf,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.confidence, 45);
  assert.strictEqual(result.needsHumanReview, true);
});

test("Classification - Handles markdown-wrapped JSON cleanly", () => {
  const markdownWrapped = `Berikut adalah hasil analisis pengaduan:
\`\`\`json
{
  "category": "banjir",
  "suggestedDepartment": "PUPR",
  "suggestedPriority": "darurat",
  "reason": "Air setinggi 1 meter merendam rumah warga.",
  "confidence": 92,
  "needsHumanReview": false
}
\`\`\`
Semoga membantu penanganan cepat.`;

  const result = validateAndNormalizeLLMOutput(
    markdownWrapped,
    MOCK_CATEGORIES,
    MOCK_DEPARTMENTS
  );

  assert.strictEqual(result.category, "banjir");
  assert.strictEqual(result.suggestedPriority, "darurat");
  assert.strictEqual(result.confidence, 92);
});

test("Classification - Provider failure safely returns fallback without crashing application", async () => {
  // If API key is missing or network fails, classifyComplaint must return safe object marked for manual review
  const fallback = await classifyComplaint(
    "Ada sampah menumpuk",
    "Sampah sudah 3 hari tidak diangkut",
    null
  );

  assert.ok(fallback);
  assert.strictEqual(fallback.category, "lainnya");
  assert.strictEqual(fallback.needsHumanReview, true);
  assert.strictEqual(fallback.status, "needs_manual_review");
  assert.strictEqual(fallback.classificationSource, "manual_fallback");
  // Verification: Keyword matching is NOT quietly invoked!
  assert.notStrictEqual(fallback.modelVersion, "keyword-v1.0");
});
