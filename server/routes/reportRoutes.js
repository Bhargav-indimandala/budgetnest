const express = require('express');
const router = express.Router();
const { getMonthlyReport, getWeeklyReport, getCategoryReport } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/monthly/:year/:month', getMonthlyReport);
router.get('/weekly', getWeeklyReport);
router.get('/category/:category', getCategoryReport);

module.exports = router;
