const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const addUsernameColumn = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roadx'
    });

    await connection.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE AFTER email
    `);

    console.log('✅ username column added to users table');
    await connection.end();
  } catch (error) {
    console.error('❌ Error adding column:', error.message);
    process.exit(1);
  }
};

addUsernameColumn();