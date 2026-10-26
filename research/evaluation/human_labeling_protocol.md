# Protokol pelabelan manusia independen — rancangan, belum dieksekusi

Tujuan: membangun referensi label yang dapat dipertanggungjawabkan untuk **dataset baru**, bukan mengganti metadata dua AI pada `final_candidate_v2/rater_{A,B}_completed.json`. Jangan menyebut dua AI terdahulu sebagai penilai manusia. Bekukan rubrik ini **sebelum** manusia melihat prediksi dan sebelum eksperimen final.

## Persiapan dan privasi

1. Setujui sumber data, hak pemakaian, periode/populasi dan prosedur anonimisasi. Lepaskan nama, nomor telepon/NIK, alamat tepat/koordinat, gambar identitas serta rincian yang memungkinkan re-identifikasi; audit manual sebelum berbagi dengan penilai atau provider. Untuk data asli, simpan berkas sumber di lokasi akses-terbatas (bukan Git publik) dan buat versi penelitian ber-ID acak, provenance serta log transformasi. Jika hanya sintetis, nyatakan pembuat, tanggal, prompt/aturan pembangkitan dan bahwa tidak ada representativitas warga.
2. Ciptakan `sample_id` stabil; judul/deskripsi tetap sama pada paket A, B, baseline dan LLM. Pertahankan tipe kasus normal, informal, typo, ambigu, incomplete, multicategory, out_of_scope; jangan paksa semua kasus dapat dilabel tunggal tanpa flag. Audit duplikasi exact dan kemiripan semantik lintas split. Bekukan hash file sumber/paket dan skema versi baru; jangan ubah sampel setelah terlihat hasilnya.
3. Rekrut **dua manusia berbeda**, tidak terlibat membuat kandidat/menyetel prompt bila memungkinkan; deklarasikan relasi, kompetensi bahasa Indonesia dan pengetahuan yurisdiksi. Penilai tidak menerima `ground_truth_category` buatan AI, hasil eksperimen, baseline atau jawaban satu sama lain. Beri hanya teks anonim, kode kategori, pedoman, dan formulir kosong. Urutan sampel acak tetap dicatat, ID stabil. Catat tanggal mulai/selesai dan versi pedoman per penilai.

## Pedoman kategori utama (satu label + status kepastian)

| Kode | Dasar keputusan dari masalah dan tindakan utama |
|---|---|
| `sampah` | pengumpulan/pengangkutan sampah, limbah, kebersihan |
| `jalan_rusak` | kerusakan permukaan jalan, trotoar atau jembatan |
| `banjir` | genangan/luapan saluran, drainase saat hujan |
| `listrik` | pasokan listrik, kabel, lampu jalan/penerangan |
| `air_bersih` | distribusi, kualitas, tekanan atau kebocoran air layanan |
| `keamanan` | ketertiban, ancaman, pemalakan, kebutuhan patroli |
| `kesehatan` | pelayanan dan fasilitas kesehatan publik |
| `pendidikan` | fasilitas dan pelayanan belajar/sekolah |
| `lainnya` | urusan administrasi umum/di luar taksonomi atau masalah tidak dapat ditentukan **setelah** pemeriksaan teks |

Tentukan berdasarkan keluhan serta permintaan tindakan yang eksplisit, bukan kemunculan kata kunci saja. Salah eja/informal tetap dikategorikan bila makna jelas. Lokasi sekolah tidak otomatis `pendidikan` bila masalah utama adalah banjir; gejala air perpipaan dan sanitasi kesehatan dibedakan menurut tindakan yang diminta. `lainnya` bukan hadiah untuk keluaran model invalid. Pada multi-masalah, tentukan utama dari permintaan dan dampak yang eksplisit; catat kategori sekunder terpisah. Jika dua masalah sama penting tanpa dasar memilih, beri `uncertain=true`, kandidat label dan alasan; boleh `unresolved` untuk adjudikasi, jangan memaksa label hanya demi distribusi seimbang. Teks sangat tidak lengkap diberi flag insufficient; bila domain tetap jelas, pilih domain itu. Di luar tugas pengaduan SIPW diberi `lainnya` dengan `out_of_scope=true`.

## Departemen, prioritas, dan field paket

Simpan **dua** target berbeda: (a) `department_mapping_reference` diturunkan dari tabel mapping kategori SIPW (sampah→DLH; jalan_rusak/banjir/air_bersih→PUPR; listrik→DISHUB; keamanan→SATPOLPP; kesehatan→DINKES; pendidikan→DISDIK; lainnya→KELURAHAN); (b) `department_substantive_label` diputuskan manusia berkompetensi lokal berdasar kewenangan aktual atau `unresolved/not_applicable`. Jangan turunkan (b) otomatis dari (a); PLN/PDAM misalnya dapat berbeda kewenangannya. Bekukan daftar OPD dan masa berlakunya. Penilai boleh mencatat kategori sekunder; **jangan** hitung metrik sekunder sebelum sengketa selesai. Prioritas hanya bila rubrik terpisah berbasis bahaya/dampak dan penilaiannya disetujui; bukan benar hanya karena field model terisi.

Minimal per baris: `sample_id`, `primary_category` atau `unresolved`, `secondary_categories`, `uncertain`, `insufficient_information`, `out_of_scope`, `department_substantive_label` atau null, `department_label_origin`, `rationale`, `guideline_version`, `rater_code`, `labeled_at`. Jangan menyimpan identitas pribadi penilai dalam Git publik; tabel pseudonim↔identitas disimpan aman oleh peneliti. Form A/B dibuat tanpa label AI atau prediksi; jawaban A dan B disimpan terpisah dan immutable.

## Agreement dan adjudikasi

1. Validasi hash/ID/text, kelengkapan, enum dan provenance setiap paket tanpa membandingkan dengan hasil LLM. Sebelum adjudikasi hitung raw agreement kategori dan confusion A×B; Cohen's kappa bila distribusi/ketentuan memungkinkan, sertakan marginals, N, interval ketidakpastian dan keterbatasan prevalensi. Kesepakatan 100% bukan bukti kebenaran; jangan menyebutnya kappa manusia dari dua berkas AI lama. Hitung agreement departemen substantif hanya pada sampel eligible dan tandai alasan eksklusi; secondary dianalisis terpisah sebagai set.
2. Simpan daftar semua perbedaan: kategori utama, department substantive, ketidakpastian, sekunder, dan alasan. Penilai dapat berdiskusi setelah hasil individual dikunci; adjudikator manusia ketiga (preferensi: ahli domain lokal) menetapkan satu referensi dengan rasional, tanpa melihat prediksi model/baseline. Konflik tanpa dasar yang memadai tetap `unresolved` dengan aturan penilaian (abstention) yang **dibekukan sebelum** menghitung hasil. Jangan mengubah label agar cocok prediksi.
3. Gold final berupa file **baru** dengan hash dataset, hash jawaban A/B, ID/rationale adjudicator, status tiap sampel (`agreed`, `adjudicated`, `unresolved`), field mapping vs substantif dan timestamp. Simpan perubahan setelah freeze sebagai versi baru yang memicu analisis ulang; jangan menimpa rater raw, dataset eksploratori atau mencampur label AI dengan label manusia.

**Gerbang belum dipenuhi:** dua manusia, sumber data/izin privasi, adjudikator, jumlah sampel dan versi dataset. Tanpa itu label tetap provisional; jangan jalankan/namai eksperimen sebagai validasi ilmiah final.
