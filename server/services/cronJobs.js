const { processDueRecurring } = require('../controllers/recurringController');
const { createNotification } = require('../controllers/notificationController');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

const runRecurringCheck = async () => {
  const count = await processDueRecurring();
  console.log(`[Cron] Processed ${count} recurring expenses`);
  return { processedRecurring: count };
};

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

module.exports = { runRecurringCheck, runBudgetCheck };