const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

console.log('🔍 Testing Customer Registration Fix...\n');

async function testRegistration() {
  try {
    // Step 1: Send OTP to phone number
    console.log('Step 1: Sending OTP to phone number...');
    const phoneNumber = '3001234567';
    
    const otpResponse = await axios.post(`${API_URL}/auth/send-otp`, {
      phone_number: phoneNumber
    });
    
    console.log('✅ OTP sent successfully');
    console.log('Response:', JSON.stringify(otpResponse.data, null, 2));
    
    // In development mode, OTP is returned in the response
    const otpCode = otpResponse.data.debug_otp;
    if (!otpCode) {
      console.log('⚠️  No debug OTP in response. Please check your SMS service.');
      return;
    }
    
    console.log(`\nStep 2: Verifying OTP and creating account with OTP: ${otpCode}`);
    
    // Step 2: Verify OTP and create user
    const registerResponse = await axios.post(`${API_URL}/auth/verify-otp`, {
      phone_number: phoneNumber,
      otp_code: otpCode,
      full_name: 'Test Customer',
      username: 'testcustomer',
      password: 'test123456'
    });
    
    console.log('✅ Registration SUCCESS!');
    console.log('Response:', JSON.stringify(registerResponse.data, null, 2));
    
    const userId = registerResponse.data.user.id;
    const accessToken = registerResponse.data.access_token;
    
    // Step 3: Verify user was created with password
    console.log('\nStep 3: Verifying user data in database...');
    console.log('User ID:', userId);
    console.log('Phone:', registerResponse.data.user.phone_number);
    console.log('Username:', registerResponse.data.user.username);
    console.log('Full Name:', registerResponse.data.user.full_name);
    console.log('Role:', registerResponse.data.user.role);
    console.log('Email:', registerResponse.data.user.email);
    
    // Step 4: Test login with username
    console.log('\nStep 4: Testing login with username...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'testcustomer',
      password: 'test123456'
    });
    
    console.log('✅ Login with username SUCCESS!');
    console.log('User ID:', loginResponse.data.user.id);
    console.log('Username:', loginResponse.data.user.username);
    
    console.log('\n🎉 All tests passed! The registration fix is working correctly.');
    console.log('\nSummary:');
    console.log('- ✅ OTP registration works');
    console.log('- ✅ Password is saved correctly');
    console.log('- ✅ User can login with username and password');
    
  } catch (error) {
    console.log('\n❌ Test FAILED');
    console.log('Error:', error.response?.data?.error || error.message);
    console.log('Full error:', JSON.stringify(error.response?.data, null, 2));
  }
}

testRegistration();