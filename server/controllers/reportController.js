const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const Report = require('../models/Report');

// @desc    Get monthly report
// @route   GET /api/reports/monthly/:year/:month
exports.getMonthlyReport = async (req, res, next) => {
  try {
    const { year, month } = req.params;
    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: req.user._id,
      isPlanned: { $ne: true },
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort('-date');

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categoryBreakdown = {};
    const dailyBreakdown = {};
    const paymentMethods = {};

    expenses.forEach((e) => {
      // Category
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      // Daily
      const dateKey = e.date.toISOString().split('T')[0];
      dailyBreakdown[dateKey] = (dailyBreakdown[dateKey] || 0) + e.amount;
      // Payment method
      paymentMethods[e.paymentMethod] = (paymentMethods[e.paymentMethod] || 0) + e.amount;
    });

    const budget = await Budget.findOne({
      userId: req.user._id,
      month: parseInt(month),
      year: parseInt(year),
    });

    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate();
    const mostExpensiveDay = Object.entries(dailyBreakdown).sort((a, b) => b[1] - a[1])[0];
    const topCategory = Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0];

    const report = {
      month: parseInt(month),
      year: parseInt(year),
      totalSpent,
      totalBudget: budget ? budget.totalBudget : 0,
      remaining: budget ? budget.totalBudget - totalSpent : 0,
      transactionCount: expenses.length,
      avgDaily: Math.round(totalSpent / daysInMonth),
      categoryBreakdown,
      dailyBreakdown,
      paymentMethods,
      mostExpensiveDay: mostExpensiveDay ? { date: mostExpensiveDay[0], amount: mostExpensiveDay[1] } : null,
      topCategory: topCategory ? { category: topCategory[0], amount: topCategory[1] } : null,
      expenses: expenses.map((e) => ({
        title: e.title,
        amount: e.amount,
        category: e.category,
        paymentMethod: e.paymentMethod,
        date: e.date.toISOString().split('T')[0],
        notes: e.notes,
      })),
    };

    res.json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly report
// @route   GET /api/reports/weekly
exports.getWeeklyReport = async (req, res, next) => {
  try {
    const now = new Date();
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const expenses = await Expense.find({
      userId: req.user._id,
      isPlanned: { $ne: true },
      date: { $gte: startOfWeek, $lte: endOfWeek },
    }).sort('-date');

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const categoryBreakdown = {};
    expenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    res.json({
      success: true,
      report: {
        weekStart: startOfWeek.toISOString().split('T')[0],
        weekEnd: endOfWeek.toISOString().split('T')[0],
        totalSpent,
        transactionCount: expenses.length,
        avgDaily: Math.round(totalSpent / 7),
        categoryBreakdown,
        expenses: expenses.map((e) => ({
          title: e.title,
          amount: e.amount,
          category: e.category,
          date: e.date.toISOString().split('T')[0],
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category report
// @route   GET /api/reports/category/:category
exports.getCategoryReport = async (req, res, next) => {
  try {
    const { category } = req.params;
    const { months = 6 } = req.query;
    const now = new Date();

    const data = [];
    for (let i = 0; i < parseInt(months); i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const expenses = await Expense.find({
        userId: req.user._id,
        isPlanned: { $ne: true },
        category,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      data.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total: expenses.reduce((sum, e) => sum + e.amount, 0),
        count: expenses.length,
      });
    }

    res.json({ success: true, category, data: data.reverse() });
  } catch (error) {
    next(error);
  }
};
