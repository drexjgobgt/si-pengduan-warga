# Desain dataset evaluasi sintetis SIPW — rancangan v1

Status: **perencanaan offline**, belum ada dataset baru, prediksi baru atau persetujuan live. Target skenario bukan ground truth manusia. Tidak ada rencana data warga nyata atau anotator manusia pada tahap ini. Evaluasi dapat mengukur kepatuhan model terhadap spesifikasi skenario sintetis, bukan mengestimasi akurasi populasi pengaduan warga.

## 1. Audit sumber label dan pemisahan jenis acuan

Arsip `final_candidate_v2/dataset.candidate.json` berisi 27 teks sintetis dan label pembuat AI; `rater_A_completed.json` (pseudonim null) serta `rater_B_completed.json` (pseudonim `AI_Provisional_Rater_B`) merupakan label dua AI berbeda menurut konfirmasi pengguna. **Tidak ditemukan bukti model pemberi label adalah Claude atau Gemini**; identitas vendor/model, versi, prompt serta kondisi blinding tidak terekam. Jangan menebak identitas dari gaya tulisan. Field template `purpose: Human independent rating` bukan provenance faktual. Target lama tidak boleh dinaikkan menjadi target-skenario independen secara retrospektif.

Target baru ditetapkan dari **spesifikasi kejadian dan aturan tugas sebelum narasi dibuat**, bukan voting AI atas narasi jadi. Independensi yang dituju hanyalah independensi dari prediksi classifier yang diuji, bukan independensi dari keputusan desain peneliti. AI dapat membantu merealisasikan narasi, tetapi keputusan skenario, bias pembuat, dan pemeriksaan konsistensinya tetap harus didokumentasikan. Target awal belum otomatis benar apabila narasi yang dihasilkan mengubah fakta/aksi; narasi demikian ditolak sebelum freeze.

## 2. Target-first: urutan yang direncanakan

1. Bekukan taksonomi dan aturan konflik; tulis `scenario_registry` berisi `scenario_id`, kejadian inti, objek/layanan, aksi utama, fakta wajib, distractor yang diizinkan, larangan fakta pembalik, `target_category`, `target_reason`, `rule_id`, `target_department_mapping`, `target_status`, versi/timestamp. Hash registri **sebelum** menyusun narasi. Jika belum dapat diputuskan, jangan memaksakan target.
2. Realisasikan narasi `title`/`description` dari fakta tersebut; jangan masukkan `target_category`, kode kelas, `rule_id`, atau ID skenario ke judul/deskripsi yang dikirim ke classifier. Nama kejadian alami seperti "sampah" boleh muncul, tetapi jangan menyisipkan "kategori saya adalah sampah". Catat pembuat/alat/versi, prompt pembangkitan jika ada, tanggal serta semua revisi. Tahap sekarang tidak membangkitkan teks melalui API.
3. Terapkan variasi bahasa tanpa mengubah inti/aksi. Bekukan pengelompokan keluarga skenario. Tidak ada varian keluarga final di dev; jangan pilih hanya kalimat yang mudah bagi LLM atau memuat keyword baseline.
4. Validator offline menguji skema/ID/enum, panjang judul <=200, nonempty, duplikasi/PII semu; pemeriksaan konsistensi terstruktur membandingkan kejadian, aksi dan fakta narasi dengan registry (negasi, pelaku, objek, prioritas masalah, petunjuk kategori). Kesepakatan dua AI opsional hanya diagnostik, bukan pengganti bukti konsistensi target. Pemeriksaan semantik otomatis tidak menjamin benar; simpan aturan/checklist dan tingkat ketidakpastian.
5. Setiap teks mendapat `eligible`, `needs_review` atau `excluded_pre_freeze`, dengan alasan, versi dan hasil check. Fakta tidak sesuai registry → revisi narasi **sebelum** freeze dengan jejak audit, bukan ubah target agar cocok prediksi. Konflik tak terurai → karantina. Semua penolakan/rekonstruksi disimpan; distribusi eligible dilaporkan dan tidak dibenahi setelah melihat hasil model.
6. Freeze registry, teks, target, eligibility, daftar eksklusi, urutan eksekusi, source code, dan hash. Classifier maupun baseline tidak melihat target atau riwayat check. Sesudah prediksi tersedia, target tidak boleh diubah; kesalahan desain yang ditemukan dilaporkan dan hanya dapat dianalisis sebagai dataset versi baru, dengan sensitivitas terhadap versi asal tetap tersedia.

## 3. Aturan kategori dan konflik

| Rule | Kategori target | Fakta/aksi inti |
|---|---|---|
| C01 | sampah | pengumpulan/pengangkutan limbah, kebersihan; bukan banjir hanya karena lokasi dekat saluran |
| C02 | jalan_rusak | kerusakan permukaan jalan/trotoar/jembatan, aksi perbaikan lintasan |
| C03 | banjir | genangan/luapan drainase, aksi memulihkan aliran/pengendalian genangan |
| C04 | listrik | pasokan/jaringan listrik atau penerangan, aksi pemeriksaan/pengamanan listrik |
| C05 | air_bersih | pasokan, tekanan/kualitas atau kebocoran jaringan air layanan |
| C06 | keamanan | ancaman, pemalakan, gangguan ketertiban, aksi patroli/penertiban |
| C07 | kesehatan | pelayanan/fasilitas kesehatan; bukan sekadar lokasi dekat klinik |
| C08 | pendidikan | pelayanan/fasilitas pembelajaran; bukan semua kejadian di sekolah |
| C09 | lainnya | administrasi umum di luar delapan domain; di luar tugas; atau tidak cukup petunjuk memilih domain |

R01: utamakan masalah/aksi yang eksplisit diminta, bukan urutan kata atau lokasi. R02: multi-masalah tanpa dominasi → `needs_review`; bila benar-benar tak terpilih dan konsisten dengan instruksi produksi "ambigu → lainnya", target `lainnya` harus ditetapkan sebagai **aturan tugas** sebelum teks, bukan fakta ontologis tunggal. R03: informasi waktu/lokasi yang kurang tidak otomatis `lainnya` jika domain/aksi masih jelas. R04: negasi dan keluhan yang hanya dikutip tidak mengalahkan keluhan utama. R05: bila dua aturan tetap bertentangan dan `lainnya` pun tidak dibenarkan, keluarkan dari set kategori utama sebelum freeze dan laporkan di challenge set deskriptif, bukan dibuang setelah gagal.

Mapping departemen internal: sampah→DLH; jalan_rusak/banjir/air_bersih→PUPR; listrik→DISHUB; keamanan→SATPOLPP; kesehatan→DINKES; pendidikan→DISDIK; lainnya→KELURAHAN. Ini label deterministik mapping aplikasi, **bukan kebenaran kewenangan substantif**; tidak ada evaluasi yurisdiksi tanpa acuan tambahan.

## 4. Ukuran dan distribusi yang diusulkan

**Usulan utama: 270 sampel evaluasi eligible, 30 per kategori**, bukan data yang sudah dibuat. Ini anggaran cakupan taksonomi/variasi, bukan perhitungan power yang menjamin kesimpulan umum. Dengan 3/kategori pada studi lama, satu kesalahan mengubah recall kelas ~33,3 poin persentase; pada 30/kategori masih ~3,3 poin. Parafrasa satu skenario tidak setara dengan observasi independen. Tidak mengutip CI populasi warga dari sampel purposif ini.

Untuk delapan kelas domain (240 sampel): per kelas 5 formal, 5 informal, 5 typo, 5 ambigu-terkendali dengan aksi pembeda yang cukup, 5 incomplete dengan domain jelas, 5 multicategory dengan aksi utama eksplisit. Untuk `lainnya` (30): 5 formal administrasi, 5 informal administrasi, 5 typo administrasi, 5 ambigu tanpa dominasi menurut R02, 5 incomplete tanpa petunjuk domain, 5 out_of_scope. Total tipe utama: formal 45, informal 45, typo 45, ambigu 45, incomplete 45, multicategory 40, out_of_scope 5. Kelompok out_of_scope hanya lima masih terbatas; jangan klaim deteksi OOD yang kuat. Multi-masalah setara dapat berupa tag tambahan pada lainnya ambigu, bukan dipaksakan ke setiap kelas.

Setiap sel 5 menggunakan lima kejadian inti berbeda (bukan lima sinonim template yang sama). Variasi formal/informal dapat tetap berhubungan semantik; catat family_id dan analisis per keluarga. Data dev baru **opsional 18** (dua/kelas, keluarga terpisah) hanya untuk uji harness/rubrik offline; bukan bagian 270 dan **0 POST dev** dalam estimasi utama. Jika eligible kurang dari target setelah QA, laporkan kekurangan dan putuskan penambahan sebelum freeze; tidak otomatis membuat pengganti setelah melihat model.

## 5. Pencegahan kebocoran

Bandingkan terhadap `dataset.provisional.json` lama (lokal, 27 dev/pilot), `final_candidate_v2/dataset.candidate.json` (27 sudah diuji), prompt/contoh produksi dan test. Exact dedup setelah normalisasi Unicode/case/whitespace/punctuation, plus token-shingle similarity dengan ambang usulan Jaccard >=0,70 untuk **ditinjau**, bukan bukti identik; ubah ambang hanya sebelum freeze. Audit kemiripan keluarga/kejadian meski string beda. Jangan mengirim ke API embedding; rencana offline saja. Data yang terpapar saat pemilihan model tetap development meski targetnya dinilai ulang.

## 6. Artefak baru yang direncanakan, belum dibuat

Folder baru `research/evaluation/synthetic_final_v1/`: registry skenario, rules/version, teks final, target labels terpisah, manifest/hash, QA/exclusion log, dev-family mapping. Target diberi provenance `scenario_rule_target`, bukan `human_ground_truth` atau `independent_human_labels`. Tidak ada dataset, screenshot atau angka hasil baru di tahap perencanaan ini. Persetujuan desain/ukuran/checklist diperlukan sebelum pembuatan dan freeze; persetujuan live terpisah sesudah QA selesai.
