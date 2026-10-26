# Audit pra-live SIPW synthetic_final_v1

**Keputusan: NOT READY. Live tetap diblokir.** Keputusan audit bukan izin API. Audit hanya membaca byte artefak/kode dan menghitung ulang metrik baseline tersimpan; tidak memuat modul produksi, `.env`, server, HTTP client atau driver DB. Tidak ada API, database, perubahan produksi/file beku, maupun push. Script audit baru: `audit_offline.cjs`; perintah aktual `node research/evaluation/pre_live_audit_v1/audit_offline.cjs`, exit 0. Exit 0 berarti audit selesai, **bukan** eksperimen siap live.

## Hasil pemeriksaan

| Pemeriksaan | Status | Bukti/hasil |
|---|---|---|
| Jumlah dataset dan registry | **PASS** | 270 narasi, 270 target; masing-masing sembilan kategori tepat 30 |
| Relasi ID | **PASS** | ID unik masing-masing; tidak ada narasi tanpa target, target tambahan, baseline hilang/tambahan/duplikat; label baseline cocok dengan registry per ID |
| Pemisahan target/narasi | **PASS** | Narasi hanya sample_id, title, description, complaint_text; kategori berada di registry |
| Hash registry/dataset/manifest | **PASS** | Ketiga hash raw-byte sesuai nilai yang diberikan; rincian `hash_verification.json` |
| Referensi hash internal | **PASS** | Dataset/registry/QA sesuai manifest, registry sesuai receipt, baseline merujuk hash input yang sama |
| File beku tetap sama saat audit | **PASS** | Delapan artefak input diperiksa before/after di `preservation_verification.json`; tidak diubah |
| Baseline tersimpan 178/270 | **PASS** | Exact equality label prediksi terhadap target registry, join sample_id; 178 cocok, 92 tidak cocok, accuracy terhadap target skenario 0.6592592593, macro F1 0.6401765210. Tidak ada run LLM atau eksekusi ulang classifier baseline |
| Sembilan kategori aktual | **PASS** | `backend/services/classificationService.js:13–23` sesuai registry dan kode rule; kategori lain tidak ditemukan pada target |
| Parameter fungsi klasifikasi vs rencana | **PASS, kode default saja** | `classifyComplaint:221–229`: temperature 0.1, jsonMode true; `kiosApi.js:15–35`: default MiniMax/500 token/15 detik. Environment bisa override; konfigurasi efektif belum diperiksa |
| Pool null tanpa DB | **PASS, inspeksi** | `getActiveContext:41–46` langsung memakai kategori/departemen default. Bukan bukti HTTP controller/persistensi DB |
| Model/versi dan harga efektif saat run baru | **NOT VERIFIED** | Alias default bukan versi provider; belum ada current price/group/kuota/larangan debit akun yang terbukti |
| FREE_ONLY sebagai jaminan Rp0 | **FAIL** | `kiosApi.js:112–122`: cabang non-free kosong, tidak menolak, tidak memeriksa harga dan tidak membatasi saldo/debit |
| Runner live dataset 270 | **NOT VERIFIED** | Inventaris `synthetic_final_v1/` tidak memuat runner live. `run_keyword_offline.cjs` khusus baseline; runner eksploratori 27 bukan bukti cap/target/stop baru |
| Spesifikasi lengkap validitas/denominator/normalisasi | **NOT VERIFIED** | Protokol beku menyebut metrik, tetapi definisi detail belum cukup untuk membuktikan seluruh implementasi konsisten; perlu annex versi baru sebelum live |
| Target semantik bebas bias/representatif | **NOT VERIFIED** | 55 keluarga, 270 varian, QA konstruksi; bukan penilaian independen atau sampling warga |

Output audit numerik: `dataset_integrity.json`, `hash_verification.json`, `baseline_reproduction.json`, `preservation_verification.json`. Semua hasil ini bukti audit offline, **bukan** hasil eksperimen LLM.

## Hash yang dihitung ulang (SHA-256 byte persis)

- Registry `e663226792e23eef1c5e277a066aeb5dae35e554c2c379befd5ae1df0babfa03`
- Dataset `98a2d730f8272969d2576e6385a0b36b9453d8ba2e85e87dc7ca86611bb63e3e`
- Manifest `6e5c0fcd1a9bcfa3eeb239f8d4f73648a0291c121c420cecc63d8d858b4dd343`

Raw-byte hash sensitif terhadap CRLF/LF. Jangan menormalisasi input beku atau Git newline tanpa mendokumentasikan versi baru. Timestamp receipt sebelum dataset freeze konsisten dengan alur target-first yang dicatat, tetapi file timestamp/self-report bukan bukti kriptografis pihak ketiga tentang urutan pembuatan atau independensi semantik.

## Reproduksi baseline

`synthetic_final_v1/keyword_baseline/predictions.json` dan registry dibaca saja. Untuk setiap ID narasi, ambil **target dari registry**, bukan percaya field target pada prediksi; pastikan field target tersimpan sama. Cocok bila string `predicted_category === target_category` tepat, tanpa fuzzy match atau koreksi label. Denominator semua 270 narasi. Hasil: **178 match + 92 mismatch = 270**, selisih dari klaim 178 adalah 0. Matriks lengkap, per kelas, daftar mismatch, precision/recall/F1 ada di `baseline_reproduction.json`; invalid/missing punya kolom sentinel dan tidak dibuang.

Audit ini mereproduksi metrik dari **prediksi tersimpan**, bukan menjalankan ulang fungsi keyword. Source dan guard pada `synthetic_final_v1/run_keyword_offline.cjs:4–17` mengharuskan freeze/hash cocok sebelum memanggil baseline historis; manifest menyatakan commit `8d669965ac6048cf1af9abed470b49e7cad0def8` dan blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f`. Tidak menafsirkan angka ini sebagai accuracy terhadap pengaduan nyata atau perbandingan dengan LLM yang belum dijalankan.

## Kecocokan protokol dengan kode aktual

- **Input dan katalog:** `classifyComplaint:170–185` menambahkan wrapper Judul/Deskripsi, membangun katalog dari defaults bila pool null. Baseline menerima complaint_text title+newline+description; wrapper LLM perlu direkam sebagai formatting, bukan label ekstra. Runner baru harus memastikan tidak mengirim registry/rationale atau memasok pool DB.
- **Parser/normalisasi:** `validateAndNormalizeLLMOutput:71–158` menerima JSON langsung atau ekstraksi `{...}`. Ia bukan strict schema validator: objek minim/array tertentu bisa menghasilkan normalisasi. Unknown category→lainnya/review true; dept invalid→KELURAHAN/review true; priority invalid→normal; confidence parseInt, default50/clamp0–100; model review Boolean-coerced. Karena itu `status=success` **bukan** strict valid, juga tidak otomatis kategori benar.
- **Kosong/error:** adapter `kiosApi.js:184–191` mengubah content hilang menjadi string kosong, lalu parser gagal; catch service `261–292` mengembalikan manual fallback lainnya/KELURAHAN/confidence0/review true. HTTP 429/401/403/5xx dicatat adapter sebagai error tetapi diubah menjadi objek fallback, sehingga harness harus menyimpan HTTP/error asli sebelum tertutup result final.
- **Timeout:** adapter membatalkan fetch setelah 15 detik, tetapi timer dibersihkan pada headers (`154`), sebelum body json (`184`). Hard deadline 22 detik dan pengukuran body-end pada protokol adalah guard harness yang belum terverifikasi, bukan sifat timeout end-to-end produksi.
- **Kuota/stop:** counter harian default200/shared klasifikasi-chat/in-memory, reset UTC atau restart; tidak cukup untuk 270 satu hari/default. Tidak ada retry otomatis di adapter. Batas global270, spacing10detik, stop/drift, pending checkpoint/no-replay tidak ditegakkan oleh fungsi produksi; perlu runner terpisah dan test offline. Jangan restart untuk menghindari limit.
- **Identitas model:** adapter memakai `data.model || model` (`190`); bila API tidak memberikan model, output service bisa berisi alias request. Harus simpan apakah model ID benar-benar provider-returned, bukan menyebut fallback alias bukti versi. Tidak ada snapshot weight/version yang terverifikasi dari kode.
- **Ambiguitas:** prompt `194` menyebut jika ambigu gunakan lainnya, sedangkan registry mempunyai ambiguity controlled_with_sufficient_action dengan target domain. Tidak otomatis kesalahan target, tetapi definisi ambigu perlu diterima eksplisit sebagai ambigu penyebab, bukan ambigu kategori; kalau tidak, konstruk yang diuji bisa bertentangan. Jangan mengubah label berdasarkan respons kelak.

## Audit spesifikasi metrik (bukan mengubah protokol beku)

Protokol `frozen_experiment_protocol.md:19` menetapkan accuracy, macro F1, precision/recall/F1 kelas, confusion matrix, valid/failure/timeout/fallback, median/p95 semua attempts dan success-only; denominator kategori semua270 dan sentinel unattempted. Namun beberapa rincian berikut belum dibekukan secara lengkap di protokol itu dan runner baru belum ada. **Usulan annex baru** yang perlu disetujui sebelum live:

1. Accuracy = jumlah prediksi kategori yang cocok target /270, raw dan final terpisah. Per kelas TP/FP/FN memasukkan missing/invalid sebagai kesalahan target, P=TP/(TP+FP), R=TP/(TP+FN), F1=2PR/(P+R), denominator nol→0 dan support dilaporkan. Macro = rerata tak berbobot sembilan kelas. Matriks 9 baris target, 9 kolom prediksi + invalid/missing. Tetapkan raw exact-vs-canonicalized (case/trim) eksplisit; jangan menyamakan output kategori alias dengan label sah tanpa aturan.
2. API transport success, service status success, strict schema validity, JSON-murni compliance dan classification correctness harus lima konsep terpisah. Tetapkan tujuh field required/tipe/enum, object non-array, confidence integer0–100; apakah JSON hasil recovery markdown strict-valid perlu dipisahkan dari JSON-murni. Jangan memakai parser produksi longgar sebagai definisi strict valid.
3. Failure rate = service non-success/attempted (termasuk local pre-request rejection ditandai terpisah dari POST tersent), HTTP failure dan invalid-output rate juga terpisah; valid-output rate = strict-valid/attempted, termasuk HTTP failure dalam denominator; timeout/attempted. Simpan request_attempt vs actual POST count untuk menjaga cap270. Missing/unattempted masuk metrik kategori konservatif, bukan latency/attempt teknis.
4. Fallback service, replacement kategori/departemen/priority/confidence, canonicalization dan saran departemen salah terhadap mapping **tidak boleh digabung**. Fallback lainnya kebetulan cocok target lainnya tetap cocok final sistem tetapi raw gagal dan error teknis. Nilai confidence0/50 buatan sistem bukan confidence raw model.
5. Latency clock monotonic sampai body+normalizer, median/p95 interpolasi linear, timeout/failure tetap disertakan bila attempted; counter error sebelum fetch dipisahkan. Kecocokan departemen hanya mapping internal; secondary/priority tidak ada metrik tanpa target sah. Analisis keluarga perlu aturan agregasi/seed eksplisit (55 keluarga, bukan 270 observasi independen).

## Blocker konkret sebelum live

Daftar machine-readable lengkap di `live_blockers.json` (B01–B08):
- identitas/versi provider dan alias drift belum diverifikasi;
- harga efektif grup akun, biaya tambahan, kuota/RPM, serta **kontrol provider yang benar-benar melarang debit** belum dibuktikan; flag FREE_ONLY gagal sebagai jaminan;
- runner live baru belum tersedia/teruji offline untuk cap, raw, timeout, stop, checkpoint/resume;
- annex perhitungan validity/failure/fallback/raw label belum disepakati;
- jadwal 270 sesuai limit lokal/provider belum ditetapkan;
- penerimaan batas konstruk 55 keluarga/template dan arti ambiguity perlu eksplisit;
- izin live baru belum ada (permintaan ini hanya audit).

**NOT READY** sampai blocker ditutup dengan bukti atau keputusan desain yang terdokumentasi dalam artefak **baru**, bukan mengedit file beku. Tidak ada hasil LLM, metrik final gabungan atau kesimpulan perbandingan yang ditetapkan dalam audit ini.
