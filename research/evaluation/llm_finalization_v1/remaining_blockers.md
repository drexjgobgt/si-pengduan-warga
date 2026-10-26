# Status Blocker & Temuan Tata Kelola AI — SIPW Finalization v1

**Tanggal Pembaruan**: 2026-10-26T18:06:00+07:00  
**Status Evaluasi Eksperimen**: **SELESAI PENUH (270 / 270 SAMPEL TEREVALUASI)**

---

## 1. Status Blocker Historis

| ID Blocker | Deskripsi Masalah | Status Pra-Live | Resolusi Pasca-Live | Rekomendasi Produksi |
|---|---|:---:|---|---|
| **B01** | Ketiadaan Pinning Versi Snapshot Model | ⚠️ Terbuka | Provider mengembalikan identifier fisik `minimaxai/minimax-m3.1-flash`. Namun tanggal snapshot tidak tersemat secara permanen. | Terapkan validasi model string eksplisit pada middleware adapter produksi. |
| **B02** | Bukti Independen Saldo Nol (Rp0) | ⚠️ Terbuka | Eksperimen 271 request diselesaikan tanpa laporan debit akun. Namun endpoint saldo independen tidak tersedia pada Kios API (HTTP 404). | Tetap terapkan batas anggaran lokal (*client-side spending circuit breaker*). |
| **B03** | Celah Logika Percabangan `FREE_ONLY` | ⚠️ Terbuka | Patch terisolasi telah dibuat dan divalidasi 7/7 tes unit lulus (`kiosApi.patch`). Kode produksi belum diubah. | Aplikasikan patch ke `backend/config/kiosApi.js` sebelum rilis produksi. |
| **B06** | Batas Kuota Harian Lokal (200 Req/Hari) | ⚠️ Terbuka | Berhasil dimitigasi melalui eksekusi batch 2 sesi (Sesi 1: 151 req, Sesi 2: 120 req) dengan checkpoint durabel. | Ubah pelacak kuota produksi menjadi berbasis Redis terdistribusi jika skala ditingkatkan. |

---

## 2. Temuan Kerentanan Baru (Pasca-Evaluasi 270 Sampel)

| ID Temuan | Kategori | Frekuensi | Deskripsi & Dampak | Solusi Rekayasa |
|---|---|:---:|---|---|
| **V01** | *Degenerative Repetition Looping* | 2 dari 270 (0,74%) | Pada sampel `SIPW-SYN-0044` dan `SIPW-SYN-0168`, model terjebak dalam perulangan token tak berujung ("posesif..." dan "nesses...") hingga batas `max_tokens = 500` tercapai, menyebabkan JSON terpotong tanpa kurung penutup (`PARSE_FAILED`). | Tambahkan parameter `frequency_penalty = 0.5` dan implementasikan parser toleran kurung penutup (*streaming JSON recovery*). |
| **V02** | *Out-of-Catalog OPD Hallucination* | 3 dari 270 (1,11%) | Pada sampel `SIPW-SYN-0147`, `0148`, dan `0149`, model memprediksi `air_bersih` dengan tepat, namun menghasilkan dinas `"PDAM"` yang berada di luar 7 kode resmi SIPW (`INVALID_SCHEMA`). | Gunakan teknik *grammar-constrained decoding* (misal via Outlines atau JSONformer) yang mengunci token OPD hanya pada pilihan yang sah. |
| **V03** | *Rate-Limit Window Sensitivity* | 1 kejadian mitigasi | Gateway Kios API menerapkan batas laju ketat 15 RPM *sliding window*. Pengiriman dengan interval < 4.000 ms memicu HTTP 429. | Terapkan antrean pesan asinkron (*message queue*) seperti BullMQ dengan *rate limiter* tetap 7.000 ms per permintaan. |
