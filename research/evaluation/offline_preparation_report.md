# Laporan persiapan dataset dan verifikasi offline

## Status
Selesai untuk persiapan kandidat dan harness offline; belum selesai untuk harness live atau eksperimen ilmiah final. Semua aktivitas tahap ini menghasilkan 0 panggilan API eksternal dan 0 koneksi database. Keluaran fixture bukan prediksi LLM.

## Dataset yang benar-benar dibuat
`dataset.provisional.json`: 27 kandidat sintetis, 3/kategori. Dev 9, pilot_candidate 18, final 0. Normal 9, informal 3, typo 5, incomplete 3, ambiguous 3, multicategory 3, out_of_scope 1. Semua label provisional dibuat AI agent; department label diturunkan dari mapping SIPW, bukan penilaian domain independen.

SHA-256: `83e10dbb0c1ad260e64404bcf519bc68ca7949cec3c0a33b41c3387f0be32c52`. Manifest di dataset_manifest.json; provenance/ancaman independence di dataset_provenance.md. Ini bukan pemenuhan target 126 sampel final dan bukan data warga nyata.

## Perintah aktual
1. `node research/evaluation/prepare_dataset.cjs` — berhasil, 27 kandidat dan manifest dibuat, request API 0.
2. `node research/evaluation/verify_offline.cjs` — percobaan pertama gagal dengan `Production path did not reach offline interceptor`. Run tersimpan di runs/offline-verification-gdnVls, tidak dihapus.
3. Koreksi hanya evaluate.cjs: reset require cache service/provider per logical run, sehingga in-memory tracker produksi tidak terbawa dari dry-run sebelumnya. Tidak mengubah produksi atau hasil run lama.
4. `node research/evaluation/verify_offline.cjs` — percobaan kedua berhasil, bukti di runs/offline-verification-9WtnZX dan evidence/offline_verification.json.
5. `node --check research/evaluation/evaluate.cjs` dan `node --check research/evaluation/lib.cjs` — berhasil.
6. `git diff --exit-code -- backend frontend` — exit 0, source produksi tetap tidak berubah; git status hanya direktori baru research/.

## Hasil verifikasi aktual
- Dry-run 27/27 selesai; 0 API/DB; request prompt dibentuk oleh service produksi aktual dengan fetch mock, tidak dibuat ulang secara manual.
- Resume: 0 diproses ulang, 27 dilewati; hash isi checkpoint tidak berubah.
- Overwrite tanpa resume ditolak; resume dengan dataset berubah ditolak.
- Uncertain attempt ditolak tanpa replay; lock run lain tetap dipertahankan.
- Offline fixtures 27/27 selesai: 6 respons canned lengkap, 6 invalid JSON, 5 HTTP 429, 5 kategori/dept unknown, 5 timeout simulasi.
- Assertions: strict-valid fixture 6; fallback 21; error INVALID_OUTPUT 6; HTTP_429 5; TIMEOUT 5. Angka ini adalah hitungan skenario buatan untuk memeriksa harness, **bukan tingkat kegagalan provider**.
- Node unit runner: 9 test, 9 pass, 0 fail, 0 skipped/cancelled/todo; duration_ms 101.3588. Log aktual: runs/offline-verification-9WtnZX/unit-tests.txt.

## Batas implementasi
JSON input didukung; CSV belum diimplementasikan (persyaratan CSV atau JSON dipenuhi lewat JSON). CLI live sengaja ditolak: belum ada spend/quota guard yang tervalidasi untuk provider, rate limit live/body deadline belum diuji. Tidak melakukan replay otomatis pada crash, retry, atau uncertain request. SIGINT/SIGTERM handler tersedia, namun pengujian kill/interupsi OS nyata belum dilakukan; bukti saat ini hanya uncertain checkpoint simulasi.

Belum ada scripts perhitungan metrik ilmiah, baseline extract/run, final predictions, agreement manusia, calibrated confidence, atau persistensi controller. Routing fixture hanya simulasi mapping lokal; tidak disimpan di DB. Tidak menggunakan output fixture untuk menghitung accuracy/F1. Label/harness live mesti ditinjau sebelum final evaluation.

## Bukti visual
Tidak ada screenshot baru pada tahap ini. TEST_EXECUTION.png/DATASET_SAMPLE.png dan screenshot wajib lain masih BELUM DILAKUKAN; log teks/JSON aktual tersedia, tetapi tidak diganti dengan gambar sintetis atau mockup. Screenshot health dari tahap sebelumnya tidak membuktikan dataset/dry-run ini.

## Selanjutnya
Review kandidat oleh dua penilai independen; atau persetujuan eksplisit pilot provisional. Verifikasi kuota/harga provider dan batas request/uang sebelum live. Implementasi live adalah fase tambahan; dataset final dipisahkan dan dibekukan setelah label adjudicated, tanpa menyesuaikan berdasarkan error final.
