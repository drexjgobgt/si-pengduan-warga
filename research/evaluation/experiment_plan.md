# Rencana eksperimen dan gerbang persetujuan

## Sudah diizinkan
Dokumentasi Phase 1/2, akses database dan API, startup proyek. Tidak ada izin migrasi/deployment/perubahan produksi; tetap dilarang. Jumlah request dan budget bulk masih perlu disepakati.

## Rancangan jumlah (belum dikumpulkan)
- Dev: 18 kandidat sintetis, target 2/kategori.
- Final: 126 kandidat sintetis, target 14/kategori dan variasi tujuh sample_type; cross-category/type balance target saja, tidak memaksa label ambigu.
- Final primary: 126 request, satu/sample, retry 0.
- Opsional stability: subset 18 yang dipilih sebelum run ×2 tambahan =36 request.
- Dev maksimal 18 request. Total rancangan 180 classification calls + maksimal 1 smoke call; metadata GET terpisah. Ini bukan bukti kuota cukup atau data sudah tersedia.
- Bisa dibagi hari, tetapi kuota akun provider, request layanan lain dan perubahan model antarhari harus dicatat. Minimum spacing 3 detik, concurrency 1.

## Runtime terverifikasi
26 Oktober 2026: kiosapi.com, configured deepseek-v4-flash-free, 0.1, 500 token, 15000 ms, limit lokal 200, PostgreSQL lokal 18.6 read-only; 9 kategori aktif/7 dept. Config freeOnly aktif tetapi enforcement produksi cacat. Harga/sisa kuota provider belum diketahui. Jangan fallback model lain.

## Gerbang sebelum bulk
1. Pengguna menyetujui count final/repeat dan budget uang maksimal; free-only memerlukan verifikasi provider, bukan hanya model ID.
2. Label independen dan dataset hash dibekukan; jika tidak ada rater, jalankan hanya pilot provisional dan ubah klaim.
3. Harness di research/evaluation, raw interception, no secret/PII, dry-run, checkpoint/resume dan recompute metrics diuji offline.
4. Kuota provider diverifikasi via dashboard/endpoint resmi yang tersedia; tidak menganggap /models memberi sisa kuota.
5. Keluaran raw/normalized/routing dibedakan; DB operasional tidak ditulis.

## Langkah sekarang
Nyalakan backend dengan PGOPTIONS read-only dan frontend loopback, periksa HTTP health/katalog tanpa GET complaints. Boleh satu smoke sintetis setelah metadata model, tanpa penyimpanan DB; bukan final dataset dan bukan hasil ilmiah. Jangan submit form ke database saat guard read-only. Screenshot UI hanya bila bebas PII; capture gagal/tidak tersedia dilaporkan jujur.

## Progres tambahan setelah izin melanjutkan
27 kandidat sintetis AI dibuat (9 dev +18 pilot_candidate, bukan 126 final); label seluruhnya provisional. Dataset/hash dan provenance tersedia. Harness dry-run/offline dibuat dan diverifikasi (27 dry-run, resume tanpa duplikasi, 27 fixture; 9 unit test pass). Satu run verifikasi pertama gagal karena quota tracker module cache, diperbaiki pada harness dan run lama dipertahankan. Live mode tetap blocked; tidak ada request API tambahan pada tahap ini. Detail di offline_preparation_report.md. Jumlah/rancangan awal tetap usulan, bukan hasil terkumpul.

## Keputusan anggaran terbaru
Pengguna menetapkan Rp0/gratis saja. Baseline keyword 18 pilot dijalankan lokal (13 label provisional cocok, macro F1 0.6962963). Pada pemeriksaan gratis-saja, GET model catalog menunjukkan alias tersedia tetapi tidak menyediakan harga/kuota akun. Smoke sebelumnya memuat usage.cost nonzero 0.00015862 (currency tidak tersedia; debit akun tidak diketahui). Karena itu pilot generasi tetap BLOCKED_FREE_ONLY_UNVERIFIED, bukan dianggap gagal klasifikasi atau selesai. Lihat free_only_status.md dan evidence/free_only_preflight.json. Tidak ada fallback berbayar dan tidak ada model alternatif dipilih.
