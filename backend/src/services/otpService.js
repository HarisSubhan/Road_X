const axios = require('axios');

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendOTP(phoneNumber, otpCode) {
  const formattedPhone = phoneNumber.startsWith('+92') ? phoneNumber : '+92' + phoneNumber.replace(/^0/, '');
  
  try {
    // Using Twilio as the SMS gateway
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      const url = `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`;
      const auth = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString('base64');
      
      await axios.post(url, 
        new URLSearchParams({
          From: process.env.TWILIO_FROM_NUMBER,
          To: formattedPhone,
          Body: `Your RoadX verification code is: ${otpCode}. Valid for 5 minutes.`
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${auth}`
          }
        }
      );
    } else {
      // Fallback: Log OTP to console for development
      console.log(`[DEV MODE] OTP for ${formattedPhone}: ${otpCode}`);
    }
    
    return true;
  } catch (error) {
    console.error('SMS sending error:', error.message);
    // In development, don't fail if SMS fails
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DEV MODE] OTP for ${formattedPhone}: ${otpCode}`);
      return true;
    }
    throw new Error('Failed to send OTP');
  }
}

module.exports = { generateOTP, sendOTP };
