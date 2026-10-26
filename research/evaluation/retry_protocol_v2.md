# Amendemen protokol pilot v2 (sebelum eksekusi batch)

Pengguna meminta retry dan tidak berhenti pada error. Interpretasi aman: lanjut melewati kegagalan sementara, bukan loop tak terbatas atau melewati autentikasi/billing/provider restrictions.

Scope hanya 16 kandidat SIPW-CAND-0012…0027. Dua sampel sebelumnya tidak diulang. Maksimal 3 attempts/sample, maksimal 48 request baru, concurrency1, spacing start request minimal10detik. Retry hanya 429/HTTP5xx/network/timeout; 30s lalu60s atau Retry-After yang lebih panjang. Jika Retry-After >5menit, stop untuk tidak mengabaikan batas provider. Deadline sesi45menit; auth401/403, payment402, model404/identity drift menghentikan batch. Tidak beralih model/provider/kunci dan tidak menghindari limit. Budget tetap Rp0, berdasarkan screenshot katalog dan receipt pengguna; debit akun tetap tidak teramati API.

Setiap attempt disimpan terpisah beserta raw/final/error dan pending marker. Retry adalah versi eksperimen baru; jangan menghapus failure. Final sample outcome: first service success; bila tidak ada, last persisted failure. Output invalid semantik tidak diulang hanya untuk memperbaiki hasil. Metrik attempt teknis menggunakan semua attempts; per-sample menggunakan aturan seleksi ini. Laporkan first-attempt serta post-retry; jangan gabungkan protokol sebagai kondisi identik. Confidence synthetic fallback tidak dimasukkan calibration raw.

Perintah: `node --test research/evaluation/retry_policy.test.cjs` (3 pass,0fail, duration69.4959ms); syntax check run_retry_batch.cjs berhasil. `node research/evaluation/run_retry_batch.cjs` diluncurkan background. Baseline dan dataset/prompt tidak diubah berdasarkan hasil.

Analisis setelah batch selesai: `node research/evaluation/analyze_pilot.cjs`; output di pilot_analysis, bukan mengubah partial_summary sebelumnya. Tolak analisis saat lock/pending masih ada. Report hasil tetap PILOT sintetis provisional dan tidak paper final tervalidasi.
