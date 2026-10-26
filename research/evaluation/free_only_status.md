# Gate biaya Rp0 — pilot dihentikan sebelum generasi

Pengguna menetapkan gratis saja/Rp0 dan meminta melanjutkan. Cap pilot 18 request tanpa retry tetap rencana; batas uang tidak boleh diabaikan karena model dapat dipakai.

## Pemeriksaan aktual
Perintah: `node research/evaluation/check_free_only.cjs`.
Waktu: 2026-10-26T05:28:59.198Z.
Satu GET authenticated `/v1/models`, HTTP 200. Alias `deepseek-v4-flash-free` terdaftar. Metadata model hanya id/object/created/owned_by/supported_endpoint_types; tidak tersedia pricing, free entitlement, sisa kuota akun atau bukti saldo tidak didebit.
0 request generasi, 0 akses database pada pemeriksaan ini. Tidak menebak endpoint billing atau berpindah model. Percobaan webfetch homepage publik tidak menghasilkan konten yang dapat dipakai sebagai bukti harga.

## Koreksi penting terhadap status smoke
Log asli `evidence/runtime_smoke.json` (2026-10-26T05:14:03.278Z), yang tidak diubah, memuat `usage.cost=0.00015862`, `usage.cost_details.upstream_inference_cost=0.00015862`, `total_cost=0.00015862`. Currency tidak disediakan. Jangan menjumlahkan field cost yang bisa merupakan rincian duplikat. Ini nilai yang dilaporkan provider, bukan bukti debit saldo akun atau tagihan dalam rupiah. Namun nilai nonzero membuat klaim gratis tidak dapat dipastikan. Laporan awal menyimpan metadata ini tetapi belum menyorot nilainya; temuan baru ini wajib digunakan untuk keputusan selanjutnya.

## Keputusan
`BLOCKED_FREE_ONLY_UNVERIFIED`. Pilot LLM 18 sampel tidak dijalankan. Baseline 18 kandidat dan seluruh hasil offline tetap valid dalam batas provisional; tidak ada hasil LLM yang dikarang untuk mengisi kekosongan.

## Pembaruan sesudah keputusan awal
Pengguna kemudian memberikan screenshot transaksi smoke yang cocok model/949-92 tokens dengan cost Rp0 dan Free-Pro 0x. Atas bukti tersebut dan permintaan continue, pilot bounded 18/no retry dimulai. Attempt pertama HTTP429 dan dihentikan (17 belum dikirim). Screenshot pengguna berikutnya menunjukkan transaksi gagal 12:32:07 WIB juga Rp0. Status terbaru: STOPPED_HTTP_429, bukan masih tanpa bukti harga historis. Sisa kuota dan penyebab 429 tetap tidak diketahui. Catatan keputusan awal di atas dipertahankan sebagai riwayat, bukan status terkini; lihat live_pilot/report.md.

## Bukti yang diperlukan agar gate dapat ditinjau ulang
Dashboard atau dokumentasi resmi terkait akun/tier/model yang menunjukkan permintaan alias ini mengonsumsi kuota gratis tanpa debit saldo/biaya tambahan, serta kuota tersisa yang cukup untuk 18 request. Provider upstream cost boleh berbeda dari debit pengguna tetapi hal ini memerlukan keterangan resmi, bukan dugaan. Jangan kirim API key, token, cookie, connection string atau data pribadi. Screenshot dashboard harus disunting untuk menyembunyikan identitas dan kredensial; billing/free-tier field yang relevan saja. Alternatif: pengguna membuka dashboard sendiri dan memberi bukti kuota/kebijakan yang dapat diperiksa. Tidak ada login otomatis atau pembacaan credential browser.
