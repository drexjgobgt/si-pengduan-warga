# Verifikasi Kesiapan Provider dan Analisis Biaya — SIPW Preflight v1

**Tanggal Verifikasi**: 26 Oktober 2026  
**Status Kesiapan Provider**: **NOT READY (LIVE REQUESTS BLOCKED)**  
**Kepatuhan Prinsip**: Fail-Closed, Biaya Maksimal Rp0, Nol Akses Jaringan pada Tahap Preflight.

---

## 1. Identitas Provider dan Model LLM

| Parameter | Konfigurasi Aktual | Analisis dan Temuan Audit |
|---|---|---|
| **Nama Provider / Gateway** | Kios API | Gateway kompatibel OpenAI untuk multi-model LLM. |
| **Base URL Endpoint** | `https://kiosapi.com/v1` | Diambil dari `process.env.KIOSAPI_BASE_URL` atau default `https://kiosapi.com/v1`. Endpoint inferensi: `/chat/completions`. |
| **Model ID Permintaan** | `minimax-m3.1-flash-free` | Dikonfigurasi pada `process.env.KIOSAPI_CLASSIFICATION_MODEL` (default: `minimax-m3.1-flash-free`). |
| **Versi / Snapshot Bobot** | Tidak Tersedia / Unpinned | Provider tidak mengekspos identifier snapshot berbasis tanggal atau hash bobot. Identitas hanya berupa alias string dinamis. |
| **Integritas Model Respon** | Rawan Tertutup Alias | Pada `backend/config/kiosApi.js:190`, kode menggunakan `data.model || model`. Jika provider mengosongkan field `model` pada respons payload, alias lokal permintaan digunakan sebagai fallback, menyembunyikan identitas model fisik sebenarnya (*risk of silent model drift*). |

---

## 2. Analisis Tarif, Kuota, dan Jaminan Pengeluaran Nol (Rp0)

### 2.1 Evaluasi Tarif dan Ketiadaan Bukti Akun Aktif
- **Tarif Input / Output Token**: Tidak ada bukti rekening aktif, bukti invoice, atau dokumen tarif resmi yang membuktikan bahwa akun pengguna dikenakan biaya Rp0 per token.
- **Kekeliruan Asumsi Nama Model 'Free'**: Audit menegaskan larangan mengasumsikan model gratis semata-mata karena terdapat kata `free` pada ID model (`minimax-m3.1-flash-free`). Pada banyak agregator AI, tier gratis sering kali merupakan kuota promosi sementara yang dapat habis atau beralih otomatis (*auto-fallback*) ke tier berbayar saat kuota harian habis.
- **Biaya Tak Langsung**: Tidak terverifikasi apakah terdapat biaya pemeliharaan akun, biaya per-request (*overhead fee*), atau pajak/biaya konversi mata uang.

### 2.2 Mekanisme Pembatasan Biaya (Hard Spending Cap)
- **Status di Sisi Provider**: Tidak ada bukti tersedianya fitur *hard spending cap* di dashboard akun Kios API yang dapat dikunci pada angka Rp0.
- **Status di Sisi Kode Produksi (`kiosApi.js`)**: **FAIL (Celah Logika)**.  
  Pemeriksaan pada `backend/config/kiosApi.js` baris 112–122:
  ```javascript
  if (KIOSAPI_CONFIG.freeOnly) {
    const targetModel = (model || "").toLowerCase();
    const isFreeDesignated = targetModel.includes("free");
    if (!isFreeDesignated && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
      // If user specifically provided a model without ':free' but set freeOnly=true,
      // allow if user explicitly configured it, but log a sanitized warning.
    }
  }
  ```
  Blok di dalam `if (!isFreeDesignated)` **kosong tanpa instruksi penolakan error**. Adapter produksi tidak melempar pengecualian (*does not throw error*) dan tetap meneruskan pemanggilan HTTP meskipun model berbayar tidak sengaja terpasang.
- **Status di Sisi Harness Evaluasi (`evaluation_guard_v1.cjs`)**: **PASS**.  
  Modul guard evaluasi terisolasi telah mengimplementasikan penolakan *fail-closed* untuk model berbayar atau model tidak dikenal. Namun, guard lokal ini tidak dapat mengendalikan mekanisme penagihan di peladen provider eksternal.

---

## 3. Batas Permintaan (Rate Limit) dan Strategi Pemrosesan 270 Sampel

### 3.1 Benturan Limit Lokal dengan Ukuran Dataset
- **Batas Harian Lokal**: `KIOSAPI_CONFIG.dailyRequestLimit = 200` request/hari (`kiosApi.js:33–35`), dilacak menggunakan objek in-memory `dailyUsageTracker`.
- **Ukuran Dataset Terencana**: 270 sampel.
- **Analisis Benturan**: Mengeksekusi 270 sampel sekaligus dalam satu hari akan memicu galat `DAILY_LIMIT_EXCEEDED` pada sampel ke-201, menyebabkan 70 sampel gagal diproses.
- **Larangan Manipulasi**: Merestart proses server/runner demi mereset counter memori dilarang keras karena melanggar protokol integritas audit.

### 3.2 Strategi Penjadwalan Multi-Hari (Jika Live Diizinkan di Masa Depan)
Untuk memproses 270 sampel secara aman tanpa melanggar batas harian lokal 200 request:
1. **Hari 1**: Mengeksekusi 150 sampel pertama (`SIPW-SYN-0001` s.d. `SIPW-SYN-0150`) dengan jarak antar-request (*spacing*) minimal 10 detik.
2. **Jeda Lintas Hari**: Menunggu pergantian tanggal UTC (reset tracker alami).
3. **Hari 2**: Melanjutkan eksekusi 120 sampel tersisa (`SIPW-SYN-0151` s.d. `SIPW-SYN-0270`) memanfaatkan checkpoint durabel tanpa pengiriman ulang sampel yang telah sukses.

---

## 4. Parameter Operasional, Error Handling, dan Mitigasi Duplikasi

- **Timeout per Request**:
  - Kode produksi: 15.000 ms (15 detik) via `AbortController`.
  - Runner evaluasi: 22.000 ms (22 detik hard wall-clock deadline) untuk mencakup transfer data dan parsing lengkap.
- **Kebijakan Retry**: **0 retry otomatis**. Tidak ada percobaan ulang otomatis pada HTTP 429, 5xx, atau timeout demi mencegah ledakan request dan tagihan tak terkendali.
- **Pencegahan Duplikasi**: Runner menggunakan pencatatan slot reservasi durabel (`<key>.reservation.json`) sebelum request dikirim. Jika terjadi kegagalan atau crash, status ditandai `UNCERTAIN` dan tidak akan di-replay secara otomatis tanpa rekonsiliasi operator.
- **Mekanisme Penghentian Seketika (*Kill-Switch*)**:
  - Runner langsung berhenti (*terminal halt*) pada error HTTP non-2xx pertama, error jaringan, atau deteksi indikasi biaya.
  - Sisa sampel pada batch ditandai sebagai `UNATTEMPTED_DUE_TO_HALT` untuk menjaga denominator evaluasi 270 sampel tetap valid dan transparan.

---

## 5. Analisis Risiko Privasi Data Pengaduan

| Skenario | Tingkat Risiko | Mitigasi yang Diterapkan |
|---|:---:|---|
| **Eksperimen Evaluasi (Saat Ini)** | **NOL (Aman)** | Menggunakan 100% dataset sintetis (`synthetic_final_v1`). Tidak ada data pribadi warga, nama riil, NIK, alamat rumah asli, atau nomor kontak yang terlibat. |
| **Penerapan Produksi Riil (Masa Depan)** | **TINGGI (Kritis)** | Pengiriman teks pengaduan riil warga ke API cloud komersial pihak ketiga (seperti Kios API / MiniMax) berisiko membocorkan Informasi Teridentifikasi Pribadi (*Personally Identifiable Information* / PII) ke server pihak ketiga. Hal ini berpotensi melanggar UU No. 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP). Rekomendasi mitigasi: wajib menerapkan modul redaksi PII lokal berbasis NER sebelum teks dikirim, atau beralih sepenuhnya ke model bahasa terbuka lokal (*on-premise SLM*). |

---

## 6. Kesimpulan Verifikasi Provider

1. **Jaminan Biaya Nol Tidak Terpenuhi**: Tidak ada bukti independen bahwa pemanggilan API tidak akan memotong saldo akun.
2. **Identitas Model Belum Terpinning**: Snapshot bobot model provider tidak dapat dipastikan kebal dari perubahan diam-diam (*model drift*).
3. **Keputusan Akhir**: **NOT READY**. Eksperimen live tidak boleh dijalankan sampai seluruh bukti tarif akun dan mekanisme hard zero-debit diverifikasi secara independen oleh peneliti.
