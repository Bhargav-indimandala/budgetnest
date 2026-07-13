const express = require('express');
const router = express.Router();
const {
  getRecurringExpenses, createRecurringExpense,
  updateRecurringExpense, deleteRecurringExpense,
} = require('../controllers/recurringController');
const { protect } = require('../middleware/auth');
const { validate, recurringExpenseRules, objectIdRule } = require('../middleware/validate');

router.use(protect);

router.route('/')
  .get(getRecurringExpenses)
  .post(recurringExpenseRules, validate, createRecurringExpense);

router.route('/:id')
  .put(objectIdRule, updateRecurringExpense)
  .delete(objectIdRule, validate, deleteRecurringExpense);

module.exports = router;
