const Expense = require('../models/Expense');

// Escapes regex special characters so user input can't break/abuse the pattern
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

// @desc    Check for a same-day matching expense (same title, category, amount)
//          so the frontend can offer to merge instead of creating a duplicate
// @route   GET /api/expenses/check-duplicate?title=&category=&amount=&date=
exports.checkDuplicate = async (req, res, next) => {
  try {
    const { title, category, amount, date, excludeId } = req.query;
    if (!title || !category || !amount) {
      return res.json({ success: true, match: null });
    }

    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    const query = {
      userId: req.user._id,
      title: { $regex: `^${escapeRegex(title.trim())}$`, $options: 'i' },
      category,
      amount: parseFloat(amount),
      date: { $gte: startOfDay, $lte: endOfDay },
    };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const match = await Expense.findOne(query);

    res.json({ success: true, match: match || null });
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

// @desc    Merge two or more existing expenses into one (sums amount and quantity).
//          Only allowed when every selected expense falls on the SAME calendar day —
//          merging across different days is rejected to avoid corrupting history.
// @route   POST /api/expenses/merge
// @body    { ids: [id1, id2, ...] }
exports.mergeExpenses = async (req, res, next) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length < 2) {
      return res.status(400).json({ success: false, message: 'Select at least 2 expenses to merge' });
    }

    const expenses = await Expense.find({ _id: { $in: ids }, userId: req.user._id });
    if (expenses.length !== ids.length) {
      return res.status(404).json({ success: false, message: 'One or more expenses were not found' });
    }

    // Enforce same calendar day across all selected expenses
    const dayKeys = expenses.map((e) => {
      const d = new Date(e.date);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    });
    if (new Set(dayKeys).size > 1) {
      return res.status(400).json({
        success: false,
        message: 'Can only merge expenses from the same day. Your selection spans multiple days.',
      });
    }

    // Enforce same title (case-insensitive) AND same category — merging is only
    // safe when the entries genuinely represent the same purchase/item.
    const titleKeys = expenses.map((e) => e.title.trim().toLowerCase());
    const categoryKeys = expenses.map((e) => e.category);
    if (new Set(titleKeys).size > 1 || new Set(categoryKeys).size > 1) {
      return res.status(400).json({
        success: false,
        message: 'Can only merge expenses with the same title and category. Your selection includes different items.',
      });
    }

    // Merge into the earliest-created expense; delete the rest
    const sorted = [...expenses].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const primary = sorted[0];
    const rest = sorted.slice(1);

    const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
    const totalQuantity = expenses.reduce((sum, e) => sum + (e.quantity || 1), 0);

    // Record exactly what was folded in, so the merge is fully traceable later
    const newHistoryEntries = rest.map((e) => ({
      title: e.title,
      category: e.category,
      amount: e.amount,
      quantity: e.quantity || 1,
      date: e.date,
      paymentMethod: e.paymentMethod,
    }));

    primary.amount = totalAmount;
    primary.quantity = totalQuantity;
    primary.mergeHistory = [...(primary.mergeHistory || []), ...newHistoryEntries];
    await primary.save();

    await Expense.deleteMany({ _id: { $in: rest.map((e) => e._id) } });

    res.json({ success: true, expense: primary, mergedCount: expenses.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Undo one item from a merge — recreates it as its own standalone
//          expense again, and subtracts its amount/quantity back out of the
//          combined entry. Can be called repeatedly to fully unwind a merge.
// @route   POST /api/expenses/:id/unmerge-item
// @body    { historyIndex }
exports.unmergeItem = async (req, res, next) => {
  try {
    const { historyIndex } = req.body;
    const primary = await Expense.findOne({ _id: req.params.id, userId: req.user._id });
    if (!primary) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    const entry = primary.mergeHistory[historyIndex];
    if (!entry) {
      return res.status(400).json({ success: false, message: 'That merged item was not found' });
    }

    const restored = await Expense.create({
      userId: req.user._id,
      title: entry.title,
      category: entry.category,
      amount: entry.amount,
      quantity: entry.quantity || 1,
      date: entry.date,
      paymentMethod: entry.paymentMethod || 'Cash',
    });

    primary.amount = Math.max(0.01, primary.amount - entry.amount);
    primary.quantity = Math.max(1, (primary.quantity || 1) - (entry.quantity || 1));
    primary.mergeHistory = primary.mergeHistory.filter((_, i) => i !== Number(historyIndex));
    await primary.save();

    res.json({ success: true, primary, restored });
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
    const safeQ = escapeRegex(q);
    const expenses = await Expense.find({
      userId: req.user._id,
      $or: [
        { title: { $regex: safeQ, $options: 'i' } },
        { notes: { $regex: safeQ, $options: 'i' } },
        { category: { $regex: safeQ, $options: 'i' } },
        { tags: { $in: [new RegExp(safeQ, 'i')] } },
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
