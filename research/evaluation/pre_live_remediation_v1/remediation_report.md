# Pre-live remediation v1 — documentation prepared, NOT READY

Read all eight blockers and report in `../pre_live_audit_v1/{live_blockers.json,pre_live_audit_report.md}`. Re-inspected production adapter `backend/config/kiosApi.js` read-only and previous 27-run script `final_candidate_v2/run_exploratory.cjs` for contrast. No 270 live runner found in `synthetic_final_v1/`; `run_keyword_offline.cjs` is offline baseline only. No production module executed, dotenv read, provider request or DB access. No frozen file or previous exploratory artefact modified. No Git push.

## Blocker disposition (closure evidence, not promised controls)

| Blocker | Current status | Work completed / evidence still required |
|---|---|---|
| B01 model identity/version | **NOT VERIFIED** | Missing returned ID can be masked by request alias (`kiosApi.js:190`). Checklist specifies exact provider/version evidence, omission/drift handling; current external evidence absent |
| B02 price/quota/Rp0 guarantee | **NOT VERIFIED** | Checklist prepared; no active-account tariff/quota or enforceable provider no-debit restriction verified. Never claim Rp0 from substring/free tier name |
| B03 FREE_ONLY enforcement | **FAIL** | Empty non-free branch112–122, arbitrary explicit/env IDs and URL accepted, regex sanitization risk identified. Threat model and fail-closed design written; no patch/test implemented, provider monetary control absent |
| B04 runner | **NOT VERIFIED** | New runner spec includes durable270 reservation cap, retries0,22s request/7200s proposed active-total deadline, stop/resume/secret controls. These controls are specifications **not implemented or tested**; need separate runner/test artifacts and approval |
| B05 scoring | **OPEN** | New `scoring_contract.md` fixes raw exact vs canonical diagnostics, strict-valid vs service success, all denominators/sentinels/fallback and family aggregate. Document-level ambiguity remediated, but adoption/hash and executable conformance tests still needed; do not mark closed PASS |
| B06 day/rate schedule | **NOT VERIFIED** | Local default200/day shared; approved270 schedule and provider evidence unavailable. Spec forbids restart bypass, tracks persisted quota/active budget; need actual account limits/reset/time windows and approval |
| B07 synthetic construct | **OPEN** | Limitations note documents55 correlated families, controlled ambiguity, mild typo and no population generalization. Need user acceptance of bounded construct or authorize v2 before LLM; v1 unchanged |
| B08 live permission | **OPEN** | Current request authorizes offline remediation documentation only; new explicit live approval bound to verified manifest/cap270/retries0/Rp0 remains absent |

No blocker is marked PASS merely because a document has been written. Inherited dataset/hash/baseline PASS checks in prior audit do not prove these controls. Conditions absent cannot be guessed or relabeled as implemented.

## Seven files created

1. `remediation_report.md` — this report and B01–B08 disposition.
2. `free_only_threat_model.md` — paid/unknown/alias/default/env/fallback/redirect and secrecy findings with separate proposed policy.
3. `offline_test_plan.md` — synthetic mock/evidence cases and runner/scoring acceptance assertions; these remain a plan, while the pure guard/scoring unit tests listed below were executed.
4. `live_runner_spec.md` — future evaluation-only runner, hard caps/deadlines, durable states, metadata and redaction.
5. `scoring_contract.md` — new immutable pre-inference scoring annex; frozen experiment protocol unchanged.
6. `provider_verification_checklist.md` — exact external evidence needed, all currently NOT VERIFIED.
7. `methodological_limitations.md` — synthetic-family correlation/ambiguity/typo/generalization and acceptance alternatives.
8. `evaluation_guard_v1.cjs` and `evaluation_guard_v1.test.cjs` — pure evaluation authorization policy fixture; no transport. Four tests pass. It accepts only supplied synthetic evidence fields; it does **not** authenticate provider/account evidence or prove billing.
9. `scoring_v1.cjs` and `scoring_v1.test.cjs` — pure scoring implementation/fixtures; six tests pass. It does **not** produce any LLM result.

## Next decisions, no live action

Approve scoring contract and proposed deadline semantics (7200s active-total plus separately approved UTC/day windows), permit later implementation of **evaluation-only** fail-closed guards/mock tests, accept limited synthetic v1 or authorize distinct v2, and provide verifiable sanitized provider/account no-spend/pricing/quota/model evidence. No existing protocol/label change or rerun authorized. If zero-debit prevention cannot be verified, remain blocked even if all local tests pass.

## Verification performed in this remediation

- `node --test research/evaluation/pre_live_remediation_v1/evaluation_guard_v1.test.cjs`: **4 pass, 0 fail**. Cases include empty/paid/unknown/free-substring models, missing/stale price/quota/no-spend evidence, alias drift, fallback, endpoint and override denial. Transport was not invoked.
- `node --test research/evaluation/pre_live_remediation_v1/scoring_v1.test.cjs`: **6 pass, 0 fail**. Cases include exact/canonical labels, missing/invalid sentinels, pure/recovered JSON, schema types, all-planned denominator, timeout/no-prediction/fallback, duplicate IDs and latency interpolation.
- These tests execute pure new evaluation utilities only; they do not load `kiosApi.js`, `classificationService.js`, dotenv, HTTP, provider, database, or frozen dataset. No runner cap/checkpoint integration test has been executed; B04 remains NOT VERIFIED.

**Decision: NOT READY; READY FOR APPROVAL would not itself authorize any provider request.** No new LLM predictions, comparison metrics or final performance claims produced.

## Local artifact verification

Seven requested documents exist and are nonempty. SHA-256 of `scoring_contract.md` (raw UTF-8 bytes) at preparation: `b59f75616f6d8e45ececb7e3b8242773cefd46b09f1b8c71d0eab5fe81227265`. Any change requires a new scoring version/hash before adoption. Read-only SHA-256 checks of the eight frozen inputs listed in the previous audit's `preservation_verification.json` all still match that audit. This is preservation evidence, not a new semantic QA or a guard/runner test. No executable acceptance tests were run; no PASS test counts are claimed.
