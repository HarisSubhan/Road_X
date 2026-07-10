const Transaction = require('../models/Transaction');
const Booking = require('../models/Booking');
const CommissionSettings = require('../models/CommissionSettings');
const { initiatePayment: initiateJazzCashPayment, verifyCallback: verifyJazzCashCallback } = require('../services/jazzCashService');
const { initiatePayment: initiateEasypaisaPayment, verifyCallback: verifyEasypaisaCallback } = require('../services/easypaisaService');
const db = require('../config/db');

const initiatePayment = async (req, res) => {
  try {
    const { booking_id, payment_method } = req.body;
    
    const booking = await Booking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    if (booking.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (booking.payment_method !== payment_method) {
      return res.status(400).json({ error: 'Payment method mismatch' });
    }
    
    const returnUrl = `${process.env.CORS_ORIGIN}/payment/callback/${booking_id}`;
    
    let paymentData;
    
    if (payment_method === 'jazzcash') {
      const customer = await db.query('SELECT phone_number FROM users WHERE id = ?', [booking.customer_id]);
      paymentData = await initiateJazzCashPayment({
        amount: booking.estimated_fare,
        bookingRef: booking.booking_ref,
        customerPhone: customer[0].phone_number,
        returnUrl
      });
    } else if (payment_method === 'easypaisa') {
      const customer = await db.query('SELECT phone_number FROM users WHERE id = ?', [booking.customer_id]);
      paymentData = await initiateEasypaisaPayment({
        amount: booking.estimated_fare,
        bookingRef: booking.booking_ref,
        customerPhone: customer[0].phone_number,
        returnUrl
      });
    } else {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    
    res.json(paymentData);
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
};

const jazzCashCallback = async (req, res) => {
  try {
    const isValid = verifyJazzCashCallback(req.body);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid callback signature' });
    }
    
    const bookingRef = req.body.pp_TxnRefNo;
    const booking = await Booking.findByRef(bookingRef);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const isSuccess = req.body.pp_ResponseCode === '000';
    
    if (isSuccess) {
      const commissionSetting = await CommissionSettings.getByCategoryId(booking.category_id) || await CommissionSettings.getGlobal();
      const commissionPercentage = commissionSetting ? commissionSetting.commission_percentage : 15;
      
      const commissionAmount = (booking.estimated_fare * commissionPercentage) / 100;
      const providerAmount = booking.estimated_fare - commissionAmount;
      
      const existingTransaction = await Transaction.findByBookingId(booking.id);
      if (!existingTransaction) {
        await Transaction.create({
          booking_id: booking.id,
          customer_id: booking.customer_id,
          provider_id: booking.provider_id,
          amount: booking.estimated_fare,
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,
          provider_amount: providerAmount,
          payment_method: 'jazzcash',
          payment_status: 'paid',
          gateway_reference: req.body.pp_TxnRefNo,
          gateway_response: req.body
        });
      }
      
      await Booking.update(booking.id, { payment_status: 'paid', final_fare: booking.estimated_fare });
    }
    
    res.json({ success: isSuccess });
  } catch (error) {
    console.error('JazzCash callback error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
};

const easypaisaCallback = async (req, res) => {
  try {
    const isValid = verifyEasypaisaCallback(req.body, process.env.EASYPAISA_HASH_KEY);
    
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid callback signature' });
    }
    
    const bookingRef = req.body.txnRefNo;
    const booking = await Booking.findByRef(bookingRef);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    const isSuccess = req.body.respCode === '000';
    
    if (isSuccess) {
      const commissionSetting = await CommissionSettings.getByCategoryId(booking.category_id) || await CommissionSettings.getGlobal();
      const commissionPercentage = commissionSetting ? commissionSetting.commission_percentage : 15;
      
      const commissionAmount = (booking.estimated_fare * commissionPercentage) / 100;
      const providerAmount = booking.estimated_fare - commissionAmount;
      
      const existingTransaction = await Transaction.findByBookingId(booking.id);
      if (!existingTransaction) {
        await Transaction.create({
          booking_id: booking.id,
          customer_id: booking.customer_id,
          provider_id: booking.provider_id,
          amount: booking.estimated_fare,
          commission_percentage: commissionPercentage,
          commission_amount: commissionAmount,
          provider_amount: providerAmount,
          payment_method: 'easypaisa',
          payment_status: 'paid',
          gateway_reference: req.body.txnRefNo,
          gateway_response: req.body
        });
      }
      
      await Booking.update(booking.id, { payment_status: 'paid', final_fare: booking.estimated_fare });
    }
    
    res.json({ success: isSuccess });
  } catch (error) {
    console.error('Easypaisa callback error:', error);
    res.status(500).json({ error: 'Failed to process callback' });
  }
};

const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const transaction = await Transaction.findByBookingId(bookingId);
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    res.json({
      payment_status: transaction.payment_status,
      payment_method: transaction.payment_method,
      amount: transaction.amount
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ error: 'Failed to fetch payment status' });
  }
};

module.exports = {
  initiatePayment,
  jazzCashCallback,
  easypaisaCallback,
  getPaymentStatus
};
