const { processDueRecurring } = require('../controllers/recurringController');
const { createNotification } = require('../controllers/notificationController');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { getISTParts, getISTDayRangeUTC } = require('../utils/dateUtils');

// Process due recurring expenses (rent, internet, subscriptions, etc.)
const runRecurringCheck = async () => {
  const count = await processDueRecurring();
  console.log(`[Cron] Processed ${count} recurring expenses`);
  return { processedRecurring: count };
};

// Check every user's current-month budget usage and alert if needed
const runBudgetCheck = async () => {
  let warned = 0;
  let exceeded = 0;
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const budgets = await Budget.find({ month, year });

    for (const budget of budgets) {
      const expenses = await Expense.find({
        userId: budget.userId,
        isPlanned: { $ne: true },
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
      const percentUsed = budget.totalBudget > 0 ? (totalSpent / budget.totalBudget) * 100 : 0;

      if (percentUsed >= 100) {
        await createNotification(
          budget.userId,
          'budget_exceeded',
          'Budget Exceeded! 🚨',
          `You've exceeded your monthly budget by ₹${Math.round(totalSpent - budget.totalBudget).toLocaleString()}.`
        );
        exceeded += 1;
      } else if (percentUsed >= 80) {
        await createNotification(
          budget.userId,
          'budget_exceeded',
          'Budget Warning ⚠️',
          `You've used ${Math.round(percentUsed)}% of your monthly budget. Be cautious with spending.`
        );
        warned += 1;
      }
    }
  } catch (error) {
    console.error('[Cron] Budget alert error:', error.message);
  }
  console.log(`[Cron] Budget check: ${warned} warnings, ${exceeded} exceeded`);
  return { warned, exceeded };
};

module.exports = { runRecurringCheck, runBudgetCheck, runDailyReminderCheck };

// Checks each user with the "no expense added today" preference enabled:
// if it's past their chosen reminderTime (IST) and they haven't logged any
// expense yet today, and we haven't already sent this reminder today, send it.
async function runDailyReminderCheck() {
  let sent = 0;
  try {
    const { hours: nowHours, minutes: nowMinutes } = getISTParts();
    const nowTotalMinutes = nowHours * 60 + nowMinutes;
    const { startUTC, endUTC } = getISTDayRangeUTC();

    const users = await User.find({ 'notificationPrefs.dailyReminder': true }).select(
      '+reminderTime +notificationPrefs'
    );

    for (const user of users) {
      const [reminderHour, reminderMinute] = (user.reminderTime || '20:00').split(':').map(Number);
      const reminderTotalMinutes = reminderHour * 60 + reminderMinute;

      // Only fire once it's actually past the user's chosen time today
      if (nowTotalMinutes < reminderTotalMinutes) continue;

      const hasExpenseToday = await Expense.exists({
        userId: user._id,
        isPlanned: { $ne: true },
        date: { $gte: startUTC, $lte: endUTC },
      });
      if (hasExpenseToday) continue;

      const alreadySentToday = await Notification.exists({
        userId: user._id,
        type: 'daily_reminder',
        createdAt: { $gte: startUTC, $lte: endUTC },
      });
      if (alreadySentToday) continue;

      await createNotification(
        user._id,
        'daily_reminder',
        "Don't forget today's expenses 📝",
        "You haven't logged any expense today yet. Add one now so your budget stays accurate."
      );
      sent += 1;
    }
  } catch (error) {
    console.error('[Cron] Daily reminder check error:', error.message);
  }
  console.log(`[Cron] Daily reminder check: ${sent} reminder(s) sent`);
  return { sent };
}

