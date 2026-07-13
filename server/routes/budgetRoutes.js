const express = require('express');
const router = express.Router();
const { getCurrentBudget, upsertBudget, getBudgetHistory, getCategoryBudget } = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');
const { validate, budgetRules } = require('../middleware/validate');

router.use(protect);

router.get('/current', getCurrentBudget);
router.post('/', budgetRules, validate, upsertBudget);
router.get('/history', getBudgetHistory);
router.get('/category/:category', getCategoryBudget);

module.exports = router;
