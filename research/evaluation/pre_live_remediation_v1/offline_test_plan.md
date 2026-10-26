# Offline acceptance test plan — NOT EXECUTED

No new runner/guard or executable tests are implemented in this remediation. These are testable acceptance criteria, not pass counts. Test environment must deny all egress, disable DNS/HTTP/SDK transport, exclude dotenv/secrets/DB drivers, use a fake key and fake monotonic clock, and inject an in-memory transport which increments `sent_post` only on invocation. Any unmocked network call fails the suite. File tests use a new disposable **audit/test** directory, never frozen artifacts. A zero-network suite must prove no request escaped.

## Guard cases (fixture evidence is NOT provider proof)

| ID | Input / perturbation | Required observable |
|---|---|---|
| G01 | Explicit paid model, FREE_ONLY true | deny, sent_post=0 |
| G02 | Unknown ID or invented `whatever-free` | deny, sent_post=0 |
| G03 | Known requested alias, missing/stale group-specific zero-price or spend-lock evidence | deny even if model name is free |
| G04 | Exact allowed alias + complete synthetic evidence + synthetic no-spend restriction | fake send only; mark evidence fixture, never live-ready |
| G05 | Alias resolves to unknown/paid/backend drift or missing response model | stop, preserve result, no second send; classification and drift statuses separate |
| G06 | Model/env absent, empty, whitespace, env default differs payload | deny ambiguous config; no implicit fallback |
| G07 | explicit paid `options.model`, paid env override, FREE_ONLY false, allow-unverified=`true` or `false` | deny nonapproved config; neither flag bypasses policy |
| G08 | Provider URL changed or redirect to other host | deny/redirect:error, no credential forwarding |
| G09 | Timeout/429/5xx/invalid output triggers fallback | one fake send maximum, no paid/model/router retry |
| G10 | Prices changed after evidence; account/key group mismatch | deny; fixture cannot establish atomic pricing or real cost |

## Runner cases

- R01: 270 unique IDs complete => exactly270 fake sends; attempt271 rejected even after restart/concurrent second process. Dataset/registry/manifest hashes and one-to-one target join required before dispatch.
- R02: duplicate input ID, extra target, changed dataset or prompt/source/evidence hash => 0 sends. Duplicate result identity/conflicting ledger => fail closed.
- R03: timeout before headers, stalled body, network/HTTP401/402/403/429/5xx => error persisted, no retries, stop; actual HTTP code/null distinguished. Fake clock verifies 15s production vs22s harness body deadline and approved total active-time cap.
- R04: fake starts never <10s apart; stricter provider rate/day caps prevail. Time rollback/resume/day boundary cannot reset global270 ledger; persisted budget survives restart. Shared account consumption conservatively reserved, not guessed.
- R05: crash before reserve, after reservation, after send but before response, after fsync result before marker removal. Completed result+valid ledger reconciled without re-send; pending without final result => unknown/blocked, consumes reserved budget; never replay automatically. Success/error are terminal attempts, retries0.
- R06: SIGINT/SIGTERM/storage full/permission error => no new send, in-flight bounded, previous files intact; ledger/status remain auditable. Exclusive lock prevents simultaneous workers; stale lock requires proof/authorization, not blind deletion.
- R07: fake secret in response, headers, request error, URL/query, regex-metacharacter key, nested message, thrown stack => no actual secret in console/JSON/HTML/CSV. Authorization/cookies never persisted. Restricted sanitized raw preserves classification before normalization; redactions recorded. Hashes of redacted versus original response must not be mislabeled.
- R08: body oversized/malformed/non-string/missing choices/model => capture bounded sanitized response and explicit truncation/unavailable; incomplete body cannot pass strict validity. Failure capture cannot crash cleanup or leak production console.error.
- R09: no DB pool/import or operational endpoint; fake classifier boundary verifies input contains only title/description and never targets/rationale. Counter pre-request refusal distinguished from dispatched POST.

## Scoring fixtures

Nine-class perfect, one wrong class, unknown/missing/no-prediction, all-error including target lainnya fallback, zero predicted support, schema-valid-but-wrong, markdown-recovered JSON, confidence string/out-of-range, boolean string, duplicate secondary, model drift, and local rejection. Assert exact/raw/canonical/final outcomes and all denominators from `scoring_contract.md`. Verify median/p95 at n=0/1/2 and failed attempts included; no numeric value for denominator0 (null). Family aggregates must cover 55 declared families without treating rows as independent people.

Required closure evidence: actual test code revision/hash, command/runtime version, fixture provenance, stdout counts, exit status, persisted network-deny evidence and assertions for every case. Until those exist: guard/runner/scoring implementation **NOT VERIFIED**; writing this test plan alone does not close B03–B05.
