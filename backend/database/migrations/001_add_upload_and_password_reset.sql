-- Migration: Add tables for file upload and password reset
-- Created: 2024

-- Table for storing multiple images per complaint
CREATE TABLE IF NOT EXISTS complaint_images (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER NOT NULL REFERENCES complaints(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    image_path TEXT, -- Path lokal file
    file_name VARCHAR(255),
    file_size INTEGER,
    mime_type VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaint_images_complaint_id ON complaint_images(complaint_id);

-- Table for password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

-- Comments
COMMENT ON TABLE complaint_images IS 'Stores multiple images for each complaint';
COMMENT ON TABLE password_reset_tokens IS 'Stores password reset tokens with expiration';

