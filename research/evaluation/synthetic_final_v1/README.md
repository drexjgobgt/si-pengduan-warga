# Dataset sintetis v1 — persiapan offline selesai, live dilarang

Judul artikel dipertahankan persis dalam registry/protokol. Lima berkas utama: `synthetic_scenario_registry.json`, `synthetic_dataset.json`, `dataset_manifest.json`, `dataset_qa_report.md`, `frozen_experiment_protocol.md`.

Urutan eksekusi aktual:
1. `node research/evaluation/synthetic_final_v1/prepare_registry.cjs` — registry 270 target ditulis dan hash disimpan di receipt; **narasi belum ada** saat receipt dibuat.
2. `node research/evaluation/synthetic_final_v1/realize_and_qa.cjs` — realisasi narasi deterministik tanpa API, QA offline, manifest freeze. 270 eligible menurut check konstruksi; 0 eksklusi. `qa_checks.json` memuat hasil per sampel.
3. `node research/evaluation/synthetic_final_v1/run_keyword_offline.cjs` — setelah manifest freeze, 270 prediksi keyword historis tersimpan di `keyword_baseline/`; 178 cocok target skenario, tanpa API/DB. Ini **hasil baseline aktual**, bukan kinerja LLM dan bukan akurasi warga; tidak digunakan untuk menyesuaikan label/narasi. Tidak ada prediksi LLM pada dataset ini.

## Batas validitas yang wajib dibaca

Ada 55 keluarga kejadian. Lima kejadian inti per kelas diulang dengan gaya berbeda; jumlah nominal 270 bukan 270 kejadian independen. Ini penyimpangan terbuka dari keinginan meningkatkan keragaman skenario sepenuhnya, bukan disembunyikan sebagai data unik semantik. Typo ringan, incomplete hanya menghapus rincian waktu/titik, ambigu-domain tetap memberi fakta pembeda, template meminta aksi eksplisit dan judul netral berulang. Desain ini dapat memudahkan classifier dan memberi fingerprint; skor tinggi tidak membuktikan robustness dunia nyata. Jika keragaman itu tidak memadai untuk tujuan artikel, buat versi baru sebelum live, pertahankan versi ini dan hasil baseline tanpa overwrite.

Aturan QA/eksklusi sudah ada di registry sebelum narasi. Pemeriksaan exact fakta/aksi, exact duplikat, regex leakage/PII dan trigram **tidak** menggantikan validasi semantik independen. Istilah alami domain tidak dilarang; instruksi label dan field target tidak masuk narasi. Target ini spesifikasi buatan AI agent dengan aturan terdokumentasi, bukan penilaian manusia. Tidak ada klaim representativitas atau blind independence dari penulis yang juga merancang generator.

Sebelum live: setujui kecukupan 55 keluarga/template dan typo ringan, audit semantik/QA lebih lanjut atau versi baru bila diperlukan, verifikasi harga efektif/grup/kuota Rp0 serta minta persetujuan maksimal 270 POST tanpa retry. Tidak ada push GitHub, akses DB atau perubahan produksi dalam pekerjaan ini. File eksploratori lama tidak disentuh.
