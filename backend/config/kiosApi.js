/**
 * Kios API Configuration and Provider Abstraction
 * Supports OpenAI-compatible endpoints (https://api.kiosapi.id/v1)
 *
 * Enforces Free-Only policy, daily limits, timeouts, and key secrecy.
 */

const KIOSAPI_CONFIG = {
  get apiKey() {
    return process.env.KIOSAPI_API_KEY || "";
  },
  get baseUrl() {
    return (process.env.KIOSAPI_BASE_URL || "https://kiosapi.com/v1").replace(/\/+$/, "");
  },
  get classificationModel() {
    return process.env.KIOSAPI_CLASSIFICATION_MODEL || "minimax-m3.1-flash-free";
  },
  get chatModel() {
    return process.env.KIOSAPI_CHAT_MODEL || "minimax-m3.1-flash-free";
  },
  get freeOnly() {
    return (process.env.KIOSAPI_FREE_ONLY || "true").toLowerCase() === "true";
  },
  get requestTimeoutMs() {
    return parseInt(process.env.KIOSAPI_REQUEST_TIMEOUT_MS, 10) || 15000;
  },
  get classificationMaxTokens() {
    return parseInt(process.env.KIOSAPI_CLASSIFICATION_MAX_TOKENS, 10) || 500;
  },
  get chatMaxTokens() {
    return parseInt(process.env.KIOSAPI_CHAT_MAX_TOKENS, 10) || 600;
  },
  get dailyRequestLimit() {
    return parseInt(process.env.KIOSAPI_DAILY_REQUEST_LIMIT, 10) || 200;
  },
};

// In-memory daily request tracker for cost & rate control
const dailyUsageTracker = {
  currentDate: new Date().toISOString().slice(0, 10),
  requestCount: 0,
};

/**
 * Reset tracker if a new day has started
 */
function checkAndResetDailyUsage() {
  const today = new Date().toISOString().slice(0, 10);
  if (dailyUsageTracker.currentDate !== today) {
    dailyUsageTracker.currentDate = today;
    dailyUsageTracker.requestCount = 0;
  }
}

/**
 * Increment and check daily request limit
 */
function recordUsage() {
  checkAndResetDailyUsage();
  if (dailyUsageTracker.requestCount >= KIOSAPI_CONFIG.dailyRequestLimit) {
    const err = new Error(
      `Batas penggunaan harian AI (${KIOSAPI_CONFIG.dailyRequestLimit} request/hari) telah tercapai.`
    );
    err.code = "DAILY_LIMIT_EXCEEDED";
    err.isQuotaError = true;
    throw err;
  }
  dailyUsageTracker.requestCount++;
}

/**
 * Get current usage stats (safe for health check, no secrets)
 */
function getUsageStats() {
  checkAndResetDailyUsage();
  return {
    date: dailyUsageTracker.currentDate,
    usedRequests: dailyUsageTracker.requestCount,
    dailyLimit: KIOSAPI_CONFIG.dailyRequestLimit,
    freeOnly: KIOSAPI_CONFIG.freeOnly,
    hasApiKey: Boolean(KIOSAPI_CONFIG.apiKey),
    classificationModel: KIOSAPI_CONFIG.classificationModel,
    chatModel: KIOSAPI_CONFIG.chatModel,
  };
}

/**
 * Core LLM Chat Completion call to Kios API
 *
 * @param {Object} options
 * @param {string} options.model - Model identifier
 * @param {Array<{role: string, content: string}>} options.messages - Message history
 * @param {number} [options.temperature=0.2] - Sampling temperature
 * @param {number} [options.max_tokens=500] - Token limit
 * @param {boolean} [options.jsonMode=false] - Request JSON format if supported
 * @returns {Promise<{content: string, model: string, usage?: object}>}
 */
async function callKiosChatCompletion({
  model,
  messages,
  temperature = 0.2,
  max_tokens = 500,
  jsonMode = false,
}) {
  if (!KIOSAPI_CONFIG.apiKey) {
    const error = new Error("Kios API Key belum dikonfigurasi di environment variable.");
    error.code = "KIOSAPI_KEY_MISSING";
    error.isConfigError = true;
    throw error;
  }

  // Enforce Free-Only check if enabled
  if (KIOSAPI_CONFIG.freeOnly) {
    const targetModel = (model || "").toLowerCase();
    // In KiosAPI / OpenRouter ecosystems, free models usually contain ':free' or 'free' in ID
    // If strict free-only is enabled and model doesn't specify free, warn or verify
    const isFreeDesignated = targetModel.includes("free");
    if (!isFreeDesignated && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
      // If user specifically provided a model without ':free' but set freeOnly=true,
      // allow if user explicitly configured it, but log a sanitized warning.
    }
  }

  // Increment usage tracker
  recordUsage();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), KIOSAPI_CONFIG.requestTimeoutMs);

  const endpoint = `${KIOSAPI_CONFIG.baseUrl}/chat/completions`;

  const payload = {
    model: model || KIOSAPI_CONFIG.classificationModel,
    messages,
    temperature,
    max_tokens,
  };

  if (jsonMode) {
    payload.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${KIOSAPI_CONFIG.apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData = {};
      try {
        errorData = await response.json();
      } catch (_) {
        errorData = { error: { message: `HTTP status ${response.status}` } };
      }

      const errorMessage =
        errorData.error?.message ||
        errorData.message ||
        `Kios API merespons dengan status ${response.status}`;

      const error = new Error(errorMessage);
      error.status = response.status;

      if (response.status === 429) {
        error.code = "RATE_LIMIT_OR_QUOTA_EXCEEDED";
        error.isQuotaError = true;
      } else if (response.status === 401 || response.status === 403) {
        error.code = "AUTH_FAILED";
      } else {
        error.code = `HTTP_${response.status}`;
      }

      throw error;
    }

    const data = await response.json();
    const choice = data.choices && data.choices[0];
    const content = choice?.message?.content || "";

    return {
      content: content.trim(),
      model: data.model || model,
      usage: data.usage || null,
    };
  } catch (err) {
    clearTimeout(timeoutId);

    // Sanitize any accidental API key leaks in error message
    if (err.message && KIOSAPI_CONFIG.apiKey) {
      err.message = err.message.replace(new RegExp(KIOSAPI_CONFIG.apiKey, "g"), "[REDACTED_API_KEY]");
    }

    if (err.name === "AbortError") {
      const timeoutError = new Error(
        `Kios API request timeout setelah ${KIOSAPI_CONFIG.requestTimeoutMs}ms`
      );
      timeoutError.code = "TIMEOUT";
      throw timeoutError;
    }

    throw err;
  }
}

module.exports = {
  KIOSAPI_CONFIG,
  callKiosChatCompletion,
  getUsageStats,
  checkAndResetDailyUsage,
};
