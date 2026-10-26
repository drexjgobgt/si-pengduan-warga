# Hasil baseline historis pada kandidat pilot provisional

Eksekusi aktual: 2026-10-26T05:25:55Z. Ini baseline keyword lokal, bukan hasil LLM. Label dan teks dibuat AI, belum independen tervalidasi. Tidak ada request provider atau write database.

## Reproduksi
Perintah `node research/evaluation/baseline_pilot.cjs` mengekstrak source historis dari commit `8d669965ac6048cf1af9abed470b49e7cad0def8`, memverifikasi blob `4cbbb9f8b0aebd27915ff1b700730017c61d4d2f`, menjalankan classifyComplaint historis tanpa modifikasi pada complaint_text (judul + newline + deskripsi). Salinan persis source, hash, prediksi dan metrik tersimpan dalam direktori ini; tidak memuat dependensi/database historis. Eksekusi ulang ke path sama ditolak untuk mencegah overwrite. Perhitungan metrik dapat dijalankan ulang tanpa prediksi baru dengan:

```powershell
node -e "const fs=require('node:fs');const {metrics}=require('./research/evaluation/baseline_pilot.cjs');console.log(JSON.stringify(metrics(JSON.parse(fs.readFileSync('./research/evaluation/baseline_pilot/predictions.json'))),null,2));"
```

`node --test research/evaluation/metrics.test.cjs`: 3 test pass, 0 fail/skipped/cancelled; duration_ms 80.1776. Menguji perfect prediction, denominator error/zero support macro, penolakan invalid label. Belum mendukung sentinel raw/no-prediction untuk metrik live.

## Hasil deskriptif
- N=18, masing-masing 2 kandidat/kategori pada split pilot_candidate.
- Cocok label provisional: 13/18; tidak cocok: 5/18.
- Accuracy: 0.7222222222 (72.22%).
- Macro F1 sembilan kategori, zero_division=0: 0.6962962963.
- Precision/recall/F1 per kategori dan confusion matrix lengkap di summary.json; denominator seluruh 18 kandidat, tidak ada sampel dibuang.

## Lima ketidakcocokan aktual
| sample_id | Label provisional | Prediksi keyword |
|---|---|---|
| SIPW-CAND-0010 | sampah | lainnya |
| SIPW-CAND-0015 | keamanan | lainnya |
| SIPW-CAND-0018 | lainnya | jalan_rusak |
| SIPW-CAND-0023 | air_bersih | banjir |
| SIPW-CAND-0024 | keamanan | lainnya |

Contoh aktual kandidat 0018: “Ada masalah di dekat balai, keadaannya tidak seperti biasanya. Saya belum bisa menjelaskan apa yang rusak atau layanan yang terganggu.” Keyword `rusak` tetap memicu jalan_rusak walaupun teks tidak menyatakan objek jalan rusak; baseline memberi confidence heuristik 95. Kandidat 0023 tentang air jaringan perpipaan berbau diprediksi banjir; periksa collision kata air pada kamus dan aturan tie-breaking historis. Kandidat 0010 memakai bekas jualan/bak penampungan, bukan kata sampah eksplisit; prediksi lainnya dengan confidence 0. Interpretasi ini hipotesis mekanisme kode, bukan validasi manusia label.

Jangan memperbaiki kamus atau label berdasarkan error ini lalu melaporkan kandidat yang sama sebagai evaluasi independen. Confidence baseline bukan confidence LLM dan tidak menggunakan mekanisme review produksi yang baru. Department agreement hanyalah mapping label kategori dan tidak membuktikan rekomendasi departemen independen. Tidak ada perbandingan LLM pada 18 kasus ini; tidak boleh disimpulkan LLM lebih baik.

## Status live
Pilot LLM 18 request/no retry belum dijalankan. Persetujuan melanjutkan dipakai untuk baseline lokal dan persiapan; harga/sisa kuota provider belum diketahui dan budget uang belum ditetapkan. Jangan menganggap model ID berakhiran free sebagai jaminan tidak ada biaya.
