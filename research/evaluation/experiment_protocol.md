# Protokol eksperimen SIPW — revisi sintetis target-first (rancangan offline)

## Protokol aktif: belum ada izin live

Mengikuti ruang lingkup pengguna terbaru: dataset sintetis saja, tanpa manusia/data warga; target berdasarkan aturan skenario **sebelum** teks dibuat. Bagian v1 di bawah dipertahankan sebagai arsip dan tidak menjadi izin mengakses DB/API. Istilah label adjudicated/ground truth independen pada arsip **tidak berlaku** pada rancangan sintetis aktif ini.

### Desain dan freeze

Set primer usulan 270 eligible/30 per kategori; `synthetic_dataset_design.md` menetapkan komposisi tipe dan registry target-first. Set 27 lama tetap eksploratori. Label aktif disebut `scenario_rule_target` dengan rule_id, rationale dan hash registry prateks; bukan ground truth manusia. QA/exclusion dilakukan sebelum prediksi; unresolved dikarantina sebelum freeze dan dilaporkan, tidak dihapus setelah salah. Semua input ke classifier hanya title+description, tidak termasuk label/rationale/ID aturan.

Bandingkan LLM dan keyword historis secara paired pada sampel/teks dan target sama. Baseline: commit `8d669965ac6048cf1af9abed470b49e7cad0def8`, blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f` (`backend/services/classificationService.js` historis); cocokkan ulang sebelum run. Lowercase, regex keyword/bobot/bonus, threshold confidence 40, default lainnya dipertahankan tanpa tuning. Katalog/urutan, prompt system dan user persis, commit/hash kode, formatter input baseline/LLM dicatat; format wrapper LLM bukan izin memberi informasi ekstra ke baseline atau membocorkan target.

Model direncanakan `minimax-m3.1-flash-free`, provider Kios API OpenAI-compatible; ID respons sebelumnya `minimaxai/minimax-m3.1-flash` hanya observasi historis. Verifikasi alias/identitas aktual pada run baru; rekam timestamp UTC, harga/versi katalog dan provenance key-group tanpa key. Temperature 0.1, JSON mode, 500 token output, timeout produksi 15000 ms, hard deadline harness usulan 22000 ms, tanpa seed terverifikasi. `pool=null` memakai default kategori/departemen tanpa koneksi DB, bukan uji controller. Timer produksi dihentikan sesudah headers sebelum body JSON; karena itu hard deadline harness penting dan harus diungkap sebagai intervensi evaluasi, bukan mengklaim timeout produksi end-to-end.

### Request, kuota, biaya

Rencana primer: **270×1=270 POST**, retries 0, concurrency 1, jarak antar-start >=10 detik, 0 POST tambahan untuk dev/baseline/generasi narasi. Approval run lama tidak berlaku. Opsional konsistensi: subset 27 dipilih sebelum run ×2 ekstra =54 POST, total 324 **hanya bila disetujui terpisah**. Interval 10 detik memberi rentang start primer >=2690 detik (~44 menit 50 detik), bukan jaminan total runtime; timeout/network overhead menambah durasi. Counter default lokal 200/hari (shared dan in-memory) tidak cukup sebagai bukti kuota 270; rencanakan beberapa hari/kuota yang diizinkan tanpa merestart untuk menghindari limit, catat hari/blok/alias serta jadwal kelas acak berstrata dengan seed offline agar efek hari tidak terkonfound kelas.

Budget uang yang diusulkan Rp0; **LIVE BLOCKED sampai harga efektif akun dan mekanisme kuota/biaya dipastikan serta jumlah request disetujui**. Tidak ada pengecekan API sekarang. Harga lalu Free-Pro multiplier 0/nama model free tidak menjamin harga kini. Formula estimasi: tarif per sejuta token × [jumlah input token/1e6 dan jumlah output token/1e6], dikali multiplier yang berlaku, ditambah semua biaya request/cache/reasoning/pajak/FX sesuai aturan provider; hindari double-count rincian usage. Maks keluaran primer 135000 token menurut request cap (bukan usage aktual atau jaminan cara provider menghitung reasoning). Input diukur offline sesudah narasi dibuat bila tokenizer cocok tersedia; bila tidak, gunakan batas konservatif yang dinyatakan, bukan angka token rekaan. Bila Rp0 tak dapat dijamin, jangan jalankan; jangan top-up atau fallback model berbayar otomatis.

### Kesalahan, normalisasi dan denominator (bekukan sebelum run)

- Raw: simpan konten sebelum parser, label literal/canonicalization terpisah, field missing/invalid sebagai sentinel. Strict-valid = JSON object non-array, tujuh field dengan tipe/enum yang benar, confidence integer 0–100. JSON yang diekstrak dari markdown dicatat sebagai parse-recovered dan bukan compliant JSON-murni. Laporkan strict schema validity serta kepatuhan JSON-murni terpisah; extra fields ditandai tanpa otomatis menganggap klasifikasi salah.
- Output non-JSON/kosong atau provider error/timeout menghasilkan manual fallback produksi: lainnya, KELURAHAN, confidence 0 dan review true. Label/dept invalid dapat diganti normalizer meskipun service status success. Rekam fallback **per-field dan full-service**, raw/final dan reason kode. Fallback lainnya yang kebetulan cocok target lainnya dihitung cocok pada metrik final-sistem tetapi tetap gagal/invalid pada metrik teknis; jangan menyamarkan error sebagai keberhasilan model.
- Semua 270 eligible terencana masuk denominator accuracy/macro F1 konservatif; unattempted/missing tidak dianggap kelas lainnya dan dicatat sentinel no_prediction. Bila stop, sebut **partial** dan tampilkan coverage, attempted-only dan conditional-success sebagai analisis sekunder, bukan hasil lengkap. Failure rate = attempt status non-success / attempt; timeout rate = timeout / attempt; strict-valid rate = strict-valid / attempt termasuk HTTP gagal; juga laporkan output tidak valid yang dinormalisasi meski status success.
- 401/403, 402, 429, harga/kuota tak jelas, drift model atau indikasi biaya → stop/checkpoint, tanpa retry/beralih provider. Timeout/network/5xx juga disimpan dan menghentikan blok untuk pemeriksaan; tidak memperpanjang timeout atau mengulang demi angka lebih baik. Resume hanya sampel belum pernah dikirim dengan izin lanjutan yang sesuai; pending uncertain tidak replay. Maksimum total POST primer tetap 270.
- Baseline execution error tidak boleh hilang dari denominator; tidak ada JSON-validity provider untuk baseline (N/A), jangan menganggapnya 100% lewat kontrak berbeda. Ukur latency lokal baseline terpisah dari latency LLM yang mencakup jaringan.

### Metrik, ketidakpastian dan klaim

Accuracy = final/ raw matches terhadap **target skenario sintetis**, precision/recall/F1 per kelas, macro P/R/F1 atas 9 kelas tetap (zero_division=0 dan support nol dinyatakan), confusion matrix dengan kolom invalid/missing; macro F1 utama bersama accuracy, bukan hanya HTTP 200. Catat raw vs final effects, fallback dan jenis kasus/keluarga. Median dan p95 latency dari semua attempt dengan failure; tambahkan success-only, gunakan monotonic clock sampai body+normalisasi dan interpolasi linear. Provider latency tidak sama processingTime service maupun baseline lokal.

Mapping departemen deterministik dilaporkan sebagai kesesuaian spesifikasi aplikasi (raw saran vs normalized vs mapping-routing **simulasi**), bukan accuracy kewenangan instansi atau persistensi DB. Secondary/priority tidak dievaluasi kuantitatif tanpa target praspesifik dan pemeriksaan konsistensi terpisah. Confidence/review dipaparkan deskriptif pada benar/salah terhadap target sintetis; bukan calibration populasi/efektivitas manusia.

Selisih metode dihitung paired per sampel/keluarga. Bootstrap berstrata kelas/per-keluarga dapat direncanakan sebagai sensitivitas internal dengan seed dan jumlah resampling dibekukan sebelum run; interval tidak merepresentasikan warga karena desain purposif dan ketergantungan template. Jangan menggeneralisasi atau menyebut satu run konsisten jangka panjang. Publikasikan versi/hash, exclusion log, planned/attempted/completed dan hasil aktual saja; tidak ada angka baru atau screenshot sebelum eksekusi.

---

## Arsip protokol v1 (referensi historis, bukan protokol aktif)

Status: Phase 2; belum eksperimen massal. Izin akses DB/API dan startup diberikan 26 Oktober 2026; jumlah request massal dan biaya belum disepakati secara spesifik. Smoke runtime harus dibedakan dari final evaluation.

## Pertanyaan penelitian
RQ1 kategori tunggal; RQ2 departemen mentah, normalized, dan routing; RQ3 latency/output validity/failure; RQ4 hubungan confidence/review dengan error.

## Freeze dan independensi
Bekukan dataset final, label adjudicated, source commit, prompt lengkap, katalog berurutan sesuai eksekusi aktual, hash, konfigurasi dan baseline sebelum request final. Simpan input title dan description, bukan complaint_text saja. Data dev terpisah. Jangan tuning prompt pada final; perubahan harus eksperimen versi baru. Simpan semua sampel/error; dilarang cherry-picking.

## Jalur eksekusi
Gunakan classifyComplaint aktual; read-only catalog adapter/snapshot, tanpa POST operational dan tanpa write DB. Harness mengobservasi fetch provider untuk raw body/output/status/model metadata sebelum normalizer; identitas provider-returned vs inferred harus eksplisit. Konteks default dan DB berbeda harus ditandai. Uji persistensi controller hanya pada DB disposable dengan izin terpisah; hasil simulasi routing bukan hasil persistensi.

## Output validity/fallback
Pisahkan transport success, parse success, strict schema validity, normalized valid-label rate. Definisikan schema sebelum run: object non-array, required seven fields, enum/array/string/boolean, confidence integer 0–100; reason string nonempty. Extra fields dilaporkan, tidak otomatis invalid kecuali keputusan dibekukan. Raw label invalid/missing menjadi kelas sentinel __invalid__/__missing__ saat menghitung error raw. Fallback kategori, departemen, priority, confidence dan full-provider failure dicatat terpisah. Final fallback dinilai terhadap label, bukan otomatis benar.

## Denominator
Kategori end-to-end: semua sampel final unik yang ditargetkan; sampel belum selesai harus dilaporkan coverage dan dianggap no-prediction dalam metrik konservatif. Selain itu laporkan hasil pada seluruh sampel attempted dan conditional transport-success dengan denominator eksplisit; jangan sebut subset conditional sebagai hasil utama. Macro P/R/F1 menggunakan sembilan kategori tetap, zero_division=0; support nol ditandai. Confusion matrix mempunyai kolom sentinel untuk raw invalid/no prediction. Akurasi departemen hanya gold department eligible, missing/failure salah; routing dan saran LLM dilaporkan terpisah.

Failure dan timeout berbasis request attempts; completion/final fallback berbasis sampel unik. Valid output rate strict valid / completed attempts (HTTP gagal tetap denominator attempted; laporkan keduanya bila parse-only diperlukan). Latency wall-clock monotonic sampai body/normalization; median/p95 seluruh attempts termasuk failed, plus successful-only. Aturan percentile linear interpolation dibekukan. Checkpoint tidak menghilangkan attempts.

## Review dan confidence
Bandingkan error reviewed/unreviewed, coverage, high-confidence errors (>=80), low-confidence correct (<60), histogram benar/salah. Self-reported confidence bukan probabilitas terkalibrasi; ECE eksploratif fixed 10 bins pada raw numeric valid, laporkan N/exclusion. Jangan menggabungkan fallback imputed confidence sebagai raw calibration.

## Secondary dan priority
Tidak menghitung akurasi tanpa gold tambahan yang tervalidasi; jika tersedia pakai multi-label P/R/F1/Jaccard terpisah dan pedoman prioritas eksplisit.

## Baseline
Extract historical keyword-v1.0 identik dari commit/blob tercatat audit; input gabungan judul/deskripsi yang sama. Tidak tuning pada final. Department baseline hanya mapping kategori beku, bukan kemampuan prediksi dept asli. Laporkan paired differences dan uncertainty; tidak klaim unggul sebelum hasil.

## Gangguan/kuota
Concurrency 1, minimum interval 3 detik, retry otomatis 0 pada final utama. Hard per-attempt deadline harness harus tidak disamakan timeout produksi. Jika 401/403/429/billing/unknown model: stop, simpan checkpoint, jangan fallback provider/model berbayar. Semua perubahan config dicatat. Kuota provider harus diverifikasi sebelum bulk; 200 lokal bukan bukti 200 tersedia.
