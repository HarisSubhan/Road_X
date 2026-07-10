const express = require('express');
const { body } = require('express-validator');
const { authLimiter } = require('../middleware/rateLimiter');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
  sendOTPHandler,
  verifyOTPHandler,
  verifyOTPOnlyHandler,
  loginWithEmailHandler,
  refreshTokenHandler,
  logoutHandler,
  updateProfileHandler,
  updateFCMTokenHandler,
  uploadProfileImage
} = require('../controllers/authController');

const router = express.Router();

// Phone number verification routes
router.post('/send-otp', authLimiter, [
  body('phone_number').notEmpty().withMessage('Phone number is required')
], handleValidationErrors, sendOTPHandler);

router.post('/verify-otp', authLimiter, [
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('otp_code').notEmpty().withMessage('OTP code is required'),
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('username').notEmpty().withMessage('Username is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], handleValidationErrors, verifyOTPHandler);

// Login with email or username & password
router.post('/login', authLimiter, [
  body('email').notEmpty().withMessage('Email or username is required'),
  body('password').notEmpty().withMessage('Password is required')
], handleValidationErrors, loginWithEmailHandler);

// Verify OTP only (no user creation - for provider registration)
router.post('/verify-otp-only', [
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('otp_code').notEmpty().withMessage('OTP code is required')
], handleValidationErrors, verifyOTPOnlyHandler);

// Other routes
router.post('/refresh', refreshTokenHandler);
router.post('/logout', authenticate, logoutHandler);
router.put('/profile', authenticate, uploadProfileImage, updateProfileHandler);
router.put('/fcm-token', authenticate, updateFCMTokenHandler);

module.exports = router;