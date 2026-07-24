const express = require('express');
const router = express.Router();
const { getMonthlyReport, getWeeklyReport, getCategoryReport, getYearlyReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/monthly/:year/:month', getMonthlyReport);
router.get('/yearly/:year', getYearlyReport);
router.get('/weekly', getWeeklyReport);
router.get('/category/:category', getCategoryReport);

module.exports = router;
