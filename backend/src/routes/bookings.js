const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');  

const {
  createBooking,
  getMyBookings,
  getBookingById,
  cancelBooking,
  updateBookingStatus,
  rateBooking,
  getProviderActiveBooking,
  getProviderHistory,
  confirmCashPayment,
  getBookingStatusHistory
} = require('../controllers/bookingsController');

const router = express.Router();

router.post('/', authenticate, requireRole('customer'), [
  body('category_id').isInt().withMessage('Category ID must be an integer'),
  body('pickup_lat').isFloat().withMessage('Pickup latitude must be a number'),
  body('pickup_lng').isFloat().withMessage('Pickup longitude must be a number'),
  body('pickup_address').notEmpty().withMessage('Pickup address is required')
], handleValidationErrors, createBooking);

router.get('/my', authenticate, requireRole('customer'), getMyBookings);

router.get('/provider/active', authenticate, requireRole('provider'), getProviderActiveBooking);

router.get('/provider/history', authenticate, requireRole('provider'), getProviderHistory);

router.get('/:id', authenticate, getBookingById);

router.get('/:id/history', authenticate, getBookingStatusHistory);

router.post('/:id/cancel', authenticate, cancelBooking);

router.put('/:id/status', authenticate, requireRole('provider'), [
  body('status').notEmpty().withMessage('Status is required')
], handleValidationErrors, updateBookingStatus);

router.post('/:id/rate', authenticate, requireRole('customer'), [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5')
], handleValidationErrors, rateBooking);

router.post('/:id/confirm-cash', authenticate, requireRole('provider'), confirmCashPayment);

module.exports = router;
