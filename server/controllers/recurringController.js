const RecurringExpense = require('../models/RecurringExpense');
const Expense = require('../models/Expense');
const { createNotification } = require('./notificationController');

// @desc    Get recurring expenses
// @route   GET /api/recurring
exports.getRecurringExpenses = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.find({ userId: req.user._id }).sort('nextDueDate');
    res.json({ success: true, recurring });
  } catch (error) {
    next(error);
  }
};

// @desc    Create recurring expense
// @route   POST /api/recurring
exports.createRecurringExpense = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;
    const recurring = await RecurringExpense.create(req.body);
    res.status(201).json({ success: true, recurring });
  } catch (error) {
    next(error);
  }
};

// @desc    Update recurring expense
// @route   PUT /api/recurring/:id
exports.updateRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!recurring) {
      return res.status(404).json({ success: false, message: 'Recurring expense not found' });
    }
    res.json({ success: true, recurring });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete recurring expense
// @route   DELETE /api/recurring/:id
exports.deleteRecurringExpense = async (req, res, next) => {
  try {
    const recurring = await RecurringExpense.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!recurring) {
      return res.status(404).json({ success: false, message: 'Recurring expense not found' });
    }
    res.json({ success: true, message: 'Recurring expense deleted' });
  } catch (error) {
    next(error);
  }
};

// Process due recurring expenses (called by cron)
exports.processDueRecurring = async () => {
  try {
    const { getISTDayRangeUTC } = require('../utils/dateUtils');
    const now = new Date();
    // Compare against the END of today in IST, not raw UTC "now" — otherwise
    // an item due "today" (IST calendar date) isn't found until 5:30 AM IST,
    // since that's when the UTC clock catches up to IST midnight.
    const { endUTC: endOfTodayIST } = getISTDayRangeUTC();
    const dueExpenses = await RecurringExpense.find({
      isActive: true,
      nextDueDate: { $lte: endOfTodayIST },
    });

    for (const recurring of dueExpenses) {
      // Create actual expense
      await Expense.create({
        userId: recurring.userId,
        title: recurring.title,
        amount: recurring.amount,
        category: recurring.category,
        paymentMethod: 'Other',
        date: now,
        notes: `Auto-generated from recurring: ${recurring.title}`,
        isRecurring: true,
      });

      // Create notification
      await createNotification(
        recurring.userId,
        'recurring_reminder',
        'Recurring Expense Due',
        `${recurring.title} - ₹${recurring.amount} has been added to your expenses.`,
        recurring._id
      );

      // Update next due date
      const nextDate = new Date(recurring.nextDueDate);
      if (recurring.frequency === 'monthly') {
        nextDate.setMonth(nextDate.getMonth() + 1);
      } else if (recurring.frequency === 'weekly') {
        nextDate.setDate(nextDate.getDate() + 7);
      } else if (recurring.frequency === 'yearly') {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      }

      recurring.nextDueDate = nextDate;
      recurring.lastProcessed = now;
      await recurring.save();
    }

    return dueExpenses.length;
  } catch (error) {
    console.error('Error processing recurring expenses:', error.message);
    return 0;
  }
};
