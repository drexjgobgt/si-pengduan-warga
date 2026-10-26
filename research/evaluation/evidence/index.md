# Indeks bukti — sementara

Tanggal: 26 Oktober 2026. Output tool percakapan merupakan bukti inspeksi awal, bukan screenshot. Bukti runtime tambahan tercatat di bawah.

| Nama | Tahap / sumber yang diperlukan | Status | Waktu capture / keterbatasan |
|---|---|---|---|
| CODE_AUDIT.png | editor/kode aktual | BELUM DILAKUKAN | belum capture |
| TEST_EXECUTION.png | terminal test aktual | BELUM DILAKUKAN | 13 pass tercatat transcript awal, belum capture |
| DATASET_SAMPLE.png | dataset anonim berlabel | BELUM DILAKUKAN | dataset belum dibuat |
| PREDICTION_RESULTS.png | prediksi final aktual | BELUM DILAKUKAN | eksperimen belum dilakukan |
| METRICS_RESULTS.png | script metrik aktual | BELUM DILAKUKAN | eksperimen belum dilakukan |
| ERROR_ANALYSIS.png | error aktual | BELUM DILAKUKAN | eksperimen belum dilakukan |
| FINAL_SUMMARY.png | ringkasan final | BELUM DILAKUKAN | eksperimen belum dilakukan |

Bukti utama tersedia: audit.md, code_map.md, risks.md dan desain Phase 2. inspect_runtime.cjs menghasilkan inventory katalog/skema tanpa record warga; read-only transaction terverifikasi on pada 2026-10-26T05:10:27.588Z. Tidak ada predictions.csv/results_summary.json placeholder dibuat.

## Bukti runtime tambahan
- `screenshots/RUNTIME_HEALTH.png` — VALID. Screenshot browser asli http://127.0.0.1:5000/api/health, tanggal 2026-10-26 sekitar 05:15 UTC; respons terlihat bertimestamp 05:14:03.173Z. Ukuran terverifikasi 13337 bytes dan gambar berhasil ditampilkan. Membuktikan health HTTP saja; bukan readiness DB/AI, bukan screenshot klasifikasi.
- `runtime_smoke.json` — satu request klasifikasi aktual sintetis, prompt dan raw output; bukan dataset/hasil final. Provider model ID berbeda dari alias request, keduanya disimpan.
- `../runtime_verification.md` — perintah startup, hasil HTTP, warning startup dan batas verifikasi.

## Persiapan offline 2026-10-26T05:22:59.021Z
- `offline_verification.json` — VALID sebagai bukti verifikasi harness offline saja: 27 dry-run, resume skip 27, fixture 27, real API/DB 0. Bukan hasil evaluasi LLM.
- `../runs/offline-verification-9WtnZX/unit-tests.txt` — log runner aktual: 9 pass, 0 fail. TEST_EXECUTION.png tetap BELUM DILAKUKAN.
- `../dataset.provisional.json` dan `../dataset_manifest.json` — 27 kandidat AI sintetis provisional, tanpa validasi penilai manusia. DATASET_SAMPLE.png tetap BELUM DILAKUKAN.
- `../runs/offline-verification-gdnVls/` — run pertama gagal, dipertahankan; sebab dan koreksi ada di ../offline_preparation_report.md.
- `../offline_preparation_report.md` — perintah, hitungan fixture, keterbatasan dan gate live. Tidak ada prediksi/metrik final atau screenshot baru.

## Baseline pilot lokal 2026-10-26T05:25:55Z
- `../baseline_pilot/historical_keyword_baseline.cjs` — source historis diekstrak, blob terverifikasi; tidak dimodifikasi.
- `../baseline_pilot/predictions.json` — 18 prediksi keyword aktual dengan label AI provisional, bukan LLM.
- `../baseline_pilot/summary.json` — metrik baseline saja: 13/18 label cocok, accuracy 72.22%, macro F1 0.6962963.
- `../baseline_pilot/report.md` — ketidakcocokan aktual dan batas interpretasi. Tidak ada screenshot baru dan tidak ada perbandingan performa LLM.

## Pemeriksaan gratis-saja 2026-10-26T05:28:59.198Z
- `free_only_preflight.json` — GET model catalog aktual HTTP 200, model terdaftar tetapi metadata pricing/quota tidak tersedia. Status BLOCKED_FREE_ONLY_UNVERIFIED, 0 generation requests.
- `../free_only_status.md` — dokumentasi batas Rp0 dan temuan cost nonzero pada log smoke sebelumnya. Cost provider bukan bukti tagihan akun; tidak ada pilot lanjutan atau screenshot baru.

## Pilot live setelah bukti dashboard pengguna
- Dua lampiran screenshot pengguna dalam percakapan: smoke matching 949/92 token Free-Pro 0x Rp0, lalu transaksi 2026-10-26 12:32:07 WIB Error 429 Rp0. VALID sebagai bukti user-supplied yang terbatas; file lokal lampiran belum tersedia/diverifikasi, tidak diklaim sebagai screenshot buatan agent.
- `../live_pilot/manifest.json` dan `../live_pilot/SIPW-CAND-0010.json` — 1 attempt provider aktual, HTTP429, manual fallback, 17 belum dikirim. 0 retry, 0 DB writes.
- `../live_pilot/report.md` — status pilot tidak lengkap dan rekonsiliasi tagihan Rp0 pada screenshot terbaru. Tidak ada akurasi semantik LLM atau perbandingan baseline yang sah dari pilot ini.

## Satu continuation 2026-10-26T05:35:49.037Z
- Lampiran pengguna: katalog model input/output/cache Rp0, Free-Pro; bukan bukti kuota atau akurasi. File lokal lampiran belum tersedia.
- `../live_pilot_continuation_one/manifest.json` dan `../live_pilot_continuation_one/SIPW-CAND-0011.json`: satu request aktual HTTP200, model self-dploy/DeepSeek-V4-Flash, raw/final jalan_rusak/PUPR, confidence90, strict-valid, no fallback. Cocok label provisional; bukan validasi independen.
- `../live_pilot_continuation_one/report.md`: status gabungan 2 attempted/18, 1 success/1 HTTP429, 16 belum dikirim. partial_summary.json lama tetap snapshot sebelum continuation, bukan status gabungan terkini. Tidak ada screenshot baru.

## Batch retry v2 — diluncurkan, hasil menunggu penyelesaian
- `../retry_protocol_v2.md` — amendemen scope 16 sampel tersisa, max3attempts/sample (48 request baru), spacing10s, backoff30/60s atau Retry-After, safety stops tetap berlaku. Jangan menganggap batch sudah selesai.
- `../retry_policy.test.cjs` — 3 test aktual lulus,0fail; duration69.4959ms.
- `../analyze_pilot.test.cjs` — 3 test aktual lulus,0fail; duration69.8749ms, denominator missing/invalid dan percentile.
- `../labeling_packets/rater_A.json`, `rater_B.json` — template 27 sampel tanpa prediksi/label AI; BELUM DIISI, bukan hasil pelabelan manusia.
- Tidak ada screenshot tambahan atau hasil metrik batch yang diklaim pada pembaruan ini.

## Studi eksploratori MiniMax (terpisah dari pilot DeepSeek lama)

- Lihat `../final_candidate_v2/evidence_index.md` untuk tujuh screenshot **`EXPLORATORY_*.png`** yang benar-benar ada, dapat dibuka, dan dibatasi sebagai capture dari halaman HTML lokal hasil batch; tidak ada klaim screenshot terminal/editor live untuk audit/test.
- `../final_candidate_v2/exploratory_run_v1/` berisi 27 log POST aktual MiniMax; `../final_candidate_v2/exploratory_analysis_v1/` berisi CSV/JSON metrik yang dihitung ulang. Dua labeler adalah AI berbeda, label **provisional**, bukan ground truth manusia. Output `predictions.csv`/`results_summary.json` di akar research/evaluation sengaja tidak dibuat, karena keluaran ini bukan eksperimen final ilmiah.
