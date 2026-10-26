# Risiko dan batas penggunaan bukti

1. **Biaya**: freeOnly tidak memblokir non-free model; nama free bukan jaminan harga provider. Counter lokal bukan sisa kuota akun. Jangan bulk sebelum metadata/kuota dan budget dipastikan.
2. **Privasi**: judul/deskripsi dapat mengandung PII; sanitization bukan anonymization. Hanya sintetis pada smoke/evaluasi awal; tidak membaca atau mengirim record warga.
3. **Mutasi tak disengaja**: GET complaints memicu UPDATE SLA. Backend verifikasi dijalankan dengan `PGOPTIONS=-c default_transaction_read_only=on`; jangan submit form/login sebagai bukti persistensi. Read-only menolak write tetapi bukan anonimisasi data yang dapat dibaca UI.
4. **Ground truth sirkular**: category_id=auto_category_id pada create. Jangan gunakan SQL accuracy sebagai validasi ilmiah.
5. **Raw hilang**: normalization overwrites invalid labels; perlu intercept observasi provider di harness, bukan asumsi raw=final.
6. **Review/calibration**: confidence self-report, fallback 0/50 dan clamp mencampur asal nilai; pisahkan confidence mentah dan sistem. Review flag tidak membuktikan manusia benar-benar meninjau.
7. **Routing**: mapping kategori mengalahkan departemen LLM. Laporkan keduanya; mapping internal tidak selalu sama kewenangan dunia nyata.
8. **Reliability**: timeout hanya sampai headers, retry tidak ada, counter reset restart, provider model alias dapat berubah, query katalog unordered.
9. **Test coverage**: 13 pass bukan bukti LLM akurat atau persistensi sukses; empat test chatbot tidak dijalankan, HTTP/DB integration belum dilakukan.
10. **External validity**: synthetic balanced dataset bukan populasi pengaduan. Hindari klaim representatif dan siap publikasi.
11. **Evidence**: screenshot belum diambil, jangan dianggap tersedia; tool transcript belum sama dengan file log terarsip. Tidak membuat hasil kosong.
12. **Secrets**: jangan log env values/raw headers/provider error bodies. Audit ini tidak membuktikan git history bebas secret.

Kegagalan operasional tercatat: satu percobaan inline `node -e` inspeksi runtime gagal SyntaxError karena quoting PowerShell sebelum koneksi dilakukan. Diganti helper CJS terpisah, yang berhasil menjalankan transaksi read-only.
