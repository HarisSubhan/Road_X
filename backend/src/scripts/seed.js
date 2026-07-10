const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const seedDatabase = async () => {
  try {
    const dbName = process.env.DB_NAME || 'roadx';
    console.log('🌱 Starting database seeding...');
    console.log('📁 Database:', dbName);

    // Create connection
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: dbName,
      multipleStatements: true
    });

    console.log('✅ Connected to database');

    // Read the seed file
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    if (!fs.existsSync(seedPath)) {
      console.error('❌ seed.sql file not found at:', seedPath);
      process.exit(1);
    }

    console.log('📂 Reading seed file...');
    const seedSQL = fs.readFileSync(seedPath, 'utf8');

    // Execute the seed
    await connection.query(seedSQL);
    
    console.log('✅ Database seeded successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('   Username: admin');
    console.log('   Password: Admin@123');
    
    // Close connection
    await connection.end();
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.sql) {
      console.error('SQL Error:', error.sql);
    }
    process.exit(1);
  }
};

// Run the seed
seedDatabase();