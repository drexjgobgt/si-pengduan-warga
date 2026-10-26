# Verifikasi Provider, Tarif, dan Kuota — SIPW Finalization v1

**Tanggal Verifikasi**: 26 Oktober 2026  
**Status Kesiapan Provider**: **BLOCKED (LIVE REQUESTS NOT PERMITTED)**  
**Prinsip Audit**: Bukti Mandiri Akun, Larangan Asumsi Label Nama, Perlindungan Finansial Rp0.

---

## 1. Matriks Status Verifikasi Parameter Provider

Sesuai ketentuan Bagian 6, seluruh parameter provider diverifikasi dan diklasifikasikan ke dalam status resmi (`VERIFIED`, `NOT VERIFIED`, `NOT AVAILABLE`, `BLOCKED`):

| No | Parameter Pemeriksaan | Status Formal | Nilai / Temuan Faktual | Analisis Keamanan & Batasan Ilmiah |
|:---:|---|:---:|---|---|
| 1 | **Identitas Provider & Base URL** | **VERIFIED** | Kios API (`https://kiosapi.com/v1`) | Endpoint inferensi kompatibel OpenAI `/chat/completions`. Base URL terkonfigurasi pada `KIOSAPI_BASE_URL`. |
| 2 | **Model ID yang Dituju** | **VERIFIED** | `minimax-m3.1-flash-free` | Ditetapkan sebagai target model pada `kiosApi.js:16` dan disetujui dalam master prompt. |
| 3 | **Versi Snapshot / Pinned Weights** | **NOT AVAILABLE** | *Unpinned* (Tidak disediakan provider) | Provider tidak menyediakan identifier snapshot berbasis tanggal/commit. Bobot model rawan berubah sewaktu-waktu (*model drift*). |
| 4 | **Model ID Respons Provider** | **NOT VERIFIED** | Belum terverifikasi untuk run 270 sampel | Pada pilot historis 27 sampel, provider mengembalikan `minimaxai/minimax-m3.1-flash`. Untuk run baru, belum ada respons yang diterima. |
| 5 | **Tarif Input & Output Akun Aktif** | **NOT VERIFIED** | Tidak ada bukti tarif akun aktif | Tidak tersedia lembar saldo (*balance statement*) atau invoice resmi yang membuktikan akun dikenakan tarif Rp0 per token saat ini. |
| 6 | **Jaminan Pengeluaran Nol (Rp0)** | **BLOCKED** | Tidak ada garansi nol debit independen | Dokumen historis `evidence/runtime_smoke.json` mencatat `usage.cost = 0.00015862` (biaya upstream nonzero). Provider tidak menjamin nol debit. |
| 7 | **Kuota & Rate Limit Provider (RPM/TPM)** | **NOT VERIFIED** | Batasan spesifik provider tidak diketahui | Tidak ada data resmi mengenai batas RPM atau kuota token akun yang dapat diperiksa secara offline. |
| 8 | **Spending Cap di Sisi Provider** | **NOT AVAILABLE** | Tidak ada hard spending cap server-side | Dasbor gateway tidak menyediakan fitur penguncian saldo pada batas Rp0 sebelum request diproses. |
| 9 | **Batas Harian Lokal** | **VERIFIED** | 200 request/hari (`kiosApi.js:33–35`) | Menghalangi eksekusi 270 sampel dalam satu hari tanpa pemecahan batch jadwal 2 hari. |
| 10 | **Kebijakan Retensi Data & Privasi** | **NOT VERIFIED** | Ketentuan retensi log pihak ketiga tidak diketahui | Dataset evaluasi aman karena sintetis, namun pengiriman data warga nyata berisiko melanggar UU PDP. |
| 11 | **Risiko Perubahan Alias / Fallback** | **BLOCKED** | Adapter rentan auto-fallback tanpa penolakan | Celah adapter produksi (`kiosApi.js:112–122`) belum dimutakhirkan di repositori utama. |

---

## 2. Analisis Tarif dan Indikasi Biaya Upstream

1. **Larangan Asumsi Nama Model 'Free'**:  
   Protokol penelitian melarang keras menganggap kata `free` pada nama model `minimax-m3.1-flash-free` sebagai jaminan hukum bahwa layanan tersebut gratis untuk akun pengguna.
2. **Bukti Historis Biaya Nonzero**:  
   Pemeriksaan terhadap log smoke historis (`research/evaluation/evidence/runtime_smoke.json`) membuktikan bahwa respons API mengembalikan metadata biaya:
   ```json
   "usage": {
     "prompt_tokens": 949,
     "completion_tokens": 92,
     "total_tokens": 1041,
     "cost": 0.00015862,
     "cost_details": {
       "upstream_inference_cost": 0.00015862
     }
   }
   ```
   Meskipun tangkapan layar pengguna sebelumnya menunjukkan tier *Free-Pro* dengan saldo Rp0, keberadaan atribut biaya internal membuktikan bahwa di tingkat gateway terjadi kalkulasi biaya per-token. Tanpa adanya jaminan tertulis bahwa provider menyerap biaya tersebut secara permanen, risiko pemotongan saldo akun berbayar tetap nyata.
3. **Keputusan Biaya**: Sesuai Bagian 6, karena tarif akun tidak dapat diverifikasi secara independen dan terdapat indikasi biaya tak disetujui, **request live tidak boleh dikirimkan**.

---

## 3. Analisis Batas Permintaan dan Kuota

- **Batas Harian Lokal**: Pelacak memori pada `backend/config/kiosApi.js:33–35` mengunci limit 200 request per hari.
- **Ukuran Dataset Pengujian**: 270 sampel narasi sintetis.
- **Benturan**: Mengeksekusi 270 request sekaligus akan memicu galat `DAILY_LIMIT_EXCEEDED` pada request ke-201. Merestart server untuk mereset memori dilarang oleh protokol audit.
- **Kebutuhan Penjadwalan Multi-Hari**: Evaluasi penuh 270 sampel memerlukan persetujuan jadwal dua sesi (Hari 1: 150 request, Hari 2: 120 request) yang disinkronkan dengan reset tanggal UTC.

---

## 4. Opsi Alternatif Model Lokal (On-Premise SLM)

Sebagai jalan keluar atas ketidakpastian biaya dan ketiadaan jaminan nol-debit pada API pihak ketiga, penelitian merekomendasikan opsi alternatif penggunaan model bahasa terbuka lokal (*on-premise Small Language Models*):

| Kriteria Evaluasi | Kios API (Cloud MiniMax) | Model Lokal On-Premise (Ollama / vLLM) |
|---|---|---|
| **Biaya per Request** | Bergantung kebijakan provider pihak ketiga | **Rp0 Mutlak** (Infrastruktur server milik sendiri) |
| **Ketergantungan Kuota** | Dibatasi RPM/TPM pihak ketiga | **Tak Terbatas** (Hanya dibatasi daya komputasi lokal) |
| **Kepatuhan Privasi (UU PDP)** | Rawan kebocoran data warga ke server luar | **100% Berdaulat** (Data tidak pernah keluar jaringan) |
| **Reproduksibilitas Ilmiah** | Rentan *model drift* sewaktu-waktu | **100% Deterministik** (Bobot model ter-pinning permanen) |
| **Rekomendasi Model** | `minimax-m3.1-flash-free` | `Qwen2.5-7B-Instruct` atau `Llama-3.1-8B-Instruct` |

---

## 5. Kesimpulan Keputusan Gerbang Provider

Sesuai aturan keputusan Bagian 6:
> *"Jika tarif akun tidak bisa diverifikasi, jangan mengklaim bahwa Rp0 telah terjamin. Jika terdapat indikasi biaya yang tidak disetujui, jangan mengirim request live."*

**Status Gerbang Provider**: **BLOCKED**. Eksperimen live tidak diizinkan untuk dikirim ke provider eksternal pada tahap ini.
