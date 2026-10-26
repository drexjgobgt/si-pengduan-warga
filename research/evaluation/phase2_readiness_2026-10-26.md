# Kesiapan eksperimen final setelah pergantian model

Status: **BELUM SIAP UNTUK EKSPERIMEN FINAL / TIDAK ADA POST BARU PADA PEMERIKSAAN INI**. Dokumen ini tidak mengubah `experiment_plan.md` historis, dataset, label, atau hasil lama. Default operasional sekarang MiniMax, sedangkan pilot lama memakai DeepSeek; jangan menggabungkan hasil sebagai satu model/protokol.

## Pemeriksaan yang dilakukan

- `dataset.provisional.json`: SHA-256 `83e10dbb0c1ad260e64404bcf519bc68ca7949cec3c0a33b41c3387f0be32c52`; 27 kandidat sintetis: 9 `dev`, 18 `pilot_candidate`, **0 final**; semua label `provisional`.
- `labeling_packets/rater_A.json` dan `rater_B.json`: masing-masing 27 sampel, hash dataset cocok, `completed=false`, 0 label kategori terisi. Dua penilai independen belum tersedia. Jangan mengisi keduanya dengan keluaran satu AI/penilai dan mengklaim independensi.
- Folder `live_pilot_retry_v2/` sudah tidak memiliki `.lock` atau `.pending` saat pemeriksaan. Menjalankan `node research/evaluation/analyze_pilot.cjs` berhasil dan menulis **folder baru** `pilot_analysis/` tanpa menimpa raw lama; perintah tidak memanggil provider, database, atau memodifikasi produksi. Output berisi `results_summary.json`, `predictions.csv`, `attempts.json`, `metrics_by_category.csv`, `confusion_matrix.csv`, `department_results.csv`, `error_analysis.md`. Tidak ada screenshot baru.
- Rekalkulasi pilot *lama* DeepSeek dari file attempt tersimpan: 18/18 sampel diattempt, 34 attempt (16 retry), 12 sampel berstatus sukses; 6/34 keluaran strict-valid, 22/34 attempt gagal dan 18/34 timeout. Keluaran sistem akhir cocok 12/18 label **provisional**; macro F1 0.674074. Baseline keyword lama pada sampel yang sama cocok 13/18; macro F1 0.696296. Ini **bukan** eksperimen MiniMax, bukan label independen, bukan bukti superioritas metode; mixed retry/no-retry juga membatasi interpretasi. Sumber dan denominator lengkap: `pilot_analysis/results_summary.json`, manifest dan file attempt terkait. Tidak mengklaim nilai ini hasil uji dalam sesi pergantian model; yang dilakukan di sini adalah **rekomputasi offline** dari attempt yang sudah ada.
- Pilot pemilihan MiniMax terpisah pada 9 sampel `dev`: 9/9 respons valid/cocok label provisional, bukan test final, tidak mengukur variasi informal/typo/ambigu secara representatif; lihat `model_switch_pilot.md`.

## Gerbang berikutnya (belum terpenuhi)

1. Bekukan dataset **final baru** yang terpisah dari 27 kandidat yang sudah dipakai/dev/pilot, dengan provenance, variasi tujuh tipe kasus, pemeriksaan PII, dan hash. Jangan memindahkan sampel yang sudah diekspos ke split final lalu mengklaim holdout baru.
2. Dua manusia menilai secara independen tanpa melihat prediksi, dengan adjudication untuk konflik; bila hanya satu penilai tersedia, nyatakan studi eksploratori dengan label belum tervalidasi. Departemen substantif perlu penilai domain atau diberi nama jelas 'mapping internal SIPW'.
3. Bekukan model `minimax-m3.1-flash-free`, prompt/katalog/parameter, timeout dan strategi retry versi baru. Protokol DeepSeek lama tidak dapat digunakan sebagai bukti MiniMax. Uji harness offline untuk sample ID/hash, raw/final, timeout, checkpoint, dan denominators; tidak menulis DB produksi.
4. Ajukan persetujuan **baru** untuk jumlah sampel final, jumlah request, repeat/retry, batas uang Rp0 dan batas waktu. Izin 27 request sebelumnya khusus pilot pemilihan model dan **tidak** menjadi izin eksperimen final. Verifikasi kembali Free-Pro dan kuota/rate limit aktual sebelum POST.
5. `research/evaluation/predictions.csv` dan `results_summary.json` di akar tidak dibuat sampai eksperimen final berjalan. Jangan menyalin metrik pilot ke file final atau membuat screenshot sintetik sebagai bukti.

## Perubahan yang diusulkan, belum dijalankan

Buat dataset final baru dan paket pelabelan manusia pada folder versi baru, tanpa menimpa `dataset.provisional.json` atau template lama. Setelah label dan izin kuota final tersedia, jalankan harness terisolasi dengan MiniMax dan hitung ulang metrik final; barulah hasilnya dimasukkan ke laporan penelitian dan bahan artikel. Sampai itu terjadi, laporan dan kesimpulan performa final belum dapat ditulis secara sah.
