const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const createTestUser = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roadx'
    });

    const passwordHash = bcrypt.hashSync('test123', 10);
    
    await connection.query(
      "INSERT INTO users (email, username, full_name, role, password_hash, email_verified, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)",
      ['test@example.com', 'testuser', 'Test User', 'customer', passwordHash, 1, 1]
    );

    console.log('✅ Test user created successfully');
    console.log('   Email: test@example.com');
    console.log('   Username: testuser');
    console.log('   Password: test123');
    
    await connection.end();
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  }
};

createTestUser();