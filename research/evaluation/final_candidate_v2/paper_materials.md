# Bahan artikel — DRAF EKSPLORATORI, BELUM SIAP DIKIRIM KE JURNAL

## Judul usulan

**Audit dan Uji Eksploratori Klasifikasi Pengaduan Warga Berbasis LLM pada SIPW dengan Data Sintetis Berlabel AI**. Bila tersedia label manusia dan dataset berizin pada studi berikutnya, judul serta klaim dapat ditinjau ulang. Jangan mengganti status label AI menjadi ground truth pada naskah.

## Rumusan masalah dan tujuan

RQ1: bagaimana kesesuaian kategori keluaran SIPW terhadap label AI provisional pada 27 teks sintetis? RQ2: bagaimana perbedaan rekomendasi departemen LLM dengan mapping internal? RQ3: bagaimana latency, validitas JSON dan tingkat gagal pada batch terbatas? RQ4: bagaimana confidence dan flag review berhubungan dengan ketidakcocokan label provisional (dengan daya analisis sangat terbatas)? Tujuan: audit jalur produksi dan dokumentasi metode pengujian ulang, **bukan** estimasi performa untuk seluruh laporan warga.

## Research gap yang dapat didukung

Literatur klasifikasi membedakan metrik menurut jenis tugas dan distribusi label (Sokolova & Lapalme, 2009), sedangkan literatur anotasi menekankan asumsi dan provenance penilai (Artstein & Poesio, 2008; Cohen, 1960). Data statements menuntut dokumentasi batas populasi/konstruksi data (Bender & Friedman, 2018). Kontribusi **terbatas** studi ini adalah memisahkan keluaran mentah model, normalisasi, mapping routing serta kegagalan transport pada implementasi SIPW aktual, dengan skrip/log yang dapat diperiksa. Ini bukan klaim kebaruan karena hanya memakai LLM, dan belum membuktikan generalisasi ilmiah.

## Metodologi aktual

27 narasi buatan AI (3/kategori), 9 kelas, 7 tipe kasus; dua AI lain memberi label kategori utama yang sepakat 27/27, tetapi tidak ada dua penilai manusia, bukti blinding, atau validasi populasi. Model `minimax-m3.1-flash-free` dipanggil melalui fungsi produksi `classifyComplaint(...,pool=null)` dengan 0.1 temperature, JSON mode, batas 500 token dan timeout 15 detik. Satu POST/sampel tanpa retry, jarak start minimal 10 detik; output raw/normalized dan latency disimpan. Baseline keyword historis dievaluasi pada data yang sama tanpa tuning. Controller/DB produksi tidak disentuh.

## Tabel hasil aktual — **kecocokan label AI provisional saja**

| Ukuran | LLM MiniMax | Keyword baseline |
|---|---:|---:|
| Sampel kategori cocok / total | 27/27 | 21/27 |
| Macro precision | 1.000000 | 0.871693 |
| Macro recall | 1.000000 | 0.777778 |
| Macro F1 | 1.000000 | 0.780423 |
| Request API | 27 | 0 |

LLM menghasilkan 27/27 HTTP 200, output strict-valid 27/27, timeout 0/27, median latency 3417.346 ms dan p95 6184.617 ms. Saran departemen model cocok 23/27 mapping SIPW; simulasi routing dari kategori cocok 27/27 secara konstruksi. Satu kasus diberi flag review (confidence 35), namun tidak ada kesalahan kategori terhadap label AI sehingga efek review tidak dapat dievaluasi. Konflik secondary pada 0009 tidak diselesaikan; tidak ada angka akurasi prioritas/multi-label. Lihat `final_report.md` dan CSV/JSON untuk denominator dan rincian.

## Pembahasan dan batas

Kecocokan sempurna pada data buatan AI yang kecil dan seimbang tidak berarti model akurat pada laporan warga nyata. Prompt dan label mengacu taksonomi yang sama; pembuat kandidat mengetahui prompt dan pilot, sehingga kebocoran semantik serta bias label mungkin terjadi. Baseline numeriknya lebih rendah **pada sampel provisional ini**, tetapi tidak ada klaim superioritas kausal atau populasi. Departemen yang benar menurut mapping bukan kewenangan dunia nyata; saran departemen LLM berbeda empat kali. Confidence bukan probabilitas terkalibrasi. Ketersediaan/harga gratis dari katalog tidak membuktikan debit akun nol. Tidak ada verifikasi operasi produksi end-to-end.

## Kesimpulan terbatas

Sistem menjalankan 27 request eksploratori sintetis dan semua keluar valid; kategorinya cocok dengan label AI provisional, sedangkan empat saran departemen tidak sejalan mapping internal. **Belum ada bukti untuk menyatakan kinerja ilmiah pada data warga, keunggulan LLM, atau kesiapan artikel GARUDA.** Langkah penting berikutnya: dataset berizin, label manusia independen, pengujian lintas kondisi, pemeriksaan biaya, dan uji persistensi DB disposable dengan izin.

## Referensi yang diperiksa

1. Sokolova, M., & Lapalme, G. (2009). *A systematic analysis of performance measures for classification tasks*. Information Processing & Management, 45(4), 427–437. https://doi.org/10.1016/j.ipm.2009.03.002
2. Artstein, R., & Poesio, M. (2008). *Inter-Coder Agreement for Computational Linguistics*. Computational Linguistics, 34(4), 555–596. https://doi.org/10.1162/coli.07-034-R2
3. Cohen, J. (1960). *A Coefficient of Agreement for Nominal Scales*. Educational and Psychological Measurement, 20(1), 37–46. https://doi.org/10.1177/001316446002000104
4. Bender, E. M., & Friedman, B. (2018). *Data Statements for Natural Language Processing: Toward Mitigating System Bias and Enabling Better Science*. Transactions of the Association for Computational Linguistics, 6, 587–604. https://doi.org/10.1162/tacl_a_00041

Referensi mendukung prinsip pengukuran/anotasi/dokumentasi data, **bukan** klaim bahwa LLM ini lebih baik pada SIPW. Tidak ada kutipan hasil penelitian terdahulu yang diada-adakan.
