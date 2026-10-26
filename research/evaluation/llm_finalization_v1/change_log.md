# Log Perubahan & Jejak Audit — SIPW Finalization v1

**Judul Penelitian**: *“Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web”*

---

## Entri Log 4: Penyelesaian Sesi 2 dan Finalisasi Evaluasi 270 Sampel
- **Waktu**: 2026-10-26T18:05:00+07:00
- **Tindakan**:
  1. Menjalankan audit pra-lanjutan: memverifikasi 150 sampel unik tersimpan pada `full_run/results/` (146 `COMPLETED`, 3 `INVALID_SCHEMA`, 1 `PARSE_FAILED`).
  2. Mengidentifikasi tepat 120 sampel tersisa (`SIPW-SYN-0151` s.d. `SIPW-SYN-0270`).
  3. Memperbaiki logika checkpoint pada `run_evaluation_live.cjs` agar mendeteksi seluruh status finalisasi (`COMPLETED`, `INVALID_SCHEMA`, `PARSE_FAILED`) guna mencegah duplikasi atau eksekusi ulang pada 150 sampel pertama.
  4. Menjalankan evaluasi live Sesi 2 (120 sampel tersisa) dengan inter-dispatch pacing 7.000 ms (~8,5 RPM) pada model `minimax-m3.1-flash-free`.
  5. Sesi 2 berhasil memproses 119 sampel dengan status `COMPLETED` dan 1 sampel `PARSE_FAILED` (`SIPW-SYN-0168`, kasus degenerative repetition loop).
  6. Menghitung ulang seluruh metrik secara menyeluruh dari 270 file hasil mentah pada disk dengan denominator beku $P=270$:
     - Akurasi Global: **98,15%** (265 / 270)
     - Macro Precision: **100,00%**
     - Macro Recall: **98,15%**
     - Macro F1-Score: **99,04%**
     - Strict Format Validity: **98,15%** (265 / 270)
  7. Menyusun artefak evaluasi final: `final_execution_report.md`, `comparison_report.md`, `evaluation_summary.md`, `confusion_matrix_llm.csv`, `category_metrics_llm.csv`.
  8. Memutakhirkan naskah ilmiah `artikel_ilmiah_final_v1.md` dan mengompilasi versi Word `artikel_ilmiah_final_v1.docx`.

## Entri Log 3: Eksekusi Live Pilot & Sesi 1 (150 Sampel)
- **Waktu**: 2026-10-26T17:35:00+07:00
- **Tindakan**:
  1. Menjalankan uji coba pilot 3 sampel (`SIPW-SYN-0001`, `0031`, `0061`) dengan hasil 100% lulus (GO Decision).
  2. Mengalihkan eksekusi ke Sesi 1 (150 sampel).
  3. Mengidentifikasi batas laju provider 15 RPM pada panggilan ke-38; mengonfigurasi inter-dispatch pacing 7.000 ms.
  4. Menyelesaikan 150 sampel pertama dengan capaian 146 selesai valid, 3 `INVALID_SCHEMA` (halusinasi "PDAM"), dan 1 `PARSE_FAILED` (degenerative repetition loop).
  5. Mengompilasi naskah artikel interim versi 1.

## Entri Log 2: Pembangunan Runner Mandiri dan Regression Suite 24 Tes
- **Waktu**: 2026-10-26T16:50:00+07:00
- **Tindakan**:
  1. Membangun runner modular durabel `runner.cjs` dan `runner.test.cjs` (7/7 tes lulus).
  2. Mengisolasi celah keamanan `FREE_ONLY` pada `adapter_remediation/` (7/7 tes lulus).
  3. Menguji suite scoring dan evaluation guard (10/10 tes lulus). Total 24/24 tes regresi lulus 100%.

## Entri Log 1: Audit Integritas Dataset dan Perhitungan Ulang Baseline
- **Waktu**: 2026-10-26T16:00:00+07:00
- **Tindakan**:
  1. Memverifikasi hash kriptografis dataset 270 sampel (100% cocok dengan manifest).
  2. Menghitung ulang baseline keyword: Akurasi 65,93%, Macro Precision 81,87%, Macro Recall 65,93%, Macro F1 64,02%.
