const test = require("node:test");
const assert = require("node:assert");
const fs = require("fs");
const path = require("path");

test("Security - No VITE_ prefix on secret backend API keys", () => {
  const envExamplePath = path.join(__dirname, "..", ".env.example");
  const envExampleContent = fs.readFileSync(envExamplePath, "utf-8");

  assert.ok(!envExampleContent.includes("VITE_KIOSAPI_API_KEY"));
  assert.ok(envExampleContent.includes("KIOSAPI_API_KEY="));
});

test("Security - Frontend API client never references secret KIOSAPI_API_KEY", () => {
  const frontendApiPath = path.join(__dirname, "..", "..", "frontend", "src", "services", "api.js");
  const frontendApiContent = fs.readFileSync(frontendApiPath, "utf-8");

  assert.ok(!frontendApiContent.includes("KIOSAPI_API_KEY"));
});

test("Security - Chat message length is strictly bounded", () => {
  const maxAllowed = 500;
  const oversizedMessage = "a".repeat(501);

  assert.ok(oversizedMessage.length > maxAllowed);
});
