# Verifikasi kandidat pengganti DeepSeek — Phase 2

Waktu pemeriksaan: 2026-10-26 sekitar 13:17 WIB. Dokumen ini melengkapi `experiment_protocol.md` dan `experiment_plan.md` tanpa mengubah rancangan maupun artefak lama. Status: **belum ada model pemenang; belum diimplementasikan**.

## Pemeriksaan aktual

- Satu authenticated read-only `GET https://kiosapi.com/v1/models` dengan credential lokal yang tidak dicetak. HTTP 200; 30 entri katalog. Request generasi klasifikasi: **0**; akses database: **0**; perubahan kode produksi: **0**.
- ID non-DeepSeek yang memuat `free`: `flint-v1.0-free`, `qwen3.8-27b-free`, `openrouter/free`, `minimax-m3.1-flash-free`, `qwen3.8-flash-free`, `glm-5.3-flash-free`, `beam-free`.
- Entitas yang dikembalikan hanya memuat `id`, `object`, `created`, `owned_by`, `supported_endpoint_types`; tidak ada data pricing, entitlement, sisa kuota, laju 429, throughput, latency atau reliabilitas. ID `openrouter/free` adalah router, sehingga identitas model respons harus dicatat; jangan menganggap model tetap.
- Default produksi masih `deepseek-v4-flash-free` di `backend/config/kiosApi.js:15–19`; dua environment override dapat mengalahkan default. Pemeriksaan free-only produksi tidak memblokir model berbayar (`kiosApi.js:112–122`). Daftar katalog dan string `free` bukan bukti debit Rp0.
- Perintah inline pertama gagal `SyntaxError` karena quoting PowerShell sebelum koneksi; perintah here-string kedua berhasil. Kegagalan lokal itu tidak dihitung sebagai request provider.

## Keputusan seleksi yang masih bersyarat

Kandidat awal untuk benchmark: `qwen3.8-flash-free`, `minimax-m3.1-flash-free`, `glm-5.3-flash-free`. Pemilihan untuk *dibandingkan* berdasarkan label `flash` dan ID gratis di katalog, **bukan** klaim ketiganya paling cepat atau paling akurat. `flint-v1.0-free`, `qwen3.8-27b-free`, dan `beam-free` dapat menjadi cadangan bila metadata resmi atau hasil pilot menunjukkan keunggulan. Tidak memilih router dinamis sebagai model utama penelitian tanpa jaminan identitas backend tetap.

Sebelum request generasi, periksa dashboard/dokumentasi resmi untuk harga Rp0 pada akun/tier yang digunakan dan sisa kuota/rate limit. Jangan kirim tangkapan layar yang mengandung key/token/identitas akun. Bila tidak dapat dipastikan, hentikan benchmark; jangan mengalihkan diam-diam ke tier berbayar. Catat bahwa pada pilot DeepSeek sebelumnya ada HTTP 429; ini bukan bukti bahwa model baru tersedia atau lebih stabil.

## Usulan uji terbatas, perlu persetujuan terpisah

1. Bekukan 9–12 pengaduan sintetis *development* yang sama lintas kandidat, tanpa data pribadi atau label final. Jangan pakai dataset evaluasi final untuk memilih model. Dua penilai independen diperlukan untuk klaim akurasi final; label provisional hanya untuk diagnostik pilot.
2. Maksimal **3 kandidat × 9 sampel × 1 pengulangan = 27 POST** (bukan izin menjalankan sekarang). Jika sisa kuota tidak cukup, ajukan ulang cakupan. Budget uang maksimum Rp0. Jarak antar request sesuai rate limit resmi (minimal 10 detik bila belum ada batas lebih ketat), concurrency 1, tanpa retry otomatis; hentikan pada 402/401/403/429 atau debit yang tidak sesuai.
3. Gunakan prompt/parameter `classifyComplaint` aktual, katalog kategori yang dibekukan, dan skema JSON sama. Hanya `KIOSAPI_CLASSIFICATION_MODEL` berubah per kandidat di proses evaluasi, bukan konfigurasi produksi; tangkap requested dan returned model ID, raw/normalized label, strict output validity, status HTTP, latency sampai respons lengkap, dan fallback. Jangan kirim ke database operasional.
4. Laporkan median dan p95 latency, tingkat HTTP/JSON gagal, kepatuhan skema, konsistensi bila pengulangan nantinya diizinkan, serta kecocokan label provisional **secara terpisah**; 1 pengulangan tidak cukup untuk menyimpulkan kestabilan. Pilih model hanya setelah tradeoff dievaluasi; laporkan ketidakpastian sampel kecil.
5. Setelah pilihan dan perubahan kode disetujui, update default klasifikasi dan bila diminta chatbot secara eksplisit, contoh konfigurasi/dokumentasi dan test. Pastikan environment aktual tidak diam-diam mempertahankan model lama; jangan commit `.env`, key, log rahasia, atau data warga. Audit staging sebelum commit/push GitHub.

Tidak ada prediksi, metrik akurasi, atau screenshot benchmark yang dihasilkan oleh pemeriksaan katalog ini.

## Pemeriksaan gerbang biaya setelah persetujuan 27 request

Pengguna menyetujui batas maksimum 27 POST, biaya Rp0, dan penggantian **model klasifikasi serta chatbot** sesudah seleksi. Persetujuan ini tidak membuktikan key lokal bergrup Free atau kuota tersedia. Dokumentasi resmi Kios API yang dibaca:

- https://docs.kiosapi.com/getting-started/token-groups — grup diikat pada key saat pembuatan; grup `Free` bermultiplier 0, sementara grup `default` bermultiplier 1.0; key hanya dapat memakai model yang diizinkan grupnya.
- https://docs.kiosapi.com/getting-started/free-models.md — grup Free mengharuskan verifikasi Telegram dan kapasitas berbagi memiliki rate limit/tanpa SLA; model gratis ditampilkan pada halaman pricing live.
- https://kiosapi.com/pricing — halaman publik yang diambil sebagai teks hanya menghasilkan judul, sehingga harga dan grup *per kandidat* tidak dapat diekstrak/diverifikasi dari respons tersebut.

Belum ada bukti aman yang memverifikasi **grup key lokal**, status verifikasi, harga efektif tiga kandidat pada akun itu, serta kuota tersisa. Keputusan: **BLOCKED_FREE_GROUP_AND_QUOTA_UNVERIFIED**. Setelah persetujuan 27 request, tetap **0 POST** pada pemeriksaan ini. Jangan membaca/mencetak token untuk mencoba menyimpulkan grup dari string-nya; minta bukti dashboard yang disensor. Jangan menganggap bukti transaksi Rp0 milik model DeepSeek lama berlaku untuk model baru. Setelah memperoleh bukti, tetapkan kembali batas rate limit resmi sebelum menjalankan pembandingan; tanpa bukti lanjutkan hanya inspeksi read-only.

## Revisi berdasarkan konfirmasi pengguna tentang Free-Pro

Pengguna kemudian secara eksplisit mengonfirmasi tier `Free-Pro` dan meminta model dari grup tersebut. Endpoint publik yang digunakan langsung oleh halaman pricing, `https://kiosapi.com/api/pricing`, berhasil dibaca. Pada waktu pemeriksaan, `group_ratio.Free-Pro=0`, `usable_group.Free-Pro` menyatakan 15 RPM, dan tiga kandidat `qwen3.8-flash-free`, `minimax-m3.1-flash-free`, `glm-5.3-flash-free` masing-masing memiliki `enable_groups` yang mencakup `Free-Pro` dan endpoint `openai`. Dokumen pengumuman `https://kiosapi.com/api/notice` menyatakan Free-Pro memerlukan verifikasi Telegram serta deposit minimum $1; **deposit bukan biaya per request**, dan kami tidak melakukan deposit. Key yang dipakai tidak menampilkan grup/kuota via `/v1/models`; atribusi grup key pada akun adalah pernyataan pengguna, bukan pembacaan API. Jangan mengklaim kuota akun terverifikasi. Gerbang harga kandidat kini bersumber katalog live publik; runner akan memeriksa ulang sebelum POST, mematuhi batas maksimal 27 request, 10 detik antar start, tanpa retry dan berhenti pada error.
