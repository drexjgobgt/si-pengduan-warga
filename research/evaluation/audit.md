# Audit implementasi SIPW

## Status dan cakupan
Inspeksi awal: 26 Oktober 2026. Commit produksi: `b20a74ac8febdb81af253c8b19ee15655bad5989`. Tidak ada source produksi diubah. Inspeksi pertama sepenuhnya read-only; dokumentasi dan inspeksi runtime berikutnya mendapat izin pengguna. Chatbot bukan objek eksperimen.

## Implementasi aktual
- React 18 (`frontend/package.json`), Node/Express dan pg (`backend/package.json`), PostgreSQL.
- `backend/services/classificationService.js::classifyComplaint` (170–294) menerima judul dan deskripsi; `getActiveContext` (41–66) membaca kategori aktif dan seluruh departemen. Query gagal/kosong memakai default. Urutan katalog SQL tidak dibekukan.
- `backend/config/kiosApi.js::callKiosChatCompletion` (98–211) menggunakan OpenAI-compatible POST `/chat/completions`. Default base URL `https://kiosapi.com/v1`, model `deepseek-v4-flash-free`, timeout 15000 ms, token 500, temperature klasifikasi 0.1, JSON mode.
- System prompt (classificationService 187–218) mencantumkan katalog, prioritas dan estimasi confidence; user prompt (225) berisi judul/deskripsi. Tidak ada anonimisasi narasi.
- Parser `validateAndNormalizeLLMOutput` (71–158) mencoba JSON lalu ekstraksi regex. Ini normalisasi longgar, bukan validasi skema ketat. Kategori invalid menjadi lainnya; departemen invalid menjadi KELURAHAN; priority invalid menjadi normal. Confidence di-parse integer dan di-clamp 0–100; missing menjadi 50. Review aktif pada invalid output tertentu atau confidence <60; flag model juga dipakai.
- Secondary categories difilter tetapi tidak dideduplikasi. Reason default/potong 500 karakter. Confidence merupakan self-report LLM, bukan probabilitas terkalibrasi. Secondary scores confidence×0.7 adalah heuristik.
- Error API/JSON menjadi manual fallback: lainnya, KELURAHAN, normal, confidence 0, review true, status needs_manual_review. Tidak ada retry otomatis.

## Persistensi dan routing
`complaintController.create` (340–482) membersihkan judul/deskripsi lewat `sanitizeInput`, memanggil LLM, lalu transaksi INSERT complaints, classification_logs, history. `category_id` dan `auto_category_id` awalnya sama-sama hasil prediksi. Departemen kategori di DB mengalahkan suggestedDepartment; saran LLM baru dipakai jika mapping kategori kosong (371–389). Priority operasional dari request, bukan saran LLM (349,391–417).

Log (422–445) menyimpan input, kategori setelah normalisasi, confidence, JSONB secondary/department/priority/reason/review/source/status, modelVersion, latency. Tidak menyimpan respons mentah, prompt hash, raw invalid labels, HTTP status, error code, usage, atau fallback reason terstruktur. Review tidak punya kolom sendiri di complaints.

`reclassify` (1228–1305) hanya mengubah auto_category_id/confidence; kategori final/departemen/priority tidak diperbarui. Log/update/history tidak satu transaksi. `recordFeedback` (299–321) tidak menyimpan actualCategory dan insert tidak mengisi input_text NOT NULL. SQL `get_classification_accuracy` (schema.sql 360–380) membandingkan dua kolom yang diinisialisasi sama, sehingga bukan akurasi ber-ground-truth independen.

## Kategori dan departemen
Sampah→DLH; jalan_rusak/banjir/air_bersih→PUPR; listrik→DISHUB; keamanan→SATPOLPP; kesehatan→DINKES; pendidikan→DISDIK; lainnya→KELURAHAN. Sumber: classificationService 13–33, schema.sql 409–418, migrasi 002 14–41.

## Test aktual pada inspeksi awal
Node v24.21.0. Tiga file dipilih via spawnSync dengan child env API key kosong, NODE_OPTIONS kosong dan default config eksplisit:
`node --test tests/classification.test.js tests/kiosApi.test.js tests/security.test.js`.
Hasil runner: 13 test, 13 pass, 0 fail/cancelled/skipped/todo, duration 118.4757 ms. Classification 7, config 3, security 3. Empat test chatbot dibaca, tidak dijalankan; bukan skipped runner. README 17 sesuai jumlah deklarasi seluruh file.
Ini unit/guardrail lokal, bukan eksperimen akurasi, integration HTTP/DB, atau bukti penyimpanan ketika provider gagal. Test sanitasi error menyalin regex; test panjang chat hanya perbandingan string; free-only test hanya config.

Probe parser lokal non-API: {} dan [] diterima menjadi fallback; string "false" menjadi review true; confidence 999 menjadi 100 tanpa review otomatis; secondary duplicates bertahan. Probe adapter dengan mock fetch membuktikan model non-free tetap diteruskan saat freeOnly true (1 mock call, 0 network).

## Perbedaan README / keterbatasan
- Klaim free-only tidak sesuai penegakan: kiosApi 112–122 memiliki cabang kosong untuk model non-free.
- Validasi bukan schema ketat; fallback tidak menjamin ID kategori/departemen ada di runtime.
- Batas 500 karakter/rate limiter chat tidak diterapkan pada classifier. Express body limit 10 MB.
- Timer dibersihkan setelah headers fetch, sebelum body response.json; timeout bukan end-to-end deadline.
- Counter harian in-memory, shared chat/classification, reset restart; bukan kuota provider.
- Health AI Active statis (server.js 66–75), bukan readiness probe.
- README menyebut SLA 12–168 jam; controller memakai 24/48/72/120 jam.

## Runtime setelah izin tambahan
`node research/evaluation/inspect_runtime.cjs` pada 2026-10-26T05:10:27.588Z: target loopback, PostgreSQL 18.6, transaction_read_only=on. Sembilan kategori aktif dan tujuh departemen cocok pemetaan di atas; kolom complaints/classification_logs sesuai kebutuhan audit. Tidak membaca baris warga/pengaduan. Konfigurasi efektif: kiosapi.com, deepseek-v4-flash-free, freeOnly true, 15000 ms, 500 token, limit lokal 200. Nilai kredensial tidak ditampilkan. Output ini belum memverifikasi kuota/harga provider.

## Baseline dan pekerjaan berikutnya
Keyword baseline historis tersedia pada commit `8d669965ac6048cf1af9abed470b49e7cad0def8`, blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f`, file services/classificationService.js. Delapan kelompok keyword, bobot/bonus regex, threshold 40, default lainnya, keyword-v1.0. Belum diuji pada dataset. Tidak ada klaim superioritas.

Belum diketahui: kuota/harga/model availability provider aktual, label independen, data berizin, persistensi end-to-end disposable, calibration dan metrik. Rekomendasi: dataset final dibekukan, dua penilai, pisahkan raw/normalized/routing, baseline identik, observability di evaluation saja. Tidak menggunakan equality kolom operasional sebagai ground truth.
