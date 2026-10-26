# Pilot pemilihan model operasional — 26 Oktober 2026

Status: **pilot development sintetis**, bukan eksperimen klasifikasi final. Pemilihan default operasional bersifat sementara sampai pengujian berlabel independen dan pengukuran jangka panjang. Perubahan default terjadi **setelah** audit read-only dan persetujuan pengguna untuk mengganti klasifikasi dan chatbot.

## Konfigurasi dan sumber

- Jalur yang diuji: `backend/services/classificationService.js::classifyComplaint` dengan `pool=null` (katalog default), temperature 0.1, `response_format=json_object`, max output 500 token, timeout produksi 15 detik. Tidak ada request ke database dan tidak ada data warga.
- Kandidat dan biaya: `https://kiosapi.com/api/pricing` menampilkan multiplier `Free-Pro=0`, dukungan Free-Pro untuk setiap model yang dipakai. Pengguna menyatakan key aplikasinya memakai Free-Pro; API katalog tidak memberikan identitas grup key atau sisa kuota akun. Tidak ada verifikasi independen bahwa debit akun setiap request Rp0; pada respons flint tercatat `usage.cost=0`.
- Dataset: sembilan teks sintetis split `dev` dari `dataset.provisional.json`, satu per kategori, label AI provisional (`dataset_provenance.md`). Untuk test model selain MiniMax, sejumlah sampel dihentikan dini saat gagal. Tidak ada tuning prompt atau label berdasarkan hasil; tidak ada klaim sampel independen.
- Batas yang disetujui 27 POST; **17 POST** dilakukan: Qwen 1, Flint 1, Beam 4, GLM 2, MiniMax 9. Selain itu GET katalog/harga/metrik publik. Batas request tidak dinaikkan; tidak ada retry. Biaya aktual pada akun tidak dapat diperiksa dari API; multiplier katalog Free-Pro nol dan key di grup itu berdasarkan pernyataan pengguna.
- Perintah aktual: `node research/evaluation/compare_free_pro.cjs` (1 POST Qwen, berhenti TIMEOUT); `node research/evaluation/smoke_flint.cjs` (1 POST Flint sebelum helper dibatasi ke kandidat lain); `node research/evaluation/smoke_flint.cjs beam-free` (sampel 0001 sebelum perubahan nama file), lalu `node research/evaluation/smoke_flint.cjs beam-free SIPW-CAND-0002` sampai `0004`, `node research/evaluation/smoke_flint.cjs glm-5.3-flash-free SIPW-CAND-0001` sampai `0002`, dan `node research/evaluation/smoke_flint.cjs minimax-m3.1-flash-free SIPW-CAND-0001` sampai `0009`. Semua perintah menggunakan request individual dan checkpoint eksklusif; tidak ada screenshot baru.

| Model | POST | JSON valid | Kategori sesuai label provisional | Hasil teknis |
|---|---:|---:|---:|---|
| `qwen3.8-flash-free` | 1 | 0 | 0 | Timeout produksi ~15.0 s, tidak ada status HTTP |
| `flint-v1.0-free` | 1 | 0 | 0 | HTTP 200, konten kosong pada output 500 token |
| `beam-free` | 4 | 3 | 3 | HTTP 200 semua; satu JSON terpotong pada 500 token → fallback |
| `glm-5.3-flash-free` | 2 | 1 | 1 | Satu HTTP 200 valid; satu timeout ~15.0 s |
| `minimax-m3.1-flash-free` | 9 | 9 | 9 | HTTP 200 semua, JSON valid, latency 2.719–5.696 s, median 3.142 s |

Semua kecocokan hanya pada sembilan label **provisional yang dibuat AI**; tidak disebut akurasi ilmiah. Provider-returned ID MiniMax `minimaxai/minimax-m3.1-flash`. `account_charge_verified=false` pada artefak lokal. Keluaran HTTP 200 kosong/terpotong **tidak** dihitung benar. Tidak ada uji konsistensi repeated-run, chatbot, ataupun DB end-to-end.

## Pilihan dan batas

Untuk kebutuhan operasional segera tanpa DeepSeek, `minimax-m3.1-flash-free` dipilih sebagai default klasifikasi **dan chatbot** berdasarkan pilot terbatas ini. Override aktif pada `backend/.env` lokal juga diganti hanya untuk dua variabel model (file tersebut diabaikan Git; nilai kredensial tidak dicetak/tidak dikomit). Tidak ada deployment. Perubahan default tidak mengubah logika pemilihan model lain atau mengatasi kelemahan `KIOSAPI_FREE_ONLY` (cabang tidak memblokir ID non-free); jangan menganggap flag itu jaminan keselamatan billing. Jika key, grup, atau harga berubah, hentikan pemakaian dan cek ulang dashboard.

Artefak mentah lokal: `free_pro_comparison_v1/`, `free_pro_flint_smoke.json`, dan `free_pro_SIPW-CAND-*_smoke.json`; file mentah tersebut tetap di workspace dan tidak otomatis dipublikasikan karena berisi prompt serta teks percobaan. Tidak ada metrik final penelitian, CSV prediksi final, atau screenshot eksperimen yang dibuat.

## Verifikasi perubahan dan batas keamanan

Perintah `node --check research/evaluation/compare_free_pro.cjs` dan `node --check research/evaluation/smoke_flint.cjs` sukses. Setelah penggantian model: percobaan `node --test tests/` dari backend gagal pada Node/Windows (satu error runner, bukan kegagalan test klasifikasi); menjalankan keempat file test secara eksplisit dengan API key kosong menghasilkan **17 test, 17 pass, 0 fail, 0 skipped**. Test chatbot lokal ini tidak mengukur kualitas respons model baru. `git check-ignore backend/.env` mengonfirmasi file override lokal tidak terlacak. Tidak ada migrasi, deployment, DB write, eksperimen final, atau screenshot baru. Perubahan yang disiapkan untuk commit hanya `backend/config/kiosApi.js`, `backend/.env.example`, `README.md`, dan dokumen pilot ini; file mentah, helper eksperimen, dataset dan hasil lama tetap tidak terlacak.
