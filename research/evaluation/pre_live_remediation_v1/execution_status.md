# Integrated final-execution status — NOT READY

Tanggal evaluasi: 2026-10-26
Status keputusan: **NOT READY (LIVE REQUESTS BLOCKED)**

Ringkasan status terintegrasi ini merupakan pembaruan status akhir tunggal sesuai protokol evaluasi. Semua artefak beku, hash verifikasi, dan data eksploratori lama dipertahankan secara utuh tanpa modifikasi. Tidak ada request live yang dikirimkan ke provider API (0 live POST) karena seluruh prasyarat penjaminan biaya nol (Rp0) dan verifikasi akun belum terpenuhi secara independen.

---

## 1. Disposisi Blocker Terintegrasi

| No | Komponen / Blocker | Status Aktual | Analisis & Bukti Penutupan yang Masih Diperlukan |
|---|---|---|---|
| B01 | **Identitas & Versi Model Kios API** | **NOT VERIFIED** | Model alias `minimax-m3.1-flash-free` pada `kiosApi.js:16` tidak mengikat versi provider tertentu. Adapter `kiosApi.js:190` menggunakan `data.model \|\| model`, sehingga jika provider tidak mengembalikan model ID riil, alias lokal dapat menutupi identitas sebenarnya. Diperlukan bukti identitas model riil dan versi snapshot langsung dari respons provider. |
| B02 | **Harga Efektif, Kuota, RPM, & Jaminan Rp0** | **NOT VERIFIED** | Tidak ada bukti kuota akun aktif, batasan RPM, atau kebijakan tarif spesifik akun yang menjamin pengeluaran Rp0. Klaim "gratis" dari katalog atau substring nama tidak membuktikan saldo akun terhindar dari pemotongan (zero debit). Diperlukan mekanisme server-side provider yang memblokir debit berbayar sebelum request diizinkan. |
| B03 | **Implementasi FREE_ONLY** | **FAIL (Produksi) / PASS (Uji Guard Evaluasi)** | Pada kode produksi (`backend/config/kiosApi.js:112–122`), percabangan `if (!isFreeDesignated)` memiliki blok kosong tanpa aksi penolakan (tidak melempar error). Pada modul evaluasi terisolasi (`evaluation_guard_v1.cjs`), kebijakan fail-closed telah diuji dan lulus 4 tes unit, namun guard lokal tidak dapat mengautentikasi billing provider eksternal. |
| B04 | **Kesiapan Runner Eksperimen 270 Sampel** | **PASS (Mesin Fixture Offline) / BLOCKED (Transport Live)** | Inti engine runner offline (`offline_runner_core.cjs`) telah diimplementasikan dan diverifikasi dengan 7/7 tes unit lulus: reservasi durabel 270 slot unik, penolakan replikasi/retry (retry 0), deteksi terminal failure, penanganan timeout & hard deadline, serta redaksi rahasia. Namun, transport live sengaja tidak dihubungkan ke jaringan demi mencegah panggilan API tanpa izin. |
| B05 | **Adopsi & Pengujian scoring_contract.md** | **PASS** | Kontrak scoring dibekukan pada `scoring_contract.md` (SHA-256: `b59f75616f6d8e45ececb7e3b8242773cefd46b09f1b8c71d0eab5fe81227265`). Implementasi scoring pada `scoring_v1.cjs` telah lulus 6/6 tes unit pada `scoring_v1.test.cjs`. Aturan scoring mendefinisikan label exact vs canonical, validitas strict (pure JSON + schema 7 field + HTTP 2xx + un-truncated), denominator 270 sampel terencana, dan pelaporan fallback terpisah. |
| B06 | **Jadwal Eksekusi Batas Provider & Lokal** | **NOT VERIFIED** | Limit lokal produksi pada `kiosApi.js:34` adalah 200 request/hari (berbasis memori). Dataset evaluasi berjumlah 270 sampel. Mengeksekusi 270 request sekaligus akan melanggar batas harian lokal, sedangkan melakukan restart server untuk mereset counter merupakan pelanggaran protokol audit. Belum ada jadwal multi-hari yang disetujui bersama bukti kuota provider. |
| B07 | **Penerimaan Keterbatasan Desain Sintetis** | **ACCEPTED AS BOUNDED CONSTRUCT** | Dataset 270 sampel berasal dari 55 keluarga kejadian (5 domain utama yang divariasikan ke dalam bentuk formal, informal, typo, ambiguous, incomplete, multicategory, out_of_scope). Diterima secara eksplisit sebagai pengujian kondisi terbatas (bounded synthetic condition test), bukan representasi populasi pengaduan warga nyata, dan target skenario bukan ground truth manusia independen. |
| B08 | **Persetujuan Live Eksplisit** | **BLOCKED (Belum Diberikan)** | Sesuai aturan keselamatan eksekusi, prompt eksekusi akhir ini tidak ditafsirkan sebagai persetujuan live otomatis. Sebelum prasyarat B01, B02, B03, dan B06 dipenuhi dengan bukti terverifikasi, persetujuan live tidak boleh diminta dan request live tidak boleh dikirimkan. |

---

## 2. Hasil Tes Otomatis Lokal yang Dijalankan

Pengujian otomatis lokal dijalankan secara terisolasi tanpa koneksi jaringan, tanpa membaca file `.env`, dan tanpa mengakses basis data produksi:

1. **`research/evaluation/pre_live_remediation_v1/offline_runner_core.test.cjs`**:
   - **7 passed, 0 failed** (durasi ~348 detik karena verifikasi fsync durabel pada 270 slot file).
   - Pengujian mencakup: reservasi unik 270 slot durabel, resume tanpa pengiriman ulang, penolakan input ID duplikat, penghentian terminal saat HTTP error tanpa retry, batas waktu per-request dan batas waktu total, deteksi reservasi tak pasti (uncertain reservation fail-closed), lockfile & integritas manifest, serta sanitasi rahasia literal dan exclusion header kredensial.
2. **`research/evaluation/pre_live_remediation_v1/scoring_v1.test.cjs`**:
   - **6 passed, 0 failed** (durasi 130 ms).
   - Pengujian mencakup: pemisahan label raw exact vs canonical, penanganan missing/invalid sebagai sentinel, pembedaan pure JSON vs recovered JSON vs schema validitas 7 field, denominator konservatif 270 sampel terencana, integritas sample_id, interpolasi linear kuantil latensi (median & P95), dan himpunan target tertutup.
3. **`research/evaluation/pre_live_remediation_v1/evaluation_guard_v1.test.cjs`**:
   - **4 passed, 0 failed** (durasi 119 ms).
   - Pengujian mencakup: penolakan model berbayar/tidak dikenal/substring 'free', penolakan konfigurasi kosong/tidak lengkap, penolakan bukti kedaluwarsa atau tanpa jaminan nol-debit, serta penolakan fallback dan modifikasi endpoint yang tidak disetujui.

**Total pengujian unit komponen evaluasi: 17 passed, 0 failed.**

---

## 3. Status Dataset dan Reproduksi Baseline

- **Dataset Sintetis Final v1 (`synthetic_final_v1`)**:
  - `synthetic_scenario_registry.json`: 270 baris target, SHA-256 `e663226792e23eef1c5e277a066aeb5dae35e554c2c379befd5ae1df0babfa03`.
  - `synthetic_dataset.json`: 270 narasi, SHA-256 `98a2d730f8272969d2576e6385a0b36b9453d8ba2e85e87dc7ca86611bb63e3e`.
  - `dataset_manifest.json`: SHA-256 `6e5c0fcd1a9bcfa3eeb239f8d4f73648a0291c121c420cecc63d8d858b4dd343`.
  - Semua hash byte raw telah diverifikasi dan identik 100% dengan kondisi beku awal.
- **Reproduksi Baseline Keyword**:
  - Sampel: 270 sampel terencana.
  - Kecocokan terhadap target skenario sintetis: **178 cocok, 92 tidak cocok**.
  - **Akurasi**: 65,93% (178 / 270).
  - **Macro Precision**: 81,87% (0,818669).
  - **Macro Recall**: 65,93% (0,659259).
  - **Macro F1**: 64,02% (0,640177).
  - Evaluasi baseline ini direproduksi secara deterministik dari prediksi tersimpan pada artefak beku commit `8d669965ac6048cf1af9abed470b49e7cad0def8` dan blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f`.

---

## 4. Status Eksperimen LLM Live

- **Jumlah live POST yang dikirim**: **0**.
- **Jumlah keberhasilan API live**: **0**.
- **Jumlah kegagalan API live**: **0**.
- **Hasil prediksi LLM 270 sampel**: **BELUM ADA / TIDAK DIJALANKAN**.
- **Alasan**: Sesuai klausul keselamatan protokol evaluasi, tidak ada request live yang diizinkan tanpa verifikasi independen atas tarif akun efektif Rp0 dan jaminan provider yang mencegah pemotongan saldo. Eksperimen eksploratori 27 sampel lama (MiniMax, kecocokan 27/27 dengan rater AI provisional) tetap dicatat sebagai bukti eksploratori historis dan tidak boleh diklaim sebagai hasil eksperimen 270 sampel.

---

## 5. Keputusan Final Operasional

**Status Operasional: NOT READY.**
Eksperimen dihentikan pada gerbang keselamatan biaya (fail-closed cost gate). Naskah artikel ilmiah difinalisasi dengan mendokumentasikan hasil baseline keyword 270 sampel secara komprehensif, mencatat status kesiapan arsitektur evaluasi, serta secara transparan dan jujur menyatakan keterbatasan eksekusi live akibat kendala verifikasi komersial pihak ketiga.
