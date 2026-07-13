const express = require('express');
const router = express.Router();
const {
  getDashboard, getMonthlyAnalytics, getWeeklyAnalytics,
  getDailyTrend, getInsights, getCategoryBreakdown, getHeatmap,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/monthly', getMonthlyAnalytics);
router.get('/weekly', getWeeklyAnalytics);
router.get('/daily-trend', getDailyTrend);
router.get('/insights', getInsights);
router.get('/category-breakdown', getCategoryBreakdown);
router.get('/heatmap', getHeatmap);

module.exports = router;
