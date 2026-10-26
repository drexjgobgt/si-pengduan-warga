# Rencana Pelaksanaan Eksperimen LLM — SIPW Preflight v1

**Judul Penelitian**:  
*“Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web”*

**Status Dokumen**: **PERENCANAAN (NOT AUTHORIZED FOR EXECUTION)**  
**Peringatan Keras**: Dokumen ini merupakan rencana operasional yang hanya boleh dieksekusi setelah seluruh gerbang keamanan (B01, B02, B03, B06, B08) terpenuhi dan persetujuan eksplisit tertulis dari peneliti telah diberikan. Tidak ada request live yang dikirimkan pada tahap ini.

---

## 1. Tahap Uji Coba Terbatas (Pilot Smoke Test)

Sebelum menjalankan evaluasi pada seluruh 270 sampel, wajib dilaksanakan uji coba kecil (*smoke test*) terkontrol:

### 1.1 Spesifikasi Uji Coba
- **Ukuran Sampel**: Tepat 3 sampel terpilih dari famili kejadian independen (`SIPW-SYN-0001`, `SIPW-SYN-0031`, `SIPW-SYN-0061`).
- **Tujuan**: Memverifikasi respons aktual dari gateway provider Kios API secara end-to-end tanpa menghabiskan kuota besar.
- **Konfigurasi**: `temperature = 0.1`, `max_tokens = 500`, `response_format = { type: "json_object" }`.
- **Spacing Antar-Request**: Jeda minimal 15 detik antara request 1, 2, dan 3.

### 1.2 Kriteria Kelulusan Uji Coba (*Go/No-Go Decision*)
Uji coba dinyatakan **LULUS (GO)** jika dan hanya jika seluruh kriteria berikut terpenuhi secara simultan:
1. **Keberhasilan Transport**: Ketiga request menghasilkan kode status HTTP 200 OK.
2. **Kesesuaian Identitas Model**: Identifier model yang dikembalikan pada respons payload (`response.model`) cocok dengan allowlist model yang disetujui (bukan model berbayar yang tidak dikenal).
3. **Validitas Format (Strict Valid)**: Ketiga respons merupakan objek JSON murni (*pure JSON*) yang memenuhi seluruh 7 atribut skema wajib (`category`, `secondaryCategories`, `suggestedDepartment`, `suggestedPriority`, `reason`, `confidence`, `needsHumanReview`).
4. **Verifikasi Saldo Nol**: Rekonsiliasi saldo akun segera setelah uji coba 3 sampel selesai membuktikan bahwa saldo akun tidak berkurang sepeser pun (nol debit).
5. **Latensi Wajar**: Waktu respons tidak melebihi batas waktu 15 detik.

Apabila salah satu dari kelima kriteria di atas gagal, uji coba dinyatakan **GAGAL (NO-GO)** dan rencana evaluasi 270 sampel dibatalkan seketika.

---

## 2. Rencana Evaluasi 270 Sampel Terbekukan

Setelah uji coba terbatas dinyatakan lulus, evaluasi penuh dilaksanakan terhadap ke-270 sampel `synthetic_final_v1`:

### 2.1 Alokasi Batch dan Penjadwalan Lintas Hari
Mengingat batas kuota lokal SIPW adalah 200 request/hari (`KIOSAPI_DAILY_REQUEST_LIMIT` pada `kiosApi.js:33–35`), evaluasi 270 sampel dibagi menjadi dua sesi jadwal terpisah tanpa merestart server:

- **Sesi 1 (Hari 1)**:
  - Rentang Sampel: `SIPW-SYN-0001` s.d. `SIPW-SYN-0150` (150 sampel).
  - Jeda Pengiriman (*Spacing*): Minimal 10 detik antar-request (kecepatan maksimal 6 request/menit, sangat aman di bawah batas RPM standar).
  - Estimasi Durasi: 150 sampel × 10 detik = ~25 menit waktu aktif.
  - Sisa Kuota Harian Lokal: 50 request (tersedia sebagai buffer).
- **Jeda Sinkronisasi**:
  - Menunggu pergantian tanggal UTC (00:00 UTC) agar counter kuota lokal mereset secara alami dan aman.
- **Sesi 2 (Hari 2)**:
  - Rentang Sampel: `SIPW-SYN-0151` s.d. `SIPW-SYN-0270` (120 sampel).
  - Jeda Pengiriman: Minimal 10 detik antar-request.
  - Estimasi Durasi: 120 sampel × 10 detik = ~20 menit waktu aktif.

---

## 3. Penanganan Rate Limit dan Kebijakan Zero-Retry

- **Retry Otomatis = 0**: Sistem dilarang melakukan percobaan ulang otomatis (*zero auto-retry*) saat menghadapi respon HTTP 429 (Rate Limit) atau HTTP 5xx.
- **Pencegahan Banjir Permintaan**: Setiap kegagalan langsung memicu *terminal stop*. Tidak ada loop *exponential backoff* tak terbatas yang dapat memicu tagihan liar atau pemblokiran IP oleh provider.
- **Deduplikasi Durabel**: Sebelum mengirim request, runner membuat file reservasi kunci SHA-256 (`<key>.reservation.json`). Jika proses terhenti di tengah jalan, sampel yang telah tersimpan pada `<key>.result.json` tidak akan pernah dikirim ulang saat sesi kedua dijalankan.

---

## 4. Pencatatan Audit, Token, Biaya, dan Penggunaan Kuota

Setiap transaksi evaluasi wajib dicatat secara persisten ke dalam ledger hasil pengujian dengan metadata lengkap:
1. `sample_id` dan `target_category` dari registri terbekukan.
2. Timestamp presisi mulai (*dispatched_at*) dan selesai pemanggilan.
3. Durasi latensi jaringan presisi tinggi (`duration_ms` via `performance.now()`).
4. Kode status HTTP aktual dari provider.
5. Model ID yang dikembalikan oleh respons payload provider.
6. Penggunaan token riil: `usage.prompt_tokens`, `usage.completion_tokens`, dan `usage.total_tokens` jika disediakan oleh provider.
7. Respons teks mentah (*raw output*) sebelum dilakukan parsing normalisasi.
8. Status validitas skema (7-field validation).
9. Prediksi kategori akhir dan status kecocokan semantik terhadap target.

---

## 5. Prosedur Penghentian Darurat (Emergency Kill-Switch)

Runner evaluasi wajib segera menghentikan seluruh aktivitas pemanggilan jaringan (*immediate halt*) apabila terdeteksi salah satu kondisi berikut:
1. **Deteksi Biaya**: Saldo akun berkurang atau ada laporan biaya non-nol dari gateway.
2. **Error HTTP Kritis**: Menerima status HTTP 401 (Unauthorized), HTTP 402 (Payment Required), HTTP 403 (Forbidden), atau HTTP 429 (Too Many Requests).
3. **Penyimpangan Model (*Model Drift*)**: Model ID yang dikembalikan provider tidak cocok dengan model ID yang disetujui.
4. **Pelanggaran Deadline Total**: Waktu eksekusi aktif kumulatif melampaui batas anggaran 7.200 detik (2 jam).
5. **Kegagalan Integritas File**: Terjadi kegagalan penulisan disk, kerusakan lockfile, atau diskrepansi checksum.

Saat penghentian darurat terjadi, seluruh sisa sampel yang belum dipanggil otomatis dicatat sebagai `UNATTEMPTED_DUE_TO_HALT`. Hasil yang telah berhasil disimpan tetap dipertahankan secara utuh tanpa ada penghapusan file.

---

## 6. Penegasan Integritas Data Ilmiah

> [!IMPORTANT]
> Seluruh metrik evaluasi LLM yang akan dilaporkan dalam artikel ilmiah (Akurasi, Macro F1, Precision, Recall, Matriks Konfusi) **hanya boleh dihitung dari hasil eksperimen nyata yang tervalidasi**.
> 
> Tidak ada angka estimasi, angka proyeksi dari pilot lama, atau data sintetis buatan yang diizinkan untuk mengisi tabel hasil final. Jika eksperimen live terhenti secara parsial, laporan wajib menyajikan hasil parsial tersebut secara jujur beserta denominator sampel terencana (270 sampel).
