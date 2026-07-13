const Expense = require('../models/Expense');
const Budget = require('../models/Budget');

// @desc    Get dashboard summary
// @route   GET /api/analytics/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const today = new Date(year, now.getMonth(), now.getDate());
    const tomorrow = new Date(year, now.getMonth(), now.getDate() + 1);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    // Start of week (Monday)
    const dayOfWeek = now.getDay() || 7;
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek + 1);
    startOfWeek.setHours(0, 0, 0, 0);

    // Previous month
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    // Parallel queries
    const [monthlyExpenses, todayExpenses, weeklyExpenses, prevMonthExpenses, budget] =
      await Promise.all([
        Expense.find({ userId: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } }),
        Expense.find({ userId: req.user._id, date: { $gte: today, $lt: tomorrow } }),
        Expense.find({ userId: req.user._id, date: { $gte: startOfWeek, $lte: now } }),
        Expense.find({ userId: req.user._id, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } }),
        Budget.findOne({ userId: req.user._id, month, year }),
      ]);

    const monthlyTotal = monthlyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const todayTotal = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const weeklyTotal = weeklyExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevMonthTotal = prevMonthExpenses.reduce((sum, e) => sum + e.amount, 0);

    const totalBudget = budget ? budget.totalBudget : req.user.monthlyBudget || 0;
    const remaining = totalBudget - monthlyTotal;

    const daysInMonth = new Date(year, month, 0).getDate();
    const remainingDays = daysInMonth - now.getDate();
    const safeDailySpending = remainingDays > 0 ? Math.max(0, remaining / remainingDays) : 0;

    // Category breakdown
    const categoryBreakdown = {};
    monthlyExpenses.forEach((e) => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
    });

    const topCategories = Object.entries(categoryBreakdown)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }));

    // Recent transactions
    const recentTransactions = await Expense.find({ userId: req.user._id })
      .sort('-date -createdAt')
      .limit(5);

    // Savings comparison
    const savingsThisMonth = totalBudget - monthlyTotal;
    const prevBudget = await Budget.findOne({ userId: req.user._id, month: prevMonth, year: prevYear });
    const prevBudgetAmount = prevBudget ? prevBudget.totalBudget : totalBudget;
    const savingsPrevMonth = prevBudgetAmount - prevMonthTotal;

    res.json({
      success: true,
      dashboard: {
        totalBudget,
        monthlySpent: monthlyTotal,
        remaining,
        remainingDays,
        safeDailySpending: Math.round(safeDailySpending * 100) / 100,
        todaySpent: todayTotal,
        weeklySpent: weeklyTotal,
        percentUsed: totalBudget > 0 ? Math.round((monthlyTotal / totalBudget) * 100) : 0,
        topCategories,
        recentTransactions,
        savings: {
          thisMonth: savingsThisMonth,
          prevMonth: savingsPrevMonth,
          change: savingsThisMonth - savingsPrevMonth,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get monthly analytics
// @route   GET /api/analytics/monthly
exports.getMonthlyAnalytics = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();
    const data = [];

    for (let i = 0; i < parseInt(months); i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1);
      const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

      const expenses = await Expense.find({
        userId: req.user._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
      });

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const categoryBreakdown = {};
      expenses.forEach((e) => {
        categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
      });

      data.push({
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        label: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        total,
        count: expenses.length,
        categoryBreakdown,
        avgDaily: total / new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate(),
      });
    }

    res.json({ success: true, data: data.reverse() });
  } catch (error) {
    next(error);
  }
};

// @desc    Get weekly analytics
// @route   GET /api/analytics/weekly
exports.getWeeklyAnalytics = async (req, res, next) => {
  try {
    const { weeks = 4 } = req.query;
    const now = new Date();
    const data = [];

    for (let i = 0; i < parseInt(weeks); i++) {
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (now.getDay() || 7) + 1 - i * 7);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const expenses = await Expense.find({
        userId: req.user._id,
        date: { $gte: startOfWeek, $lte: endOfWeek },
      });

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      data.push({
        weekStart: startOfWeek.toISOString().split('T')[0],
        weekEnd: endOfWeek.toISOString().split('T')[0],
        total,
        count: expenses.length,
        avgDaily: total / 7,
      });
    }

    res.json({ success: true, data: data.reverse() });
  } catch (error) {
    next(error);
  }
};

// @desc    Get daily spending trend
// @route   GET /api/analytics/daily-trend
exports.getDailyTrend = async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    const now = new Date();
    const data = [];

    for (let i = parseInt(days) - 1; i >= 0; i--) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const expenses = await Expense.find({
        userId: req.user._id,
        date: { $gte: day, $lt: nextDay },
      });

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);

      data.push({
        date: day.toISOString().split('T')[0],
        label: day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        total,
        count: expenses.length,
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate insights
// @route   GET /api/analytics/insights
exports.getInsights = async (req, res, next) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const startOfPrevMonth = new Date(prevYear, prevMonth - 1, 1);
    const endOfPrevMonth = new Date(prevYear, prevMonth, 0, 23, 59, 59);

    const [currentExpenses, prevExpenses, budget] = await Promise.all([
      Expense.find({ userId: req.user._id, date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Expense.find({ userId: req.user._id, date: { $gte: startOfPrevMonth, $lte: endOfPrevMonth } }),
      Budget.findOne({ userId: req.user._id, month, year }),
    ]);

    const currentTotal = currentExpenses.reduce((sum, e) => sum + e.amount, 0);
    const prevTotal = prevExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Category breakdown for both months
    const currentCategories = {};
    currentExpenses.forEach((e) => {
      currentCategories[e.category] = (currentCategories[e.category] || 0) + e.amount;
    });

    const prevCategories = {};
    prevExpenses.forEach((e) => {
      prevCategories[e.category] = (prevCategories[e.category] || 0) + e.amount;
    });

    const insights = [];
    const totalBudget = budget ? budget.totalBudget : req.user.monthlyBudget || 0;

    // Overall spending comparison
    if (prevTotal > 0) {
      const changePercent = Math.round(((currentTotal - prevTotal) / prevTotal) * 100);
      if (changePercent > 0) {
        insights.push({ type: 'warning', text: `You've spent ${changePercent}% more this month compared to last month.`, icon: '📈' });
      } else if (changePercent < 0) {
        insights.push({ type: 'success', text: `Great! You've spent ${Math.abs(changePercent)}% less this month.`, icon: '📉' });
      }
    }

    // Category-wise insights
    Object.keys(currentCategories).forEach((cat) => {
      const current = currentCategories[cat];
      const prev = prevCategories[cat] || 0;

      if (prev > 0) {
        const change = Math.round(((current - prev) / prev) * 100);
        if (Math.abs(change) >= 15) {
          if (change > 0) {
            insights.push({ type: 'info', text: `${cat} expenses increased by ${change}%.`, icon: '⬆️' });
          } else {
            insights.push({ type: 'success', text: `${cat} expenses decreased by ${Math.abs(change)}%.`, icon: '⬇️' });
          }
        }
      }
    });

    // Biggest expense category
    const topCategory = Object.entries(currentCategories).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({ type: 'info', text: `Your biggest expense category is ${topCategory[0]} (₹${topCategory[1].toLocaleString()}).`, icon: '🏷️' });
    }

    // Average daily spending
    const daysElapsed = now.getDate();
    const avgDaily = Math.round(currentTotal / daysElapsed);
    insights.push({ type: 'info', text: `Average spending per day is ₹${avgDaily.toLocaleString()}.`, icon: '📊' });

    // Safe spending
    if (totalBudget > 0) {
      const remaining = totalBudget - currentTotal;
      const remainingDays = new Date(year, month, 0).getDate() - now.getDate();

      if (remaining > 0 && remainingDays > 0) {
        const safeDaily = Math.round(remaining / remainingDays);
        insights.push({ type: 'success', text: `You can safely spend ₹${safeDaily.toLocaleString()}/day for the rest of the month.`, icon: '✅' });
      }

      // Budget status
      const percentUsed = Math.round((currentTotal / totalBudget) * 100);
      if (percentUsed > 100) {
        insights.push({ type: 'danger', text: `You've exceeded your budget by ₹${Math.abs(remaining).toLocaleString()}!`, icon: '🚨' });
      } else if (percentUsed > 80) {
        insights.push({ type: 'warning', text: `You've used ${percentUsed}% of your monthly budget. Be cautious.`, icon: '⚠️' });
      } else {
        insights.push({ type: 'success', text: `You've used ${percentUsed}% of your budget. You're on track!`, icon: '🎯' });
      }
    }

    // Most expensive day
    const dailyTotals = {};
    currentExpenses.forEach((e) => {
      const dateKey = e.date.toISOString().split('T')[0];
      dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + e.amount;
    });

    const mostExpensiveDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
    if (mostExpensiveDay) {
      const dayLabel = new Date(mostExpensiveDay[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      insights.push({ type: 'info', text: `Most expensive day: ${dayLabel} (₹${mostExpensiveDay[1].toLocaleString()}).`, icon: '📅' });
    }

    res.json({ success: true, insights });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category breakdown
// @route   GET /api/analytics/category-breakdown
exports.getCategoryBreakdown = async (req, res, next) => {
  try {
    const now = new Date();
    const { month = now.getMonth() + 1, year = now.getFullYear() } = req.query;

    const startOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const endOfMonth = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const breakdown = {};
    expenses.forEach((e) => {
      if (!breakdown[e.category]) {
        breakdown[e.category] = { amount: 0, count: 0, transactions: [] };
      }
      breakdown[e.category].amount += e.amount;
      breakdown[e.category].count += 1;
    });

    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    const categories = Object.entries(breakdown)
      .map(([category, data]) => ({
        category,
        amount: data.amount,
        count: data.count,
        percentage: total > 0 ? Math.round((data.amount / total) * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    res.json({ success: true, categories, total });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expense heatmap data
// @route   GET /api/analytics/heatmap
exports.getHeatmap = async (req, res, next) => {
  try {
    const now = new Date();
    const startDate = new Date(now.getFullYear(), 0, 1); // Start of year

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startDate, $lte: now },
    });

    const heatmapData = {};
    expenses.forEach((e) => {
      const dateKey = e.date.toISOString().split('T')[0];
      heatmapData[dateKey] = (heatmapData[dateKey] || 0) + e.amount;
    });

    const data = Object.entries(heatmapData).map(([date, amount]) => ({
      date,
      amount,
      count: expenses.filter((e) => e.date.toISOString().split('T')[0] === date).length,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
