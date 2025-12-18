const pool = require('../config/database');

const migrate = async () => {
  try {
    console.log('Starting migration...');
    await pool.query('ALTER TABLE complaints ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT FALSE;');
    console.log('Migration successful: is_anonymous column added.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    process.exit();
  }
};

migrate();
