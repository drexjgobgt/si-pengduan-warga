# Evaluasi Kinerja Large Language Model (minimax-m3.1-flash-free)

**Tanggal Evaluasi**: 2026-10-26T11:04:25.099Z  
**Model**: `minimax-m3.1-flash-free`  
**Total Dataset**: 270 sampel terencana  
**Sampel Selesai**: 265 / 270  
**Sampel Dicoba**: 270 / 270  
**Prediksi Benar (Match)**: 265  
**Status Terminal**: SELESAI PENUH

---

## 1. Metrik Keseluruhan (Denominator P=270)

- **Akurasi Global**: 98.15% (265 / 270)
- **Macro Precision**: 100.00%
- **Macro Recall**: 98.15%
- **Macro F1-Score**: 99.04%
- **Tingkat Validitas Format (Strict Valid Rate)**: 98.15% (265 / 270)

---

## 2. Kinerja Per Kategori

| Kategori | Target (Support) | TP | FP | FN | Diprediksi | Precision | Recall | F1-Score |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `sampah` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| `jalan_rusak` | 30 | 29 | 0 | 1 | 29 | 100.00% | 96.67% | 98.31% |
| `banjir` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| `listrik` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| `air_bersih` | 30 | 27 | 0 | 3 | 27 | 100.00% | 90.00% | 94.74% |
| `keamanan` | 30 | 29 | 0 | 1 | 29 | 100.00% | 96.67% | 98.31% |
| `kesehatan` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| `pendidikan` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| `lainnya` | 30 | 30 | 0 | 0 | 30 | 100.00% | 100.00% | 100.00% |
| **Macro Average** | 270 | - | - | - | 265 | **100.00%** | **98.15%** | **99.04%** |

---

## 3. Matriks Konfusi

```
actual/predicted,sampah,jalan_rusak,banjir,listrik,air_bersih,keamanan,kesehatan,pendidikan,lainnya,__invalid__,__missing__,__no_prediction__,total
sampah,30,0,0,0,0,0,0,0,0,0,0,0,30
jalan_rusak,0,29,0,0,0,0,0,0,0,1,0,0,30
banjir,0,0,30,0,0,0,0,0,0,0,0,0,30
listrik,0,0,0,30,0,0,0,0,0,0,0,0,30
air_bersih,0,0,0,0,27,0,0,0,0,3,0,0,30
keamanan,0,0,0,0,0,29,0,0,0,1,0,0,30
kesehatan,0,0,0,0,0,0,30,0,0,0,0,0,30
pendidikan,0,0,0,0,0,0,0,30,0,0,0,0,30
lainnya,0,0,0,0,0,0,0,0,30,0,0,0,30

```
