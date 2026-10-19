-- Migration: 002_sla_disposition_departments.sql
-- Purpose: Add departments, disposition workflow, SLA tracking, and timeline enhancements

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Insert default departments
INSERT INTO departments (name, code, description) VALUES
('Dinas Lingkungan Hidup', 'DLH', 'Penanganan kebersihan, persampahan, dan taman'),
('Dinas Pekerjaan Umum & Tata Air', 'PUPR', 'Infrastruktur jalan, jembatan, saluran air, dan drainase'),
('Dinas Perhubungan & Penerangan', 'DISHUB', 'Penerangan jalan umum, rambu, dan fasilitas perhubungan'),
('Satuan Polisi Pamong Praja', 'SATPOLPP', 'Ketertiban umum, ketenteraman masyarakat, dan keamanan lingkungan'),
('Dinas Kesehatan', 'DINKES', 'Fasilitas kesehatan masyarakat, puskesmas, dan sanitasi'),
('Dinas Pendidikan', 'DISDIK', 'Sarana dan prasarana pendidikan'),
('Sekretariat Kelurahan', 'KELURAHAN', 'Pelayanan umum, administrasi kependudukan, dan pengaduan umum')
ON CONFLICT (code) DO NOTHING;

-- 3. Extend users table for department and supervisor role
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- Update role constraint in users to include supervisor
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('warga', 'petugas', 'supervisor', 'admin'));

-- 4. Extend categories table to associate with department
ALTER TABLE categories ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;

-- Link default categories to departments
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'DLH') WHERE name = 'sampah';
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'PUPR') WHERE name IN ('jalan_rusak', 'banjir', 'air_bersih');
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'DISHUB') WHERE name = 'listrik';
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'SATPOLPP') WHERE name = 'keamanan';
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'DINKES') WHERE name = 'kesehatan';
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'DISDIK') WHERE name = 'pendidikan';
UPDATE categories SET department_id = (SELECT id FROM departments WHERE code = 'KELURAHAN') WHERE name = 'lainnya';

-- 5. Extend complaints table for SLA and disposition
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_hours INTEGER DEFAULT 72;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_start_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_deadline_at TIMESTAMP;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS sla_status VARCHAR(30) DEFAULT 'aman';
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_escalated BOOLEAN DEFAULT FALSE;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalated_at TIMESTAMP;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalation_level INTEGER DEFAULT 0;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS escalation_reason TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_proof_url TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;

-- Constraint for sla_status
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_sla_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_sla_status_check 
    CHECK (sla_status IN ('aman', 'mendekati_tenggat', 'terlambat', 'selesai_tepat_waktu', 'selesai_terlambat'));

-- Set default deadline for existing complaints without deadline
UPDATE complaints 
SET sla_hours = CASE 
    WHEN priority = 'darurat' THEN 24
    WHEN priority = 'tinggi' THEN 48
    WHEN priority = 'normal' THEN 72
    ELSE 120
END
WHERE sla_hours IS NULL;

UPDATE complaints
SET sla_deadline_at = created_at + (sla_hours || ' hours')::INTERVAL
WHERE sla_deadline_at IS NULL;

-- 6. Create complaint_dispositions table
CREATE TABLE IF NOT EXISTS complaint_dispositions (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    assigned_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    from_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    to_officer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dispositions_complaint_id ON complaint_dispositions(complaint_id);
CREATE INDEX IF NOT EXISTS idx_dispositions_to_officer ON complaint_dispositions(to_officer_id);
CREATE INDEX IF NOT EXISTS idx_dispositions_department ON complaint_dispositions(department_id);

-- 7. Extend complaint_history for rich chronological timeline
ALTER TABLE complaint_history ADD COLUMN IF NOT EXISTS action_type VARCHAR(50) DEFAULT 'status_change';
ALTER TABLE complaint_history ADD COLUMN IF NOT EXISTS is_internal BOOLEAN DEFAULT FALSE;
ALTER TABLE complaint_history ADD COLUMN IF NOT EXISTS proof_url TEXT;

CREATE INDEX IF NOT EXISTS idx_complaint_history_internal ON complaint_history(is_internal);

-- 8. Seed sample officers and supervisors for test / demonstration
-- Password: admin123 ($2b$10$pKnyJ6AdbBqQ4OdW5UeXhOJ7BIGy3769E1k4nH0nVOZ8xiTztVuo2)
INSERT INTO users (name, email, phone, password_hash, role, email_verified, department_id) VALUES
('Bambang Supervisor', 'supervisor@pengaduan.local', '081234567888', '$2b$10$pKnyJ6AdbBqQ4OdW5UeXhOJ7BIGy3769E1k4nH0nVOZ8xiTztVuo2', 'supervisor', TRUE, 1),
('Agus Santoso (DLH)', 'petugas.dlh@pengaduan.local', '081234567881', '$2b$10$pKnyJ6AdbBqQ4OdW5UeXhOJ7BIGy3769E1k4nH0nVOZ8xiTztVuo2', 'petugas', TRUE, 1),
('Joko Widodo (PUPR)', 'petugas.pupr@pengaduan.local', '081234567882', '$2b$10$pKnyJ6AdbBqQ4OdW5UeXhOJ7BIGy3769E1k4nH0nVOZ8xiTztVuo2', 'petugas', TRUE, 2),
('Dedi Cahyono (Satpol PP)', 'petugas.satpol@pengaduan.local', '081234567883', '$2b$10$pKnyJ6AdbBqQ4OdW5UeXhOJ7BIGy3769E1k4nH0nVOZ8xiTztVuo2', 'petugas', TRUE, 4)
ON CONFLICT (email) DO NOTHING;
