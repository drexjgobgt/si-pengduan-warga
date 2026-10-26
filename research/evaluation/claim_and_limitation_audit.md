# Audit klaim dan keterbatasan penelitian SIPW

## Amendemen ruang lingkup: sintetis target-first, tanpa manusia

Pengguna kini memilih evaluasi terkontrol hanya sintetis tanpa pengumpulan warga atau penilai manusia. Tidak adanya manusia tidak melarang pengukuran terhadap **target aturan skenario**, tetapi membatasi konstruk dan generalisasinya. Rencana aktif di `synthetic_dataset_design.md`, revisi sintetis `experiment_protocol.md`, dan bagian terbaru `final_validation_plan.md`. Pernyataan lama bahwa gold manusia menjadi syarat aktif final di bagian bawah kini merupakan riwayat usulan yang tidak dipilih. Protokol pelabelan manusia dipertahankan sebagai opsi penelitian masa depan.

| Klaim tambahan | Putusan berdasarkan audit offline |
|---|---|
| Label eksploratori dibuat Claude/Gemini | **Tidak terverifikasi**. Tidak ditemukan nama model/vendor dalam dua completed JSON dan provenance lokal. Hanya konfirmasi pengguna dua AI berbeda. Identitas `AI_Provisional_Rater_B` bukan nama model; rater A null. Draf DOCX tidak menambah bukti identitas |
| Target skenario baru independen dari prediksi | **Dapat dirancang, belum dibuktikan/dibuat**: hash registry+aturan+target sebelum narasi, QA konsistensi dan freeze sebelum classifier. Bukan ground truth manusia dan bukan independen dari bias peneliti/taksonomi |
| Dataset sintetis target-first otomatis menghilangkan bias | **Tidak**: teks bisa membocorkan kelas, template sederhana, konflik aturan dan semantic overlap dapat membuat skor tinggi artifisial; perlu QA dan log eksklusi sebelum freeze |
| 270 kasus baru cukup mewakili populasi warga | **Tidak**. Usulan 30/kategori adalah budget cakupan kondisi sintetis, bukan sampling warga atau power guarantee; outcome dibatasi pada skenario yang diuji |
| Final sintetis sama dengan validasi dunia nyata | **Tidak**. Istilah final hanya versi dataset/protokol yang dibekukan. Accuracy dapat dilaporkan sebagai kecocokan terhadap target skenario sintetis, dengan provenance dan keterbatasan jelas |
| Gratis karena model berakhiran free | **Tidak**. Cabang free-only di `backend/config/kiosApi.js:112–122` tidak memblokir model berbayar; harga/kuota/batas biaya baru belum diverifikasi, sehingga live tetap diblokir |

### Audit lampiran DOCX (dibaca offline, tidak diubah)

`C:\Users\acer\Downloads\Draf_Artikel_Ilmiah_SIPW.docx` ditemukan; teks `word/document.xml` dibaca. Bagian 3.2 menetapkan target sebelum narasi dan hasil final masih placeholder—sesuai arah ini. Abstrak/4.1 memakai baseline 18 sampel (13/18, F1 ~0,6963); jangan dipasangkan head-to-head dengan LLM 27 sampel karena kohort berbeda. Baseline berpasangan dengan LLM 27 tersedia di `final_candidate_v2/exploratory_keyword_baseline_v1/` (21/27, F1 ~0,7804). Kedua hasil lama tetap eksploratori. Referensi/DOI/klaim literatur DOCX belum divalidasi eksternal; tidak dianggap otomatis benar atau siap jurnal. Jangan mengisi tabel final memakai angka 27/27, ukuran rancangan atau prediksi biaya.

### Temuan kode yang tetap relevan untuk rancangan sintetis

`classificationService.js:13–36` memiliki sembilan kategori default, tujuh departemen, review threshold <60. `getActiveContext` membaca DB hanya bila pool diberikan; desain offline/live masa depan memakai null sehingga tidak ada DB. Parser `validateAndNormalizeLLMOutput` normalisasi longgar, bukan skema ketat; invalid category→lainnya, department→KELURAHAN, priority→normal, missing confidence→50; error API/parse→manual fallback confidence 0. `classifyComplaint` memakai temperature 0.1, JSON mode, 500 token default dan confidence self-report. `kiosApi.js` timeout 15 detik dibersihkan sebelum pembacaan body; tidak ada retry. Kode historis keyword memakai lowercasing, regex+bobot, threshold 40 dan fallback lainnya; tidak menjadi fallback diam-diam LLM produksi. Fakta kode ini bukan bukti performa klasifikasi atau persistensi.

---

## Audit eksploratori dan riwayat usulan awal (klaim hasil tetap berlaku; syarat manusia bukan gate aktif)

Status 26 Oktober 2026: audit dokumentasi dan berkas lokal saja; tidak ada uji baru atau modifikasi artefak eksploratori. Ini daftar klaim berdasarkan **jenis bukti**—bukan menaikkan studi AI-provisional menjadi ground truth manusia.

| Klaim | Status yang dapat dipertahankan | Bukti aktual / batas |
|---|---|---|
| Default model klasifikasi dan chatbot MiniMax | **Didukung kode default** | `backend/config/kiosApi.js:15–19`; environment dapat override, tidak membuktikan semua deployment memakai default |
| Backend menyediakan alur klasifikasi dan persistensi | **Didukung inspeksi kode**, bukan uji integrasi | `backend/controllers/complaintController.js::create` 340–482, `backend/routes/complaints.js:23`, `backend/database/schema.sql:71–119,180–191` |
| 27 teks sintetis, tiga per kategori | **Didukung dataset/manifest** | `final_candidate_v2/dataset.candidate.json`, `manifest.json`; variasi tipe: normal 9, informal 4, typo 4, ambigu 3, incomplete 3, multicategory 3, out_of_scope 1. Bukan distribusi populasi |
| Dua penilai manusia independen / ground truth sah | **TIDAK didukung** | `final_candidate_v2/rater_A_completed.json`, `rater_B_completed.json` diisi dua **AI** berbeda menurut pengguna. Kesepakatan kategori utama 27/27 antar-AI tidak membuktikan kebenaran; blinding tak terverifikasi |
| 27/27 kategori MiniMax cocok label AI provisional | **Didukung pada sampel ini saja** | `final_candidate_v2/exploratory_analysis_v1/results_summary.json` dan 27 log `exploratory_run_v1/`; bukan akurasi pengaduan riil, tidak ada confidence interval populasi yang sah dari desain ini |
| 27/27 output valid, 0 timeout, median ~3417 ms, p95 ~6185 ms | **Didukung batch eksploratori** | `results_summary.json` memakai denominator 27 request; tidak menjamin SLA atau stabilitas hari lain |
| Saran departemen model sesuai mapping 23/27 | **Didukung pada mapping internal** | `department_results.csv`/`results_summary.json`; empat mismatch, tidak menguji benar-salah kewenangan hukum/instansi sebenarnya |
| Routing departemen operasional sukses 27/27 | **TIDAK didukung** | Simulasi kategori→mapping cocok 27/27 secara konstruksi. `create` memprioritaskan kategori DB; belum ada INSERT/SELECT DB disposable ataupun verifikasi HTTP end-to-end |
| Keyword baseline cocok 21/27 label AI provisional | **Didukung pada dataset sama** | `exploratory_keyword_baseline_v1/predictions.json`/manifest; keyword dieksekusi offline, bukan API operasional |
| MiniMax lebih unggul daripada baseline untuk warga | **TIDAK didukung** | 27 vs 21 hanya pada 27 kasus sintetis dengan label AI; kemungkinan bias konstruk, sampel kecil dan proses pemilihan model pada dev sebelumnya |
| Confidence terkalibrasi / review manusia efektif | **TIDAK didukung** | Confidence self-report; hanya satu kasus diberi review, tidak ada keputusan manusia/ground truth. Empat mismatch departemen tetap review=false pada label mapping |
| API sungguh mendebit Rp0 dan kuota tersedia | **TIDAK diverifikasi pada akun** | Manifest mencatat Free-Pro multiplier 0/eligible dan keterangan grup dari pengguna; nilai charge akun dan remaining quota tidak tersedia di log |
| Seluruh screenshot adalah bukti capture proses live | **TIDAK didukung** | Tujuh PNG di `research/evaluation/evidence/screenshots/EXPLORATORY_*.png` merupakan capture halaman HTML lokal berisi hasil aktual **setelah** run. `EXPLORATORY_CODE_AUDIT.png`/`EXPLORATORY_TEST_EXECUTION.png` bukan capture langsung editor/terminal saat berjalan; rincian `final_candidate_v2/evidence_index.md` |
| Laporan eksploratori siap sebagai artikel final GARUDA | **TIDAK didukung** | `final_candidate_v2/final_report.md`, `paper_materials.md` secara eksplisit membatasi studi; masih memerlukan data/label manusia dan uji end-to-end di DB test |

## Ancaman validitas yang harus dilaporkan

1. **Konstruk/label:** teks dan dua penilai AI mungkin berbagi pola/taksonomi dengan prompt MiniMax; 27/27 tidak membuktikan kualitas klasifikasi terhadap kebutuhan warga. Konflik sekunder 0009 tidak diadjudikasi.
2. **Sampling/eksternal:** tiga sampel per kelas, hanya satu out_of_scope, tanpa prevalensi warga asli atau interval generalisasi yang dapat dipertahankan; jumlah final harus direncanakan terpisah.
3. **Implementasi:** klasifikasi eksploratori memakai `pool=null` dan katalog default, tidak sama dengan jalur `create` memakai katalog DB; output mentah tidak disimpan di `classification_logs` produksi dan `priority` operasional berasal dari request. Review flag tidak menunjukkan manusia benar-benar meninjau.
4. **Komparasi:** baseline lama diberi input sama pada studi eksploratori tetapi gold AI-only; perbandingan final memerlukan pasangan per sampel pada gold manusia yang dibekukan dan keputusan timeout/failure yang sama.
5. **Bukti teknis:** tidak ada uji persistensi DB test; multiplier katalog bukan bukti billing; screenshot hasil yang dirender belakangan tidak sama dengan terminal/editor live.

## Status kerja dan tindak lanjut

Phase 1 audit dan studi **eksploratori** telah terdokumentasi; Phase 5/6/7/8 yang tersedia hanyalah hasil, screenshot, laporan dan bahan artikel eksploratori. **Validasi ilmiah final belum berjalan**: belum ada gold manusia, dataset final baru berizin, target jumlah/CI, anggaran dan batas API final, maupun uji DB terisolasi. Rencana gerbang dan desain uji berikutnya di `final_validation_plan.md` dan `human_labeling_protocol.md`. Tidak membuat `research/evaluation/predictions.csv` atau `results_summary.json` akar sebagai hasil final palsu.
