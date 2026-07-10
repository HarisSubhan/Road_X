const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const setUserPassword = async () => {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roadx'
    });

    console.log('🔧 Setting password for user...\n');

    // Option 1: Set password for existing user 'haris'
    const username = 'haris';
    const newPassword = 'haris123';

    console.log(`1️⃣  Setting password for username: ${username}`);
    
    // Check if user exists
    const [users] = await connection.query(
      'SELECT id, username, email, password_hash FROM users WHERE username = ?',
      [username]
    );

    if (users.length === 0) {
      console.log(`   ❌ User '${username}' not found`);
    } else {
      const user = users[0];
      console.log(`   ✅ User found: ID=${user.id}, Username=${user.username}`);
      
      // Hash the new password
      const passwordHash = bcrypt.hashSync(newPassword, 10);
      
      // Update the user's password
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [passwordHash, user.id]
      );
      
      console.log(`   ✅ Password set successfully!`);
      console.log(`   📋 New credentials:`);
      console.log(`      Username: ${username}`);
      console.log(`      Password: ${newPassword}`);
    }

    // Option 2: Create a new test user with password
    console.log('\n2️⃣  Creating new test user with password...');
    
    const testEmail = 'test@example.com';
    const testUsername = 'testuser';
    const testPassword = 'test123';
    const testFullName = 'Test User';

    // Check if test user already exists
    const [existingUsers] = await connection.query(
      'SELECT id, email, username FROM users WHERE email = ? OR username = ?',
      [testEmail, testUsername]
    );

    if (existingUsers.length > 0) {
      console.log(`   ⚠️  Test user already exists (ID: ${existingUsers[0].id})`);
      console.log('   💡 Updating password...');
      
      const testPasswordHash = bcrypt.hashSync(testPassword, 10);
      await connection.query(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [testPasswordHash, existingUsers[0].id]
      );
      
      console.log(`   ✅ Password updated for test user`);
    } else {
      // Create new test user
      const testPasswordHash = bcrypt.hashSync(testPassword, 10);
      
      await connection.query(
        `INSERT INTO users (email, username, full_name, role, password_hash, email_verified, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [testEmail, testUsername, testFullName, 'customer', testPasswordHash, 1, 1]
      );
      
      console.log(`   ✅ Test user created successfully!`);
    }

    console.log(`\n📋 Test User Credentials:`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Username: ${testUsername}`);
    console.log(`   Password: ${testPassword}`);

    // List all users with passwords
    console.log('\n3️⃣  All users in database:');
    const [allUsers] = await connection.query(
      'SELECT id, username, email, full_name, role, is_active, is_blocked, password_hash IS NOT NULL as has_password FROM users'
    );
    
    allUsers.forEach(user => {
      const status = user.has_password ? '✅ Has password' : '❌ No password';
      console.log(`   - ID: ${user.id}, ${user.full_name} (${user.email || user.username}) - ${user.role} - ${status}`);
    });

    await connection.end();
    
    console.log('\n✅ Done! You can now login with:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${newPassword}`);
    console.log(`\n   OR`);
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

setUserPassword();