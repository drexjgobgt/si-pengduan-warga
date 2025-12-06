/**
 * Script untuk menjalankan migration database
 * Usage: node database/migrations/run-migration.js
 */

const fs = require('fs');
const path = require('path');
const pool = require('../../config/database');

async function runMigration() {
  const migrationFile = path.join(__dirname, '001_add_upload_and_password_reset.sql');
  
  console.log('📄 Reading migration file...');
  
  try {
    // Read migration file
    const sql = fs.readFileSync(migrationFile, 'utf8');
    
    console.log('🚀 Executing migration...\n');
    
    const client = await pool.connect();
    
    try {
      // Execute SQL file as a whole
      // PostgreSQL can handle multiple statements separated by semicolons
      await client.query('BEGIN');
      
      // Split by semicolon but keep CREATE TABLE and CREATE INDEX together
      const statements = sql
        .split(/(?<!');(?=\s*(?:CREATE|COMMENT))/)
        .map(s => s.trim())
        .filter(s => {
          // Remove comments
          s = s.replace(/--.*$/gm, '');
          // Remove multi-line comments
          s = s.replace(/\/\*[\s\S]*?\*\//g, '');
          return s.length > 10 && !s.match(/^\s*$/);
        });
      
      console.log(`✅ Found ${statements.length} SQL statements\n`);
      
      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim();
        
        if (!statement || statement.length < 10) {
          continue;
        }
        
        try {
          console.log(`[${i + 1}/${statements.length}] Executing...`);
          await client.query(statement);
          console.log(`✅ Statement ${i + 1} executed successfully\n`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message.includes('already exists') || 
              error.code === '42P07' || 
              error.code === '42710') {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
          } else {
            console.error(`❌ Error in statement ${i + 1}:`);
            console.error(`   ${error.message}\n`);
            throw error;
          }
        }
      }
      
      await client.query('COMMIT');
      console.log('\n✅ Migration completed successfully!');
      console.log('\n📋 Tables created:');
      console.log('   - complaint_images');
      console.log('   - password_reset_tokens');
      console.log('\n🎉 You can now use the new features!');
      
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:');
    console.error(error.message);
    
    if (error.code === 'ENOENT') {
      console.error('\n💡 Make sure the migration file exists at:');
      console.error(`   ${migrationFile}`);
    } else if (error.code === 'ECONNREFUSED' || error.code === '28P01') {
      console.error('\n💡 Database connection failed. Check your .env file:');
      console.error('   - DB_HOST');
      console.error('   - DB_PORT');
      console.error('   - DB_NAME');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
    } else {
      console.error('\n💡 Full error details:');
      console.error(error);
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration
runMigration().catch(console.error);

