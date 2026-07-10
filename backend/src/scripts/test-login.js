const axios = require('axios');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const API_URL = 'http://localhost:5000/api';

console.log('🔍 Testing Login API...\n');

// Test 1: Check if backend is running
async function testBackendConnection() {
  try {
    console.log('1️⃣  Testing backend connection...');
    const response = await axios.get(`${API_URL}/health`, { timeout: 3000 });
    console.log('   ✅ Backend is running');
    return true;
  } catch (error) {
    console.log('   ❌ Backend is NOT running or not accessible');
    console.log('   💡 Start backend with: npm run dev');
    return false;
  }
}

// Test 2: Check database connection and users
async function testDatabase() {
  try {
    console.log('\n2️⃣  Testing database connection...');
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'roadx'
    });

    console.log('   ✅ Database connected');

    // Check users table
    const [users] = await connection.query('SELECT id, email, username, full_name, role, is_active, is_blocked FROM users');
    
    if (users.length === 0) {
      console.log('   ⚠️  No users found in database!');
      console.log('   💡 Run: npm run seed');
      console.log('   💡 Then: node src/scripts/create-test-user.js');
    } else {
      console.log(`   ✅ Found ${users.length} user(s):`);
      users.forEach(user => {
        console.log(`      - ${user.full_name} (${user.email || user.username}) - Role: ${user.role} - Active: ${user.is_active}`);
      });
    }

    await connection.end();
    return users.length > 0;
  } catch (error) {
    console.log('   ❌ Database connection failed:', error.message);
    console.log('   💡 Check database credentials in .env file');
    return false;
  }
}

// Test 3: Test login API
async function testLoginAPI() {
  try {
    console.log('\n3️⃣  Testing login API...');
    
    const testCredentials = [
      { email: 'test@example.com', password: 'test123', label: 'Test Customer (email)' },
      { email: 'testuser', password: 'test123', label: 'Test Customer (username)' },
      { email: 'admin@roadx.pk', password: 'Admin@123', label: 'Admin' }
    ];

    let successCount = 0;

    for (const cred of testCredentials) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: cred.email,
          password: cred.password
        }, { timeout: 5000 });

        if (response.data.access_token) {
          console.log(`   ✅ ${cred.label}: SUCCESS`);
          successCount++;
        }
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`   ❌ ${cred.label}: FAILED - ${errorMsg}`);
      }
    }

    return successCount > 0;
  } catch (error) {
    console.log('   ❌ Login API test failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  const backendRunning = await testBackendConnection();
  
  if (!backendRunning) {
    console.log('\n❌ Cannot proceed - backend is not running');
    console.log('\n📋 Quick Start:');
    console.log('   1. Open a new terminal');
    console.log('   2. cd backend');
    console.log('   3. npm run dev');
    console.log('   4. Wait for "Server running on port 5000"');
    console.log('   5. Run this test again\n');
    return;
  }

  const hasUsers = await testDatabase();
  const loginWorks = await testLoginAPI();

  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`Backend Running:     ${backendRunning ? '✅' : '❌'}`);
  console.log(`Database Connected:  ${hasUsers ? '✅' : '❌'}`);
  console.log(`Login API Working:   ${loginWorks ? '✅' : '❌'}`);
  console.log('='.repeat(50));

  if (backendRunning && hasUsers && loginWorks) {
    console.log('\n🎉 All tests passed! Login should work.');
    console.log('\n📱 Mobile App Credentials:');
    console.log('   Email: test@example.com');
    console.log('   Password: test123');
    console.log('\n   OR');
    console.log('\n   Username: testuser');
    console.log('   Password: test123');
  } else {
    console.log('\n❌ Some tests failed. Follow the suggestions above.');
  }
}

runTests().catch(console.error);