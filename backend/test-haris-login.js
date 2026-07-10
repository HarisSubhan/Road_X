const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

console.log('🔍 Testing login with user "haris"...\n');

async function testLogin() {
  try {
    console.log('Attempting login with username: haris');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'haris',
      password: 'test123'
    });

    console.log('✅ Login SUCCESS!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ Login FAILED');
    console.log('Error:', error.response?.data?.error || error.message);
    
    if (error.response?.data?.error === 'Please set a password first') {
      console.log('\n⚠️  User exists but has no password set!');
      console.log('This user needs to set a password first.');
    }
  }
}

testLogin();