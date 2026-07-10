const express = require('express');
const { body } = require('express-validator');
const { handleValidationErrors } = require('../middleware/validate');
const { authenticateAdmin } = require('../middleware/auth');
const { requireAdminRole } = require('../middleware/roles');  // Import requireAdminRole from roles.js

const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryStats
} = require('../controllers/categoriesController');

const router = express.Router();

router.get('/', getAllCategories);

router.get('/:id', getCategoryById);

router.get('/:id/stats', getCategoryStats);

router.post('/', authenticateAdmin, requireAdminRole('admin', 'super_admin'), [
  body('name_en').notEmpty().withMessage('Name (English) is required'),
  body('base_fare').isFloat({ min: 0 }).withMessage('Base fare must be non-negative'),
  body('price_per_km').isFloat({ min: 0 }).withMessage('Price per KM must be non-negative')
], handleValidationErrors, createCategory);

router.put('/:id', authenticateAdmin, requireAdminRole('admin', 'super_admin'), updateCategory);

router.delete('/:id', authenticateAdmin, requireAdminRole('admin', 'super_admin'), deleteCategory);

module.exports = router;
