# Kandidat holdout sintetis v2 — BELUM DATASET FINAL

27 pengaduan sintetis baru, tiga **label provisional** per kategori, mencakup tujuh tipe kasus. Semua teks dan label provisional disusun oleh AI agent untuk tujuan persiapan; bukan laporan warga riil, bukan representasi populasi, bukan ground truth manusia. `dataset.candidate.json` memakai `split=final` sebagai **target split yang diusulkan**, tetapi `manifest.json::final_dataset_frozen=false` berarti **BELUM boleh dipakai sebagai evaluasi final**.

Perintah yang sudah dijalankan: `node research/evaluation/final_candidate_v2/prepare.cjs`; output dibuat sekali dengan `wx` dan tidak menimpa artefak lama. SHA-256 dataset di manifest. Pemeriksaan lokal menolak kecocokan teks persis dengan 27 kandidat sebelumnya, bukan pemeriksaan kebocoran semantik yang sempurna. Definisi kelas berasal dari prompt produksi dan penulis mengetahui hasil pilot terdahulu; potensi bias desain dan semantic leakage wajib ditinjau sebelum freeze.

`rater_A.blank.json` dan `rater_B.blank.json` adalah template **tanpa** label provisional, prediksi atau hasil baseline. Masing-masing harus diisi secara mandiri oleh **orang berbeda** yang tidak melihat file `dataset.candidate.json`, `candidates.cjs`, prediksi, atau jawaban penilai lain. Berikan hanya satu blank packet dan `../labeling_guide.md` per penilai; salin ke file jawaban baru di luar template, jangan menimpa blank packet. Jangan menyebarluaskan data sensitif; seluruh teks saat ini sintetis dan tetap perlu pemeriksaan PII manusia.

Setelah kedua penilai selesai: validasi ID/hash/enum dan kelengkapan, hitung agreement sebelum adjudication, dokumentasikan semua konflik dan alasan penyelesaiannya dalam file baru. Jika manusia mengubah wording atau label acuan, buat versi dataset/hash baru; jangan ganti isi `dataset.candidate.json` secara diam-diam. Departemen berdasarkan mapping otomatis di kandidat **bukan** label departemen substantif independen; penilai harus mencatat asal labelnya.

Belum ada request provider atau screenshot dari pembuatan kandidat ini. Tidak ada angka akurasi final. Eksperimen final dan publikasi hasilnya memerlukan izin jumlah request/biaya terpisah setelah freeze.

## Status jawaban yang diterima

Pengguna mengonfirmasi `rater_A_completed.json` dan `rater_B_completed.json` diisi **dua AI yang berbeda**, bukan manusia. Kedua file tidak diubah. `purpose: "Human independent rating"` di dalam file berasal dari template dan **tidak menggambarkan provenance jawaban aktual**. Kesepakatan kategori utama kedua AI adalah 27/27, tetapi label tetap provisional; satu perbedaan kategori sekunder ada pada sampel 0009. Lihat `label_validation_2026-10-26.md` sebelum menggunakan berkas. Jangan mengklaim validasi ground truth manusia atau akurasi final dari label ini.

## Studi eksploratori yang disetujui

Pengguna menyetujui maksimal 27 POST MiniMax, tanpa retry dan batas biaya Rp0. Protokol lengkap: `exploratory_protocol_v1.md`. Perintah dry-run: `node research/evaluation/final_candidate_v2/run_exploratory.cjs --dry-run` (dilakukan; 27 sampel, 0 POST). Batch live: `node research/evaluation/final_candidate_v2/run_exploratory.cjs --live`; jalankan hanya sekali pada output baru. Baseline keyword historis: `node research/evaluation/final_candidate_v2/exploratory_baseline.cjs` (27 prediksi lokal, tidak mengirim API). Sesudah run selesai tanpa lock/pending: `node research/evaluation/final_candidate_v2/analyze_exploratory.cjs`, yang menulis analisis dalam folder terpisah. Jangan menggabungkan analisis ini dengan hasil final penelitian atau dengan batch DeepSeek lama.
