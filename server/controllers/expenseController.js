const Expense = require('../models/Expense');

// @desc    Get all expenses (paginated, filtered, sorted)
// @route   GET /api/expenses
exports.getExpenses = async (req, res, next) => {
  try {
    const {
      page = 1, limit = 10, sort = '-date', category, paymentMethod,
      startDate, endDate, minAmount, maxAmount, search, tags,
    } = req.query;

    const filter = { userId: req.user._id };

    if (category) filter.category = category;
    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (tags) filter.tags = { $in: tags.split(',') };

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Expense.countDocuments(filter);
    const expenses = await Expense.find(filter)
      .sort(sort)
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({
      success: true,
      expenses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single expense
// @route   GET /api/expenses/:id
exports.getExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Create expense
// @route   POST /api/expenses
exports.createExpense = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;
    if (req.file) {
      req.body.attachment = `/uploads/${req.file.filename}`;
    }
    const expense = await Expense.create(req.body);
    res.status(201).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Update expense
// @route   PUT /api/expenses/:id
exports.updateExpense = async (req, res, next) => {
  try {
    if (req.file) {
      req.body.attachment = `/uploads/${req.file.filename}`;
    }
    const expense = await Expense.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
exports.deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    res.json({ success: true, expense, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete expenses
// @route   POST /api/expenses/bulk-delete
exports.bulkDelete = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Provide an array of IDs' });
    }
    const result = await Expense.deleteMany({ _id: { $in: ids }, userId: req.user._id });
    res.json({ success: true, message: `${result.deletedCount} expenses deleted` });
  } catch (error) {
    next(error);
  }
};

// @desc    Duplicate expense
// @route   POST /api/expenses/:id/duplicate
exports.duplicateExpense = async (req, res, next) => {
  try {
    const original = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!original) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }
    const duplicate = await Expense.create({
      userId: req.user._id,
      title: `${original.title} (copy)`,
      amount: original.amount,
      category: original.category,
      paymentMethod: original.paymentMethod,
      date: new Date(),
      notes: original.notes,
      isRecurring: original.isRecurring,
      tags: original.tags,
      location: original.location,
    });
    res.status(201).json({ success: true, expense: duplicate });
  } catch (error) {
    next(error);
  }
};

// @desc    Search expenses
// @route   GET /api/expenses/search
exports.searchExpenses = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    const expenses = await Expense.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { notes: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    })
      .sort('-date')
      .limit(20);

    res.json({ success: true, expenses });
  } catch (error) {
    next(error);
  }
};

// @desc    Export expenses as CSV data
// @route   GET /api/expenses/export/csv
exports.exportCSV = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { userId: req.user._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort('-date');

    const csvData = expenses.map((e) => ({
      Title: e.title,
      Amount: e.amount,
      Category: e.category,
      'Payment Method': e.paymentMethod,
      Date: e.date.toISOString().split('T')[0],
      Notes: e.notes || '',
      Tags: (e.tags || []).join('; '),
      Location: e.location || '',
    }));

    res.json({ success: true, data: csvData });
  } catch (error) {
    next(error);
  }
};

// @desc    Export expenses as PDF data
// @route   GET /api/expenses/export/pdf
exports.exportPDF = async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query;
    const filter = { userId: req.user._id };
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const expenses = await Expense.find(filter).sort('-date');
    const total = expenses.reduce((sum, e) => sum + e.amount, 0);

    res.json({
      success: true,
      data: {
        expenses: expenses.map((e) => ({
          title: e.title,
          amount: e.amount,
          category: e.category,
          paymentMethod: e.paymentMethod,
          date: e.date.toISOString().split('T')[0],
          notes: e.notes || '',
        })),
        total,
        count: expenses.length,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
