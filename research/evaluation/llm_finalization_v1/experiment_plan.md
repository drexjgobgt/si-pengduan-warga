# Rencana Operasional Eksperimen Live LLM — SIPW Finalization v1

**Judul Penelitian**:  
*“Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web”*

**Status Rencana**: **SIAP OPERASIONAL — DITAHAN (WAITING FOR PROVIDER EVIDENCE & APPROVAL)**  
**Target Model**: `minimax-m3.1-flash-free` via Kios API (`https://kiosapi.com/v1`)  
**Ukuran Dataset**: 270 sampel terencana (`synthetic_final_v1`), 9 kategori layanan publik seimbang.

---

## 1. Rencana Uji Coba Pilot Terbatas Tiga Sampel (Tahap E)

Uji coba pilot terbatas dirancang sebagai gerbang operasional awal untuk memverifikasi respons aktual provider sebelum komitmen 270 request:

### 1.1 Spesifikasi Sampel Pilot
Dipilih tepat 3 sampel dari famili kejadian terpisah yang mewakili kategori berbeda:
1. `SIPW-SYN-0001` (Target: `sampah`, Tipe: `formal`)
2. `SIPW-SYN-0031` (Target: `jalan_rusak`, Tipe: `formal`)
3. `SIPW-SYN-0061` (Target: `banjir`, Tipe: `formal`)

### 1.2 Ketentuan Eksekusi Pilot
- Request dikirim **satu per satu secara sekuensial** (concurrency = 1).
- Jeda antar-pengiriman (*spacing*): minimal 15 detik.
- Konfigurasi parameter inferensi:
  - `temperature = 0.1`
  - `max_tokens = 500`
  - `response_format = { type: "json_object" }`
- Timeout: 15 detik produksi / 22 detik hard wall-clock deadline.
- Kebijakan Retry: **0 percobaan ulang otomatis**.

### 1.3 Kriteria Kelulusan Pilot (*Go/No-Go Decision*)
Pilot dinyatakan **LULUS (GO)** jika dan hanya jika memenuhi seluruh syarat berikut:
- [x] Status respons HTTP bernilai 200 OK untuk ketiga sampel.
- [x] Respon payload menghasilkan objek JSON valid dengan 7 atribut skema wajib.
- [x] Atribut `category` menghasilkan salah satu dari 9 label resmi SIPW.
- [x] Model ID yang dikembalikan provider sesuai dengan allowlist model yang disetujui.
- [x] Rekonsiliasi transaksi akun membuktikan saldo tidak berkurang (biaya debit Rp0).
- [x] Mekanisme checkpointing durabel berhasil menyimpan file `<key>.result.json` ke disk.

Jika ada satu saja kriteria di atas yang gagal, seluruh proses dihentikan seketika (**NO-GO**), dan laporan kegagalan dibuat dalam `pilot_report.md` tanpa melanjutkan ke evaluasi 270 sampel.

---

## 2. Rencana Evaluasi Penuh 270 Sampel (Tahap F)

Setelah pilot dinyatakan lulus penuh, evaluasi 270 sampel dieksekusi dengan protokol bertahap:

### 2.1 Alokasi Jadwal Dua Hari (Mitigasi Limit Lokal 200/Hari)
Untuk mematuhi batas lokal 200 request/hari pada `backend/config/kiosApi.js:33–35` tanpa merestart server:

- **Sesi 1 (Hari ke-1)**:
  - Memproses 150 sampel (`SIPW-SYN-0001` s.d. `SIPW-SYN-0150`).
  - Jeda antar-request: minimal 10 detik (~6 request/menit).
  - Estimasi waktu aktif: ~25 menit.
  - Sisa kuota harian lokal tersimpan: 50 request (buffer).
- **Jeda Sinkronisasi Alami**:
  - Menunggu pergantian tanggal UTC (00:00 UTC) untuk reset alami counter memori.
- **Sesi 2 (Hari ke-2)**:
  - Melanjutkan 120 sampel tersisa (`SIPW-SYN-0151` s.d. `SIPW-SYN-0270`).
  - Runner otomatis mendeteksi 150 file `.result.json` yang telah selesai dan langsung melanjutkan ke sampel ke-151 (*zero duplicate replay*).
  - Estimasi waktu aktif: ~20 menit.

---

## 3. Penanganan Rate Limit dan Kegagalan Jaringan

1. **Kebijakan Nol Retry (*Zero Auto-Retry*)**:
   - Jika menerima respons HTTP 429 (Too Many Requests), HTTP 500, HTTP 502, HTTP 503, atau timeout, runner **seketika berhenti (*terminal halt*)**.
   - Tidak ada loop perulangan otomatis. Hal ini mencegah lonjakan request liar dan akumulasi biaya tak terkendali.
2. **Pencatatan Status Sentinel**:
   - Sampel yang gagal dihentikan ditandai statusnya (`TRANSPORT_FAILED`, `TIMEOUT`, atau `PARSE_FAILED`).
   - Seluruh sampel yang belum sempat dikirim dicatat sebagai `UNATTEMPTED_DUE_TO_HALT` agar denominator metrik tetap utuh pada $P = 270$.

---

## 4. Pencatatan Metadata Audit Lengkap

Setiap sampel yang diproses mencatat atribut komprehensif ke file JSON individual dan agregat `.jsonl`:
- `sample_id` dan `target_category` dari registri terbekukan.
- Timestamp presisi mulai (*dispatched_at*) dan selesai.
- Latensi monotonic (`duration_ms`).
- Status kode HTTP aktual provider.
- Model ID respons provider.
- Token prompt, token completion, dan total token jika disediakan provider.
- Teks mentah (*raw output*) sebelum normalisasi.
- Status validitas skema 7 field dan flag `is_pure_json`.
- Kategori prediksi dan rekomendasi OPD.

---

## 5. Prosedur Penghentian Darurat (*Kill-Switch*)

Eksekusi wajib dibatalkan seketika jika:
1. Terdeteksi adanya pemotongan saldo akun pada dasbor provider.
2. Provider mengembalikan model ID yang tidak terdaftar dalam allowlist.
3. Terjadi 2 kegagalan validasi skema berturut-turut.
4. Total waktu aktif melampaui batas anggaran 7.200 detik (2 jam).
5. Terjadi galat penulisan disk atau kegagalan lockfile.

---

## 6. Prinsip Integritas Ilmiah

> [!IMPORTANT]
> Seluruh metrik evaluasi LLM (Akurasi, Macro F1, Precision, Recall, Matriks Konfusi) **hanya boleh dihitung dari respons nyata yang tervalidasi**.
> 
> Tidak ada data tiruan yang diizinkan untuk menggantikan sampel gagal. Apabila eksperimen terhenti di tengah jalan, laporan wajib menyajikan data riil parsial tersebut secara transparan dengan denominator 270 sampel.
