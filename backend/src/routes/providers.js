const express = require('express');
const { body } = require('express-validator');
const multer = require('multer');
const path = require('path');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');  
const {
  registerProvider,
  uploadDocuments,
  getMyProfile,
  updateAvailability,
  getNearbyProviders,
  getEarnings
} = require('../controllers/providersController');

const router = express.Router();

const upload = multer({
  dest: process.env.UPLOAD_DIR || './uploads',
  limits: { fileSize: (process.env.MAX_FILE_SIZE_MB || 5) * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

router.post('/register', [
  body('cnic_number').notEmpty().withMessage('CNIC number is required'),
  body('service_category_id').isInt().withMessage('Service category ID must be an integer')
], handleValidationErrors, registerProvider);

router.post('/documents', authenticate, upload.fields([
  { name: 'cnic_front', maxCount: 1 },
  { name: 'cnic_back', maxCount: 1 },
  { name: 'license', maxCount: 1 },
  { name: 'certification', maxCount: 1 }
]), uploadDocuments);

router.get('/me', authenticate, requireRole('provider'), getMyProfile);

router.put('/availability', authenticate, requireRole('provider'), [
  body('is_online').isBoolean().withMessage('is_online must be a boolean')
], handleValidationErrors, updateAvailability);

router.get('/nearby', getNearbyProviders);

router.get('/earnings', authenticate, requireRole('provider'), getEarnings);

module.exports = router;
