# Laporan Audit Baseline v1 — SIPW

**Tanggal Audit**: 26 Oktober 2026  
**Status Audit**: **PASS (TERVERIFIKASI PENUH)**  
**Objek Audit**: Evaluasi Ulang Baseline Kata Kunci Historis pada Dataset Final v1 (270 Sampel)  
**Lingkungan**: Terisolasi lokal, tanpa koneksi jaringan, tanpa pemanggilan API pihak ketiga, tanpa akses basis data produksi.

---

## 1. Ringkasan Eksekutif

Audit baseline tahap 1 ini melakukan verifikasi integritas kriptografis dan penghitungan ulang independen atas kinerja algoritma klasifikasi berbasis kata kunci (*keyword baseline*) historis (commit `8d66996`, blob `4cbbb9f`) terhadap dataset terbekukan `synthetic_final_v1`. 

Seluruh metrik yang dilaporkan dalam naskah artikel ilmiah ([`research/manuscript/artikel_ilmiah_final_v1.md`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/manuscript/artikel_ilmiah_final_v1.md)) telah dihitung ulang secara independen langsung dari file registri target dan file prediksi mentah yang tersimpan. Hasil audit mengonfirmasi:
- **Jumlah Sampel**: Tepat 270 narasi, tanpa duplikasi ID, tanpa sampel hilang.
- **Distribusi Target**: Seimbang sempurna, masing-masing tepat 30 sampel untuk 9 kategori layanan publik.
- **Integritas Kriptografis**: 100% hash SHA-256 cocok persis dengan `dataset_manifest.json` dan `manifest.json`.
- **Hasil Klasifikasi**: **178 cocok** (True Positive), **92 tidak cocok** (False Positive / False Negative).
- **Akurasi**: **65,93%** (178 / 270).
- **Macro Precision**: **81,87%** (0,818669).
- **Macro Recall**: **65,93%** (0,659259).
- **Macro F1-Score**: **64,02%** (0,640177).
- **Discrepancy dengan Artikel**: **0 perbedaan numerik (100% konsisten)**.

---

## 2. Inventaris Artefak yang Diverifikasi

| Nama Komponen | Lokasi File Relatif | Ukuran (Bytes) | Hash SHA-256 Terverifikasi |
|---|---|:---:|---|
| **Skenario Registri Target** | `research/evaluation/synthetic_final_v1/synthetic_scenario_registry.json` | 134.195 | `e663226792e23eef1c5e277a066aeb5dae35e554c2c379befd5ae1df0babfa03` |
| **Dataset Narasi (Tanpa Label)** | `research/evaluation/synthetic_final_v1/synthetic_dataset.json` | 84.444 | `98a2d730f8272969d2576e6385a0b36b9453d8ba2e85e87dc7ca86611bb63e3e` |
| **Manifest Dataset** | `research/evaluation/synthetic_final_v1/dataset_manifest.json` | 1.155 | `6e5c0fcd1a9bcfa3eeb239f8d4f73648a0291c121c420cecc63d8d858b4dd343` |
| **Protokol Eksperimen Beku** | `research/evaluation/synthetic_final_v1/frozen_experiment_protocol.md` | 3.424 | `3652c41793744fcbbceb06666ba8e67da9ea6014e30fc9ce6ba63d76e73715d3` |
| **Prediksi Baseline Tersimpan** | `research/evaluation/synthetic_final_v1/keyword_baseline/predictions.json` | 31.790 | `55d314818fe2b1f8fb54b1f6dbfc17ba85bb12aece2697d620aee0f0ddcfd5c8` |
| **Manifest Baseline** | `research/evaluation/synthetic_final_v1/keyword_baseline/manifest.json` | 569 | `f1ce896d888126b6495b597c5ddb806d2039775f0a0d4cbb8f42ef9e34a6ef5d` |
| **Kontrak Penilaian (Scoring Contract)** | `research/evaluation/pre_live_remediation_v1/scoring_contract.md` | 5.228 | `b59f75616f6d8e45ececb7e3b8242773cefd46b09f1b8c71d0eab5fe81227265` |
| **Laporan Remediasi** | `research/evaluation/pre_live_remediation_v1/remediation_report.md` | 4.887 | `bbceaa64673891d4e112461ec4668b5947a17721e51b2e2d93e18a994772b146` |
| **Naskah Artikel Ilmiah** | `research/manuscript/artikel_ilmiah_final_v1.md` | 27.530 | *(Telah diperiksa terhadap seluruh angka metrik)* |

---

## 3. Verifikasi Struktur Dataset dan Registri Target

- **Total Baris Dataset**: 270 sampel unik (`sample_id`: `SIPW-SYN-0001` s.d. `SIPW-SYN-0270`).
- **Pengecekan Duplikasi**: 0 duplikasi ID pada dataset, 0 duplikasi ID pada registry, 0 duplikasi ID pada prediksi baseline.
- **Pengecekan Relasi 1-to-1**: 
  - Sampel dataset tanpa target: 0
  - Target registry tanpa teks dataset: 0
  - Sampel baseline tanpa pasangan target: 0
- **Distribusi Kategori Target**:
  - `sampah`: 30 sampel
  - `jalan_rusak`: 30 sampel
  - `banjir`: 30 sampel
  - `listrik`: 30 sampel
  - `air_bersih`: 30 sampel
  - `keamanan`: 30 sampel
  - `kesehatan`: 30 sampel
  - `pendidikan`: 30 sampel
  - `lainnya`: 30 sampel
- **Karakteristik Kasus (*Case Types*)**:
  - `formal`: 45 sampel
  - `informal`: 45 sampel
  - `typo`: 45 sampel
  - `ambiguous`: 45 sampel
  - `incomplete`: 45 sampel
  - `multicategory`: 40 sampel
  - `out_of_scope`: 5 sampel
- **Jumlah Keluarga Kejadian Inti**: 55 keluarga (*family IDs*).

---

## 4. Hasil Hitung Ulang Kinerja Keyword Baseline

Penghitungan ulang dilakukan dengan membaca langsung prediksi dari `keyword_baseline/predictions.json` dan mencocokkannya ke target autoritatif pada `synthetic_scenario_registry.json`.

### Tabel Metrik per Kategori

| Kategori | Target (Support) | TP | FP | FN | Total Diprediksi | Precision | Recall | F1-Score |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `sampah` | 30 | 6 | 0 | 24 | 6 | 1,0000 | 0,2000 | 0,3333 |
| `jalan_rusak` | 30 | 18 | 11 | 12 | 29 | 0,6207 | 0,6000 | 0,6102 |
| `banjir` | 30 | 29 | 10 | 1 | 39 | 0,7436 | 0,9667 | 0,8406 |
| `listrik` | 30 | 24 | 12 | 6 | 36 | 0,6667 | 0,8000 | 0,7273 |
| `air_bersih` | 30 | 12 | 0 | 18 | 12 | 1,0000 | 0,4000 | 0,5714 |
| `keamanan` | 30 | 5 | 0 | 25 | 5 | 1,0000 | 0,1667 | 0,2857 |
| `kesehatan` | 30 | 24 | 0 | 6 | 24 | 1,0000 | 0,8000 | 0,8889 |
| `pendidikan` | 30 | 30 | 0 | 0 | 30 | 1,0000 | 1,0000 | 1,0000 |
| `lainnya` | 30 | 30 | 59 | 0 | 89 | 0,3371 | 1,0000 | 0,5042 |
| **Macro Average** | **270** | **178** | **92** | **92** | **270** | **0,8187** | **0,6593** | **0,6402** |

### Confusion Matrix 9x9 Terverifikasi

```
Target \ Pred   SAM  JAL  BAN  LIS  AIR  KEA  KES  PEN  LAI  Total
sampah            6    0    0    4    0    0    0    0   20     30
jalan_rusak       0   18    0    2    0    0    0    0   10     30
banjir            0    0   29    0    0    0    0    0    1     30
listrik           0    6    0   24    0    0    0    0    0     30
air_bersih        0    5   10    0   12    0    0    0    3     30
keamanan          0    0    0    5    0    5    0    0   20     30
kesehatan         0    0    0    1    0    0   24    0    5     30
pendidikan        0    0    0    0    0    0    0   30    0     30
lainnya           0    0    0    0    0    0    0    0   30     30
Total Pred        6   29   39   36   12    5   24   30   89    270
```

---

## 5. Perbandingan dengan Naskah Artikel Ilmiah

Audit membandingkan setiap nilai numerik pada hasil hitung ulang dengan naskah artikel ilmiah ([`artikel_ilmiah_final_v1.md`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/manuscript/artikel_ilmiah_final_v1.md)):

| Nilai / Pernyataan | Nilai Hasil Hitung Ulang | Nilai dalam Artikel Ilmiah | Status Kesesuaian |
|---|:---:|:---:|:---:|
| Ukuran Dataset | 270 sampel | 270 sampel | **IDENTIK (Cocok)** |
| Distribusi per Kategori | Tepat 30 per kategori | Tepat 30 per kategori | **IDENTIK (Cocok)** |
| Jumlah Sampel Cocok (TP) | 178 | 178 | **IDENTIK (Cocok)** |
| Jumlah Mismatch (FP/FN) | 92 | 92 | **IDENTIK (Cocok)** |
| Akurasi Keyword Baseline | 65,93% (0,659259) | 65,93% | **IDENTIK (Cocok)** |
| Macro Precision | 81,87% (0,818669) | 81,87% | **IDENTIK (Cocok)** |
| Macro Recall | 65,93% (0,659259) | 65,93% | **IDENTIK (Cocok)** |
| Macro F1-Score | 64,02% (0,640177) | 64,02% | **IDENTIK (Cocok)** |
| Nilai Matriks Konfusi | 81 sel konfusi | 81 sel pada Tabel 2 | **IDENTIK (Cocok)** |
| Jumlah Prediksi 'lainnya' | 89 prediksi | 89 prediksi | **IDENTIK (Cocok)** |
| Recall 'keamanan' | 16,67% (5/30) | 16,67% | **IDENTIK (Cocok)** |
| Recall 'sampah' | 20,00% (6/30) | 20,00% | **IDENTIK (Cocok)** |
| F1 'pendidikan' | 1,0000 (30/30) | 1,0000 | **IDENTIK (Cocok)** |

**Kesimpulan Perbandingan**: Tidak ditemukan diskrepansi numerik sedikit pun. Semua data pada naskah artikel ilmiah didukung 100% oleh bukti terverifikasi pada registri dan prediksi tersimpan.

---

## 6. Hambatan dan Catatan Data

1. **Ketiadaan Data Prediksi LLM 270 Sampel**:  
   Sesuai catatan integritas, tidak ada file prediksi LLM untuk dataset 270 sampel karena request live memang tidak pernah dijalankan. Audit menegaskan bahwa tidak ada data tiruan yang dibuat untuk mengisi kekosongan tersebut.
2. **Ketergantungan Data Sintetis**:  
   270 narasi berasal dari 55 keluarga kejadian inti. Meskipun terbukti seimbang dan konsisten secara leksikal, metrik baseline tidak boleh ditafsirkan sebagai estimasi performa pada seluruh pengaduan warga nyata di lapangan.
