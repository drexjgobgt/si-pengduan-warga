# Hasil Pengujian Runner Evaluasi Offline — SIPW Preflight v1

**Tanggal Pengujian**: 26 Oktober 2026  
**Status Pengujian**: **PASS (100% LULUS SECARA OFFLINE)**  
**Kepatuhan Prinsip**: Mock Lokal Terisolasi, Nol Socket/Panggilan Jaringan, Verifikasi Kontrak Penilaian.

---

## 1. Ringkasan Eksekutif Pengujian

Suite pengujian offline dirancang untuk memverifikasi seluruh komponen alur evaluasi inferensi sebelum diizinkan menyentuh lingkungan produksi atau jaringan luar. Pengujian mencakup tiga modul independen:
1. **`runner.cjs`** (Engine Runner Evaluasi Offline Terpadu) — diuji melalui `runner.test.cjs`.
2. **`scoring_v1.cjs`** (Penerapan Kontrak Penilaian Scoring Contract v1) — diuji melalui `scoring_v1.test.cjs`.
3. **`evaluation_guard_v1.cjs`** (Kebijakan Otorisasi Fail-Closed) — diuji melalui `evaluation_guard_v1.test.cjs`.

Seluruh pengujian dijalankan menggunakan Node.js Test Runner bawaan (`node --test`). Hasil agregat: **17 pengujian lulus dari 17 pengujian (0 gagal)**.

---

## 2. Rincian Hasil Pengujian Unit Runner Evaluasi (`runner.test.cjs`)

Perintah eksekusi:  
`node --test research/evaluation/llm_preflight_v1/runner.test.cjs`

| No | Nama Skenario Uji | Status | Durasi | Deskripsi Verifikasi |
|:---:|---|:---:|:---:|---|
| 1 | Validasi skema 7-field terstruktur & penolakan skema rusak | **PASS** | 1,65 ms | Memverifikasi bahwa objek JSON dengan 7 field lengkap diterima. Menolak payload yang kehilangan field `category`, enum kategori asing, enum departemen di luar 7 OPD, nilai `confidence` di luar rentang 0–100, duplikasi `secondaryCategories`, atau penyertaan kategori utama dalam kategori sekunder. |
| 2 | Pembedaan Pure JSON vs Recovered Markdown vs Teks Rusak | **PASS** | 0,84 ms | Memverifikasi bahwa JSON langsung dikenali sebagai `is_pure_json: true` (`parse_mode: 'pure_json'`), JSON di dalam blok kode markdown ` ```json ... ``` ` diparsing sebagai `is_pure_json: false` (`parse_mode: 'recovered_block'`), dan teks biasa/rusak ditandai sebagai `parse_failed`. |
| 3 | Pencocokan `sample_id` ke Registri & Deteksi Kecocokan Semantik | **PASS** | 24,78 ms | Memverifikasi keakuratan join 1-to-1 antara ID sampel dataset dan target registri. Membuktikan bahwa model yang memprediksi kategori tepat dihitung sebagai kecocokan, sedangkan prediksi yang meleset dicatat sebagai misklasifikasi semantik tanpa merusak data registri. |
| 4 | Pemisahan Error Transport, Parsing, dan Skema secara Eksplisit | **PASS** | 11,58 ms | Memverifikasi bahwa respons error dipisahkan ke dalam kategori yang tepat: error jaringan/HTTP dicatat pada `transport_error`, teks tak terpapar JSON pada `parse_error`, dan format tanpa atribut wajib pada `schema_error`. |
| 5 | Terminal Halt pada Kegagalan Transport | **PASS** | 7,48 ms | Menguji skenario simulasi HTTP 429 (Rate Limit). Runner seketika menghentikan eksekusi (hanya mengirim 1 request), menandai status `terminal_halt: true`, dan mencatat seluruh sisa sampel sebagai `UNATTEMPTED_DUE_TO_HALT` demi menjaga validitas denominator 270 sampel. |
| 6 | Checkpointing Inkremental & Resume Bebas Replay | **PASS** | 19,82 ms | Memverifikasi bahwa sampel yang telah berhasil diproses dan disimpan pada file `.result.json` tidak akan dipanggil ulang saat runner dijalankan kembali (*zero duplicate dispatch*). |
| 7 | Sanitasi dan Redaksi Rahasia Kredensial | **PASS** | 11,40 ms | Memverifikasi bahwa token rahasia tiruan otomatis disanitasi menjadi `[REDACTED]` dan atribut sensitif seperti `authorization` serta `apiKey` dihapus dari file hasil sebelum disimpan ke disk. |

**Hasil Ringkasan Runner Suite**: 7 pass, 0 fail (Durasi: ~265 ms).

---

## 3. Hasil Pengujian Modul Pendukung Terkait

### 3.1 Scoring Engine (`scoring_v1.test.cjs`)
Perintah eksekusi: `node --test research/evaluation/pre_live_remediation_v1/scoring_v1.test.cjs`
- **6 pass, 0 fail** (Durasi: 130 ms).
- *Cakupan*: Pemisahan raw exact vs canonical trim/lowercase, penanganan missing/invalid sebagai sentinel, denominator konservatif 270 terencana, integritas himpunan target tertutup, dan kuantil latensi linear.

### 3.2 Evaluation Guard (`evaluation_guard_v1.test.cjs`)
Perintah eksekusi: `node --test research/evaluation/pre_live_remediation_v1/evaluation_guard_v1.test.cjs`
- **4 pass, 0 fail** (Durasi: 119 ms).
- *Cakupan*: Penolakan fail-closed terhadap model berbayar, model tidak dikenal, nama model jebakan dengan kata 'free', bukti akun kedaluwarsa, dan modifikasi endpoint yang tidak disetujui.

---

## 4. Penegasan Batasan Pengujian Offline

> [!WARNING]
> Keberhasilan seluruh tes unit offline di atas (**17/17 pass**) hanya membuktikan bahwa **logika perangkat lunak lokal (harness, validator, parser, dan checkpointing) telah berfungsi sesuai spesifikasi teknis**.
> 
> Pengujian ini **TIDAK MEMBUKTIKAN**:
> 1. Bahwa provider Kios API / MiniMax benar-benar gratis atau bebas biaya.
> 2. Bahwa saldo akun pengguna terhindar dari pemotongan saat pemanggilan live.
> 3. Bahwa provider akan mengembalikan format JSON yang valid pada pengujian dunia nyata.
> 
> Oleh sebab itu, keberhasilan tes unit offline tidak dapat dijadikan dasar untuk mengubah status kesiapan live menjadi `READY`.
