# Protokol beku dataset sintetis v1 — LIVE BLOCKED

Judul tetap: **Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web**.

270 narasi/30 per kategori; target disimpan terpisah di `synthetic_scenario_registry.json`, hash dan timestamp prateks di `registry_freeze_receipt.json`. Narasi `synthetic_dataset.json` hanya memuat sample_id/title/description/complaint_text, tanpa label. Classifier menerima hanya title dan description. Target berbasis spesifikasi sintetis, bukan ground truth manusia. 55 keluarga kejadian digunakan untuk analisis ketergantungan; bukan 270 kejadian independen atau sampel populasi warga.

## Audit dan aturan

Kategori kode `backend/services/classificationService.js:13–23` cocok sembilan domain: sampah, jalan_rusak, banjir, listrik, air_bersih, keamanan, kesehatan, pendidikan, lainnya. Sumber dokumentasi: `research/evaluation/synthetic_dataset_design.md` dan audit lama. Definisi kategori dalam kode: limbah/kebersihan; jalan/trotoar/jembatan; genangan/drainase; jaringan/penerangan; pasokan air; ketertiban; fasilitas/layanan kesehatan; fasilitas/pembelajaran; administratif/di luar domain. Sumber primer tetap kode, bukan asumsi README.

Registry menetapkan aksi utama mengalahkan masalah sekunder, domain jelas tetap dilabel walau waktu/lokasi kurang, dan tanpa petunjuk domain memakai lainnya. PII, duplikat exact, instruksi label, fakta/aksi hilang atau kontradiksi tak terselesaikan harus dikarantina sebelum freeze; tidak boleh diperbaiki dengan melihat prediksi baseline/LLM. Dataset beku tidak ditulis ulang; revisi menjadi versi baru.

## Baseline dan eksperimen primer yang direncanakan

Baseline keyword historis commit `8d669965ac6048cf1af9abed470b49e7cad0def8`, blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f`, tanpa tuning; jalankan **sesudah freeze** dengan `complaint_text` sama dan target registry. Simpan manifest/hash dan prediksi lokal terpisah. Baseline bukan gate pemilihan sampel.

Live (belum diizinkan): maksimal 270 POST, satu/sampel, retries 0, concurrency 1, jarak start >=10 detik. MiniMax `minimax-m3.1-flash-free`, Kios API, temperature 0.1, output cap 500 token, JSON mode, timeout produksi 15000 ms, hard deadline harness 22000 ms dengan perbedaan tersebut diungkap. Fungsi produksi `classifyComplaint(title,description,null)`, katalog default beku, tidak ada DB; model ID returned, prompt lengkap/hash, commit/parameter/timestamp aktual disimpan saat run. Tidak ada klaim konfigurasi provider kini terverifikasi karena tidak ada API saat persiapan ini.

Accuracy/kecocokan dan macro F1 utama dihitung terhadap target skenario sintetis; precision/recall/F1 sembilan kelas, confusion matrix, valid-output/failure/timeout/fallback, median/p95 latency monotonic (linear interpolation) dari semua attempt plus success-only. Semua 270 planned tetap denominator konservatif; missing/unattempted sentinel, partial run tidak disebut lengkap. Raw sebelum normalisasi dan final sistem terpisah; error API/parse fallback lainnya/KELURAHAN/0/review true, invalid enum dapat dinormalisasi. Fallback yang kebetulan cocok target lainnya tetap error teknis, bukan sukses model. Baseline errors tidak dikeluarkan. Mapping departemen hanya konsistensi aplikasi, bukan kewenangan substantif. Secondary/priority tidak dihitung tanpa target tambahan yang sah. Confidence self-report, bukan probabilitas terkalibrasi.

Stop pada auth/402/429/5xx/network/timeout, drift model, harga/kuota tak terverifikasi atau indikasi biaya; checkpoint pending tidak replay. Tidak ada retry atau perubahan label untuk memperbaiki skor. Analisis paired dan sensitivitas per keluarga, bukan inferensi populasi warga. Jangan tuning pada dataset ini; semua eksploratori lama dipertahankan terpisah.

## Batas izin

Budget maksimum Rp0. Nama free dan harga katalog lama bukan bukti harga efektif akun kini. Input token dan kuota belum diverifikasi; output cap primer 135000 token permintaan bukan usage aktual. Verifikasi harga efektif, grup akun, kuota dan aturan billing serta minta persetujuan live baru sebelum **segala** POST. Counter lokal default 200/hari tidak menjadi izin 270 sekaligus; jadwal lintas hari harus disetujui tanpa restart untuk menghindari limit. Tidak ada API, database, perubahan source produksi atau push pada persiapan ini.
