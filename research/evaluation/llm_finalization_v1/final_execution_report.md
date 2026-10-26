# Laporan Eksekusi Final Evaluasi Komparatif LLM — SIPW Finalization v1

**Judul Penelitian**:  
*“Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web”*

**Tanggal / Waktu Penyelesaian**: 2026-10-26T18:05:00+07:00  
**Model Target**: `minimax-m3.1-flash-free` via Kios API (`https://kiosapi.com/v1`)  
**Ukuran Dataset**: 270 narasi sintetis terstandarisasi (*synthetic final v1*), 9 kategori layanan publik seimbang (30 sampel per kategori).

---

## 1. Rekonsiliasi Eksekusi & Permintaan HTTP

### 1.1 Rincian Permintaan HTTP Aktual
| Sesi Eksekusi | Sampel ID | Request Dikirim | HTTP 200 OK | HTTP 429 / Galat | Status Eksekusi |
|---|---|:---:|:---:|:---:|---|
| **Pilot 3 Sampel** | `SIPW-SYN-0001`, `0031`, `0061` | 3 | 3 | 0 | Lulus 100% (GO) |
| **Sesi 1 (Percobaan A)** | `SIPW-SYN-0002` s.d. `0038` | 36 | 35 | 1 (HTTP 429) | Terhenti terminal (15 RPM hit pada sample 38) |
| **Sesi 1 (Percobaan B)** | `SIPW-SYN-0038` s.d. `0150` | 112 | 112 | 0 | Selesai penuh dengan jeda 7.000 ms |
| **Sesi 2** | `SIPW-SYN-0151` s.d. `0270` | 120 | 120 | 0 | Selesai penuh dengan jeda 7.000 ms |
| **Total Kumulatif** | **270 Sampel Dataset** | **271 request** | **270** | **1** | **Semua 270 sampel memiliki hasil final** |

*Catatan*: Dari 271 request inferensi chat yang dikirim ke provider, 270 berhasil mengembalikan payload JSON (265 berstatus `COMPLETED`, 3 `INVALID_SCHEMA`, 2 `PARSE_FAILED`), dan 1 request mengalami penolakan laju 429 pada fase kalibrasi laju yang kemudian diulang secara bersih pada jeda 7.000 ms.

### 1.2 Verifikasi Biaya, Kuota, dan Akun
- **Model Identifier yang Dikembalikan Provider**: `minimaxai/minimax-m3.1-flash`.
- **Atribut Biaya Telemetri API**: Pada seluruh 267 sampel yang mengembalikan objek `usage`, atribut `cost` bernilai `undefined` / tidak disertakan oleh provider (berbeda dengan `deepseek-v4-flash-free` terdahulu yang mencatatkan indikasi biaya internal `$0.00015862`).
- **Prompt Token Caching**: Rata-rata 768 prompt tokens pada setiap request tercatat sebagai `cached_tokens` pada metadata provider.
- **Konsumsi Token Kumulatif**:
  - Total Token Prompt: 239.583 tokens (rata-rata: 897,3 tokens/request)
  - Total Token Completion: 24.821 tokens (rata-rata: 93,0 tokens/request)
  - Total Token Keseluruhan: 264.404 tokens (rata-rata: 990,3 tokens/request)
- **Garansi Biaya Rp0**: Meskipun provider menamai model sebagai model gratis dan tidak ada potongan saldo yang teramati pada pengujian lokal, ketiadaan endpoint saldo transparan (`/user`, `/balance`, `/usage` mengembalikan HTTP 404) menegaskan bahwa ketiadaan biaya tetap merupakan batasan kebijakan provider eksternal dan bukan jaminan kriptografis lokal.

---

## 2. Metrik Komparatif Final (N=270, Denominator P=270)

Perbandingan langsung antara *Keyword Baseline* historis dan *Large Language Model* pada dataset terbekukan utuh:

| Metrik Evaluasi | Keyword Baseline Historis | Large Language Model (MiniMax) | Selisih Performa |
|---|:---:|:---:|:---:|
| **Total Sampel Terencana ($P$)** | 270 sampel | 270 sampel | - |
| **Sampel Selesai Valid** | 270 sampel | **265 sampel** | -5 sampel |
| **Prediksi Benar (TP)** | 178 sampel | **265 sampel** | **+87 sampel** |
| **Akurasi Global** | **65,93%** (178/270) | **98,15%** (265/270) | **+32,22%** |
| **Macro Precision** | **81,87%** (0,818706) | **100,00%** (1,000000) | **+18,13%** |
| **Macro Recall** | **65,93%** (0,659259) | **98,15%** (0,981481) | **+32,22%** |
| **Macro F1-Score** | **64,02%** (0,640177) | **99,04%** (0,990431) | **+35,02%** |
| **Strict Format Valid Rate** | Tidak Berlaku | **98,15%** (265/270) | - |
| **Tingkat Galat Layanan (Failure Rate)** | 0,00% | **1,85%** (5/270) | +1,85% |

---

## 3. Rincian Metrik Per Kategori (9 Kelas Layanan Publik)

| Kategori Pengaduan | Target ($N$) | Baseline TP | LLM TP | Baseline Recall | LLM Recall | Baseline Precision | LLM Precision | LLM F1-Score |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `sampah` | 30 | 6 | **30** | 20,00% | **100,00%** | 100,00% | **100,00%** | **100,00%** |
| `jalan_rusak` | 30 | 18 | **29** | 60,00% | **96,67%** | 62,07% | **100,00%** | **98,31%** |
| `banjir` | 30 | 29 | **30** | 96,67% | **100,00%** | 74,36% | **100,00%** | **100,00%** |
| `listrik` | 30 | 24 | **30** | 80,00% | **100,00%** | 66,67% | **100,00%** | **100,00%** |
| `air_bersih` | 30 | 12 | **27** | 40,00% | **90,00%** | 100,00% | **100,00%** | **94,74%** |
| `keamanan` | 30 | 5 | **29** | 16,67% | **96,67%** | 100,00% | **100,00%** | **98,31%** |
| `kesehatan` | 30 | 24 | **30** | 80,00% | **100,00%** | 100,00% | **100,00%** | **100,00%** |
| `pendidikan` | 30 | 30 | **30** | 100,00% | **100,00%** | 100,00% | **100,00%** | **100,00%** |
| `lainnya` | 30 | 30 | **30** | 100,00% | **100,00%** | 33,71% | **100,00%** | **100,00%** |
| **Rata-rata Makro** | **270** | **178** | **265** | **65,93%** | **98,15%** | **81,87%** | **100,00%** | **99,04%** |

---

## 4. Matriks Konfusi Lengkap

### Matriks Konfusi LLM (270 Sampel)
```
Target       |  samp  jala  banj  list  air_  keam  kese  pend  lain  __in  __mi  __no | Total
-------------+--------------------------------------------------------------------------+------
sampah       |    30     0     0     0     0     0     0     0     0     0     0     0 |    30
jalan_rusak  |     0    29     0     0     0     0     0     0     0     1     0     0 |    30
banjir       |     0     0    30     0     0     0     0     0     0     0     0     0 |    30
listrik      |     0     0     0    30     0     0     0     0     0     0     0     0 |    30
air_bersih   |     0     0     0     0    27     0     0     0     0     3     0     0 |    30
keamanan     |     0     0     0     0     0    29     0     0     0     1     0     0 |    30
kesehatan    |     0     0     0     0     0     0    30     0     0     0     0     0 |    30
pendidikan   |     0     0     0     0     0     0     0    30     0     0     0     0 |    30
lainnya      |     0     0     0     0     0     0     0     0    30     0     0     0 |    30
```
*Keterangan Kolom Sentinel*: `__in` = `__invalid__` (5 sampel), `__mi` = `__missing__` (0 sampel), `__no` = `__no_prediction__` (0 sampel).

---

## 5. Analisis 5 Kegagalan Empiris LLM

1. **Degenerative Repetition Loop & Token Cutoff (2 Sampel / 0,74%)**:
   - `SIPW-SYN-0044` (target `jalan_rusak`): Model mengulang kata "posesif posesif..." pada field reason hingga durasi 16.176 ms dan memicu terpotongnya JSON sebelum kurung penutup (`}`).
   - `SIPW-SYN-0168` (target `keamanan`): Model mengulang sub-token "nessesnessesnesses..." pada field reason hingga durasi 16.245 ms dan memotong JSON.
   - Status evaluasi: `PARSE_FAILED`.
2. **Pelanggaran Batasan Katalog OPD Akibat Halusinasi (3 Sampel / 1,11%)**:
   - `SIPW-SYN-0147`, `SIPW-SYN-0148`, `SIPW-SYN-0149` (ketiganya bertarget `air_bersih`).
   - Model memprediksi kategori dengan tepat (`air_bersih`), namun mengisi `suggestedDepartment: "PDAM"`.
   - Kode "PDAM" tidak terdaftar dalam 7 kode resmi SIPW (`DLH, PUPR, DISHUB, SATPOLPP, DINKES, DISDIK, KELURAHAN`).
   - Status evaluasi: `INVALID_SCHEMA` (reason: `INVALID_SUGGESTED_DEPARTMENT`).

---

## 6. Statistik Latensi Eksekusi (270 Sampel)

- **Durasi Minimum**: 2.416 ms
- **Durasi Rata-rata**: 4.192 ms
- **Durasi Median (p50)**: 3.624 ms
- **Durasi Persentil 90 (p90)**: 5.973 ms
- **Durasi Persentil 95 (p95)**: 7.042 ms
- **Durasi Maksimum**: 16.245 ms (kasus pengulangan degeneratif)

---

## 7. Status Kesiapan Naskah Publikasi Ilmiah

- [x] Integritas dataset diverifikasi kriptografis SHA-256.
- [x] Baseline kata kunci diverifikasi utuh pada 270 sampel.
- [x] Evaluasi LLM diselesaikan penuh pada seluruh 270 sampel.
- [x] Metrik dihitung ulang langsung dari artefak mentah tanpa pembulatan asumtif.
- [x] Naskah artikel ilmiah dimutakhirkan dalam format Markdown dan DOCX.
- [x] Pembahasan menyajikan komparasi mendalam dan analisis keterbatasan data sintetis.
- **Kesimpulan Status**: **Naskah artikel ilmiah SIAP UNTUK SUBMISSION (READY FOR PEER-REVIEW)**.
