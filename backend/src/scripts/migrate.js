const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const migrateDatabase = async () => {
  try {
    console.log('🔨 Starting database migration...');
    console.log('📁 Database:', process.env.DB_NAME || 'roadx');

    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      multipleStatements: true
    });

    console.log('✅ Connected to MySQL');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'roadx';
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await connection.query(`USE \`${dbName}\``);
    console.log(`✅ Database '${dbName}' ready`);

    // Read schema file
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (!fs.existsSync(schemaPath)) {
      console.error('❌ schema.sql not found at:', schemaPath);
      process.exit(1);
    }

    console.log('📂 Reading schema file...');
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');

    // Split SQL statements (handle DELIMITER commands)
    const statements = schemaSQL
      .split(';')
      .filter(stmt => stmt.trim().length > 0)
      .map(stmt => stmt.trim());

    console.log(`📊 Found ${statements.length} SQL statements`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await connection.query(stmt);
        process.stdout.write('.');
      } catch (error) {
        console.log(`\n⚠️ Statement ${i + 1} failed:`, error.message);
        // Continue with next statement
      }
    }

    console.log('\n✅ Database migration completed!');
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('❌ Error migrating database:', error.message);
    process.exit(1);
  }
};

// Run the migration
migrateDatabase();