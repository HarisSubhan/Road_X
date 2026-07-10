const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { estimateFare } = require('../controllers/fareController');

const router = express.Router();

router.post('/estimate', [
  body('category_id').isInt().withMessage('Category ID must be an integer'),
  body('pickup_lat').isFloat().withMessage('Pickup latitude must be a number'),
  body('pickup_lng').isFloat().withMessage('Pickup longitude must be a number')
], handleValidationErrors, estimateFare);

module.exports = router;
