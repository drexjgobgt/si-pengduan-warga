/*
-- Sample seed data for testing

-- Insert sample warga (citizen) users
INSERT INTO users (name, email, phone, password_hash, role, email_verified) VALUES
('Budi Santoso', 'budi@example.com', '081234567892', 
 '$2b$10$rI3qFrGLW8mEXmI0lJ0LTOqKQvN8wPQvLYvJ3JZN3YyXxLlR6Fa0S', 
 'warga', TRUE),
('Siti Nurhaliza', 'siti@example.com', '081234567893',
 '$2b$10$rI3qFrGLW8mEXmI0lJ0LTOqKQvN8wPQvLYvJ3JZN3YyXxLlR6Fa0S',
 'warga', TRUE),
('Ahmad Yani', 'ahmad@example.com', '081234567894',
 '$2b$10$rI3qFrGLW8mEXmI0lJ0LTOqKQvN8wPQvLYvJ3JZN3YyXxLlR6Fa0S',
 'warga', TRUE);

-- Insert sample complaints
INSERT INTO complaints (user_id, title, description, category_id, auto_category_id, confidence_score, location_address, status, priority) VALUES
(3, 'Sampah menumpuk di gang 5', 
 'Sampah sudah tidak diangkut selama 3 hari, bau menyengat dan mengganggu warga sekitar',
 (SELECT id FROM categories WHERE name = 'sampah'),
 (SELECT id FROM categories WHERE name = 'sampah'),
 87.5,
 'Jl. Merdeka Gang 5, RT 02 RW 03',
 'pending',
 'tinggi'),

(4, 'Jalan berlubang besar di depan sekolah',
 'Ada lubang besar di jalan yang berbahaya untuk kendaraan, sudah ada yang jatuh',
 (SELECT id FROM categories WHERE name = 'jalan_rusak'),
 (SELECT id FROM categories WHERE name = 'jalan_rusak'),
 82.3,
 'Jl. Pendidikan No. 45',
 'diproses',
 'darurat'),

(5, 'Lampu jalan mati total',
 'Penerangan jalan di komplom perumahan mati semua sejak kemarin malam, sangat gelap dan tidak aman',
 (SELECT id FROM categories WHERE name = 'listrik'),
 (SELECT id FROM categories WHERE name = 'listrik'),
 76.8,
 'Perumahan Griya Asri Blok C',
 'pending',
 'tinggi'),

(3, 'Selokan tersumbat menyebabkan genangan',
 'Selokan di depan rumah tersumbat sampah dan menyebabkan air hujan tergenang',
 (SELECT id FROM categories WHERE name = 'banjir'),
 (SELECT id FROM categories WHERE name = 'banjir'),
 71.2,
 'Jl. Kenanga No. 12',
 'pending',
 'normal');

-- Insert complaint history
INSERT INTO complaint_history (complaint_id, status, note, changed_by) VALUES
(1, 'pending', 'Pengaduan dibuat', 3),
(2, 'pending', 'Pengaduan dibuat', 4),
(2, 'diproses', 'Telah ditindaklanjuti oleh dinas PU', 2),
(3, 'pending', 'Pengaduan dibuat', 5),
(4, 'pending', 'Pengaduan dibuat', 3);

-- Insert some votes
INSERT INTO votes (complaint_id, user_id, vote_type) VALUES
(1, 4, 'support'),
(1, 5, 'support'),
(2, 3, 'support'),
(2, 5, 'support'),
(3, 3, 'support');

-- Insert some comments
INSERT INTO comments (complaint_id, user_id, comment) VALUES
(1, 4, 'Sama, di gang 6 juga tidak diangkut'),
(2, 3, 'Ini sangat berbahaya, mohon segera diperbaiki'),
(2, 5, 'Anak saya hampir terjatuh di lubang ini'),
(3, 4, 'Di blok D juga sama, semua lampu mati');

-- Verify seed data
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_complaints FROM complaints;
SELECT COUNT(*) as total_comments FROM comments;
*/