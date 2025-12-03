# Sistem Pengaduan Warga

Sistem informasi pengaduan warga dengan klasifikasi otomatis menggunakan AI (keyword-based classification). Warga dapat melaporkan masalah di lingkungan mereka, dan sistem akan secara otomatis mengklasifikasikan pengaduan ke dalam kategori yang sesuai.

## 🚀 Fitur Utama

- ✅ **Autentikasi Pengguna** - Login dan registrasi untuk warga, admin, dan petugas
- 📝 **Pengaduan Warga** - Form untuk membuat pengaduan dengan lokasi dan foto
- 🤖 **AI Classification** - Klasifikasi otomatis pengaduan berdasarkan keyword matching
- 📊 **Dashboard Statistik** - Analisis data pengaduan per kategori dan status
- 💬 **Komentar & Voting** - Interaksi warga dengan pengaduan
- 📧 **Email Notifications** - Notifikasi email saat status pengaduan berubah
- 🔍 **Filter & Pencarian** - Filter pengaduan berdasarkan kategori, status, dan keyword

## 🛠️ Teknologi

### Backend
- **Node.js** dengan Express.js
- **PostgreSQL** sebagai database
- **JWT** untuk autentikasi
- **bcrypt** untuk hashing password
- **nodemailer** untuk email notifications

### Frontend
- **React 18** dengan Hooks
- **Tailwind CSS** untuk styling
- **Axios** untuk HTTP requests
- **Lucide React** untuk icons

## 📋 Prasyarat

Sebelum memulai, pastikan Anda telah menginstall:

- **Node.js** (v14 atau lebih tinggi)
- **PostgreSQL** (v12 atau lebih tinggi)
- **npm** atau **yarn**

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd pengaduan-warga
```

### 2. Setup Database

1. Buat database PostgreSQL:

```sql
CREATE DATABASE pengaduan_warga;
```

2. Jalankan schema SQL:

```bash
cd backend
psql -U postgres -d pengaduan_warga -f database/schema.sql
```

3. (Opsional) Jalankan seed data:

```bash
psql -U postgres -d pengaduan_warga -f database/seeds.sql
```

### 3. Setup Backend

1. Masuk ke folder backend:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Buat file `.env` di folder `backend/`:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=pengaduan_warga
DB_USER=postgres
DB_PASSWORD=your_database_password_here

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Email Configuration (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
EMAIL_FROM=noreply@pengaduanwarga.com
```

4. Jalankan server:

```bash
# Development mode (dengan nodemon)
npm run dev

# Production mode
npm start
```

Server akan berjalan di `http://localhost:5000`

### 4. Setup Frontend

1. Masuk ke folder frontend:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
```

3. Buat file `.env` di folder `frontend/`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Jalankan aplikasi:

```bash
npm start
```

Aplikasi akan berjalan di `http://localhost:3000`

## 📁 Struktur Project

```
pengaduan-warga/
├── backend/
│   ├── config/
│   │   └── database.js          # Konfigurasi database
│   ├── controllers/
│   │   ├── authController.js    # Controller untuk autentikasi
│   │   └── complaintController.js # Controller untuk pengaduan
│   ├── database/
│   │   ├── schema.sql           # Schema database
│   │   └── seeds.sql            # Data awal
│   ├── middleware/
│   │   ├── auth.js              # Middleware autentikasi
│   │   └── errorHandler.js      # Error handler
│   ├── routes/
│   │   ├── auth.js              # Routes autentikasi
│   │   ├── complaints.js        # Routes pengaduan
│   │   ├── categories.js        # Routes kategori
│   │   └── statistics.js        # Routes statistik
│   ├── services/
│   │   ├── classificationService.js # AI classification
│   │   └── emailService.js      # Email service
│   ├── utils/
│   │   ├── logger.js            # Logger utility
│   │   └── Validator.js         # Input validation
│   └── server.js                # Entry point server
│
└── frontend/
    ├── public/
    └── src/
        ├── components/
        │   ├── Auth/            # Komponen autentikasi
        │   ├── Complaints/      # Komponen pengaduan
        │   ├── Statistics/      # Komponen statistik
        │   ├── Layout/          # Layout components
        │   └── Common/          # Komponen umum
        ├── context/
        │   └── authContext.jsx  # Auth context
        ├── hooks/
        │   ├── useAuth.js       # Auth hook
        │   └── useComplaints.js # Complaints hook
        ├── services/
        │   └── api.js           # API service
        ├── utils/
        │   ├── constants.js     # Constants
        │   └── helpers.js       # Helper functions
        └── App.jsx              # Main component
```

## 🔐 Roles & Permissions

- **warga** - Dapat membuat pengaduan, melihat pengaduan, memberikan komentar dan vote
- **petugas** - Semua akses warga + dapat mengubah status pengaduan
- **admin** - Semua akses petugas + akses penuh ke semua fitur

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Registrasi user baru
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get profile user (protected)
- `PUT /api/auth/profile` - Update profile (protected)

### Complaints
- `GET /api/complaints` - Get semua pengaduan (dengan filter)
- `GET /api/complaints/:id` - Get detail pengaduan
- `POST /api/complaints` - Buat pengaduan baru (protected)
- `PATCH /api/complaints/:id/status` - Update status (admin/petugas)
- `POST /api/complaints/:id/vote` - Vote pengaduan (protected)
- `POST /api/complaints/:id/comments` - Tambah komentar (protected)
- `GET /api/complaints/:id/comments` - Get komentar
- `GET /api/complaints/:id/history` - Get history pengaduan

### Categories
- `GET /api/categories` - Get semua kategori
- `GET /api/categories/:id` - Get detail kategori

### Statistics
- `GET /api/statistics` - Get statistik umum
- `GET /api/statistics/monthly` - Get statistik bulanan

### Health Check
- `GET /api/health` - Health check endpoint

## 🤖 AI Classification

Sistem menggunakan keyword-based classification untuk mengklasifikasikan pengaduan secara otomatis. Kategori yang didukung:

- **sampah** - Masalah sampah dan kebersihan
- **jalan_rusak** - Jalan rusak dan infrastruktur
- **banjir** - Masalah banjir dan drainase
- **listrik** - Masalah listrik dan penerangan
- **air_bersih** - Masalah air bersih dan PDAM
- **keamanan** - Masalah keamanan dan kriminalitas
- **kesehatan** - Masalah kesehatan dan fasilitas kesehatan
- **pendidikan** - Masalah pendidikan dan sekolah
- **lainnya** - Kategori lainnya

## 🧪 Testing

### Test Database Connection

```bash
cd backend
npm run db:migrate
```

### Test API

Gunakan Postman atau curl untuk test API endpoints:

```bash
# Health check
curl http://localhost:5000/api/health

# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'
```

## 🐛 Troubleshooting

### Database Connection Error

1. Pastikan PostgreSQL berjalan
2. Periksa kredensial database di file `.env`
3. Pastikan database `pengaduan_warga` sudah dibuat

### Port Already in Use

Jika port 5000 sudah digunakan, ubah `PORT` di file `.env` backend.

### CORS Error

Pastikan backend sudah berjalan dan URL di frontend `.env` sudah benar.

## 📝 License

MIT License

## 👥 Kontribusi

Kontribusi sangat diterima! Silakan buat issue atau pull request.

## 📧 Kontak

Untuk pertanyaan atau dukungan, silakan buat issue di repository ini.

