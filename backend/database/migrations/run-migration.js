/**
 * Script untuk menjalankan migration database
 * Usage: node database/migrations/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../../config/database');

async function runMigration() {
  const migrationsDir = __dirname;
  const sqlFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`📄 Found ${sqlFiles.length} migration file(s): ${sqlFiles.join(', ')}\n`);

  try {
    const client = await pool.connect();
    try {
      for (const file of sqlFiles) {
        const filePath = path.join(migrationsDir, file);
        console.log(`🚀 Executing migration: ${file}...`);
        const sql = fs.readFileSync(filePath, 'utf8');

        await client.query('BEGIN');
        try {
          // PostgreSQL handles multiple statements per query execution
          await client.query(sql);
          await client.query('COMMIT');
          console.log(`✅ ${file} executed successfully!\n`);
        } catch (stmtError) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed in ${file}:`, stmtError.message);
          throw stmtError;
        }
      }

      console.log('🎉 All migrations applied successfully!');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('\n❌ Migration batch failed:');
    console.error(error.message);

    if (error.code === 'ECONNREFUSED' || error.code === '28P01') {
      console.error('\n💡 Database connection failed. Check your .env file:');
      console.error('   - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch(console.error);

