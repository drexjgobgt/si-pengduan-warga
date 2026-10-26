# Verifikasi runtime terbatas

26 Oktober 2026. Story: formulir → API → classifier/provider → DB → UI. Batas yang benar-benar diverifikasi di bawah; bukan klaim end-to-end lengkap.

## Startup dan perintah
- Backend, workdir backend: `$env:PGOPTIONS='-c default_transaction_read_only=on'; node server.js` (background).
- Frontend, workdir frontend: `$env:BROWSER='none'; $env:HOST='127.0.0.1'; $env:PORT='3000'; $env:CI='true'; npm start` (background).
- `node research/evaluation/inspect_runtime.cjs`: SELECT metadata dan katalog, PostgreSQL 18.6, transaction_read_only on; tidak membaca baris warga/pengaduan.
- `node research/evaluation/runtime_smoke.cjs`: GET provider models + 1 POST classification sintetis; tidak menulis DB.
- HTTP fetch localhost health/categories/frontend; browser membuka health saja.

## Hasil aktual
Frontend: `Compiled successfully!`, webpack compiled successfully, HTTP 200 text/html di http://127.0.0.1:3000. Warning deprecation fs.F_OK/webpack middleware dan browserslist lama; tidak memperbarui dependencies.

Backend: startup port 5000. Startup SELECT NOW sempat warning `Connection terminated due to connection timeout`. Pemeriksaan berikutnya endpoint categories HTTP 200 dengan sembilan kategori; inspeksi DB read-only juga berhasil. Timeout awal tetap dicatat, bukan dihapus atau diklaim seluruh startup bersih. Health HTTP 200 tetapi status AI Active statis.

Provider models HTTP 200, configured model terdaftar. Satu classifyComplaint sintetis dengan pool=null memakai katalog default aktual layanan, bukan katalog DB. HTTP 200; provider-returned model `self-dploy/DeepSeek-V4-Flash`; kategori listrik; departemen DISHUB; priority normal; confidence 85; needsHumanReview false; status success. Wall-clock 7592.6883 ms, service processingTime 7592 ms. Output mentah, request prompt, usage dan metadata berada di evidence/runtime_smoke.json. Teks sintetis tidak memuat data warga. Tidak ada label independen sehingga tidak dihitung akurasi, F1 atau keberhasilan routing/persistensi.

Model catalog tidak membuktikan harga atau sisa kuota akun. Price/quota belum diverifikasi, tidak ada mass experiment. Smoke runner menolak overwrite dan membatasi satu attempt; bukan harness final checkpoint/resume.

## Batas verifikasi
| Boundary | Status |
|---|---|
| Frontend compiled/HTTP served | terverifikasi |
| Visual UI aplikasi | belum diverifikasi; tidak membuka homepage yang memuat record warga |
| API health HTTP | terverifikasi, bukan readiness provider |
| API categories → DB → JSON | terverifikasi |
| Service → provider → normalizer | satu smoke aktual terverifikasi |
| Form submit → controller persistence | belum dilakukan, DB guard read-only |
| Prediksi → UI | belum dilakukan |

Tidak mengirim POST operational, tidak login/register, tidak membuka GET complaints, tidak migrasi atau deployment. Guard read-only membuat operasi write gagal; jangan menganggap aplikasi ini mode operasional normal. Hentikan verifikasi persistensi sampai database disposable ditentukan.

## Screenshot
`evidence/screenshots/RUNTIME_HEALTH.png`: screenshot browser asli endpoint health, 13337 bytes, terbuka dan terbaca. Hanya membuktikan respons health; bukan audit kode, test suite atau model accuracy. Screenshot wajib lainnya belum tersedia.
