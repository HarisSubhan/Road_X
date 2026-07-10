const crypto = require('crypto');
const axios = require('axios');

function generateHash(params, salt) {
  const sorted = Object.keys(params).filter(k => k !== 'pp_SecureHash').sort();
  const hashStr = salt + sorted.map(k => params[k]).join('&');
  return crypto.createHmac('sha256', salt).update(hashStr).digest('hex').toUpperCase();
}

async function initiatePayment({ amount, bookingRef, customerPhone, returnUrl }) {
  const params = {
    pp_Version: '1.1',
    pp_TxnType: 'MWALLET',
    pp_Language: 'EN',
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID,
    pp_Password: process.env.JAZZCASH_PASSWORD,
    pp_TxnRefNo: bookingRef,
    pp_Amount: String(amount * 100), // in paisas
    pp_TxnCurrency: 'PKR',
    pp_TxnDateTime: new Date().toISOString().replace(/[-:T.Z]/g,'').slice(0,14),
    pp_BillReference: bookingRef,
    pp_Description: 'RoadX Service - ' + bookingRef,
    pp_MobileNumber: customerPhone,
    pp_ReturnURL: returnUrl,
  };
  
  params.pp_SecureHash = generateHash(params, process.env.JAZZCASH_INTEGRITY_SALT);
  
  try {
    const { data } = await axios.post(
      process.env.JAZZCASH_API_URL + '/Purchase/DoMWalletTransaction',
      params
    );
    return data;
  } catch (error) {
    console.error('JazzCash payment error:', error.message);
    throw new Error('Failed to initiate JazzCash payment');
  }
}

function verifyCallback(params) {
  const receivedHash = params.pp_SecureHash;
  const calculatedHash = generateHash(params, process.env.JAZZCASH_INTEGRITY_SALT);
  
  return receivedHash === calculatedHash;
}

module.exports = { initiatePayment, verifyCallback };
