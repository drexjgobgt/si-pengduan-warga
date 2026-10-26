# Validasi dan Audit Baseline Keyword — SIPW Finalization v1

**Tanggal Audit**: 26 Oktober 2026  
**Status Audit**: **PASS (TERVERIFIKASI PENUH & REPRODUCIBLE)**  
**Objek Evaluasi**: Keyword Baseline Historis (Commit `8d66996`, Blob `4cbbb9f`) pada Dataset Final v1 (270 Sampel)  
**Lingkungan**: Terisolasi lokal, tanpa koneksi jaringan, tanpa pemanggilan API pihak ketiga, tanpa akses basis data produksi.

---

## 1. Inventarisasi dan Verifikasi Integritas Artefak

Seluruh file yang mendasari evaluasi telah diverifikasi keberadaannya dan dihitung nilai checksum kriptografis SHA-256 byte persis:

| No | Komponen Artefak | Jalur File Relatif | Ukuran (Bytes) | SHA-256 Terverifikasi | Status Hash vs Manifest |
|:---:|---|---|:---:|---|:---:|
| 1 | **Skenario Registri Target** | `research/evaluation/synthetic_final_v1/synthetic_scenario_registry.json` | 134.195 | `e663226792e23eef1c5e277a066aeb5dae35e554c2c379befd5ae1df0babfa03` | **COCOK (PASS)** |
| 2 | **Dataset Narasi (Tanpa Label)** | `research/evaluation/synthetic_final_v1/synthetic_dataset.json` | 84.444 | `98a2d730f8272969d2576e6385a0b36b9453d8ba2e85e87dc7ca86611bb63e3e` | **COCOK (PASS)** |
| 3 | **Manifest Dataset Beku** | `research/evaluation/synthetic_final_v1/dataset_manifest.json` | 1.155 | `6e5c0fcd1a9bcfa3eeb239f8d4f73648a0291c121c420cecc63d8d858b4dd343` | **COCOK (PASS)** |
| 4 | **Protokol Eksperimen Beku** | `research/evaluation/synthetic_final_v1/frozen_experiment_protocol.md` | 3.424 | `3652c41793744fcbbceb06666ba8e67da9ea6014e30fc9ce6ba63d76e73715d3` | **COCOK (PASS)** |
| 5 | **Prediksi Baseline Tersimpan** | `research/evaluation/synthetic_final_v1/keyword_baseline/predictions.json` | 31.790 | `55d314818fe2b1f8fb54b1f6dbfc17ba85bb12aece2697d620aee0f0ddcfd5c8` | **COCOK (PASS)** |
| 6 | **Manifest Baseline** | `research/evaluation/synthetic_final_v1/keyword_baseline/manifest.json` | 569 | `f1ce896d888126b6495b597c5ddb806d2039775f0a0d4cbb8f42ef9e34a6ef5d` | **COCOK (PASS)** |
| 7 | **Kontrak Penilaian Terbekukan** | `research/evaluation/pre_live_remediation_v1/scoring_contract.md` | 5.228 | `b59f75616f6d8e45ececb7e3b8242773cefd46b09f1b8c71d0eab5fe81227265` | **COCOK (PASS)** |
| 8 | **Laporan Remediasi Pra-Live** | `research/evaluation/pre_live_remediation_v1/remediation_report.md` | 4.887 | `bbceaa64673891d4e112461ec4668b5947a17721e51b2e2d93e18a994772b146` | **COCOK (PASS)** |
| 9 | **Naskah Artikel Ilmiah** | `research/manuscript/artikel_ilmiah_final_v1.md` | 27.530 | *(Terverifikasi memuat angka persis)* | **COCOK (PASS)** |

---

## 2. Struktur Dataset dan Distribusi Kategori

- **Ukuran Total Dataset**: 270 narasi pengaduan warga sintetis.
- **Integritas Identifier**: 270 ID unik (`SIPW-SYN-0001` s.d. `SIPW-SYN-0270`), 0 duplikasi, relasi 1-to-1 lengkap antara dataset dan registri target.
- **Distribusi Kategori**: Seimbang sempurna (*balanced*), tepat 30 sampel per kategori untuk 9 kelas layanan publik:
  1. `sampah`: 30 sampel
  2. `jalan_rusak`: 30 sampel
  3. `banjir`: 30 sampel
  4. `listrik`: 30 sampel
  5. `air_bersih`: 30 sampel
  6. `keamanan`: 30 sampel
  7. `kesehatan`: 30 sampel
  8. `pendidikan`: 30 sampel
  9. `lainnya`: 30 sampel
- **Sebaran Tipe Kasus Bahasa**:
  - `formal`: 45 sampel
  - `informal`: 45 sampel
  - `typo`: 45 sampel
  - `ambiguous`: 45 sampel
  - `incomplete`: 45 sampel
  - `multicategory`: 40 sampel
  - `out_of_scope`: 5 sampel
- **Jumlah Keluarga Kejadian Inti**: 55 keluarga (*event families*).

---

## 3. Hasil Hitung Ulang Metrik Keyword Baseline

Perhitungan metrik dilakukan secara independen terhadap 270 sampel prediksi tersimpan dengan denominator konservatif $P = 270$:

- **Sampel Cocok (True Positive)**: 178 sampel
- **Sampel Tidak Cocok (False Positive / False Negative)**: 92 sampel
- **Akurasi Global**: **65,93%** (178 / 270 = 0,659259)
- **Macro Precision**: **81,87%** (0,818669)
- **Macro Recall**: **65,93%** (0,659259)
- **Macro F1-Score**: **64,02%** (0,640177)

### Tabel Metrik per Kategori Layanan

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
| **Rata-rata Makro** | **270** | **178** | **92** | **92** | **270** | **0,8187** | **0,6593** | **0,6402** |

### Confusion Matrix 9 × 9 Baseline

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
Total Diprediksi  6   29   39   36   12    5   24   30   89    270
```

---

## 4. Evaluasi Pola Kesalahan Klasifikasi Baseline

1. **Penumpukan ke Kategori Penampung Default (`lainnya`)**:
   - Total prediksi kategori `lainnya` membengkak hingga **89 sampel** (presisi tertekan ke 33,71%).
   - Dari 89 sampel tersebut, 59 sampel adalah pengaduan teknis sah yang gagal dideteksi kamus kata kunci karena penggunaan bahasa informal atau slang warga:
     - 20 sampel `sampah` (misal: "aroma busuk menyengat dari tumpukan limbah plastik")
     - 20 sampel `keamanan` (misal: "remaja nongkrong bawa senjata tajam buat resah")
     - 10 sampel `jalan_rusak`
     - 5 sampel `kesehatan`
     - 3 sampel `air_bersih`
     - 1 sampel `banjir`
2. **Tumpang Tindih Leksikal Lintas Domain**:
   - 10 sampel `air_bersih` salah terprediksi sebagai `banjir` dan 5 sampel sebagai `jalan_rusak` karena pelapor mengeluhkan pipa PDAM bocor dengan kata-kata "menggenangi badan jalan".
   - 6 sampel `listrik` salah terprediksi sebagai `jalan_rusak` karena tiang lampu roboh di aspal.
3. **Ketahanan Kategori Spesifik**:
   - Kategori `pendidikan` mencapai presisi dan recall 100% karena leksikon domain ("sekolah", "gedung kelas", "guru", "siswa") sangat distingtif dan tidak tumpang tindih dengan fasilitas sipil lainnya.

---

## 5. Konsistensi Antar-Artefak dan Naskah Publikasi

Audit mengonfirmasi bahwa seluruh nilai yang tercantum dalam:
- Laporan Audit Baseline (`research/evaluation/audit_baseline_v1/baseline_audit_report.md`),
- Laporan Status Preflight (`research/evaluation/llm_preflight_v1/preflight_report.md`),
- Naskah Artikel Ilmiah Markdown (`research/manuscript/artikel_ilmiah_final_v1.md`), dan
- Naskah Artikel Word DOCX (`research/manuscript/artikel_ilmiah_final_v1.docx`),

memiliki **konsistensi 100% tanpa ada diskrepansi numerik sedikit pun**. Tidak ada data tiruan yang dimasukkan dan tidak ada classifier berbeda yang diklaim sebagai baseline historis.
