# Reproduksibilitas studi eksploratori MiniMax

Status: studi eksploratori selesai; **bukan eksperimen final ber-ground-truth manusia**. Input 27 teks sintetis dan label acuan provisional dari dua AI; metadata `purpose: Human independent rating` pada template penilai tidak menggambarkan provenance sebenarnya. Perbedaan kategori sekunder 0009 tidak diadjudikasi.

## Perintah yang benar-benar dijalankan

1. `node --check research/evaluation/final_candidate_v2/run_exploratory.cjs` — syntax OK.
2. `node research/evaluation/final_candidate_v2/run_exploratory.cjs --dry-run` — 27 checkpoint dry-run, 0 POST/DB writes.
3. `node research/evaluation/final_candidate_v2/exploratory_baseline.cjs` — 27 prediksi keyword lokal, 0 POST.
4. `node research/evaluation/final_candidate_v2/run_exploratory.cjs --live` — 27 POST (satu/sampel, tanpa retry), 27 HTTP 200/status success/strict-valid. Batch berakhir `COMPLETED`. Tidak ada DB writes. Folder `exploratory_run_v1/` berisi manifest dan satu JSON per sampel.
5. `node research/evaluation/final_candidate_v2/analyze_exploratory.cjs` — output terhitung dari file tersimpan di `exploratory_analysis_v1/`.
6. `node --test research/evaluation/analyze_pilot.test.cjs research/evaluation/metrics.test.cjs research/evaluation/retry_policy.test.cjs` — 9 pass, 0 fail; ini test utilitas perhitungan, bukan akurasi model.

Analisis dibuat sekali (menolak overwrite). Ulangi hanya dengan direktori output versi baru atau salinan terpisah; **jangan mengulang POST** untuk menghitung ulang. `run_exploratory.cjs` menolak run bila folder tujuan telah ada. Pending marker yang tersisa menunjukkan hasil request tidak pasti dan tidak boleh direplay otomatis. `analyze_exploratory.cjs` menolak adanya `.lock`/`.pending`, mismatch hash label/dataset/model dan direktori output yang telah ada. Perhitungan matriks/per kelas menggunakan sembilan kategori tetap, zero_division=0; kategori salah/tidak ada tidak dikeluarkan dari denominator 27. Percentile latency memakai interpolasi linear.

Source commit saat batch tersimpan di `exploratory_run_v1/manifest.json`; SHA-256 dataset, jawaban dua AI, service, adapter dan harness juga tersimpan di sana. Prompt version per sampel adalah hash messages request; ID model yang diminta dan dikembalikan ada pada log. Harga Free-Pro dan eligibility diperiksa sebelum run; API tidak menyediakan bukti debit akun Rp0 atau sisa kuota. Tidak ada klaim pengukuran actual account charge, persistensi controller maupun calibration.

Artefak utama: `exploratory_run_v1/SIPW-EVAL-CAND-*.json` (raw/normalized, status, latency, confidence/review, model), `exploratory_analysis_v1/{predictions.csv,results_summary.json,metrics_by_category.csv,confusion_matrix.csv,department_results.csv,error_analysis.md}`, `exploratory_keyword_baseline_v1/`. Semua bersifat lokal hingga diperiksa aman untuk publikasi; jangan memasukkan kredensial, header, atau data pribadi ke Git.
