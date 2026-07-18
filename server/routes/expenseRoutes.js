const express = require('express');
const router = express.Router();
const {
  getExpenses, getExpense, createExpense, updateExpense, deleteExpense,
  bulkDelete, duplicateExpense, searchExpenses, exportCSV, exportPDF, checkDuplicate, mergeExpenses, unmergeItem,
} = require('../controllers/expenseController');
const { protect } = require('../middleware/auth');
const { validate, expenseRules, objectIdRule } = require('../middleware/validate');
const upload = require('../middleware/upload');

router.use(protect);

router.get('/search', searchExpenses);
router.get('/check-duplicate', checkDuplicate);
router.get('/export/csv', exportCSV);
router.get('/export/pdf', exportPDF);
router.post('/bulk-delete', bulkDelete);
router.post('/merge', mergeExpenses);

router.route('/')
  .get(getExpenses)
  .post(upload.single('attachment'), expenseRules, validate, createExpense);

router.route('/:id')
  .get(objectIdRule, validate, getExpense)
  .put(objectIdRule, upload.single('attachment'), expenseRules, validate, updateExpense)
  .delete(objectIdRule, validate, deleteExpense);

router.post('/:id/duplicate', objectIdRule, validate, duplicateExpense);
router.post('/:id/unmerge-item', objectIdRule, validate, unmergeItem);

module.exports = router;
