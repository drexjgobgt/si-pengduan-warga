const test = require("node:test");
const assert = require("node:assert");
const {
  KIOSAPI_CONFIG,
  getUsageStats,
  checkAndResetDailyUsage,
} = require("../config/kiosApi");

test("Kios API Config - Default configuration adheres to Free-Only policy", () => {
  assert.strictEqual(typeof KIOSAPI_CONFIG.freeOnly, "boolean");
  assert.strictEqual(KIOSAPI_CONFIG.freeOnly, true);
  assert.strictEqual(typeof KIOSAPI_CONFIG.dailyRequestLimit, "number");
  assert.ok(KIOSAPI_CONFIG.dailyRequestLimit > 0);
  assert.ok(KIOSAPI_CONFIG.classificationModel.includes("free"));
  assert.ok(KIOSAPI_CONFIG.chatModel.includes("free"));
});

test("Kios API Usage Stats - Sanitized and does NOT reveal API key", () => {
  const stats = getUsageStats();
  assert.ok("hasApiKey" in stats);
  assert.ok("usedRequests" in stats);
  assert.ok("dailyLimit" in stats);
  assert.ok("freeOnly" in stats);
  assert.ok("classificationModel" in stats);
  assert.ok("chatModel" in stats);

  // Ensure apiKey is NOT in the public stats
  assert.strictEqual("apiKey" in stats, false);
});

test("Kios API Error Message Sanitization - Redacts API key if present", () => {
  const fakeKey = "kios_live_secret_key_123456789";
  const rawMessage = `Error contacting endpoint with Authorization Bearer ${fakeKey} failed!`;
  const sanitized = rawMessage.replace(new RegExp(fakeKey, "g"), "[REDACTED_API_KEY]");

  assert.ok(!sanitized.includes(fakeKey));
  assert.ok(sanitized.includes("[REDACTED_API_KEY]"));
});
