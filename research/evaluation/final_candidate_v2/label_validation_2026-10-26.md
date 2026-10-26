# Pemeriksaan berkas pelabelan completed

Status: **lengkap secara struktur, dua penilai adalah AI berbeda (dikonfirmasi pengguna), bukan dua penilai manusia**. Tidak ada label, dataset, atau jawaban penilai yang diubah. Tidak ada panggilan API klasifikasi atau penulisan database.

## Integritas

- Dataset kandidat: 27 sampel; SHA-256 `7d380e03ee535e9f340b678f8c82d0c32aecb6edf757171d781e031319c32bc7` sesuai `manifest.json` dan kedua berkas jawaban.
- `rater_A_completed.json`: `completed=true`, 27 ID unik cocok dengan dataset, teks sama, semua label kategori/departemen dan alasan terisi, enum valid. SHA-256 `436b293e6feeaa05eb805fdc78be4681d1488c67f153320f187f7ecbd2f523bb`. `rater_identity_pseudonym=null`.
- `rater_B_completed.json`: `completed=true`, 27 ID unik cocok dengan dataset, teks sama, semua label kategori/departemen dan alasan terisi, enum valid. SHA-256 `f78fb9c29aeb9179bcaddc8e15c0dbdb88e37d72e46acb8d5e55fb15bfaea3aa`. `rater_identity_pseudonym="AI_Provisional_Rater_B"`.
- Kategori utama: A dan B sepakat **27/27** sebagai kesepakatan *antar-dua-AI*, bukan inter-annotator agreement manusia. Departemen: **27/27**, tetapi labelnya berstatus `mapping` (pemetaan kategori internal), bukan penilaian yurisdiksi substantif independen. Semua 27 label kategori A cocok dengan label provisional pembuat dataset. Tanpa bukti blinding dari label pembuat dan prediksi, kesesuaian ini tidak menguatkan validitas ground truth.
- Kategori sekunder: **26/27** set sama. Konflik di `SIPW-EVAL-CAND-0009`: A memberi `["listrik"]`, B memberi `["listrik", "pendidikan"]`. Label utama keduanya `banjir`. Jangan menyelesaikan konflik dengan menyalin keputusan AI; perlu adjudikasi manusia dengan alasan tercatat bila metrik sekunder akan dihitung.

## Gerbang sebelum freeze/final

1. Pengguna mengonfirmasi A dan B adalah **dua AI berbeda**. Ini menjawab identitas jenis penilai tetapi tidak membuktikan bahwa kedua AI dibutakan dari label pembuat, prediksi model, atau satu sama lain. Jangan menyebut file `purpose: "Human independent rating"` sebagai fakta; itu teks template yang tidak cocok dengan asal jawaban aktual.
2. Perlakukan semua label sebagai **provisional AI**, termasuk 27 kesepakatan kategori utama. Untuk ground truth penelitian yang lebih kuat, dapatkan setidaknya dua penilai manusia yang berbeda pada paket buta baru; jangan menimpa kedua file completed. Jika hanya satu manusia tersedia, nyatakan keterbatasan dan jangan klaim double-label manusia.
3. Konflik kategori sekunder 0009 tetap belum terselesaikan; kesepakatan AI bukan adjudikasi manusia. Periksa kemiripan semantik dengan data pengembangan dan kemungkinan pengaruh contoh prompt. Jangan membekukan sebagai dataset final tervalidasi; `manifest.json::final_dataset_frozen` sekarang masih `false`.
4. Jika pengguna memilih eksperimen eksploratori menggunakan label provisional AI, buat protokol tersendiri dan mintalah persetujuan baru untuk jumlah request serta biaya. Jangan menyebut hasilnya akurasi terhadap ground truth independen atau menyalinnya sebagai hasil final artikel. Persetujuan pilot pemilihan model tidak berlaku untuk batch ini.

Belum ada akurasi model final, kappa antarpenilai manusia, screenshot baru, atau permintaan provider pada pemeriksaan ini.
