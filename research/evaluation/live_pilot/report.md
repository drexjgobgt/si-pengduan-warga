# Pilot LLM terbatas — terhenti HTTP 429

## Izin dan bukti gratis
Pengguna mengirim screenshot dashboard yang menunjukkan transaksi smoke sebelumnya bertanggal 26 Oktober 2026 sekitar 12:14 WIB: requested deepseek-v4-flash-free, response self-dploy/DeepSeek-V4-Flash, 949/92 token, tier Free-Pro 0x, cost Rp0. Token/model cocok dengan log smoke lokal. Ini bukti user-supplied bahwa smoke tersebut tidak ditagih; nonzero upstream usage cost tidak sama dengan debit pengguna. Bukan bukti sisa kuota atau jaminan tagihan seluruh request berikutnya. Gambar terlihat dalam percakapan, tetapi tidak disalin menjadi screenshot workspace karena lokasi/bytes lampiran belum tersedia; tidak mengklaim file bukti yang tidak ada. Jangan salin identitas token/aktivitas lain pada screenshot ke laporan publik.

Budget Rp0; cap 18 request/no retry/no model fallback, spacing 3 detik, concurrency 1. Pengaman model/endpoint dikunci di live_pilot.cjs, hash source/config/dataset direkam manifest. Tidak mengubah produksi atau database. Saldo akun tidak dapat dibaca dari respons API, sehingga tagihan pilot memerlukan rekonsiliasi dashboard. Free-only di kode produksi masih tidak ditegakkan; harness mengunci model tetapi bukan server-side billing cap.

## Eksekusi aktual
`node --check research/evaluation/live_pilot.cjs` — berhasil.
`node research/evaluation/live_pilot.cjs` — 1 request aktual lalu stop, tanpa retry:
- sample_id SIPW-CAND-0010; timestamp hasil 2026-10-26T05:32:08.170Z.
- HTTP 429; service needs_manual_review; provider model/raw prediction/usage unavailable.
- Final system category lainnya; dept KELURAHAN; confidence 0; review true.
- Label provisional sampah/DLH; final fallback tidak cocok.
- Wall-clock 3606.8927 ms, fallback service_manual_fallback.
- 17 sampel belum dikirim; tidak dihitung sebagai timeout atau respons model.

HTTP 429 berarti rate-limit atau kuota tidak tersedia; error body tidak diarsipkan karena dapat memuat informasi sensitif. Tidak dapat menentukan penyebab spesifik atau waktu reset. Reason aplikasi menyebut kuota gratis, tetapi teks tersebut berasal dari fallback backend, bukan penjelasan terverifikasi provider.

### Rekonsiliasi screenshot tambahan
Setelah attempt, pengguna mengirim screenshot dashboard transaksi 2026-10-26 12:32:07 WIB, model deepseek-v4-flash-free, Free-Pro, Error, status_code=429 openai_error, cost Rp0. Ini cocok dengan attempt lokal dan mendukung debit Rp0 untuk transaksi gagal tersebut berdasarkan bukti dashboard pengguna, bukan billing API. Durasi dashboard 2.0 detik berbeda dari wall-clock lokal 3.6069 detik; keduanya mengukur batas berbeda dan tidak diganti satu sama lain. Sisa kuota/reset/penyebab 429 tetap tidak tersedia. Tidak ada request baru sesudah screenshot ini.

## Interpretasi
Tidak ada prediksi kategori LLM yang sukses pada pilot ini. Jangan melaporkan accuracy LLM 0%/macro F1 0 atau menyimpulkan baseline unggul. Hasil yang tersedia hanya kegagalan teknis satu attempt, coverage 1/18, dan mismatch fallback terhadap label provisional. Median/p95 dengan n=1 sama dengan satu latency dan tidak representatif. Tidak ada bukti persistensi karena pool=null dan routing hanya simulasi mapping.

Reproduksi ringkasan: `node research/evaluation/summarize_live_pilot.cjs` membaca checkpoint dan menolak overwrite output. Menjalankan ulang request bukan reproduksi metrik; jangan resume sebelum penyebab 429/kuota diketahui. Setelah izin dan kuota dipastikan, --resume dapat melewati record yang sudah selesai (termasuk error); tidak otomatis mengulang sampel gagal. Retry/repeat sampel gagal perlu run/attempt versi baru agar riwayat tidak ditimpa.

## Keterbatasan implementasi
Live runner baru menjalani syntax check dan satu kegagalan API nyata; belum tervalidasi penuh pada success/body timeout/interupsi. Offline runner sebelumnya telah diuji terpisah, bukan bukti semua cabang live teruji. Tidak menyimpan raw response error atau Retry-After; observability rate-limit terbatas. Tidak ada screenshot baru. Jangan membuat predictions.csv final, confusion matrix final atau paper final dari satu error ini.

## Langkah selanjutnya
Periksa dashboard rate-limit/kuota/tanggal reset dan debit transaksi pilot. Jangan retry otomatis, mengganti model, menurunkan perlindungan, atau memakai kredensial lain. Lanjutkan review label independen tanpa API sambil menunggu akses tersedia. Status penelitian: pilot tidak lengkap, belum layak kesimpulan performa LLM.
