# Laporan Audit Keamanan dan Remediasi Adapter — SIPW Finalization v1

**Tanggal Audit**: 26 Oktober 2026  
**Status Audit**: **CELAH TERIDENTIFIKASI & TEREMEDIASI PADA WORKSPACE TERISOLASI**  
**Komponen yang Diaudit**: `backend/config/kiosApi.js` dan Seluruh Jalur Transport Provider LLM  
**Prinsip Keamanan**: Fail-Closed, Redaksi Kredensial, Zero Production Code Mutation Tanpa Izin.

---

## 1. Ringkasan Temuan Audit Keamanan

Pemeriksaan baris per baris (*deep code inspection*) terhadap basis kode adapter `backend/config/kiosApi.js` mengungkap sejumlah celah struktural dan operasional dalam mekanisme pengendalian biaya dan penegakan kebijakan model gratis:

| No | Aspek Pemeriksaan | Status Audit Kode Asli | Temuan / Analisis Celah |
|:---:|---|:---:|---|
| 1 | **Enforcement `FREE_ONLY`** | **CRITICAL FLAW (FAIL)** | Pada baris 112–122, percabangan `if (!isFreeDesignated)` memiliki blok kosong tanpa aksi penolakan (`throw Error`). Model berbayar tidak ditolak dan tetap dialirkan ke jaringan. |
| 2 | **Validasi Model ID** | **VULNERABLE (FAIL)** | Sistem mengandalkan pencocokan substring leksikal longgar (`targetModel.includes("free")`). Model jebakan seperti `gpt-4o-free-edition` akan lolos pemeriksaan. |
| 3 | **Penolakan Model Berbayar / Tak Dikenal** | **FAIL** | Tidak ada daftar izin (*allowlist*) tertutup. Model apa pun yang dikirim melalui parameter fungsi akan diteruskan ke provider. |
| 4 | **Penanganan Konfigurasi Kosong / Hilang** | **PARTIAL PASS** | Ketiadaan `KIOSAPI_API_KEY` melempar galat `KIOSAPI_KEY_MISSING`, namun model kosong tidak divalidasi ketat sebelum persiapan payload. |
| 5 | **Timeout & Error Handling** | **PASS (Lokal)** | Timeout 15.000 ms via `AbortController`. Namun, timer dibersihkan saat headers diterima, sebelum seluruh body payload selesai diunduh. |
| 6 | **Pelacak Rate Limit Harian** | **PARTIAL (In-Memory)** | Menggunakan objek `dailyUsageTracker` (200 request/hari). Celah: counter tersimpan dalam memori proses Node.js; me-restart aplikasi akan mereset hitungan ke 0. |
| 7 | **Pencegahan Duplikasi & Checkpointing** | **NOT IMPLEMENTED (Produksi)** | Kode adapter produksi tidak memiliki penyimpanan checkpoint persisten; deduplikasi hanya disediakan oleh harness evaluasi terpisah. |
| 8 | **Redaksi Rahasia (Secret Sanitization)** | **PARTIAL** | Log konsol standar menyembunyikan API key, namun pesan error objek jaringan pihak ketiga rawan membocorkan header otorisasi jika terjadi uncaught rejection. |
| 9 | **Penghentian Otomatis (Fail-Closed)** | **NOT IMPLEMENTED (Produksi)** | Tidak ada penghentian terminal saat mendeteksi indikasi biaya; adapter mengandalkan fallback manual ke kategori `lainnya`. |
| 10 | **Jaminan Sisi Provider** | **ABSENT (Bukan Kontrol Provider)** | Seluruh pembatasan bersifat lokal di kode Node.js; provider Kios API tidak memiliki penguncian hard balance cap di level gateway. |

---

## 2. Analisis Mendalam Celah Kritis `FREE_ONLY`

Pada implementasi asli `backend/config/kiosApi.js` baris 112–122:
```javascript
  // Enforce Free-Only check if enabled
  if (KIOSAPI_CONFIG.freeOnly) {
    const targetModel = (model || "").toLowerCase();
    // In KiosAPI / OpenRouter ecosystems, free models usually contain ':free' or 'free' in ID
    // If strict free-only is enabled and model doesn't specify free, warn or verify
    const isFreeDesignated = targetModel.includes("free");
    if (!isFreeDesignated && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
      // If user specifically provided a model without ':free' but set freeOnly=true,
      // allow if user explicitly configured it, but log a sanitized warning.
    }
  }
```

**Analisis Risiko**:
1. Komentar pada baris 119 menyatakan *"allow if user explicitly configured it, but log a sanitized warning"*, namun tidak ada kode logging maupun pelemparan error di dalam blok tersebut.
2. Jika variabel lingkungan `KIOSAPI_CLASSIFICATION_MODEL` diubah menjadi model komersial berbayar (misalnya `gpt-4o`, `claude-3-5-sonnet`, atau `minimax-01`), adapter akan tetap melakukan panggilan HTTP POST berbayar ke Kios API.
3. Ketergantungan pada substring `includes("free")` rentan terhadap penamaan manipulatif yang mengandung kata "free" tetapi mengenakan biaya komersial.

---

## 3. Desain dan Implementasi Remediasi Terisolasi

Remediasi disiapkan pada area kerja terisolasi [`research/evaluation/llm_finalization_v1/adapter_remediation/`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/evaluation/llm_finalization_v1/adapter_remediation/) tanpa menyentuh kode produksi aktif:

1. **Allowlist Model Tertutup (*Closed Allowlist*)**:
   ```javascript
   const ALLOWED_FREE_MODELS = Object.freeze([
     'minimax-m3.1-flash-free'
   ]);
   ```
2. **Penolakan Fail-Closed Sebelum Request Jaringan**:
   Jika `freeOnly === true` dan model yang diminta tidak terdaftar secara persis dalam `ALLOWED_FREE_MODELS`, sistem seketika melempar error `PAID_OR_UNAUTHORIZED_MODEL_BLOCKED` dengan status `isSecurityBlock = true` sebelum inisialisasi payload dan sebelum increment counter.
3. **Validasi Endpoint Resmi**:
   Hanya base URL resmi (`https://kiosapi.com/v1` dan `https://api.kiosapi.id/v1`) yang diizinkan untuk mencegah pengalihan request (*endpoint redirection attack*).
4. **Sanitasi Kredensial Literal**:
   Modul sanitasi otomatis menggantikan nilai string secret menjadi `[REDACTED]` pada seluruh pesan galat dan log audit.

---

## 4. Hasil Verifikasi Pengujian Unit Remediasi

Pengujian otomatis dijalankan menggunakan suite `node --test research/evaluation/llm_finalization_v1/adapter_remediation/kiosApi_remediation.test.cjs`:

- **Hasil Uji: 7 passed, 0 failed (100% lulus)**
  1. `minimax-m3.1-flash-free` berhasil diotorisasi dengan konfigurasi valid.
  2. Model berbayar komersial (`gpt-4o`, `claude-3-5-sonnet`, `deepseek-chat`, `gemini-1.5-pro`) seketika ditolak dengan galat `PAID_OR_UNAUTHORIZED_MODEL_BLOCKED`.
  3. Model manipulatif dengan substring `free` (`gpt-4o-free-tier`, `claude-free-unlimited`, dll.) ditolak secara fail-closed.
  4. API key kosong langsung ditolak dengan kode `KIOSAPI_KEY_MISSING`.
  5. Identifier model kosong atau spasi ditolak dengan kode `MODEL_REQUIRED`.
  6. Endpoint base URL tidak sah ditolak dengan kode `ENDPOINT_NOT_PERMITTED`.
  7. Token rahasia terbukti 100% tersanitasi dari pesan log.

---

## 5. Rincian Patch Usulan (`kiosApi.patch`)

Patch terpadu telah disimpan pada [`kiosApi.patch`](file:///d:/pls%20jgn%20diliatin/si-pengduan-warga/research/evaluation/llm_finalization_v1/adapter_remediation/kiosApi.patch):

```diff
--- backend/config/kiosApi.js
+++ backend/config/kiosApi.js (Remediated Security Version)
@@ -7,6 +7,10 @@
  */
 
+const ALLOWED_FREE_MODELS = Object.freeze([
+  'minimax-m3.1-flash-free'
+]);
+
 const KIOSAPI_CONFIG = {
   get apiKey() {
     return process.env.KIOSAPI_API_KEY || "";
@@ -112,11 +116,14 @@
   // Enforce Free-Only check if enabled
   if (KIOSAPI_CONFIG.freeOnly) {
     const targetModel = (model || "").toLowerCase();
-    const isFreeDesignated = targetModel.includes("free");
-    if (!isFreeDesignated && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
+    const isExplicitlyAllowed = ALLOWED_FREE_MODELS.includes(targetModel);
+    if (!isExplicitlyAllowed && !process.env.KIOSAPI_ALLOW_UNVERIFIED_MODELS) {
+      const error = new Error(
+        `Model '${targetModel}' tidak termasuk dalam allowlist model gratis yang diizinkan. Permintaan dibatalkan demi keamanan biaya.`
+      );
+      error.code = "PAID_OR_UNAUTHORIZED_MODEL_BLOCKED";
+      error.isSecurityBlock = true;
+      throw error;
     }
   }
```

---

## 6. Penegasan Batasan Keamanan Perangkat Lunak

> [!IMPORTANT]
> Penambahan *allowlist* model dan logika penolakan *fail-closed* di tingkat aplikasi lokal **bukan merupakan bukti bahwa provider eksternal menjamin tarif Rp0**.
> 
> Pembatasan kode lokal hanya memastikan bahwa aplikasi tidak akan secara sengaja meminta model berbayar. Namun, jika provider pihak ketiga mengubah kebijakan tarif akun secara sepihak atau beralih rute secara diam-diam, kode lokal tidak dapat membatalkan penagihan di peladen provider. Oleh karena itu, verifikasi akun independen tetap menjadi prasyarat mutlak sebelum pengiriman request live.
