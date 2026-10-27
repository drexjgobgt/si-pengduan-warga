# Evaluasi Kinerja Large Language Model dan Keyword Baseline untuk Klasifikasi Pengaduan Warga (SIPW)

Repositori ini memuat artefak penelitian, data evaluasi, skrip verifikasi reproducibility, dan dokumentasi metodologis untuk pengujian klasifikasi otomatis laporan pengaduan warga pada Sistem Informasi Pengaduan Warga (SIPW).

---

## 1. Tujuan Eksperimen

Tujuan penelitian ini adalah mengevaluasi dan membandingkan kinerja klasifikasi otomatis antara:
1. **Keyword-based Baseline Classifier (`keyword-v1.0`)**: Sistem pencocokan leksikal deterministik berbasis kamus kata kunci dan regex yang sebelumnya digunakan pada backend SIPW.
2. **Large Language Model (`minimax-m3.1-flash-free`)**: Pendekatan zero-shot LLM berbasis instruksi terstruktur via Kios API yang menghasilkan output JSON tervalidasi skema.

Evaluasi dilakukan pada dataset uji sintetis terstandarisasi untuk mengukur akurasi ketat (*strict accuracy*), presisi, *recall*, *macro F1-score*, ketahanan skema (*strict format validity*), serta latensi operasional.

---

## 2. Dataset dan Distribusi Kategori

Eksperimen menggunakan dataset beku (*frozen dataset*) versi final:
- **Lokasi**: `research/evaluation/synthetic_final_v1/synthetic_dataset.json`
- **Total Sampel ($N$)**: 270 narasi pengaduan warga sintetis.
- **Jumlah Kategori**: 9 kategori domain publik.
- **Distribusi Target**: 30 sampel seimbang per kategori (*balanced target distribution*):

| No | Kategori | Kode Internal | Target Sampel | Deskripsi Cakupan Masalah |
|:---:|---|---|:---:|---|
| 1 | Sampah | `sampah` | 30 | Penumpukan sampah liar, TPS meluap, keterlambatan jadwal truk, bau busuk. |
| 2 | Jalan Rusak | `jalan_rusak` | 30 | Lubang jalan, aspal mengelupas, trotoar amblas, jalan bergelombang membahayakan. |
| 3 | Banjir | `banjir` | 30 | Genangan air pemukiman, drainase tersumbat, luapan sungai, tanggul jebol. |
| 4 | Listrik | `listrik` | 30 | PJU padam, trafo meledak, kabel semrawut membahayakan, pemadaman mendadak. |
| 5 | Air Bersih | `air_bersih` | 30 | Air PAM keruh/berbau, pipa bocor, pasokan air mati berhari-hari, tandon komunal. |
| 6 | Keamanan | `keamanan` | 30 | Premanisme, pungli, tawuran warga, balap liar, pencurian, gangguan ketertiban. |
| 7 | Kesehatan | `kesehatan` | 30 | Fasilitas puskesmas, antrean BPJS, wabah DBD/vektor, ketersediaan ambulans. |
| 8 | Pendidikan | `pendidikan` | 30 | Gedung sekolah rusak, pungli sekolah, kekurangan guru, hambatan zonasi/KIP. |
| 9 | Lainnya | `lainnya` | 30 | Urusan perizinan, administrasi kependudukan, taman kota, sengketa lahan privat. |

Dataset diturunkan dari 55 keluarga skenario kejadian (*scenario families*), dengan 7 variasi tipologi gaya penulisan:
- Ragam formal baku (45 sampel)
- Ragam informal / bahasa percakapan sehari-hari (45 sampel)
- Ragam mengandung salah ketik / *typo* (45 sampel)
- Ragam ambigu antar-domain (45 sampel)
- Ragam informasi tidak lengkap / *incomplete context* (45 sampel)
- Ragam pengaduan multi-masalah / *multicategory* (40 sampel)
- Ragam di luar lingkup utama / *out of scope* (5 sampel)

---

## 3. Asal Dataset dan Metode Penentuan Target Label

- **Asal Dataset**: Dataset sintetis dihasilkan melalui generator skenario deterministik berbasis aturan dan template skenario (`prepare_registry.cjs` dan `realize_and_qa.cjs`) yang diverifikasi integritasnya melalui *checksum* SHA-256 pada `dataset_manifest.json`.
- **Penentuan Target Label**: Target kategori ditetapkan secara deterministik pada level registri skenario (`synthetic_scenario_registry.json`) sebelum narasi teks digenerasi.
- **Pemberitahuan Metodologis Penting**: Target label pada dataset ini merupakan **spesifikasi skenario sintetis buatan**, bukan *ground truth* laporan warga riil yang telah divalidasi oleh pakar pemerintahan atau dianotasi oleh manusia secara ganda (*inter-rater reliability*). Skor evaluasi mengukur kepatuhan model terhadap skenario buatan, bukan estimasi akurasi mutlak pada laporan warga di dunia nyata.

---

## 4. Konfigurasi Model dan Parameter Inferensi

Evaluasi LLM dijalankan menggunakan model inferensi langsung:
- **Nama Model & ID**: `minimax-m3.1-flash-free` (diidentifikasi oleh provider sebagai `minimaxai/minimax-m3.1-flash`)
- **Penyedia Layanan (Provider)**: Kios API (`https://kiosapi.com/v1`)
- **Tingkat Akses / Tier**: Free-tier / promosi kuota
- **Waktu Eksekusi Eksperimen**: 26 Oktober 2026 (Sesi 1: 150 sampel, Sesi 2: 120 sampel)
- **Parameter Inferensi**:
  - `temperature`: 0.1 (deterministik tinggi untuk klasifikasi)
  - `max_tokens`: 500
  - `top_p`: 0.95
- **Kontrak Format Output (System Prompt)**: Output diwajibkan berupa format JSON murni (*strict pure JSON*) tanpa blok pembungkus markdown (tanpa ` ```json `), dengan 7 field skema:
  1. `category` (string, wajib salah satu dari 9 kategori)
  2. `secondaryCategories` (array of string kategori sekunder yang valid)
  3. `suggestedDepartment` (string, kode OPD resmi: `DLH`, `PUPR`, `DISHUB`, `SATPOLPP`, `DINKES`, `DISDIK`, atau `KELURAHAN`)
  4. `suggestedPriority` (string: `rendah`, `normal`, `tinggi`, `darurat`)
  5. `reason` (string alasan ringkas keputusan klasifikasi)
  6. `confidence` (integer skor keyakinan 0–100)
  7. `needsHumanReview` (boolean)
- **Tata Kelola Rate Limit**: Provider menerapkan batas *sliding-window* 15 RPM. Runner evaluasi menerapkan *inter-dispatch pacing* sebesar 7.000 ms (~8,5 RPM) untuk mencegah HTTP 429 *Rate Limit Exceeded*.

---

## 5. Definisi Metrik dan Penanganan Keluaran Tidak Valid

Evaluasi mengacu pada *Scoring Contract* yang ketat dengan penyebut tetap (*denominator invariant*) $P = 270$:

1. **Akurasi Ketat (*Strict Accuracy*)**:
   $$\text{Accuracy} = \frac{\sum_{i=1}^{N} \mathbb{I}(\text{status}_i = \text{COMPLETED} \land \hat{y}_i = y_i)}{N}$$
   Sampel yang mengalami kegagalan parsing (*repetition loop truncation*) atau menghasilkan skema yang tidak valid dianggap sebagai kegagalan prediksi (bukan dieliminasi dari penyebut).
2. **Keluaran Tidak Valid (*Non-Semantic Failures*)**:
   - `PARSE_FAILED`: Terjadi saat keluaran LLM tidak dapat diurai oleh parser JSON standar (misal terpotong sebelum kurung penutup karena repetisi berulang).
   - `INVALID_SCHEMA`: Terjadi saat JSON valid secara sintaksis, namun melanggar batasan enum skema sistem (misalnya merekomendasikan OPD di luar katalog resmi).
   - Penanganan dalam Matriks Konfusi: Masuk ke dalam kolom `__invalid__` dan dihitung sebagai *False Negative* ($FN$) bagi kelas target asli, serta tidak menambah *False Positive* ($FP$) pada kelas mana pun karena tidak ada kategori yang diakui.
3. **Macro Precision, Recall, dan F1-Score**:
   - $\text{Precision}_c = \frac{TP_c}{TP_c + FP_c}$
   - $\text{Recall}_c = \frac{TP_c}{TP_c + FN_c} = \frac{TP_c}{30}$
   - $\text{F1}_c = \frac{2 \cdot \text{Precision}_c \cdot \text{Recall}_c}{\text{Precision}_c + \text{Recall}_c}$
   - **Catatan Macro Precision 100%**: Macro precision mencapai 100,00% karena untuk seluruh 265 sampel yang menghasilkan prediksi kategori valid, model **tidak pernah menghasilkan False Positive** ($FP = 0$ di semua 9 kategori). Angka ini **bukan** berarti 100% permintaan berhasil menghasilkan keluaran valid, karena 5 sampel mengalami kegagalan teknis skema/parsing yang menurunkan recall dan akurasi global menjadi 98,15%.
4. **Kebijakan Perhitungan Latensi**:
   - Latensi diukur per panggilan HTTP (`duration_ms`) dari saat permintaan dikirim hingga seluruh *payload* respons diterima.
   - **Median Linear Midpoint**: Menggunakan rata-rata aritmetika dua nilai tengah pada urutan genap ($N=270$):
     $$\text{Median} = \frac{D[134] + D[135]}{2} = 3.616,91\text{ ms}$$
   - **Median Nearest-Rank ($p=50$)**: Menggunakan indeks elemen urutan tengah langsung:
     $$D[135] = 3.624,42\text{ ms} \quad (\text{upper rank}) \quad \text{atau} \quad D[134] = 3.609,40\text{ ms} \quad (\text{lower rank})$$
   - Kedua metode didokumentasikan secara terbuka untuk transparansi pelaporan.

---

## 6. Hasil Evaluasi yang Terverifikasi

Hasil evaluasi komparatif empiris terhadap $N=270$ sampel:

### A. Tabel Perbandingan Kinerja Utama

| Metrik Evaluasi | Keyword Baseline (`keyword-v1.0`) | LLM (`minimax-m3.1-flash`) | Perubahan ($\Delta$) |
|---|:---:|:---:|:---:|
| **Total Sampel ($N$)** | 270 | 270 | 0 |
| **Keluaran Valid Skema** | 270 (100,00%) | 265 (98,15%) | -5 |
| **Prediksi Cocok Benar ($TP$)** | 178 | 265 | **+87** |
| **Akurasi Global ($P=270$)** | **65,93%** | **98,15%** | **+32,22%** |
| **Macro Precision** | 81,87% | **100,00%** | **+18,13%** |
| **Macro Recall** | 65,93% | **98,15%** | **+32,22%** |
| **Macro F1-Score** | 64,02% | **99,04%** | **+35,02%** |
| **Rata-rata Latensi** | ~1,75 ms | 4.191,80 ms | +4.190,05 ms |
| **Median Latensi (Linear)** | ~1,70 ms | 3.616,91 ms | +3.615,21 ms |

### B. Kinerja LLM Per Kategori

| Kategori | Target ($Support$) | $TP$ | $FP$ | $FN$ | Precision | Recall | F1-Score | Status Utama |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|---|
| `sampah` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna |
| `jalan_rusak` | 30 | 29 | 0 | 1 | 100,00% | 96,67% | 98,31% | 1 Parse error (loop) |
| `banjir` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna |
| `listrik` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna |
| `air_bersih` | 30 | 27 | 0 | 3 | 100,00% | 90,00% | 94,74% | 3 OPD hallucination |
| `keamanan` | 30 | 29 | 0 | 1 | 100,00% | 96,67% | 98,31% | 1 Parse error (loop) |
| `kesehatan` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna |
| `pendidikan` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna |
| `lainnya` | 30 | 30 | 0 | 0 | 100,00% | 100,00% | 100,00% | Sempurna (No fallback leakage) |
| **Macro Average** | **270** | **265** | **0** | **5** | **100,00%** | **98,15%** | **99,04%** | - |

### C. Analisis Kegagalan LLM (5 Sampel / 1,85%)

1. **Degenerative Repetition Loop Truncation (`PARSE_FAILED`, 2 sampel)**:
   - `SIPW-SYN-0044` (target `jalan_rusak`): Model mengalami perulangan token pada kata deskriptif hingga mencapai batas `max_tokens: 500`, menyebabkan string terpotong sebelum tanda kurung penutup `}`.
   - `SIPW-SYN-0168` (target `keamanan`): Mengalami anomali repetisi token serupa pada karakter akhir alasan rekomendasi.
2. **Halusinasi Kode OPD di Luar Katalog (`INVALID_SCHEMA`, 3 sampel)**:
   - `SIPW-SYN-0147`, `SIPW-SYN-0148`, `SIPW-SYN-0149` (target `air_bersih`): Model memprediksi kategori `air_bersih` dengan tepat, namun menghasilkan nilai `suggestedDepartment: "PDAM"`. Karena `PDAM` berstatus BUMD dan tidak termasuk ke dalam 7 OPD resmi SIPW (`DLH, PUPR, DISHUB, SATPOLPP, DINKES, DISDIK, KELURAHAN`), validator skema menolak keluaran sebagai pelanggaran kontrak integrasi.

---

## 7. Cara Menjalankan Verifikasi Reproducibility

Semua hasil evaluasi dapat direproduksi secara mandiri dan offline tanpa memerlukan API key eksternal maupun koneksi internet.

### Prasyarat
- Node.js (versi 18.x atau lebih baru)

### Menjalankan Skrip Verifikasi Metrik
Jalankan skrip verifikasi dari *root* repositori:

```bash
node research/evaluation/verify_reproducibility.cjs
```

Skrip ini akan:
1. Membaca `research/evaluation/llm_finalization_v1/full_run/llm_predictions.jsonl`.
2. Membaca `research/evaluation/synthetic_final_v1/keyword_baseline/predictions.json`.
3. Menghitung matriks konfusi, metrik per kategori, macro average, tingkat validitas skema, dan statistik latensi.
4. Memvalidasi bahwa seluruh angka hasil hitung ulang identik dengan artefak ringkasan resmi (`llm_metrics.json` dan `baseline_recalculation.json`) dengan toleransi $\epsilon < 10^{-5}$.

### Menjalankan Audit Keamanan dan Kebocoran Rahasia
Untuk memastikan tidak ada token atau kredensial rahasia yang tersimpan:

```bash
node research/evaluation/scan_security.cjs
```

---

## 8. Struktur Direktori dan Deskripsi Artefak

```
research/evaluation/
├── README.md                                  # Dokumentasi utama evaluasi ini
├── verify_reproducibility.cjs                 # Skrip verifikasi metrik otomatis tanpa API
├── scan_security.cjs                          # Skrip audit keamanan dan zero-secret leakage
│
├── synthetic_final_v1/                        # Direktori dataset sintetis final beku
│   ├── synthetic_dataset.json                 # 270 sampel narasi pengaduan warga
│   ├── synthetic_scenario_registry.json       # Registri 270 skenario dan target kategori
│   ├── dataset_manifest.json                  # Hash SHA-256 dan manifest integritas dataset
│   ├── frozen_experiment_protocol.md          # Protokol eksperimen beku
│   └── keyword_baseline/
│       ├── predictions.json                   # 270 hasil prediksi mentah classifier keyword
│       └── manifest.json                      # Metadata run baseline
│
├── audit_baseline_v1/                         # Audit baseline independen
│   ├── baseline_audit_report.md               # Laporan audit baseline
│   ├── baseline_recalculation.json            # Rekalkulasi metrik baseline terverifikasi
│   └── run_audit.cjs                          # Runner verifikasi baseline
│
└── llm_finalization_v1/                       # Hasil evaluasi live LLM final
    ├── final_execution_report.md              # Laporan teknis eksekusi 270 sampel
    ├── comparison_report.md                   # Laporan analisis komparatif mendalam
    ├── provider_verification.md               # Verifikasi identitas model dan akun Kios API
    ├── run_evaluation_live.cjs                # Runner evaluasi dengan pacing 7.000 ms
    ├── pilot_run/
    │   └── pilot_report.md                    # Laporan pilot run 3 sampel (GO Decision)
    └── full_run/
        ├── llm_predictions.jsonl              # 270 rekaman inferensi LLM mentah
        ├── llm_metrics.json                   # Ringkasan metrik performa LLM dalam format JSON
        ├── confusion_matrix_llm.csv           # Matriks konfusi 9 kelas + __invalid__
        ├── category_metrics_llm.csv           # Metrik support, TP, FP, FN, P, R, F1 per kelas
        ├── evaluation_summary.md              # Ringkasan markdown evaluasi LLM
        ├── reservations/                      # Bukti reservasi per request (270 berkas)
        └── results/                           # Payload JSON mentah per sampel beserta info token (270 berkas)
```

---

## 9. Keterbatasan Metodologis Penelitian

1. **Keterbatasan Representasi Laporan Warga Riil**: Dataset terdiri atas narasi sintetis yang digenerasi dari 55 keluarga skenario. Meskipun memuat variasi penulisan informal, *typo*, dan multimasalah, dataset sintetis tidak merefleksikan seluruh ambiguitas emosional, dialek lokal kedaerahan, atau laporan tidak jelas dari masyarakat riil di lapangan.
2. **Ketergantungan pada Provider Pihak Ketiga**: Eksperimen menggunakan endpoint API publik pihak ketiga (Kios API) dengan status model *free-tier*. Perubahan versi inferensi di hulu, latensi jaringan publik, atau kebijakan *rate limiting* dapat memengaruhi waktu respons di masa depan.
3. **Ketidakhadiran Ground Truth Manusia Ganda**: Evaluasi ini membandingkan prediksi terhadap target desain skenario sintetis. Belum dilakukan validasi *inter-rater reliability* oleh penilai manusia independen pada dataset ini.
4. **Cakupan Model Tunggal**: Evaluasi komparatif live berfokus pada perbandingan *keyword classifier* terhadap satu model LLM (`minimax-m3.1-flash-free`). Model LLM komersial tertutup lainnya belum disertakan dalam run live berbayar demi menjaga kepatuhan batas anggaran penelitian Rp0.

---

## 10. Lingkungan dan Dependensi

- **Runtime**: Node.js v18.x, v20.x, atau v22.x (menggunakan modul bawaan `fs`, `path`, `crypto`).
- **Dependensi Eksternal untuk Reproduksi**: **Tidak ada (Zero External Dependencies)**. Seluruh skrip evaluasi dan verifikasi ditulis menggunakan *CommonJS* standar.
- **Sistem Operasi**: Teruji pada Windows 11 dan Linux (Ubuntu 22.04 LTS).
