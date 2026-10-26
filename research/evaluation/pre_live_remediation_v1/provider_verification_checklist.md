# Provider evidence checklist — all current external controls NOT VERIFIED

No provider HTTP/API calls were made for this work. No current account settings or secret values inspected. This checklist specifies evidence to obtain later via an approved channel; it is **not** verification or permission to call even a catalog endpoint now. A public page, model name containing free, historical receipt, provider upstream cost=0 or user assurance is not proof of zero active-account debit for the new run.

| Item | Evidence required (sanitized) | Acceptance/stop condition | Current status |
|---|---|---|---|
| Provider/base URL | Official account console endpoint, ownership/TLS domain and routing policy, capture time | Exact approved endpoint, no unknown redirect/router | NOT VERIFIED for new run |
| Requested model/version | Official alias→backend identity/version/snapshot mapping or explicit statement version cannot be pinned | Record limitation; user decides accept alias drift risk before run | NOT VERIFIED |
| Returned model provenance | Actual provider field and whether omitted/misnamed; policy on immutable version | Missing field never replaced with "verified" request alias; unexpected ID stops | NOT VERIFIED |
| Key group/entitlement | Active account/key group Free-Pro binding, eligibility/verification status without key value | Bound to intended key/group and valid at dispatch | NOT VERIFIED |
| Effective tariff | Account-specific input/output/cache/reasoning/per-request and surcharge/tax/FX policy, units, effective dates | Every possible charge is zero under approved restriction; unknown component blocks | NOT VERIFIED |
| Quota and RPM | Account/model remaining request/token quota, RPM/TPM, reset zone and shared traffic | Enough for approved per-day schedule; respect stricter bound | NOT VERIFIED |
| Daily/local cap | Provider daily cap/reset and evidence of other account consumers; local200/day counter considered separately | No restart to bypass; 270 split across approved days if needed | NOT VERIFIED |
| Monetary no-spend mechanism | Documented server-side key restriction to zero-priced routes, hard paid-debit cap/disable-credit/no-overage semantics, actual account setting bound to key | Must prevent debit **before acceptance**, not alert/refund afterward. Zero quota may block all traffic; verify semantics, never assume cap0 means no spend | NOT VERIFIED |
| Fallback/repricing | Provider policy for fallback routes, auto upgrades, group switching, repricing and in-flight queued billing | No paid fallback or spend at changed rate; if cannot guarantee, Rp0 experiment stays blocked | NOT VERIFIED |
| Billing reconciliation | Sanitized request IDs/time window, actual account debit and balance movement, currency | Post-run corroboration only, not pre-run no-spend protection | NOT VERIFIED/not executed |

Record evidence source URL/document or screenshot path, captured_at UTC, effective_until, issuer, account/group binding pseudonym, relevant fields, integrity hash, reviewer decision and precise uncertainty. Never request/publish key, password, auth header, cookie, personal account identifiers or raw .env. Offline fixtures can validate interpretation logic but cannot authenticate account evidence. Evidence can expire between days; reapproval/revalidation policy must be frozen, not silently loosened. No provider-side restriction is known to exist locally; do not create one or claim it is available without proof.

Closing B01/B02/B06 requires this evidence plus approved scheduling/transport guards; if no enforceable zero-debit control can be established, maintain NOT READY regardless of catalog multiplier0.
