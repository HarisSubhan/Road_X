const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');  
const {
  initiatePayment,
  jazzCashCallback,
  easypaisaCallback,
  getPaymentStatus
} = require('../controllers/paymentsController');

const router = express.Router();

router.post('/initiate', authenticate, requireRole('customer'), [
  body('booking_id').isInt().withMessage('Booking ID must be an integer'),
  body('payment_method').isIn(['cash', 'jazzcash', 'easypaisa']).withMessage('Invalid payment method')
], handleValidationErrors, initiatePayment);

router.post('/jazzcash/callback', jazzCashCallback);

router.post('/easypaisa/callback', easypaisaCallback);

router.get('/status/:bookingId', authenticate, getPaymentStatus);

module.exports = router;
