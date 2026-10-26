# Laporan evaluasi eksploratori SIPW — bukan hasil penelitian final

## 1. Ringkasan

SIPW diuji menggunakan `minimax-m3.1-flash-free` pada 27 teks pengaduan **sintetis**, dengan referensi kategori yang disusun dua AI berbeda dan belum divalidasi manusia. Semua 27 request menghasilkan HTTP 200, status service success dan output strict-valid. Kategori mentah dan final cocok **27/27 terhadap label AI provisional** (macro precision/recall/F1 masing-masing 1 pada sampel ini). Nilai itu **tidak boleh disebut akurasi pengaduan warga atau hasil final artikel**. Departemen saran model hanya cocok 23/27 dengan mapping internal; baseline keyword historis cocok 21/27 label AI provisional. Tidak ada dasar untuk menyatakan LLM unggul secara umum.

## 2–3. Audit aktual dan alur

Audit file/fungsi: `../audit.md`, `../code_map.md`, `../risks.md`. Input `complaintController.create` → `classifyComplaint` → `callKiosChatCompletion` → parser normalisasi → routing departemen berdasarkan kategori DB (mengalahkan saran model) → log/complaint. Eksperimen memakai `classifyComplaint(title,description,null)`, bukan endpoint POST operasional: katalog kategori/departemen default, **tanpa** DB write atau bukti persistensi controller. Model default klasifikasi dan chatbot di `backend/config/kiosApi.js` telah diganti ke MiniMax; kualitas chatbot tidak dievaluasi. Confidence adalah self-report model, bukan probabilitas terkalibrasi.

## 4. Dataset dan label

`dataset.candidate.json` berisi 27 teks sintetis (3/kategori, tipe normal/informal/typo/ambigu/incomplete/multicategory/out_of_scope). Dua AI berbeda mengisi `rater_A_completed.json` dan `rater_B_completed.json`, sepakat 27/27 kategori utama; bukan dua penilai manusia independen, dan blinding dari label pembuat/prediksi tidak dapat dibuktikan. Kedua label departemen menggunakan `mapping`; konflik secondary sampel 0009 tidak diselesaikan. Dataset dibuat dengan pengetahuan taksonomi/prompt, rawan kebocoran semantik. Tidak ada data warga nyata atau klaim representativitas.

## 5. Konfigurasi

Kios API Free-Pro menurut katalog publik multiplier 0 dan user mengonfirmasi grup key; debit akun aktual serta kuota akun tidak dapat dibaca. Requested model `minimax-m3.1-flash-free`; provider-returned pada 27 respons `minimaxai/minimax-m3.1-flash`. Temperature 0.1, `json_object`, output 500 token, timeout produksi 15 detik, 0 retry, minimum antar-start 10 detik, concurrency 1. Batas disetujui maksimum 27 POST dan Rp0. Timestamp, hash konfigurasi/prompt/dataset tersimpan pada manifest/log; rincian di `reproducibility.md`.

## 6. Pengujian fungsional

Empat file test backend sebelumnya dieksekusi eksplisit dengan key kosong: 17 pass, 0 fail (`../model_switch_pilot.md`). Pada tahap ini 9 test utilitas metrik/retry lulus, 0 gagal. Dry-run 27 sampel menghasilkan 0 POST. Tidak ada integration test DB baru; lulus test tidak membuktikan klasifikasi benar.

## 7. Kecocokan kategori terhadap label AI provisional

| Ukuran | MiniMax, semua 27 | Keyword historis, 27 sama |
|---|---:|---:|
| Kategori cocok | 27/27 | 21/27 |
| Macro precision | 1 | 0.871693 |
| Macro recall | 1 | 0.777778 |
| Macro F1 | 1 | 0.780423 |

Denominator MiniMax adalah semua 27 sampel, termasuk kegagalan bila ada; tidak ada sampel gagal pada batch ini. Prediksi mentah/final sama pada 27 sampel. Confusion matrix dan per-kategori dapat dihitung ulang dari `exploratory_analysis_v1/predictions.csv`; jangan menafsirkan angka 1 sebagai generalisasi atau superiority. Baseline keyword menggunakan source historis tanpa tuning pada dataset ini; studi kecil, label AI berpotensi bias, dan contoh sintetis ditulis dari taksonomi yang sama.

## 8. Departemen

Saran departemen model yang dinormalisasi cocok **23/27** dengan kode mapping internal (macro F1 0.869388). Ketidakcocokan: `0013` KELURAHAN vs PUPR, `0014` DINKES vs PUPR, `0015` KELURAHAN vs PUPR (semuanya kategori air_bersih), serta `0025` SATPOLPP vs KELURAHAN (kategori lainnya). Routing **simulasi** dari kategori memberi 27/27 terhadap mapping yang sama secara konstruksi, bukan bukti routing DB atau kewenangan instansi dunia nyata. Tidak ada klaim departemen model 100%.

## 9. Kinerja teknis

27/27 attempted, 27/27 HTTP 200, 27/27 sukses dan strict-valid, failure/timeout/429 0/27, median latency wall-clock **3417.346 ms**, p95 **6184.617 ms** (interpolasi linear), 0 retry. **Fallback/normalisasi penggantian label: 0/27** (kategori dan departemen raw sama dengan final); empat saran departemen yang berbeda dari mapping adalah **ketidakcocokan prediksi terhadap referensi mapping**, bukan fallback. Provider tidak mengirim nilai cost pada log ini; tidak ada klaim tagihan akun Rp0 yang terukur.

## 10. Analisis kesalahan dan review

Tidak ada mismatch kategori terhadap label AI provisional pada 27 sampel, sehingga `exploratory_analysis_v1/error_analysis.md` menyatakan hal tersebut tanpa membuat contoh salah palsu. Ada **empat mismatch saran departemen** seperti di atas, tidak otomatis ditandai review walau confidence masing-masing 95, 92, 88, 92. Satu sampel `0026` ditandai perlu tinjauan pada confidence 35 dan kategori cocok label provisional. Tidak ada kesimpulan efektivitas review atau kalibrasi dari sampel ini. Priority/secondary tidak dinilai akurasinya tanpa referensi adjudicated yang sah.

## 11. Bukti visual

Lihat `../evidence/index.md` dan `evidence_index.md` lokal. Tujuh PNG `../evidence/screenshots/EXPLORATORY_*.png` benar-benar ditangkap dari **halaman HTML lokal yang menampilkan log aktual** setelah batch; khusus CODE_AUDIT/TEST_EXECUTION bukan screenshot langsung editor/terminal pada saat kerja. Screenshot terdahulu `RUNTIME_HEALTH.png` hanya membuktikan health server; bukan hasil studi ini. CSV/JSON/skrip adalah bukti utama. Screenshot live editor/terminal khusus audit/test tetap BELUM DILAKUKAN, tidak diganti diam-diam oleh rekonstruksi visual.

## 12–13. Keterbatasan dan ancaman validitas

Dataset kecil, sintetis, seimbang artifisial; label AI-only tidak terverifikasi; pembuat mengetahui prompt/taksonomi; dua AI mungkin berbagi bias dan blinding tidak terverifikasi; departemen referensi mapping sirkular; classifier memakai katalog default bukan katalog DB live; endpoint/controller dan persistensi tidak diuji; hanya satu run/model pada dataset ini; perubahan provider/harga/alias mungkin terjadi; billing akun tidak teramati; baseline tidak boleh disimpulkan inferior secara populasi. Nilai sempurna terhadap label AI bukan bukti sistem siap digunakan tanpa peninjauan manusia.

## 14–15. Rekomendasi dan kesimpulan terbatas

Peroleh pengaduan berizin/anonim atau dataset sintetis yang dinilai manusia buta, adjudikasi kategori dan departemen substantif, pisahkan dev/final independen, evaluasi berbagai hari dan kondisi provider serta DB disposable dengan izin terpisah. Perbaiki enforcement free-only, audit log raw/final, dan timeout body. Kesimpulan sah hanya: **dalam batch eksploratori ini**, 27 respons valid dan kategori cocok dengan 27 label AI provisional; saran departemen berbeda dari mapping pada empat kasus. Tidak menyatakan akurasi final atau paper siap terbit.

## 16. Artefak

`exploratory_protocol_v1.md`, `dataset.candidate.json`, dua file completed, `exploratory_run_v1/manifest.json` dan 27 log per sampel, `exploratory_analysis_v1/` (CSV, JSON, confusion matrix, error analysis), `exploratory_keyword_baseline_v1/`, `reproducibility.md`, serta dokumen audit di induk. Raw/log kandidat lama tidak dicampur dengan batch MiniMax ini.
