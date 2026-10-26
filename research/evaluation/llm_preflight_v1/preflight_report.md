# Laporan Akhir Tahap Persiapan Eksperimen LLM (Preflight Report v1)

**Judul Penelitian**:  
*“Evaluasi Kinerja Large Language Model untuk Klasifikasi Otomatis Pengaduan Warga pada Sistem Informasi Pengaduan Berbasis Web”*

**Tanggal Pelaksanaan**: 26 Oktober 2026  
**Status Akhir**: **NOT READY (LIVE EXPERIMENT BLOCKED)**  
**Lokasi Penyimpanan**: `research/evaluation/llm_preflight_v1/`

---

## 1. Status Audit Baseline Kata Kunci (Tahap 1)

Audit baseline pada dataset final terbekukan (`synthetic_final_v1`) telah selesai dilaksanakan secara independen dan dicatat dalam [`research/evaluation/audit_baseline_v1/`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/evaluation/audit_baseline_v1/):
- **Integritas Dataset**: Tepat 270 narasi pengaduan terdistribusi seimbang (30 sampel per kategori pada 9 kelas layanan) yang berasal dari 55 keluarga skenario kejadian inti.
- **Integritas Hash**: Seluruh checksum SHA-256 (registri, dataset, manifest, protokol beku, scoring contract) terverifikasi 100% cocok tanpa perubahan byte sedikit pun.
- **Hasil Hitung Ulang Baseline**:
  - Sampel Cocok (True Positive): **178 sampel**
  - Sampel Tidak Cocok (False Positive / False Negative): **92 sampel**
  - **Akurasi**: **65,93%** (178 / 270)
  - **Macro Precision**: **81,87%** (0,818669)
  - **Macro Recall**: **65,93%** (0,659259)
  - **Macro F1-Score**: **64,02%** (0,640177)
- **Kesesuaian dengan Naskah Artikel Ilmiah**: Ditemukan **0 perbedaan (100% konsisten)** antara hasil hitung ulang matematis dan data pada naskah artikel ([`research/manuscript/artikel_ilmiah_final_v1.md`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/manuscript/artikel_ilmiah_final_v1.md)).

---

## 2. Hasil Pengujian Runner Evaluasi Offline (Tahap 3)

Pengujian offline engine evaluasi mandiri ([`research/evaluation/llm_preflight_v1/runner.cjs`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/evaluation/llm_preflight_v1/runner.cjs)) dijalankan sepenuhnya menggunakan mock lokal tanpa koneksi jaringan:
- **Suite Runner (`runner.test.cjs`)**: **7 pengujian lulus, 0 gagal (100% pass)**.
  - Memvalidasi skema ketat 7-field (`category`, `secondaryCategories`, `suggestedDepartment`, `suggestedPriority`, `reason`, `confidence`, `needsHumanReview`).
  - Memisahkan secara presisi: *pure JSON* vs *recovered markdown* vs *unparseable text*.
  - Memisahkan 4 jenis galat: error transport jaringan, error parsing, error ketidaksesuaian skema, dan misklasifikasi semantik.
  - Memverifikasi penghentian terminal (*terminal halt*) seketika pada kegagalan transport (simulasi HTTP 429) dengan pencatatan status `UNATTEMPTED_DUE_TO_HALT` untuk menjaga denominator 270 sampel.
  - Memverifikasi checkpointing inkremental bebas replay (sampel yang selesai tidak dipanggil ulang).
  - Memverifikasi redaksi rahasia kredensial dan penghapusan atribut sensitif.
- **Suite Scoring Terbekukan (`scoring_v1.test.cjs`)**: **6 pengujian lulus, 0 gagal**.
- **Suite Otorisasi Guard (`evaluation_guard_v1.test.cjs`)**: **4 pengujian lulus, 0 gagal**.
- **Total Pengujian Unit Evaluasi**: **17 pengujian lulus dari 17 skenario (0 gagal)**.

---

## 3. Status Verifikasi Provider dan Jaminan Biaya (Tahap 2)

Pemeriksaan konfigurasi adapter Kios API (`backend/config/kiosApi.js`) menghasilkan temuan kritis:
- **Provider & Model**: Kios API (`https://kiosapi.com/v1`), model ID permintaan: `minimax-m3.1-flash-free`.
- **Snapshot Versi**: Unpinned / tidak disediakan oleh provider. Respons rawan menutupi model riil dengan alias permintaan jika atribut `model` dikosongkan.
- **Jaminan Biaya Nol (Rp0)**: **TIDAK TERBUKTI**. Tidak ada bukti akun aktif, dasbor penagihan, atau mekanisme server-side provider yang menjamin bahwa saldo akun terkunci dari pemotongan (nol debit). Menarik kesimpulan gratis semata-mata dari label `free` dilarang.
- **Celah Kode Produksi**: Pada `kiosApi.js:112–122`, blok percabangan `if (!isFreeDesignated)` kosong tanpa instruksi penolakan error, sehingga adapter produksi rentan meloloskan model komersial berbayar.
- **Risiko Privasi Data**: Dataset pengujian 100% sintetis sehingga bebas risiko privasi. Namun, untuk implementasi produksi masa depan, pengiriman teks pengaduan riil warga ke LLM cloud komersial pihak ketiga menghadirkan risiko pelanggaran UU PDP yang wajib dimitigasi dengan anonimisator lokal atau model on-premise.

---

## 4. Batas Permintaan yang Berlaku dan Rencana Eksekusi

- **Batas Harian Lokal**: `kiosApi.js:33–35` menetapkan limit maksimal 200 request/hari dalam memori.
- **Benturan Kuota**: Dataset pengujian memiliki 270 sampel, melampaui limit lokal sebesar 70 sampel jika dijalankan sekaligus.
- **Solusi Penjadwalan Terverifikasi**: Disiapkan rencana eksekusi 2 hari pada [`experiment_plan.md`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/evaluation/llm_preflight_v1/experiment_plan.md):
  - *Sesi 1 (Hari 1)*: 150 sampel (`SIPW-SYN-0001` s.d. `SIPW-SYN-0150`), jeda pengiriman >= 10 detik.
  - *Jeda Sinkronisasi*: Menunggu reset tanggal UTC alami (tanpa merestart server).
  - *Sesi 2 (Hari 2)*: 120 sampel tersisa (`SIPW-SYN-0151` s.d. `SIPW-SYN-0270`).

---

## 5. Hambatan yang Masih Tersisa (Remaining Blockers)

Lima blocker substantif masih berstatus **OPEN**:
1. **B01 (Model Version Pinning)**: Ketiadaan snapshot versi tetap dari provider Kios API.
2. **B02 (Zero-Debit Guarantee)**: Ketiadaan bukti independen akun yang menjamin pengeluaran Rp0.
3. **B03 (Production FREE_ONLY Flaw)**: Celah logika percabangan kosong pada adapter produksi.
4. **B06 (Multi-Day Schedule Approval)**: Penjadwalan 2 hari belum disetujui bersama kuota provider.
5. **B08 (Explicit Live Approval)**: Persetujuan live tertulis eksplisit dari peneliti belum diberikan.

---

## 6. Keputusan Akhir dan Rekomendasi

### **Status Keputusan: NOT READY**
Sesuai aturan keselamatan eksekusi:
- **0 request dikirimkan ke provider LLM** pada tahap ini.
- Tidak ada data prediksi LLM yang dikarang atau diproyeksikan.
- Persiapan runner offline, protokol audit, kontrak scoring, dan rencana eksperimen telah selesai dan terverifikasi secara matematis dan perangkat lunak.
- Tahap eksekusi live baru dapat dipertimbangkan setelah peneliti menyediakan bukti tarif akun Rp0 dan memberikan persetujuan live eksplisit.
