# Provenance kandidat sintetis v1

Tanggal pembuatan: 26 Oktober 2026. Pembuat teks dan label provisional: AI agent dalam sesi evaluasi ini. Tidak mengambil pengaduan dari database, tidak memakai data warga, tidak mengirim permintaan model untuk membuat kandidat.

`dataset_candidates.cjs` memuat 27 kandidat yang ditulis eksplisit berdasarkan definisi kategori. `prepare_dataset.cjs` menghasilkan JSON dan manifest hash, tanpa randomisasi. Sembilan kasus normal ditetapkan sebagai dev; 18 lainnya sebagai pilot_candidate. Tidak ada split final; rencana 18 dev +126 final belum direalisasikan. Setiap kategori mempunyai tiga kandidat; distribusi variasi tidak seimbang. Tipe out_of_scope hanya pada lainnya karena memaksakan semua kelas mempunyai out_of_scope tidak logis. Kasus ambigu mempertahankan petunjuk domain bila tersedia; satu kasus tanpa petunjuk memakai lainnya. Keputusan tersebut masih perlu penilaian manusia.

Kolom ground_truth_category hanyalah nama kolom kontrak: nilainya label acuan PROVISIONAL, bukan ground truth independen terverifikasi. Departemen diturunkan dari mapping internal SIPW, bukan label instansi yang dinilai independen. Jangan gunakan hasil dept mapping untuk mengklaim pemahaman kewenangan nyata.

Kandidat dan label disusun tanpa menggunakan keluaran prediksi untuk memperbaiki label. Pembuat sudah mengetahui prompt produksi dan satu hasil smoke sebelumnya; karena itu blind independence tidak dapat diklaim. Perlu pemeriksaan kemiripan semantik dengan prompt/contoh smoke sebelum dataset final; teks yang tampak mirip tidak boleh diklaim holdout independen hanya karena string berbeda. Tidak menghapus sampel berdasarkan error.

Pemeriksaan otomatis: struktur/enum, ID dan teks unik lintas split, komposisi complaint_text, panjang title, allowlist sumber sintetis, heuristik nomor panjang/email. Heuristik PII bukan jaminan anonimisasi; review manual tetap diperlukan. Tidak mengumpulkan nama, kontak, NIK, koordinat atau alamat individual.

Urutan: authored candidates → labels provisional → prepare/hash → offline only. Tidak ada label manusia, adjudication, agreement/kappa atau evaluasi LLM final saat dokumen ini ditulis. Untuk penggunaan ilmiah, minimal dua penilai manusia memeriksa tanpa prediksi; simpan A/B/adjudication secara terpisah. Revisi final harus menjadi dataset versi baru, bukan overwrite kandidat ini.
