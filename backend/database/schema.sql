-- ========================================
-- DATABASE SETUP GUIDE
-- Sistem Informasi Pengaduan Warga
-- ========================================

-- ========================================
-- STEP 1: CREATE DATABASE
-- ========================================
-- Run this in PostgreSQL terminal or pgAdmin

-- Drop database if exists (WARNING: This will delete all data!)
-- DROP DATABASE IF EXISTS pengaduan_warga;

-- Create new database
CREATE DATABASE pengaduan_warga
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'en_US.UTF-8'
    LC_CTYPE = 'en_US.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Connect to the database
\c pengaduan_warga

-- ========================================
-- STEP 2: CREATE EXTENSIONS
-- ========================================

-- Enable UUID extension (optional, for future use)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable PostGIS for geolocation (optional)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ========================================
-- STEP 3: CREATE TABLES
-- ========================================

-- Table: users
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20),
    nik VARCHAR(16) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'warga' CHECK (role IN ('warga', 'admin', 'petugas')),
    is_active BOOLEAN DEFAULT TRUE,
    email_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add comment to table
COMMENT ON TABLE users IS 'Stores user information including citizens, admin, and officers';

-- Table: categories
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6B7280',
    icon VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE categories IS 'Complaint categories for classification';

-- Table: complaints
CREATE TABLE complaints (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    auto_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    confidence_score DECIMAL(5,2),
    location_address TEXT,
    location_lat DECIMAL(10,8),
    location_lng DECIMAL(11,8),
    image_url TEXT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'diproses', 'selesai', 'ditolak')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('rendah', 'normal', 'tinggi', 'darurat')),
    response_text TEXT,
    response_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    response_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE complaints IS 'Main complaints table with AI classification results';
COMMENT ON COLUMN complaints.auto_category_id IS 'AI-predicted category';
COMMENT ON COLUMN complaints.confidence_score IS 'AI confidence percentage (0-100)';

-- Table: complaint_history
CREATE TABLE complaint_history (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    note TEXT,
    changed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE complaint_history IS 'Audit trail for complaint status changes';

-- Table: comments
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE comments IS 'Comments on complaints';
COMMENT ON COLUMN comments.is_internal IS 'Internal notes for admin/officers only';

-- Table: votes
CREATE TABLE votes (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) DEFAULT 'support' CHECK (vote_type IN ('upvote', 'support')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(complaint_id, user_id)
);

COMMENT ON TABLE votes IS 'User votes/supports for complaints';

-- Table: classification_logs
CREATE TABLE classification_logs (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    input_text TEXT NOT NULL,
    predicted_category VARCHAR(50),
    confidence_score DECIMAL(5,2),
    all_scores JSONB,
    model_version VARCHAR(50),
    processing_time_ms INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE classification_logs IS 'Logs for AI classification performance monitoring';

-- Table: notifications (optional)
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE notifications IS 'User notifications for complaint updates';

-- ========================================
-- STEP 4: CREATE INDEXES
-- ========================================

-- Indexes for users table
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Indexes for complaints table
CREATE INDEX idx_complaints_user_id ON complaints(user_id);
CREATE INDEX idx_complaints_category_id ON complaints(category_id);
CREATE INDEX idx_complaints_auto_category_id ON complaints(auto_category_id);
CREATE INDEX idx_complaints_status ON complaints(status);
CREATE INDEX idx_complaints_priority ON complaints(priority);
CREATE INDEX idx_complaints_created_at ON complaints(created_at DESC);
CREATE INDEX idx_complaints_location ON complaints(location_lat, location_lng);

-- Indexes for related tables
CREATE INDEX idx_complaint_history_complaint_id ON complaint_history(complaint_id);
CREATE INDEX idx_complaint_history_created_at ON complaint_history(created_at DESC);
CREATE INDEX idx_comments_complaint_id ON comments(complaint_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_votes_complaint_id ON votes(complaint_id);
CREATE INDEX idx_votes_user_id ON votes(user_id);
CREATE INDEX idx_classification_logs_complaint_id ON classification_logs(complaint_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Full-text search index for complaints
CREATE INDEX idx_complaints_fulltext ON complaints USING gin(to_tsvector('indonesian', title || ' ' || description));

-- ========================================
-- STEP 5: CREATE VIEWS
-- ========================================

-- View: Complaint Statistics
CREATE OR REPLACE VIEW complaint_stats AS
SELECT 
    c.name as category,
    COUNT(co.id) as total_complaints,
    SUM(CASE WHEN co.status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN co.status = 'diproses' THEN 1 ELSE 0 END) as diproses,
    SUM(CASE WHEN co.status = 'selesai' THEN 1 ELSE 0 END) as selesai,
    SUM(CASE WHEN co.status = 'ditolak' THEN 1 ELSE 0 END) as ditolak,
    AVG(co.confidence_score) as avg_confidence
FROM categories c
LEFT JOIN complaints co ON c.id = co.category_id
GROUP BY c.name
ORDER BY total_complaints DESC;

-- View: Recent Complaints with Details
CREATE OR REPLACE VIEW recent_complaints AS
SELECT 
    co.id,
    co.title,
    co.description,
    co.status,
    co.priority,
    co.confidence_score,
    cat.name as category_name,
    cat.color as category_color,
    u.name as user_name,
    u.email as user_email,
    co.created_at,
    COUNT(DISTINCT v.id) as vote_count,
    COUNT(DISTINCT cm.id) as comment_count
FROM complaints co
LEFT JOIN categories cat ON co.category_id = cat.id
LEFT JOIN users u ON co.user_id = u.id
LEFT JOIN votes v ON co.id = v.complaint_id
LEFT JOIN comments cm ON co.id = cm.complaint_id
GROUP BY co.id, cat.name, cat.color, u.name, u.email
ORDER BY co.created_at DESC;

-- View: User Activity Summary
CREATE OR REPLACE VIEW user_activity AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT co.id) as total_complaints,
    COUNT(DISTINCT cm.id) as total_comments,
    COUNT(DISTINCT v.id) as total_votes,
    MAX(co.created_at) as last_complaint_date
FROM users u
LEFT JOIN complaints co ON u.id = co.user_id
LEFT JOIN comments cm ON u.id = cm.user_id
LEFT JOIN votes v ON u.id = v.user_id
GROUP BY u.id, u.name, u.email, u.role;

-- ========================================
-- STEP 6: CREATE FUNCTIONS
-- ========================================

-- Function: Update timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create notification on status change
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status != OLD.status THEN
        INSERT INTO notifications (user_id, complaint_id, title, message)
        VALUES (
            NEW.user_id,
            NEW.id,
            'Status Pengaduan Diperbarui',
            'Pengaduan "' || NEW.title || '" telah diubah ke status: ' || NEW.status
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate classification accuracy
CREATE OR REPLACE FUNCTION get_classification_accuracy()
RETURNS TABLE(
    total_predictions BIGINT,
    accurate_predictions BIGINT,
    accuracy_percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_predictions,
        SUM(CASE WHEN c.category_id = c.auto_category_id THEN 1 ELSE 0 END) as accurate_predictions,
        ROUND(
            (SUM(CASE WHEN c.category_id = c.auto_category_id THEN 1 ELSE 0 END)::NUMERIC / 
            COUNT(*)::NUMERIC) * 100, 
            2
        ) as accuracy_percentage
    FROM complaints c
    WHERE c.category_id IS NOT NULL AND c.auto_category_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- STEP 7: CREATE TRIGGERS
-- ========================================

-- Trigger: Update timestamp on users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp on complaints table
CREATE TRIGGER update_complaints_updated_at 
    BEFORE UPDATE ON complaints
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Create notification on status change
CREATE TRIGGER trigger_notify_status_change
    AFTER UPDATE ON complaints
    FOR EACH ROW
    EXECUTE FUNCTION notify_status_change();

-- ========================================
-- STEP 8: INSERT DEFAULT DATA
-- ========================================

-- Insert default categories
INSERT INTO categories (name, description, color, icon) VALUES
('sampah', 'Keluhan terkait pengelolaan sampah dan kebersihan', '#EF4444', 'trash'),
('jalan_rusak', 'Kerusakan infrastruktur jalan dan trotoar', '#F59E0B', 'road'),
('banjir', 'Masalah banjir, genangan, dan drainase', '#3B82F6', 'water'),
('listrik', 'Gangguan listrik dan penerangan jalan', '#FBBF24', 'zap'),
('air_bersih', 'Masalah distribusi air bersih', '#06B6D4', 'droplet'),
('keamanan', 'Keluhan terkait keamanan lingkungan', '#DC2626', 'shield'),
('kesehatan', 'Layanan dan fasilitas kesehatan', '#10B981', 'heart'),
('pendidikan', 'Fasilitas dan layanan pendidikan', '#8B5CF6', 'book'),
('lainnya', 'Kategori lainnya', '#6B7280', 'more-horizontal');

-- Create default admin user
-- Password: admin123 (change this in production!)
INSERT INTO users (name, email, phone, password_hash, role, email_verified) VALUES
('Administrator', 'admin@pengaduan.local', '081234567890', 
 '$2b$10$rI3qFrGLW8mEXmI0lJ0LTOqKQvN8wPQvLYvJ3JZN3YyXxLlR6Fa0S', 
 'admin', TRUE);

-- Create sample petugas (officer)
INSERT INTO users (name, email, phone, password_hash, role, email_verified) VALUES
('Petugas Kelurahan', 'petugas@pengaduan.local', '081234567891',
 '$2b$10$rI3qFrGLW8mEXmI0lJ0LTOqKQvN8wPQvLYvJ3JZN3YyXxLlR6Fa0S',
 'petugas', TRUE);

-- ========================================
-- STEP 9: GRANT PERMISSIONS
-- ========================================

-- Grant all privileges to postgres user (development only)
GRANT ALL PRIVILEGES ON DATABASE pengaduan_warga TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- For production, create specific user with limited permissions
-- CREATE USER pengaduan_app WITH PASSWORD 'secure_password_here';
-- GRANT CONNECT ON DATABASE pengaduan_warga TO pengaduan_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO pengaduan_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO pengaduan_app;

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all views
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';

-- Check all functions
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check categories
SELECT * FROM categories;

-- Check users
SELECT id, name, email, role FROM users;

-- ========================================
-- USEFUL MAINTENANCE QUERIES
-- ========================================

-- Reset auto-increment sequences
-- SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
-- SELECT setval('complaints_id_seq', (SELECT MAX(id) FROM complaints));

-- Backup database
-- pg_dump -U postgres pengaduan_warga > backup_pengaduan_warga.sql

-- Restore database
-- psql -U postgres pengaduan_warga < backup_pengaduan_warga.sql

-- ========================================
-- TESTING QUERIES
-- ========================================

-- Test classification accuracy function
SELECT * FROM get_classification_accuracy();

-- Test statistics view
SELECT * FROM complaint_stats;

-- Test recent complaints view
SELECT * FROM recent_complaints LIMIT 10;

-- Test user activity view
SELECT * FROM user_activity;

COMMENT ON DATABASE pengaduan_warga IS 'Database for Citizen Complaint System with AI Classification';

-- ========================================
-- END OF DATABASE SETUP
-- ========================================

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Database setup completed successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database: pengaduan_warga';
    RAISE NOTICE 'Tables created: 9';
    RAISE NOTICE 'Views created: 3';
    RAISE NOTICE 'Functions created: 3';
    RAISE NOTICE 'Default categories: 9';
    RAISE NOTICE 'Default users: 2 (admin, petugas)';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Login credentials:';
    RAISE NOTICE 'Admin: admin@pengaduan.local / admin123';
    RAISE NOTICE 'Petugas: petugas@pengaduan.local / admin123';
    RAISE NOTICE '⚠️  CHANGE DEFAULT PASSWORDS IN PRODUCTION!';
    RAISE NOTICE '========================================';
END $$;