const test = require("node:test");
const assert = require("node:assert");
const {
  handleCitizenChat,
  getPublicFAQ,
  isTrackingIntent,
} = require("../services/chatService");

test("Chatbot - Tracking intent detection identifies report status queries", () => {
  assert.strictEqual(isTrackingIntent("Bagaimana status laporan saya?"), true);
  assert.strictEqual(isTrackingIntent("Cek pengaduan saya dong"), true);
  assert.strictEqual(isTrackingIntent("Laporan saya #42 sudah diproses belum?"), true);
  assert.strictEqual(isTrackingIntent("Kapan laporan saya ditindaklanjuti?"), true);

  // General questions should NOT be detected as tracking intent
  assert.strictEqual(isTrackingIntent("Bagaimana cara membuat laporan?"), false);
  assert.strictEqual(isTrackingIntent("Apa saja kategori pengaduan di SIPW?"), false);
  assert.strictEqual(isTrackingIntent("Berapa lama batas waktu penanganan SLA?"), false);
});

test("Chatbot - Report tracking inquiry without authentication requires login", async () => {
  const result = await handleCitizenChat({
    message: "Bagaimana status pengaduan saya?",
    history: [],
    user: null, // Unauthenticated visitor
  });

  assert.strictEqual(result.requiresAuth, true);
  assert.ok(result.reply.toLowerCase().includes("masuk") || result.reply.toLowerCase().includes("login"));
  // Verification: Doesn't reveal whether any reports exist
  assert.strictEqual(result.reply.includes("ID #"), false);
});

test("Chatbot - Public FAQ provides authoritative answers for visitors", () => {
  const faqs = getPublicFAQ();
  assert.ok(Array.isArray(faqs));
  assert.ok(faqs.length >= 5);

  const topics = faqs.map((f) => f.topic);
  assert.ok(topics.includes("cara_melapor"));
  assert.ok(topics.includes("kategori_pengaduan"));
  assert.ok(topics.includes("arti_status"));
  assert.ok(topics.includes("penjelasan_sla"));
  assert.ok(topics.includes("fitur_anonim"));
});

test("Chatbot - Empty or whitespace message returns polite greeting and suggestions", async () => {
  const result = await handleCitizenChat({
    message: "   ",
    history: [],
    user: null,
  });

  assert.ok(result.reply.length > 0);
  assert.ok(Array.isArray(result.suggestions));
  assert.ok(result.suggestions.length > 0);
});
