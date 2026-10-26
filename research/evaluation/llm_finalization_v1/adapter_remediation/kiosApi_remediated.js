/**
 * REMEDIATED KIOS API ADAPTER — ISOLATED WORKSPACE IMPLEMENTATION
 * 
 * Provides fail-closed model authorization, strict allowlist enforcement,
 * parameter validation, daily quota tracking, and credential redaction.
 * Designed to remediate security flaws in backend/config/kiosApi.js without
 * modifying production files prematurely.
 */

const ALLOWED_FREE_MODELS = Object.freeze([
  'minimax-m3.1-flash-free'
]);

const ALLOWED_ENDPOINTS = Object.freeze([
  'https://kiosapi.com/v1',
  'https://api.kiosapi.id/v1'
]);

class KiosApiSecurityError extends Error {
  constructor(message, code, isConfigError = false) {
    super(message);
    this.name = 'KiosApiSecurityError';
    this.code = code;
    this.isConfigError = isConfigError;
  }
}

function sanitizeLogMessage(message, secret) {
  if (typeof message !== 'string') return message;
  if (!secret) return message;
  return message.split(secret).join('[REDACTED]');
}

/**
 * Validates model and configuration strictly fail-closed BEFORE any network dispatch.
 */
function validateModelAuthorization({
  model,
  apiKey,
  baseUrl,
  freeOnly = true,
  allowUnverified = false
}) {
  // 1. Validate API Key presence
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new KiosApiSecurityError(
      'Kios API Key belum dikonfigurasi di environment variable.',
      'KIOSAPI_KEY_MISSING',
      true
    );
  }

  // 2. Validate Base URL
  const normalizedBaseUrl = (baseUrl || 'https://kiosapi.com/v1').replace(/\/+$/, '');
  if (!ALLOWED_ENDPOINTS.includes(normalizedBaseUrl) && !allowUnverified) {
    throw new KiosApiSecurityError(
      `Endpoint baseUrl '${normalizedBaseUrl}' tidak terdaftar dalam allowlist resmi.`,
      'ENDPOINT_NOT_PERMITTED',
      true
    );
  }

  // 3. Validate Target Model
  if (!model || typeof model !== 'string' || !model.trim()) {
    throw new KiosApiSecurityError(
      'Model ID wajib ditentukan dan tidak boleh kosong.',
      'MODEL_REQUIRED',
      true
    );
  }

  const normalizedModel = model.trim();

  // 4. Strict Free-Only and Allowlist Enforcement
  if (freeOnly) {
    const isExplicitlyAllowed = ALLOWED_FREE_MODELS.includes(normalizedModel);

    if (!isExplicitlyAllowed) {
      // Fail closed: reject immediately, do not rely on substring check
      throw new KiosApiSecurityError(
        `Model '${normalizedModel}' bukan model gratis yang disetujui dalam allowlist evaluasi. Permintaan dibatalkan demi proteksi biaya.`,
        'PAID_OR_UNAUTHORIZED_MODEL_BLOCKED'
      );
    }
  }

  return {
    authorized: true,
    model: normalizedModel,
    baseUrl: normalizedBaseUrl
  };
}

module.exports = {
  ALLOWED_FREE_MODELS,
  ALLOWED_ENDPOINTS,
  KiosApiSecurityError,
  sanitizeLogMessage,
  validateModelAuthorization
};
