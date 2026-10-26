# Kelanjutan pilot: satu attempt yang disetujui

Pengguna memberikan screenshot katalog harga input/output/cache Rp0 untuk deepseek-v4-flash-free (Free-Pro), kemudian menyetujui proposal satu percobaan sampel berikutnya. Screenshot katalog bukan bukti sisa kuota atau akurasi; angka status 89.88% tidak digunakan sebagai metrik penelitian. Lampiran tersedia dalam percakapan, bukan file workspace yang sudah diverifikasi.

## Perintah dan pembatasan
- `node --check research/evaluation/continue_one.cjs` berhasil.
- `node research/evaluation/continue_one.cjs` dijalankan sekali; hard cap 1 fetch, tanpa retry/model switching, output baru exclusive create, source produksi tidak berubah, pool=null sehingga tidak menulis DB.
- Checkpoint SIPW-CAND-0010 yang gagal HTTP429 tetap dipertahankan, tidak direplay atau ditimpa. Config/source/dataset hash untuk continuation dicatat terpisah karena harness berubah. Prompt sistem hash tetap sama: ff7538198a2820650a892eb1d751d0796cc7c17468069f37bba39fae31e07ed4.

## Hasil aktual
Timestamp 2026-10-26T05:35:49.037Z. Sampel SIPW-CAND-0011 (typo), judul “Aspal gang ngelupas parh”, deskripsi tentang aspal mengelupas/berlubang dan motor tersangkut.

| Field | Hasil |
|---|---|
| HTTP | 200 |
| Provider model | self-dploy/DeepSeek-V4-Flash |
| Raw dan final category | jalan_rusak |
| Raw dan final department | PUPR |
| Confidence | 90 (self-report LLM, tidak terkalibrasi) |
| Human review | false |
| Priority | normal, tanpa gold prioritas |
| Strict output valid | true |
| Fallback | false |
| Wall-clock latency | 5962.3999 ms |

Kategori dan departemen cocok dengan label provisional sampel ini. Ini satu kecocokan aktual, bukan bukti accuracy 100% pada populasi atau dataset final. Reason model disimpan pada record. Routing mapping hanya simulasi, tidak ada persistensi controller. Tagihan transaksi continuation belum direkonsiliasi dashboard; catalog Rp0 mendukung pemilihan model tetapi bukan receipt debit akun.

## Status gabungan, jangan mencampur dengan smoke
Dari 18 kandidat pilot: 2 sample unik telah attempted, 1 success, 1 HTTP429/manual fallback, 16 belum dikirim. Kecocokan kategori final sistem terhadap provisional pada attempted: 1/2; kecocokan prediksi provider yang berhasil: 1/1. Denominator berbeda, tidak boleh menamai angka conditional ini hasil utama LLM final. Smoke awal adalah sampel lain dan tidak dimasukkan dalam pilot. Baseline 18 belum sebanding dengan 1 prediksi provider berhasil; tidak ada klaim superioritas.

Proses berhenti setelah satu attempt sesuai persetujuan, walaupun success. Tidak ada screenshot baru atau pengiriman 16 sampel berikutnya otomatis. Sebelum melanjutkan perlu izin batch selanjutnya dan tetap stop-on-429; kuota/reset provider belum diketahui.
