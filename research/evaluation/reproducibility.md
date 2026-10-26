# Reproduksibilitas — tahap persiapan/offline

Status: belum ada eksperimen LLM massal/final. Dokumen ini bukan laporan metrik klasifikasi.

## Lingkungan
Windows PowerShell, Node v24.21.0; source produksi commit b20a74ac8febdb81af253c8b19ee15655bad5989. Tidak memasang dependency baru. Semua helper CJS memakai Node built-in, kecuali helper runtime sebelumnya yang memakai dependency backend terpasang. Harness dry-run/offline tidak memuat dotenv, server, controller atau modul database.

## Perintah dari root repositori
```powershell
node research/evaluation/prepare_dataset.cjs
node research/evaluation/verify_offline.cjs
```
Persiapan dataset/manifest dan laporan verifikasi menolak overwrite. Untuk mengulang verifikasi sesudah laporan pertama, jangan hapus hasil lama: jalankan CLI ke direktori run baru dan gunakan unit tests langsung:
```powershell
node --test research/evaluation/harness.test.cjs
node research/evaluation/evaluate.cjs --dataset research/evaluation/dataset.provisional.json --out research/evaluation/runs/dry-run-new --mode dry-run
node research/evaluation/evaluate.cjs --dataset research/evaluation/dataset.provisional.json --out research/evaluation/runs/dry-run-new --mode dry-run --resume
node research/evaluation/evaluate.cjs --dataset research/evaluation/dataset.provisional.json --out research/evaluation/runs/fixtures-new --mode offline-fixtures
```

## Arti mode
Dry-run menggunakan jalur prompt produksi dan fetch mock tetap untuk memeriksa struktur request. Respons mock dipakai internal agar layanan dapat selesai, tetapi tidak disimpan sebagai prediksi. Record bertanda DRY_RUN, real API requests 0. Offline-fixtures menyimpan hasil respons canned yang sengaja mencakup error; semua record OFFLINE_ONLY_NOT_LLM_RESULTS. Tidak menghitung accuracy/F1, tidak menulis predictions.csv atau results_summary.json penelitian dari simulasi ini.

## Checkpoint
Manifest mengikat hash dataset, service, provider, harness dan validator serta commit. Satu berkas per sample_id memakai hash nama file, exclusive create dan fsync; marker pending dicatat sebelum attempt. Resume melewati hasil valid yang selesai; marker uncertain tanpa hasil menghentikan eksekusi, bukan replay. Satu lock per run mencegah dua worker; stale lock/pending perlu pemeriksaan manual, jangan dihapus otomatis. SIGINT/SIGTERM berhenti setelah sampel aktif selesai; kill mendadak dapat meninggalkan uncertain marker. Tidak ada retry/network di mode saat ini.

## Parameter dan raw
Prompt sistem persis yang disusun service dicatat per sample dan di-hash SHA-256; request user tersimpan untuk teks sintetis. Mode offline memakai katalog default (pool=null), bukan DB. Hash model source/prompt bukan bukti provider model stabil. Field raw unavailable disimpan null + parse_mode/error, bukan dibuat-buat. routing_department_simulated adalah mapping snapshot lokal, routing_persisted=false; bukan persistence controller yang diuji.

## Batas keamanan dan live
Mode live sengaja ditolak sebelum akses credential/network sampai budget/kuota dan desain dataset disetujui. Ini bukan harness live siap eksperimen. Rate-limit, deadline body, raw capture provider, spend guard, model availability dan account usage perlu diuji/diterapkan pada tahap live terpisah; jangan menyebut mock sebagai validasi batas provider. Harga/sisa kuota belum diketahui.

## Bukti
Manifest dataset, per-sample records dan evidence/offline_verification.json memungkinkan pemeriksaan ulang jumlah kandidat, hash, resume dan skenario fixture. Log unit runner berada pada run_directory yang dicatat laporan. Tidak ada bukti prediksi LLM tambahan selain evidence/runtime_smoke.json dari tahap sebelumnya. Screenshot offline belum tersedia sampai capture asli dilakukan.
