const express = require('express');
const router = express.Router();
const { runRecurringCheck, runBudgetCheck, runDailyReminderCheck } = require('../services/cronJobs');

// Shared-secret check — this route is intentionally NOT behind JWT auth,
// since it's meant to be called by an external scheduler (e.g. cron-job.org)
// rather than a logged-in user.
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

// @desc    Run recurring-expense processing on demand
// @route   GET/POST /api/cron/run-recurring?key=CRON_SECRET
router.all('/run-recurring', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runRecurringCheck();
    res.json({ success: true, job: 'recurring', ...result });
  } catch (error) {
    next(error);
  }
});

// @desc    Run budget alert checks on demand
// @route   GET/POST /api/cron/run-budget-check?key=CRON_SECRET
router.all('/run-budget-check', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runBudgetCheck();
    res.json({ success: true, job: 'budget-check', ...result });
  } catch (error) {
    next(error);
  }
});

// @desc    Run "no expense logged today" reminder checks on demand
// @route   GET/POST /api/cron/run-daily-reminder?key=CRON_SECRET
router.all('/run-daily-reminder', requireCronSecret, async (req, res, next) => {
  try {
    const result = await runDailyReminderCheck();
    res.json({ success: true, job: 'daily-reminder', ...result });
  } catch (error) {
    next(error);
  }
});

// @desc    Run both jobs in one call — convenient for a single external scheduler ping
// @route   GET/POST /api/cron/run-all?key=CRON_SECRET
router.all('/run-all', requireCronSecret, async (req, res, next) => {
  try {
    const recurring = await runRecurringCheck();
    const budget = await runBudgetCheck();
    const dailyReminder = await runDailyReminderCheck();
    res.json({ success: true, job: 'run-all', recurring, budget, dailyReminder });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
