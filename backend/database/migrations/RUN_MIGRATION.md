# 🗄️ Cara Menjalankan Migration di Windows

Karena `psql` tidak tersedia di PATH, gunakan salah satu metode berikut:

---

## Metode 1: Menggunakan pgAdmin (Paling Mudah) ⭐

1. Buka **pgAdmin 4**
2. Connect ke server PostgreSQL Anda
3. Klik kanan pada database `pengaduan_warga` → **Query Tool**
4. Buka file `001_add_upload_and_password_reset.sql`
5. Copy semua isinya dan paste ke Query Tool
6. Klik **Execute** (F5)

---

## Metode 2: Menggunakan DBeaver / Database Tool Lain

1. Buka DBeaver atau tool database favorit Anda
2. Connect ke database `pengaduan_warga`
3. Buka file `001_add_upload_and_password_reset.sql`
4. Copy semua isinya dan paste ke SQL editor
5. Execute query

---

## Metode 3: Install PostgreSQL Client Tools

1. Download PostgreSQL dari: https://www.postgresql.org/download/windows/
2. Install PostgreSQL (include command line tools)
3. Setelah install, buka **Command Prompt** (bukan PowerShell) atau restart terminal
4. Jalankan:
   ```cmd
   psql -U postgres -d pengaduan_warga -f backend\database\migrations\001_add_upload_and_password_reset.sql
   ```

**Atau** tambahkan PostgreSQL bin ke PATH:
- Cari folder PostgreSQL (biasanya `C:\Program Files\PostgreSQL\15\bin`)
- Tambahkan ke System Environment Variables → PATH

---

## Metode 4: Menggunakan Node.js Script (Otomatis)

Saya sudah membuat script Node.js yang bisa dijalankan langsung!

```bash
cd backend
node database/migrations/run-migration.js
```

Script ini akan otomatis menjalankan migration menggunakan koneksi database yang sudah ada.

---

## Metode 5: Copy-Paste Manual

Jika Anda sudah punya akses ke database (via pgAdmin, DBeaver, dll), copy isi file SQL di bawah dan jalankan langsung:

