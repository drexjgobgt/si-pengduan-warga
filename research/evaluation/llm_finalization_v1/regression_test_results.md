# Hasil Pengujian Regresi Offline — SIPW Finalization v1

**Tanggal Pengujian**: 26 Oktober 2026  
**Status Pengujian**: **PASS (24/24 UJI UNIT LULUS — 100% REGRESSION PASS)**  
**Lingkungan**: Terisolasi lokal, tanpa koneksi jaringan, tanpa pemanggilan API pihak ketiga, tanpa akses basis data produksi.

---

## 1. Ringkasan Eksekutif Pengujian Regresi

Untuk memastikan keandalan, ketahanan (*fault-tolerance*), dan kepatuhan arsitektur terhadap protokol penelitian, telah dieksekusi suite regresi terpadu yang menggabungkan 4 modul uji:
1. `research/evaluation/llm_finalization_v1/adapter_remediation/kiosApi_remediation.test.cjs` (7 pengujian)
2. `research/evaluation/llm_finalization_v1/runner.test.cjs` (7 pengujian)
3. `research/evaluation/pre_live_remediation_v1/scoring_v1.test.cjs` (6 pengujian)
4. `research/evaluation/pre_live_remediation_v1/evaluation_guard_v1.test.cjs` (4 pengujian)

Perintah eksekusi terpadu:
```powershell
node --test research/evaluation/llm_finalization_v1/runner.test.cjs `
            research/evaluation/llm_finalization_v1/adapter_remediation/kiosApi_remediation.test.cjs `
            research/evaluation/pre_live_remediation_v1/scoring_v1.test.cjs `
            research/evaluation/pre_live_remediation_v1/evaluation_guard_v1.test.cjs
```

Hasil eksekusi: **24 pengujian lulus, 0 gagal (Durasi: ~162 ms)**.

---

## 2. Rincian Hasil Pengujian per Modul

### 2.1 Modul Remediasi Keamanan Adapter (`kiosApi_remediation.test.cjs` — 7 Pass)
- **Uji 1 (Otorisasi Model Bebas Biaya Resmi)**: Memvalidasi model `minimax-m3.1-flash-free` dengan konfigurasi sah diterima tanpa kendala (1,38 ms).
- **Uji 2 (Penolakan Model Berbayar Komersial)**: Menolak model komersial (`gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`, `gemini-1.5-pro`) secara fail-closed sebelum inisialisasi jaringan (0,85 ms).
- **Uji 3 (Penolakan Model Substring Jebakan)**: Memblokir model yang mengandung kata "free" tetapi tidak ada di allowlist (`gpt-4o-free-tier`, `claude-free-unlimited`, dll.) (0,35 ms).
- **Uji 4 (Penolakan Ketiadaan Kredensial)**: Melempar galat konfigurasi `KIOSAPI_KEY_MISSING` saat API key kosong (1,27 ms).
- **Uji 5 (Penolakan Parameter Model Kosong)**: Melempar galat `MODEL_REQUIRED` saat model bernilai null, undefined, atau string kosong (0,48 ms).
- **Uji 6 (Penolakan Endpoint Tidak Sah)**: Memblokir base URL di luar domain resmi Kios API (0,24 ms).
- **Uji 7 (Sanitasi Kredensial Literal)**: Memastikan token rahasia otomatis disunting menjadi `[REDACTED]` dalam log (0,26 ms).

### 2.2 Modul Runner Evaluasi Terpadu (`runner.test.cjs` — 7 Pass)
- **Uji 1 (Validasi Skema 7 Field)**: Memastikan struktur output mematuhi taksonomi kategori, departemen, prioritas, dan batasan panjang teks alasan (1,53 ms).
- **Uji 2 (Pembedaan JSON Murni vs Markdown)**: Mampu mendeteksi apakah JSON dihasilkan secara murni atau dibungkus markdown code block (0,56 ms).
- **Uji 3 (Pencocokan ID & Semantik)**: Memverifikasi pencocokan deterministik terhadap 9 kategori target (17,59 ms).
- **Uji 4 (Pemisahan Kategori Galat)**: Membedakan galat transport, parsing, skema, dan semantik (6,55 ms).
- **Uji 5 (Terminal Halt & Sentinel Unattempted)**: Berhenti seketika saat error transport dan mencatat sisa sampel sebagai `UNATTEMPTED_DUE_TO_HALT` demi menjaga denominator 270 (7,50 ms).
- **Uji 6 (Checkpointing Inkremental)**: Menghindari pengiriman ulang sampel yang telah berhasil disimpan pada sesi sebelumnya (13,52 ms).
- **Uji 7 (Redaksi Rahasia Hasil)**: Menghapus atribut sensitif dari file hasil yang disimpan ke disk (4,59 ms).

### 2.3 Modul Kontrak Penilaian Terbekukan (`scoring_v1.test.cjs` — 6 Pass)
- **Uji 1 (Pemisahan Label Raw vs Canonical)**: Membedakan evaluasi case-sensitive persis dari normalisasi trim/lowercase (2,24 ms).
- **Uji 2 (Validitas Skema Ketat)**: Memvalidasi integritas 7 field tanpa pembulatan tipe (0,54 ms).
- **Uji 3 (Denominator Konservatif 270)**: Memastikan sampel gagal, timeout, atau unattempted tetap berada dalam denominator akurasi (2,55 ms).
- **Uji 4 (Deteksi Duplikasi ID)**: Membatalkan evaluasi jika ditemukan ID duplikat atau ukuran dataset tidak sesuai (1,24 ms).
- **Uji 5 (Kuantil Latensi Linear)**: Menghitung median dan persentil ke-95 secara matematis persis (2,96 ms).
- **Uji 6 (Himpunan Target Tertutup)**: Menolak target kategori asing yang tidak terdaftar (0,60 ms).

### 2.4 Modul Kebijakan Otorisasi Pra-Live (`evaluation_guard_v1.test.cjs` — 4 Pass)
- **Uji 1 (Penolakan Konfigurasi Kosong & Model Berbayar)**: 0,99 ms.
- **Uji 2 (Otorisasi Fixture Lengkap)**: 0,17 ms.
- **Uji 3 (Penolakan Bukti Stale & Unbound)**: 0,17 ms.
- **Uji 4 (Penolakan Fallback & Endpoint Tak Dikenal)**: 0,11 ms.

---

## 3. Penegasan Batasan Metodologis

> [!WARNING]
> Keberhasilan 24 tes unit regresi offline ini membuktikan bahwa **arsitektur evaluasi, integritas skema, deteksi kesalahan, dan mekanisme penghentian fail-closed telah teruji 100% secara perangkat lunak**.
> 
> Namun, pengujian regresi offline **TIDAK MEMBUKTIKAN**:
> 1. Bahwa provider Kios API secara kontraktual menjamin saldo akun Rp0.
> 2. Bahwa rate limit provider mengizinkan pemrosesan 270 sampel tanpa throttling.
> 3. Bahwa respons LLM live akan menghasilkan akurasi yang lebih tinggi daripada baseline kata kunci.
