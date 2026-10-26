# Rincian Hambatan yang Masih Tersisa (Remaining Blockers) — SIPW Preflight v1

**Tanggal Dokumentasi**: 26 Oktober 2026  
**Status Operasional**: **NOT READY (LIVE REQUESTS BLOCKED)**  
**Prinsip Tata Kelola**: Fail-Closed, Tidak Mengasumsikan Biaya Nol Tanpa Bukti Independen, Perlindungan Integritas Repositori Produksi.

---

## 1. Matriks Status Blocker

| ID Blocker | Komponen | Status Saat Ini | Kriteria Bukti untuk Penutupan (Closure Criteria) |
|---|---|:---:|---|
| **B01** | **Identitas & Versi Model Kios API** | **OPEN / NOT VERIFIED** | Diperlukan konfirmasi dokumentasi resmi atau respons gateway bahwa model `minimax-m3.1-flash-free` terikat ke versi bobot tertentu yang stabil (*pinned snapshot*), serta aturan penanganan jika gateway mengosongkan atribut `model`. |
| **B02** | **Tarif Akun, Kuota Token, & Jaminan Rp0** | **OPEN / NOT VERIFIED** | Diperlukan bukti sanitasi rekening aktif (tangkapan layar dasbor akun atau log penagihan resmi) yang membuktikan bahwa pemanggilan endpoint ini tidak mendebit saldo, tidak memiliki biaya tersembunyi, dan akun terkunci pada saldo Rp0 (*enforceable zero-debit restriction*). |
| **B03** | **Celah Penegakan FREE_ONLY di Produksi** | **OPEN (Produksi FAIL)** | Diperlukan perbaikan arsitektural pada `backend/config/kiosApi.js` baris 112–122 agar secara eksplisit melempar error (`throw Error('PAID_MODEL_BLOCKED')`) jika model non-free terpasang, bukan sekadar blok kosong. Perubahan ini memerlukan persetujuan eksplisit peneliti sebelum kode produksi dimodifikasi. |
| **B06** | **Jadwal Eksekusi Batas Provider & Lokal** | **OPEN / NOT VERIFIED** | Diperlukan persetujuan rencana penjadwalan dua hari (Sesi 1: 150 sampel, Sesi 2: 120 sampel) untuk menghormati batas lokal 200 request/hari pada `kiosApi.js:33–35` tanpa merestart server. |
| **B08** | **Persetujuan Live Tertulis Eksplisit** | **OPEN / BLOCKED** | Diperlukan persetujuan tertulis eksplisit dari peneliti setelah blocker B01, B02, B03, dan B06 ditutup secara substantif. |

---

## 2. Analisis Mendalam Tiap Blocker

### Blocker B01: Identitas dan Versi Model Provider
- **Kondisi Aktual**: Konfigurasi model pada `kiosApi.js:16` menggunakan string `minimax-m3.1-flash-free`. Pada saat pemanggilan API, gateway Kios API dapat mengubah implementasi model di balik alias tersebut tanpa pemberitahuan (*model drift*).
- **Risiko**: Ketidakterulangan ilmiah (*irreproducibility*). Model yang dievaluasi hari ini bisa berbeda perilakunya dengan model yang dievaluasi bulan depan jika bobot internal diperbarui oleh provider.
- **Tindakan Penyelesaian**: Mencatat keterbatasan ini secara eksplisit dalam artikel ilmiah atau meminta gateway menyediakan endpoint dengan identifier versi tetap (*pinned version snapshot*).

### Blocker B02: Jaminan Pengeluaran Nol (Rp0)
- **Kondisi Aktual**: Tidak ada bukti rekening aktif yang menunjukkan saldo awal, batasan tagihan maksimal Rp0, atau status bebas biaya untuk akun pengguna saat ini.
- **Risiko**: Pemotongan saldo tanpa disengaja atau timbulnya tagihan komersial liar apabila kuota promo habis di tengah eksperimen 270 sampel.
- **Aturan Keputusan**: Sesuai instruksi audit, "Jika pengeluaran wajib Rp0 tetapi tidak ada mekanisme yang dapat dipercaya untuk menjamin biaya nol, hentikan eksekusi dan laporkan blocker spesifik tersebut." Blocker ini adalah pemblokir utama yang mewajibkan status tetap `NOT READY`.

### Blocker B03: Celah Percabangan `FREE_ONLY` pada Adapter Produksi
- **Kondisi Aktual**: Pemeriksaan kode `backend/config/kiosApi.js` baris 112–122 membuktikan bahwa percabangan `if (!isFreeDesignated)` tidak memiliki aksi penolakan:
  ```javascript
  const isFreeDesignated = targetModel.includes("free");
  if (!isFreeDesignated && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
    // If user specifically provided a model without ':free' but set freeOnly=true,
    // allow if user explicitly configured it, but log a sanitized warning.
  }
  ```
- **Risiko**: Perlindungan `FREE_ONLY` pada kode produksi hanya berupa ilusi semantik; sistem produksi tidak memblokir model komersial berbayar.
- **Tindakan Penyelesaian**: Kode produksi saat ini sengaja tidak disentuh sesuai aturan wajib ("Jangan mengubah kode produksi"). Perbaikan harus disetujui secara terpisah dan diuji sebelum deployment.

### Blocker B06: Pembatasan Kuota Harian Lokal
- **Kondisi Aktual**: Pelacak memori pada `kiosApi.js:33–35` menetapkan limit 200 request/hari. Dataset pengujian memiliki 270 sampel.
- **Risiko**: Eksekusi 270 sampel dalam satu sesi akan terhenti di tengah jalan pada sampel ke-201 dengan galat `DAILY_LIMIT_EXCEEDED`.
- **Tindakan Penyelesaian**: Mengadopsi rencana penjadwalan multi-hari (150 sampel hari ke-1, 120 sampel hari ke-2) dengan runner durabel yang telah lulus uji inkremental.

---

## 3. Kesimpulan dan Rekomendasi Tindakan

Seluruh blocker di atas bersumber dari **faktor eksternal provider dan tata kelola akun**, bukan karena ketiadaan kode evaluasi lokal. Seluruh perangkat evaluasi offline (runner, validator, scoring contract, dan suite pengujian unit) telah siap 100%.

**Rekomendasi Langkah Berikutnya**:
1. Menjaga status operasional tetap **`NOT READY`** untuk pemanggilan jaringan.
2. Peneliti memeriksa dasbor akun Kios API untuk memverifikasi saldo, kuota, dan batasan penagihan Rp0.
3. Menyetujui rencana penjadwalan 2 hari (Sesi 1: 150 sampel, Sesi 2: 120 sampel) pada saat live experiment diizinkan.
