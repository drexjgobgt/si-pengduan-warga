# Laporan Perbandingan Kinerja Komparatif: Keyword Baseline vs LLM (N=270)

**Studi Kasus**: Sistem Informasi Pengaduan Warga (SIPW)  
**Dataset**: *synthetic final v1* (270 sampel seimbang, 9 kategori, 55 keluarga skenario kejadian)  
**Model LLM**: `minimax-m3.1-flash-free` (`minimaxai/minimax-m3.1-flash`) via Kios API  

---

## 1. Perbandingan Metrik Global

| Metrik Evaluasi | Keyword Baseline | Large Language Model | Perbedaan (Delta) | Catatan Signifikansi |
|---|:---:|:---:|:---:|---|
| **Akurasi Global** | 65,93% (178/270) | **98,15% (265/270)** | **+32,22%** | LLM melampaui baseline pada 8 dari 9 kategori |
| **Macro Precision** | 81,87% | **100,00%** | **+18,13%** | LLM menghasilkan nol false positive pada prediksi valid |
| **Macro Recall** | 65,93% | **98,15%** | **+32,22%** | Mengatasi kebocoran false negative ke kategori fallback |
| **Macro F1-Score** | 64,02% | **99,04%** | **+35,02%** | Keseimbangan performa sangat tinggi di seluruh kelas |
| **Validitas Skema** | 100,00% (Lokal) | **98,15%** (265/270) | -1,85% | 5 sampel mengalami kegagalan skema atau parsing |
| **Biaya Komputasi** | Rp0 (In-process) | Rp0 (Tier Promosi) | Setara | LLM membutuhkan koneksi API eksternal |
| **Latensi Median** | < 1 ms | 3.624 ms | +3.623 ms | LLM memiliki overhead inferensi jaringan |

---

## 2. Analisis Perbandingan Per Kategori

### 2.1 Domain Pengaduan yang Mengalami Peningkatan Terbesar
1. **Kategori `sampah` (+80,00% Recall)**:
   - *Baseline*: Recall 20,00% (6/30). Sebanyak 20 laporan terlempar ke `lainnya` karena menggunakan istilah slang daerah/informal ("bau busuk menyengat", "tong plastik dirobek hewan").
   - *LLM*: Recall 100,00% (30/30). Model memahami konteks kebersihan lingkungan secara intuitif tanpa memedulikan ketiadaan kata leksikal "sampah".
2. **Kategori `keamanan` (+80,00% Recall)**:
   - *Baseline*: Recall 16,67% (5/30). Sebanyak 20 laporan terlempar ke `lainnya` dan 5 salah diprediksi sebagai `listrik` (akibat penyebutan lampu jalan mati saat tawuran).
   - *LLM*: Recall 96,67% (29/30). Model mengenali konteks gangguan ketertiban masyarakat, senjata tajam, dan pungli dengan presisi 100%. (1 kegagalan akibat token loop pada sample `0168`).
3. **Kategori `air_bersih` (+50,00% Recall)**:
   - *Baseline*: Recall 40,00% (12/30). Sebanyak 10 laporan salah diprediksi sebagai `banjir` dan 5 sebagai `jalan_rusak` karena pelapor menyebutkan "air menggenang ke jalan".
   - *LLM*: Recall 90,00% (27/30). Model mengidentifikasi akar permasalahan pada kebocoran pipa transmisi PDAM. (3 kegagalan akibat halusinasi kode dinas "PDAM").
4. **Kategori `jalan_rusak` (+36,67% Recall)**:
   - *Baseline*: Recall 60,00% (18/30). Mengalami salah klasifikasi ke `listrik` dan `lainnya`.
   - *LLM*: Recall 96,67% (29/30). (1 kegagalan akibat token loop pada sample `0044`).
5. **Kategori `listrik` (+20,00% Recall)**:
   - *Baseline*: Recall 80,00% (24/30). Terganggu oleh penyebutan tiang roboh ke aspal jalan.
   - *LLM*: Recall 100,00% (30/30).

### 2.2 Kategori dengan Kinerja Setara
- **Kategori `pendidikan`**: Keduanya meraih **Recall 100% dan Precision 100%**. Kosakata sekolah ("guru", "ruang kelas", "bangku belajar") memiliki kekhasan leksikal yang sangat tinggi sehingga aturan kata kunci sederhana pun bekerja sempurna.

---

## 3. Resolusi Masalah Fallback Kategori "Lainnya"

Pada *Keyword Baseline*, kategori `lainnya` mengalami fenomena *Default Fallback Sink* yang sangat parah:
- Sebanyak 89 sampel diprediksi sebagai `lainnya` (precision anjlok menjadi 33,71%).
- 59 sampel di antaranya merupakan laporan sah dari 6 kategori teknis yang gagal terdeteksi kata kuncinya.

Pada *Large Language Model*:
- Kategori `lainnya` diprediksi tepat sebanyak **30 sampel**, dan seluruh 30 sampel tersebut memang bertarget asli `lainnya` (**Precision 100,00%, Recall 100,00%**).
- Tidak ada satupun laporan infrastruktur teknis yang bocor ke kategori `lainnya`.

---

## 4. Taksonomi Kegagalan: Komparasi Arsitektur

| Karakteristik | Keyword Baseline | Large Language Model |
|---|---|---|
| **Akar Penyebab Kegagalan** | Ketiadaan kata leksikal exact; tumpang tindih leksikal antar-dinas | Anomali sampling token (looping); halusinasi entitas dunia nyata di luar katalog |
| **Bentuk Output Gagal** | Salah kategori (misklasifikasi semantik) | Galat struktural (`PARSE_FAILED`, `INVALID_SCHEMA`) |
| **Deterministik** | 100% deterministik | Stokastik (suhu 0,1 meminimalkan namun tidak meniadakan variasi) |
| **Penanganan yang Disarankan** | Perluasan kamus sinonim dan stemming | Penegakan *grammar-guided decoding* (Outlines) dan *frequency penalty* |
