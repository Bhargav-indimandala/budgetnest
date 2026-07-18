const { validationResult, body, param, query } = require('express-validator');
const { getISTDayRangeUTC } = require('../utils/dateUtils');

// Middleware to check validation results
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

// Sanitize input to prevent MongoDB injection
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    if (Array.isArray(obj)) {
      return obj.map((item) => sanitize(item));
    }
    const sanitized = {};
    for (const key in obj) {
      if (key.startsWith('$')) continue; // Strip $ operators
      if (typeof obj[key] === 'object' && obj[key] !== null && !(obj[key] instanceof Date)) {
        sanitized[key] = sanitize(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
    return sanitized;
  };
  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};

// Auth validation rules
const registerRules = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 50 }).withMessage('Name too long'),
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginRules = [
  body('email').trim().isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

const changePasswordRules = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

// Expense validation rules
const expenseRules = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('quantity').optional().isInt({ min: 1 }).withMessage('Quantity must be at least 1'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('paymentMethod').optional().isIn(['Cash', 'UPI', 'Card', 'Online', 'Other']),
  body('date').optional().isISO8601().withMessage('Invalid date format'),
  body('date').custom((value, { req }) => {
    if (!value) return true;
    if (req.body.isPlanned === true || req.body.isPlanned === 'true') return true;
    const { endUTC: endOfTodayIST } = getISTDayRangeUTC();
    if (new Date(value) > endOfTodayIST) {
      throw new Error('Date cannot be in the future unless marked as a planned expense');
    }
    return true;
  }),
  body('isPlanned').optional().isBoolean(),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('isRecurring').optional().isBoolean(),
  body('tags').optional().isArray(),
  body('location').optional().trim(),
];

// Budget validation rules
const budgetRules = [
  body('month').isInt({ min: 1, max: 12 }).withMessage('Month must be 1-12'),
  body('year').isInt({ min: 2020, max: 2100 }).withMessage('Invalid year'),
  body('totalBudget').isFloat({ min: 0 }).withMessage('Budget must be 0 or greater'),
  body('categoryBudgets').optional().isArray(),
  body('categoryBudgets.*.category').optional().trim().notEmpty(),
  body('categoryBudgets.*.limit').optional().isFloat({ min: 0 }),
];

// Asset validation rules
const assetRules = [
  body('name').trim().notEmpty().withMessage('Asset name is required').isLength({ max: 100 }),
  body('purchasePrice').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['Active', 'Disposed', 'Damaged']),
  body('expectedLifetime').optional().trim(),
  body('category').optional().trim(),
  body('notes').optional().trim().isLength({ max: 500 }),
];

// Grocery validation rules
const groceryRules = [
  body('name').trim().notEmpty().withMessage('Grocery name is required').isLength({ max: 100 }),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be 0 or greater'),
  body('unit').isIn(['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet']).withMessage('Invalid unit'),
  body('purchaseDate').optional().isISO8601().withMessage('Invalid date format'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be 0 or greater'),
  body('estimatedRemainingQty').optional().isFloat({ min: 0 }),
  body('category').optional().isIn(['Grains', 'Dairy', 'Vegetables', 'Fruits', 'Spices', 'Oil', 'Snacks', 'Beverages', 'General']),
];

// Recurring expense validation rules
const recurringExpenseRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('category').trim().notEmpty().withMessage('Category is required'),
  body('frequency').optional().isIn(['monthly', 'weekly', 'yearly']),
  body('nextDueDate').isISO8601().withMessage('Valid due date is required'),
  body('notes').optional().trim(),
];

// MongoDB ObjectId param validation
const objectIdRule = [
  param('id').isMongoId().withMessage('Invalid ID format'),
];

module.exports = {
  validate,
  sanitizeInput,
  registerRules,
  loginRules,
  changePasswordRules,
  expenseRules,
  budgetRules,
  assetRules,
  groceryRules,
  recurringExpenseRules,
  objectIdRule,
};
