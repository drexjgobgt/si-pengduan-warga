# Skema dataset v1 (belum dibuat)

Format JSON UTF-8 disarankan; CSV boleh dengan array sebagai JSON string. Null bukan string "unavailable" untuk field nullable; status availability tersendiri.

| Field | Aturan |
|---|---|
| sample_id | unik, stabil, nonempty, contoh format SIPW-EVAL-0001 (format saja, bukan record terkumpul) |
| title | string nonempty sintetis/anonim, maksimum 200 karakter mengikuti skema DB |
| description | string nonempty sintetis/anonim |
| complaint_text | gabungan title dan description yang definisinya dibekukan |
| ground_truth_category | satu dari sembilan kategori audit |
| ground_truth_department | salah satu tujuh kode atau null jika belum dapat ditentukan |
| department_label_eligible | boolean dan alasan eligibility |
| sample_type | normal/informal/typo/ambiguous/incomplete/multicategory/out_of_scope |
| data_source | synthetic_researcher atau sumber berizin yang tercatat |
| label_validation_status | provisional/independent_double_labeled/adjudicated |
| split | dev/final |
| provenance_id | tautan proses pembuatan/izin, tanpa PII |
| secondary_ground_truth | optional array; jangan diasumsikan dari primary |
| priority_ground_truth | optional enum; perlu pedoman tersendiri |

Metadata pelabelan terpisah: label rater A/B, departemen, alasan, timestamp, adjudication, revision. Rater dibutakan terhadap prediksi. Validasi uniqueness, UTF-8, empty input, enum dan split overlap/hash sebelum request. Tidak ada data warga riil di artefak saat ini.
