# Indeks bukti visual eksploratori — 26 Oktober 2026

Ketujuh berkas di `../evidence/screenshots/EXPLORATORY_*.png` merupakan **screenshot browser Chrome headless atas halaman HTML lokal** yang dihasilkan dari dataset/log/analisis aktual (`build_evidence_view.cjs`, `evidence_view.html`, dan snapshot per bagian `evidence_*.html`). Ini bukan mockup angka: teks dan angka ditarik dari file eksperimen yang benar-benar disimpan. Namun **bukan** tangkapan proses terminal langsung pada waktu batch berjalan. Bukti primer tetap JSON/CSV dan skrip. Tanggal capture: 26 Oktober 2026, sesudah batch selesai (waktu tepat per-file tidak dibekukan dalam PNG; lihat metadata filesystem). Screenshot awal via anchor menghasilkan sebagian file kosong; semua tujuh nama `EXPLORATORY_*.png` ditangkap ulang dan dibuka untuk diperiksa. File probe/check terpisah bukan bukti penelitian.

| Nama screenshot yang diverifikasi ada | Tahap yang didukung | Status | Sumber dan keterbatasan |
|---|---|---|---|
| `EXPLORATORY_CODE_AUDIT.png` | audit kode | VALID TERBATAS | ringkasan visual file/fungsi yang telah dibaca, bukan editor sumber asli |
| `EXPLORATORY_TEST_EXECUTION.png` | test | VALID TERBATAS | tampilan browser dari catatan/log test; **bukan** screenshot terminal saat test berjalan |
| `EXPLORATORY_DATASET_SAMPLE.png` | dataset | VALID | cuplikan narasi sintetis dan label provisional; bukan data warga |
| `EXPLORATORY_PREDICTION_RESULTS.png` | prediksi | VALID | dari log model aktual; lima contoh, termasuk ketidakcocokan departemen |
| `EXPLORATORY_METRICS_RESULTS.png` | metrik | VALID | hasil analisis yang dihitung ulang dari 27 log, label AI provisional |
| `EXPLORATORY_ERROR_ANALYSIS.png` | analisis error | VALID | empat saran departemen berbeda dari mapping; tidak ada mismatch kategori provisional |
| `EXPLORATORY_FINAL_SUMMARY.png` | ringkasan | VALID | 27 request, 27 output valid, 23/27 saran departemen, 21/27 keyword baseline |

Nama `CODE_AUDIT.png`, `TEST_EXECUTION.png` tanpa prefix yang diminta master prompt **BELUM DIBUAT** sebagai screenshot editor/terminal langsung. Bukti rekonstruksi di atas tidak boleh ditampilkan seolah tangkapan live. Screenshot `RUNTIME_HEALTH.png` yang sudah ada dari fase lama bukan bukti klasifikasi MiniMax.

Artefak primer: `exploratory_run_v1/manifest.json` dan 27 log per sampel; `exploratory_analysis_v1/predictions.csv`, `results_summary.json`, `metrics_by_category.csv`, `confusion_matrix.csv`, `department_results.csv`, `error_analysis.md`. Tidak ada credential/PII warga dalam layar ini. Jangan mempublikasikan halaman atau screenshot sebelum mengecek ulang keamanan dan provenance label.
