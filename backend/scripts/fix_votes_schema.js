
const pool = require("../config/database");

const fixSchema = async () => {
  try {
    console.log("Fixing votes table schema...");
    
    // Drop the existing constraint
    await pool.query(`
      ALTER TABLE votes 
      DROP CONSTRAINT IF EXISTS votes_vote_type_check
    `);
    
    // Add new constraint allowing 'up', 'down', and keeping 'support' for legacy
    await pool.query(`
      ALTER TABLE votes 
      ADD CONSTRAINT votes_vote_type_check 
      CHECK (vote_type IN ('up', 'down', 'support'))
    `);

    console.log("✅ Schema updated successfully");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating schema:", error);
    process.exit(1);
  }
};

fixSchema();
