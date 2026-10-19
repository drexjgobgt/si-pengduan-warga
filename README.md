# Sistem Informasi Pengaduan Warga (SIPW)

<p align="center">
  <img src="./assets/images/logo.png" alt="Logo SIPW" width="220" />
</p>

Sistem Informasi Pengaduan Warga (SIPW) adalah aplikasi web pelayanan publik untuk pelaporan, penelusuran status, disposisi tugas, dan pemantauan Service Level Agreement (SLA) penanganan masalah lingkungan perkotaan. 

Aplikasi ini menghubungkan masyarakat dengan instansi Organisasi Perangkat Daerah (OPD) seperti Dinas Lingkungan Hidup (DLH), Dinas Pekerjaan Umum (PUPR), Dinas Perhubungan (DISHUB), dan Satuan Polisi Pamong Praja (SATPOL PP).

---

## Pratinjau Antarmuka

### 1. Beranda & Daftar Laporan (Desktop Full-Width)
Tata letak fluid hingga lebar 1720px dengan pembagian kolom adaptif, baris filter terpadu, dan kartu laporan yang terstruktur rapi.

![Beranda Desktop](./assets/images/dashboard.png)

### 2. Statistik & Tren Interaktif
Grafik linier formal berbasis Recharts untuk memantau volume aduan masuk, laporan selesai, antrean proses, dan keterlambatan SLA dengan rentang waktu 7 hari hingga 12 bulan.

![Statistik dan Tren](./assets/images/statistics.png)

### 3. Kinerja Penanganan & Komparasi Antar-OPD
Metrik rata-rata durasi penyelesaian (jam), rasio kepatuhan target SLA, serta diagram batang horizontal yang dapat diurutkan berdasarkan beban kerja atau tingkat ketuntasan.

![Kinerja OPD](./assets/images/performance.png)

### 4. Tampilan Mobile & Drawer Navigasi
Dioptimalkan untuk layar ponsel (320px–430px) tanpa pergeseran horizontal (*zero overflow*), dilengkapi menu drawer samping dan kontrol formulir yang mudah disentuh.

![Tampilan Mobile](./assets/images/mobile.png)

---

## Fitur Utama

### Pelayanan Publik (Warga)
- **Pelaporan Berbasis Peta & Bukti**: Penandaan titik lokasi dengan peta interaktif (Leaflet), alamat otomatis, dan unggah foto lampiran.
- **Opsi Pelapor Anonim**: Melindungi identitas pelapor pada kartu laporan publik dan linimasa penanganan.
- **Linimasa Kronologis**: Riwayat tahapan dari pelaporan, verifikasi, penugasan petugas, hingga bukti foto tindakan selesai.
- **Keterbukaan SLA**: Menampilkan estimasi batas waktu penanganan secara transparan (24 jam hingga 120 jam sesuai tingkat urgensi).
- **Pembukaan Kembali Laporan**: Warga dapat mengajukan pembukaan kembali jika kendala di lapangan belum tuntas.

### Manajemen Operasional & Penugasan (Admin & Petugas)
- **Pemantauan Batas Waktu SLA**: Klasifikasi otomatis status tenggat (*Aman*, *Mendekati Batas < 12 jam*, *Melewati SLA*, dan *Eskalasi Supervisor*).
- **Disposisi Cepat ke OPD & Petugas**: Penugasan laporan ke dinas terkait dan petugas lapangan disertai pemantauan beban kerja aktif.
- **Tab Khusus Petugas ("Tugas Saya")**: Antarmuka kerja bagi petugas untuk memperbarui progres, mencatat tindakan lapangan, dan mengunggah foto bukti penyelesaian.
- **Audit Trail Pengalihan**: Pencatatan riwayat perpindahan tugas dan catatan internal antar-petugas.

### Analisis Data & Aksesibilitas
- **Grafik Tren Garis Linier**: Pilihan rentang waktu (7 Hari, 30 Hari, 90 Hari, 12 Bulan) dan opsi toggle kurva interpolasi halus vs garis linier presisi.
- **Tabel Data Alternatif**: Mode tabel data terstruktur untuk pembaca layar (*screen reader*) sesuai standar aksesibilitas WCAG 2.1 AA.
- **Peta Kepadatan Spasial (Heatmap)**: Pemetaan sebaran konsentrasi masalah lingkungan di seluruh wilayah administratif.

---

## Tumpukan Teknologi

### Frontend
- **React 18** (`react-scripts`)
- **Tailwind CSS 3** (Sistem token warna *Civic Navy*, *Azure*, dan semantik status)
- **Recharts 2.15** (Visualisasi data analitik)
- **React Leaflet & Leaflet** (Peta spasial dan geolokasi)
- **Lucide React** (Ikon antarmuka)
- **Axios** (Klien HTTP API)

### Backend
- **Node.js** & **Express.js** (REST API)
- **PostgreSQL** (Database relasional dengan agregasi SQL kontinu `generate_series`)
- **JSON Web Token (JWT)** & **Bcrypt** (Autentikasi dan otorisasi role)
- **Multer** & **Cloudinary** (Manajemen berkas dan foto lampiran)

---

## Persyaratan Sistem

Pastikan perangkat telah terpasang:
- **Node.js** (versi 16 atau lebih baru)
- **PostgreSQL** (versi 13 atau lebih baru)
- **Git**

---

## Panduan Instalasi & Menjalankan Aplikasi

### 1. Salin Repositori
```bash
git clone https://github.com/drexjgobgt/si-pengduan-warga.git
cd si-pengduan-warga
```

### 2. Konfigurasi Backend
Masuk ke direktori backend dan instal dependensi:
```bash
cd backend
npm install
```

Buat file konfigurasi `.env` di dalam folder `/backend`:
```env
PORT=5000
NODE_ENV=development

# Konfigurasi Database PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pengaduan_warga
DB_USER=postgres
DB_PASSWORD=password_database_anda

# Autentikasi
JWT_SECRET=kunci_rahasia_jwt_anda

# Penyimpanan Cloudinary (Foto Lampiran)
CLOUDINARY_CLOUD_NAME=cloud_name_anda
CLOUDINARY_API_KEY=api_key_anda
CLOUDINARY_API_SECRET=api_secret_anda

# Layanan Notifikasi Email (Opsional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email_anda@gmail.com
EMAIL_PASS=app_password_anda
```

Jalankan skrip migrasi database:
```bash
node database/migrations/run-migration.js
```

Jalankan server backend:
```bash
npm run dev
# Server aktif pada port: http://localhost:5000
```

### 3. Konfigurasi Frontend
Buka terminal baru, masuk ke direktori frontend, lalu pasang dependensi:
```bash
cd ../frontend
npm install
```

Buat file `.env` di dalam folder `/frontend`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Jalankan aplikasi React:
```bash
npm start
# Antarmuka web dapat diakses di: http://localhost:3000
```

Untuk membangun versi produksi:
```bash
npm run build
```

---

## Akun Demo Bawaan

| Peran | Alamat Email | Kata Sandi | Akses Utama |
|:---|:---|:---|:---|
| **Admin** | `admin@pengaduan.local` | `admin123` | Seluruh dashboard, disposisi OPD, analitik kinerja |
| **Petugas** | `petugas@pengaduan.local` | `admin123` | Tab Tugas Saya, pembaruan status, unggah bukti |
| **Supervisor** | `supervisor@pengaduan.local` | `admin123` | Eskalasi aduan lewat batas waktu, rekapitulasi SLA |
| **Warga** | *Daftar mandiri via form* | *Sesuai pendaftaran* | Pelaporan aduan, pelacakan linimasa, ulasan |

---

## Lisensi

Proyek ini dirilis di bawah lisensi [MIT](LICENSE).
