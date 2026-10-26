/**
 * UNIT TESTS FOR REMEDIATED ADAPTER AUTHORIZATION
 * 
 * Verifies that paid, unknown, substring-spoofed, and unconfigured models
 * are strictly rejected before any network request can occur.
 */

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  ALLOWED_FREE_MODELS,
  ALLOWED_ENDPOINTS,
  KiosApiSecurityError,
  sanitizeLogMessage,
  validateModelAuthorization
} = require('./kiosApi_remediated.js');

const dummyKey = 'test_key_placeholder';
const validEndpoint = 'https://kiosapi.com/v1';

test('1. Authorizes explicitly allowed free model with valid configuration', () => {
  const result = validateModelAuthorization({
    model: 'minimax-m3.1-flash-free',
    apiKey: dummyKey,
    baseUrl: validEndpoint,
    freeOnly: true
  });

  assert.equal(result.authorized, true);
  assert.equal(result.model, 'minimax-m3.1-flash-free');
  assert.equal(result.baseUrl, validEndpoint);
});

test('2. Rejects commercial paid models fail-closed before any dispatch', () => {
  const paidModels = ['gpt-4o', 'claude-3-5-sonnet', 'deepseek-chat', 'gemini-1.5-pro'];

  for (const model of paidModels) {
    assert.throws(
      () =>
        validateModelAuthorization({
          model,
          apiKey: dummyKey,
          baseUrl: validEndpoint,
          freeOnly: true
        }),
      (err) => {
        assert(err instanceof KiosApiSecurityError);
        assert.equal(err.code, 'PAID_OR_UNAUTHORIZED_MODEL_BLOCKED');
        return true;
      }
    );
  }
});

test('3. Rejects deceptive models containing substring "free" if not in allowlist', () => {
  const spoofedModels = [
    'gpt-4o-free-tier',
    'claude-free-unlimited',
    'minimax-m3.1-pro-free',
    'malicious-free-model'
  ];

  for (const model of spoofedModels) {
    assert.throws(
      () =>
        validateModelAuthorization({
          model,
          apiKey: dummyKey,
          baseUrl: validEndpoint,
          freeOnly: true
        }),
      (err) => {
        assert(err instanceof KiosApiSecurityError);
        assert.equal(err.code, 'PAID_OR_UNAUTHORIZED_MODEL_BLOCKED');
        return true;
      }
    );
  }
});

test('4. Rejects missing API key with configuration error code', () => {
  assert.throws(
    () =>
      validateModelAuthorization({
        model: 'minimax-m3.1-flash-free',
        apiKey: '',
        baseUrl: validEndpoint,
        freeOnly: true
      }),
    (err) => {
      assert(err instanceof KiosApiSecurityError);
      assert.equal(err.code, 'KIOSAPI_KEY_MISSING');
      assert.equal(err.isConfigError, true);
      return true;
    }
  );
});

test('5. Rejects empty, whitespace, or undefined model identifier', () => {
  const emptyInputs = ['', '   ', null, undefined];

  for (const model of emptyInputs) {
    assert.throws(
      () =>
        validateModelAuthorization({
          model,
          apiKey: dummyKey,
          baseUrl: validEndpoint,
          freeOnly: true
        }),
      (err) => {
        assert(err instanceof KiosApiSecurityError);
        assert.equal(err.code, 'MODEL_REQUIRED');
        return true;
      }
    );
  }
});

test('6. Rejects unapproved base URL endpoint fail-closed', () => {
  assert.throws(
    () =>
      validateModelAuthorization({
        model: 'minimax-m3.1-flash-free',
        apiKey: dummyKey,
        baseUrl: 'https://suspicious-gateway.com/v1',
        freeOnly: true
      }),
    (err) => {
      assert(err instanceof KiosApiSecurityError);
      assert.equal(err.code, 'ENDPOINT_NOT_PERMITTED');
      return true;
    }
  );
});

test('7. Sanitizes literal secret from error logs without exposing credentials', () => {
  const secretKey = 'secret_kios_api_key_xyz987';
  const rawLog = `Network request failed for Authorization: Bearer ${secretKey} at endpoint`;
  const sanitized = sanitizeLogMessage(rawLog, secretKey);

  assert.equal(sanitized.includes(secretKey), false);
  assert.equal(sanitized.includes('[REDACTED]'), true);
});
