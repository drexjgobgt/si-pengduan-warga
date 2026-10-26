# Peta kode dan bukti

Commit: b20a74ac8febdb81af253c8b19ee15655bad5989.

| Batas | File / fungsi / baris inspeksi |
|---|---|
| Input | frontend/src/components/Complaints/ComplaintForm.jsx::handleSubmit 85–88 |
| Submit/alert | frontend/src/App.jsx::handleCreateComplaint 130–159 |
| HTTP client | frontend/src/services/api.js::complaintAPI.create 48–52 |
| Mount | backend/server.js 58–64 |
| Route | backend/routes/complaints.js 23,29–34 |
| Create/persistence | backend/controllers/complaintController.js::create 340–482 |
| Catalog | backend/services/classificationService.js::getActiveContext 41–66 |
| Parser | backend/services/classificationService.js::validateAndNormalizeLLMOutput 71–158 |
| Prompt/classify | backend/services/classificationService.js::classifyComplaint 170–294 |
| API | backend/config/kiosApi.js::callKiosChatCompletion 98–211 |
| Daily quota | backend/config/kiosApi.js::recordUsage/getUsageStats 38–84 |
| Reclassify | backend/controllers/complaintController.js::reclassify 1228–1305 |
| Feedback | backend/services/classificationService.js::recordFeedback 299–321 |
| Schema | backend/database/schema.sql complaints 85–119, logs 180–191 |
| Mapping | backend/database/migrations/002_sla_disposition_departments.sql 14–41 |
| Unsafe read endpoint | complaintController.getAll 82–85 → refreshSLAs 37–75 (UPDATE) |
| Sanitization | backend/utils/Validator.js::sanitizeInput 19–22 |
| Tests | backend/tests/classification.test.js, kiosApi.test.js, security.test.js |

Flow: form → App → Axios → authenticated POST complaints → sanitize → catalog → prompt → provider → normalize/fallback → category mapping preferred over department suggestion → transactional complaints/log/history → UI alert.

Read-only runtime helper: `research/evaluation/inspect_runtime.cjs`. Tidak memuat controller/server; query metadata/katalog dengan read-only session. Source produksi tidak diubah.
