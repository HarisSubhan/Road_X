const crypto = require('crypto');
const axios = require('axios');

function generateHash(params, hashKey) {
  const sorted = Object.keys(params).sort();
  const hashStr = sorted.map(k => `${k}=${params[k]}`).join('&');
  return crypto.createHmac('sha256', hashKey).update(hashStr).digest('hex');
}

async function initiatePayment({ amount, bookingRef, customerPhone, returnUrl }) {
  const params = {
   storeId: process.env.EASYPAISA_STORE_ID,
    amount: String(amount),
    accountNum: customerPhone.replace('+92', '').trim(),
    txnRefNo: bookingRef,
    txnDateTime: new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14),
    paymentMode: 'MWALLET',
    returnUrl: returnUrl,
    email: '',
    mobileNum: customerPhone.replace('+92', '').trim()
  };

  const hash = generateHash(params, process.env.EASYPAISA_HASH_KEY);
  params.hmac = hash;

  try {
    const { data } = await axios.post(
      'https://easypaisa.com.pk/easypay/Confirm.jsf',
      params
    );
    return data;
  } catch (error) {
    console.error('Easypaisa payment error:', error.message);
    throw new Error('Failed to initiate Easypaisa payment');
  }
}

function verifyCallback(params, hashKey) {
  const receivedHash = params.hmac;
  const paramsCopy = { ...params };
  delete paramsCopy.hmac;
  const calculatedHash = generateHash(paramsCopy, hashKey);
  
  return receivedHash === calculatedHash;
}

module.exports = { initiatePayment, verifyCallback };
