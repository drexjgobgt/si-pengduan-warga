# Sistem Pengaduan Warga (SIPW)

Sistem Informasi Pengaduan Warga modern dengan antarmuka **Premium Glassmorphism**, klasifikasi otomatis berbasis AI, dan visualisasi data **Heatmap**. Aplikasi ini memudahkan warga melaporkan masalah lingkungan (sampah, jalan rusak, banjir, dll) secara transparan dan responsif.

![Banner Preview](https://via.placeholder.com/1200x600?text=Sistem+Pengaduan+Warga+Preview)

## 🚀 Fitur Unggulan

### 🌟 User Experience (Warga)
- **Modern UI**: Desain Glassmorphism yang estetik, responsif, dan animasi halus.
- **Laporan Anonim**: Opsi untuk menyembunyikan identitas pelapor demi keamanan privasi.
- **Lokasi Presisi**: Pinpoint lokasi kejadian via Peta Interaktif (Leaflet) atau GPS otomatis.
- **Bukti Multimedia**: Upload foto kejadian dengan preview langsung.
- **Tracking Transparan**: Pantau status laporan (Pending -> Diproses -> Selesai) secara real-time.
- **Interaksi Komunitas**: Fitur Vote dan Komentar layaknya sosial media.
- **Hapus Laporan**: Kontrol penuh untuk menghapus laporan sendiri jika diperlukan.

### 🛡️ Dashboard (Admin & Petugas)
- **Heatmap Visual**: Peta panas sebaran masalah untuk prioritas penanganan wilayah.
- **AI Classification**: Klasifikasi otomatis kategori laporan (Sampah, Infra, Keamanan) menggunakan keyword matching.
- **Statistik Lengkap**: Grafik tren laporan bulanan dan kategori terbanyak.
- **Manajemen Laporan**: Update status, respon cepat, dan verifikasi lapangan.
- **Notifikasi Sistem**: Alert real-time untuk laporan baru atau update status.

---

## 🛠️ Teknologi yang Digunakan

### Frontend
- **React 18** (Vite-based)
- **Tailwind CSS** (Styling & Responsive Design)
- **Framer Motion** & **Glass UI** (Animations & Effects)
- **React Leaflet** (Maps & Heatmap)
- **Lucide React** (Modern Icons)
- **Axios** (API Client)

### Backend
- **Node.js** & **Express** (REST API)
- **PostgreSQL** (Database Relasional)
- **Cloudinary** (Cloud Storage untuk Gambar)
- **JWT** (Secure Authentication)
- **Multer** (File Handling)

---

## 📋 Prasyarat Instalasi

Pastikan komputer Anda sudah terinstall:
- **Node.js** (v16+)
- **PostgreSQL** (v13+)
- **Git**

---

## ⚡ Panduan Instalasi Cepat

### 1. Clone Repository
```bash
git clone https://github.com/drexjgobgt/si-pengduan-warga.git
cd si-pengduan-warga
```

### 2. Konfigurasi Backend
Masuk ke folder backend dan install dependencies:
```bash
cd backend
npm install
```

Buat file `.env` di dalam folder `/backend`:
```env
PORT=5000
NODE_ENV=development

# Database Config
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pengaduan_warga
DB_USER=postgres
DB_PASSWORD=password_db_anda

# Authentication
JWT_SECRET=rahasia_super_secure_bisa_diganti

# Cloudinary (Untuk Upload Gambar)
CLOUDINARY_CLOUD_NAME=nama_cloud_anda
CLOUDINARY_API_KEY=api_key_anda
CLOUDINARY_API_SECRET=api_secret_anda

# Email Service (Opsional - SMTP Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=email_anda@gmail.com
EMAIL_PASS=app_password_gmail
```

**Setup Database:**
Jalankan script migrasi (Pastikan PostgreSQL sudah berjalan):
```bash
# Otomatis membuat DB dan Tabel
node scripts/migrate_anonymous.js
# Atau import manual file database/schema.sql via pgAdmin
```

Jalankan Server:
```bash
npm run dev
# Server berjalan di: http://localhost:5000
```

### 3. Konfigurasi Frontend
Buka terminal baru, masuk ke folder frontend:
```bash
cd ../frontend
npm install
```

Buat file `.env` di dalam folder `/frontend`:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Jalankan Aplikasi:
```bash
npm run dev
# Akses aplikasi di: http://localhost:3000
```

---

## 📸 Screnshots

| Dashboard Utama | Detail Laporan (Map & Chart) |
|:---:|:---:|
| *(Ganti ini dengan screenshot home)* | *(Ganti ini dengan screenshot detail)* |

| Heatmap Wilayah (Admin) | Versi Mobile |
|:---:|:---:|
| *(Ganti ini dengan screenshot heatmap)* | *(Ganti ini dengan screenshot mobile)* |

---

## 🔐 Akun Demo (Default)

| Role | Email | Password |
|:---|:---|:---|
| **Admin** | `admin@pengaduan.local` | `admin123` |
| **Petugas** | `petugas@pengaduan.local` | `admin123` |
| **Warga** | *(Silakan Register Sendiri)* | - |

---

## 👥 Kontribusi

Project ini dikembangkan untuk kebutuhan Open Source. Pull Request sangat dipersilakan!
1. Fork repo ini
2. Buat branch fitur (`git checkout -b fitur-keren`)
3. Commit perubahan (`git commit -m 'Menambah fitur keren'`)
4. Push ke branch (`git push origin fitur-keren`)
5. Buat Pull Request

---

**License**: MIT
**Author**: Drexjgobgt & Team
