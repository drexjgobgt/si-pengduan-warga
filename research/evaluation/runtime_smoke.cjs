// One explicitly authorized synthetic smoke call, NOT a final evaluation.
// Never invokes operational controllers or writes the application database.
const fs = require('node:fs');
const path = require('node:path');
const backend = path.resolve(__dirname, '../../backend');
require(path.join(backend, 'node_modules/dotenv')).config({ path: path.join(backend, '.env'), quiet: true });
const { KIOSAPI_CONFIG: config } = require(path.join(backend, 'config/kiosApi'));
const outputPath = path.join(__dirname, 'evidence/runtime_smoke.json');
if (fs.existsSync(outputPath)) throw new Error('Refusing to overwrite previous smoke record');
const originalFetch = global.fetch;
const record = { purpose: 'synthetic runtime smoke; not final evaluation', timestamp: new Date().toISOString(),
  configured_model: config.classificationModel, provider: new URL(config.baseUrl).hostname,
  dataset_sample: false, operational_database_writes: 0, catalog_source: 'production service defaults (pool=null)',
  input: { title: 'Lampu penerangan jalan tidak menyala', description: 'Dua lampu penerangan di jalan lingkungan padam sejak tiga malam. Mohon diperiksa agar pengguna jalan dapat melintas dengan aman.' },
  provider_quota_verified: false, provider_price_verified: false, attempts: 0 };
const redact = text => {
  const value = String(text);
  return config.apiKey ? value.split(config.apiKey).join('[REDACTED]') : value;
};
async function main() {
  // Model catalog may show availability, but does not prove account quota/pricing.
  try {
    const r = await originalFetch(`${config.baseUrl}/models`, { headers: { Authorization: `Bearer ${config.apiKey}` }, signal: AbortSignal.timeout(15000) });
    record.model_catalog_http_status = r.status;
    if (r.ok) {
      const body = await r.json();
      record.configured_model_listed = Array.isArray(body.data) ? body.data.some(m => m.id === config.classificationModel) : null;
    }
  } catch (e) { record.model_catalog_error_type = e.name; }
  if (record.model_catalog_http_status === 401 || record.model_catalog_http_status === 403 || record.model_catalog_http_status === 429 || record.configured_model_listed === false) {
    record.generation_status = 'BLOCKED_BY_PREFLIGHT';
  } else {
    if (config.classificationModel !== 'deepseek-v4-flash-free' || new URL(config.baseUrl).hostname !== 'kiosapi.com') throw new Error('Unexpected provider/model; stop for review');
    global.fetch = async (url, options) => {
      record.attempts++;
      if (record.attempts > 1) throw new Error('One-call budget exceeded');
      const payload = JSON.parse(options.body);
      record.request = { model: payload.model, temperature: payload.temperature, max_tokens: payload.max_tokens,
        response_format: payload.response_format, messages: payload.messages };
      const response = await originalFetch(url, { ...options, signal: AbortSignal.any([options.signal, AbortSignal.timeout(20000)]) });
      record.http_status = response.status;
      if (response.ok) {
        const body = await response.clone().json();
        record.provider_returned_model_id = body.model || null;
        record.raw_content = redact(body.choices?.[0]?.message?.content || '');
        record.finish_reason = body.choices?.[0]?.finish_reason || null;
        record.usage = body.usage || null;
      }
      return response;
    };
    const { classifyComplaint } = require(path.join(backend, 'services/classificationService'));
    const started = performance.now();
    // Production service logs arbitrary provider messages: suppress only during this call.
    const savedError = console.error;
    try {
      console.error = () => {};
      const result = await classifyComplaint(record.input.title, record.input.description, null);
      const { error, ...safeResult } = result;
      record.normalized_result = safeResult;
      record.generation_status = result.status;
      if (error) record.error_type = 'SERVICE_MANUAL_FALLBACK';
    } finally { console.error = savedError; record.latency_ms = performance.now() - started; }
  }
  fs.writeFileSync(outputPath, JSON.stringify(record, null, 2), { flag: 'wx' });
  console.log(JSON.stringify({ evidence: 'research/evaluation/evidence/runtime_smoke.json', status: record.generation_status,
    model_catalog_status: record.model_catalog_http_status, model_listed: record.configured_model_listed,
    classification_attempts: record.attempts, http_status: record.http_status,
    provider_model: record.provider_returned_model_id, result: record.normalized_result, latency_ms: record.latency_ms }));
}
main().catch(e => { console.error(JSON.stringify({ smoke: 'FAILED', error_type: e.name })); process.exitCode = 1; }).finally(() => { global.fetch = originalFetch; });
