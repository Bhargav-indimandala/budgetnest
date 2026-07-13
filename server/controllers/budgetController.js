const Budget = require('../models/Budget');
const Expense = require('../models/Expense');

// @desc    Get current month budget
// @route   GET /api/budgets/current
exports.getCurrentBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    let budget = await Budget.findOne({ userId: req.user._id, month, year });

    if (!budget) {
      // Auto-create from user's monthly budget setting
      budget = await Budget.create({
        userId: req.user._id,
        month,
        year,
        totalBudget: req.user.monthlyBudget || 0,
      });
    }

    // Calculate spent amount
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: req.user._id,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    });

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    // Category-wise spending
    const categorySpending = {};
    expenses.forEach((e) => {
      categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
    });

    // Update category budgets with spent amounts
    const updatedCategoryBudgets = budget.categoryBudgets.map((cb) => ({
      category: cb.category,
      limit: cb.limit,
      spent: categorySpending[cb.category] || 0,
    }));

    // Calculate remaining days
    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = now.getDate();
    const remainingDays = daysInMonth - currentDay;

    const remaining = budget.totalBudget - totalSpent;
    const safeDailySpending = remainingDays > 0 ? Math.max(0, remaining / remainingDays) : 0;

    res.json({
      success: true,
      budget: {
        ...budget.toObject(),
        categoryBudgets: updatedCategoryBudgets,
        spent: totalSpent,
        remaining,
        remainingDays,
        safeDailySpending: Math.round(safeDailySpending * 100) / 100,
        daysInMonth,
        currentDay,
        percentUsed: budget.totalBudget > 0 ? Math.round((totalSpent / budget.totalBudget) * 100) : 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create or update monthly budget
// @route   POST /api/budgets
exports.upsertBudget = async (req, res, next) => {
  try {
    const { month, year, totalBudget, categoryBudgets } = req.body;

    const budget = await Budget.findOneAndUpdate(
      { userId: req.user._id, month, year },
      { totalBudget, categoryBudgets: categoryBudgets || [] },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, budget });
  } catch (error) {
    next(error);
  }
};

// @desc    Get budget history
// @route   GET /api/budgets/history
exports.getBudgetHistory = async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const now = new Date();

    const budgets = await Budget.find({ userId: req.user._id })
      .sort({ year: -1, month: -1 })
      .limit(parseInt(months));

    // Attach spent amount to each budget
    const history = await Promise.all(
      budgets.map(async (budget) => {
        const startOfMonth = new Date(budget.year, budget.month - 1, 1);
        const endOfMonth = new Date(budget.year, budget.month, 0, 23, 59, 59);

        const expenses = await Expense.find({
          userId: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        });

        const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

        return {
          ...budget.toObject(),
          spent: totalSpent,
          remaining: budget.totalBudget - totalSpent,
          percentUsed: budget.totalBudget > 0
            ? Math.round((totalSpent / budget.totalBudget) * 100)
            : 0,
        };
      })
    );

    res.json({ success: true, history });
  } catch (error) {
    next(error);
  }
};

// @desc    Get category budget details
// @route   GET /api/budgets/category/:category
exports.getCategoryBudget = async (req, res, next) => {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();

    const budget = await Budget.findOne({ userId: req.user._id, month, year });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'No budget set for this month' });
    }

    const categoryBudget = budget.categoryBudgets.find(
      (cb) => cb.category === req.params.category
    );

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59);

    const expenses = await Expense.find({
      userId: req.user._id,
      category: req.params.category,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).sort('-date');

    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      category: req.params.category,
      limit: categoryBudget ? categoryBudget.limit : 0,
      spent: totalSpent,
      remaining: categoryBudget ? categoryBudget.limit - totalSpent : 0,
      expenses,
    });
  } catch (error) {
    next(error);
  }
};
