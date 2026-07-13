const express = require('express');
const router = express.Router();
const { runRecurringCheck, runBudgetCheck } = require('../services/cronJobs');

const requireCronSecret = (req, res, next) => {
  const provided = req.query.key || req.headers['x-cron-secret'];
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    return res.status(503).json({
      success: false,
      message: 'CRON_SECRET is not configured on the server',
    });
  }

  if (!provided || provided !== expected) {
    return res.status(401).json({ success: false, message: 'Invalid or missing cron key' });
  }

  next();
};

router.all('/run-recurring', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runRecurringCheck();
    res.json({ success: true, job: 'recurring', ...result });
  } catch (error) {
    next(error);
  }
});

router.all('/run-budget-check', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runBudgetCheck();
    res.json({ success: true, job: 'budget-check', ...result });
  } catch (error) {
    next(error);
  }
});

router.all('/run-all', requireCronSecret, async (req, res, next) => {
  try {
    const recurring = await runRecurringCheck();
    const budget = await runBudgetCheck();
    res.json({ success: true, job: 'run-all', recurring, budget });
  } catch (error) {
    next(error);
  }
});

module.exports = router;