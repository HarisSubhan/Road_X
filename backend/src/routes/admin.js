const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateAdmin, requireAdminRole } = require('../middleware/auth');
const {
  adminLogin,
  getDashboard,
  getProviders,
  updateProviderApproval,
  getBookings,
  getBookingDetail,
  getEarningsReport,
  getUsers,
  updateUserStatus,
  getSettings,
  updateSetting,
  broadcastNotification,
  getCommissionSettings,
  createCommissionSetting,
  registerProvider
} = require('../controllers/adminController');

// Configure multer for provider document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/provider-documents');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'provider-doc-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image and PDF files are allowed (jpeg, jpg, png, pdf)'));
  }
});

const router = express.Router();

router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required')
], handleValidationErrors, adminLogin);

router.get('/dashboard', authenticateAdmin, getDashboard);

router.get('/providers', authenticateAdmin, getProviders);

router.put('/providers/:id/approval', authenticateAdmin, [
  body('action').isIn(['approve', 'reject', 'suspend', 'reinstate']).withMessage('Invalid action')
], handleValidationErrors, updateProviderApproval);

router.get('/bookings', authenticateAdmin, getBookings);

router.get('/bookings/:id', authenticateAdmin, getBookingDetail);

router.get('/reports/earnings', authenticateAdmin, getEarningsReport);

router.get('/users', authenticateAdmin, getUsers);

router.put('/users/:id/status', authenticateAdmin, [
  body('action').isIn(['block', 'unblock', 'activate', 'deactivate']).withMessage('Invalid action')
], handleValidationErrors, updateUserStatus);

router.get('/settings', authenticateAdmin, getSettings);

router.put('/settings/:key', authenticateAdmin, updateSetting);

router.post('/notifications/broadcast', authenticateAdmin, [
  body('target').isIn(['everyone', 'customers', 'providers']).withMessage('Invalid target'),
  body('title_en').notEmpty().withMessage('Title (English) is required'),
  body('body_en').notEmpty().withMessage('Body (English) is required')
], handleValidationErrors, broadcastNotification);

router.get('/commission-settings', authenticateAdmin, getCommissionSettings);

router.post('/commission-settings', authenticateAdmin, [
  body('commission_percentage').isFloat({ min: 0, max: 100 }).withMessage('Commission percentage must be between 0 and 100')
], handleValidationErrors, createCommissionSetting);

router.post('/providers/register', authenticateAdmin, upload.fields([
  { name: 'cnic_front', maxCount: 1 },
  { name: 'cnic_back', maxCount: 1 },
  { name: 'driving_license', maxCount: 1 },
  { name: 'vehicle_registration', maxCount: 1 }
]), registerProvider);

module.exports = router;
