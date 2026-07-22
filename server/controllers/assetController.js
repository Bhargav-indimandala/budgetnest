const Asset = require('../models/Asset');
const Expense = require('../models/Expense');

// @desc    Get all assets
// @route   GET /api/assets
exports.getAssets = async (req, res, next) => {
  try {
    const { status, sort = '-purchaseDate' } = req.query;
    const filter = { userId: req.user._id };
    if (status) filter.status = status;

    const assets = await Asset.find(filter).sort(sort);
    const totalValue = assets.reduce((sum, a) => sum + a.purchasePrice, 0);
    const activeCount = assets.filter((a) => a.status === 'Active').length;

    res.json({ success: true, assets, totalValue, activeCount, total: assets.length });
  } catch (error) {
    next(error);
  }
};

// @desc    Create asset — also creates a linked Expense so this one-time
//          purchase counts toward monthly spend/budget/analytics, while
//          still being tracked here separately for lifetime/status.
// @route   POST /api/assets
exports.createAsset = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;
    const asset = await Asset.create(req.body);

    const expense = await Expense.create({
      userId: req.user._id,
      title: asset.name,
      amount: asset.purchasePrice,
      category: 'Assets',
      paymentMethod: 'Cash',
      date: asset.purchaseDate,
      notes: 'Auto-added from Asset tracker (one-time purchase)',
      tags: ['asset'],
    });
    asset.linkedExpenseId = expense._id;
    await asset.save();

    res.status(201).json({ success: true, asset });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset — keeps the linked Expense's amount/date/title in sync
// @route   PUT /api/assets/:id
exports.updateAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (asset.linkedExpenseId) {
      await Expense.findByIdAndUpdate(asset.linkedExpenseId, {
        title: asset.name,
        amount: asset.purchasePrice,
        date: asset.purchaseDate,
      });
    }

    res.json({ success: true, asset });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete asset — also removes its linked Expense so spend totals
//          stay accurate
// @route   DELETE /api/assets/:id
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    if (asset.linkedExpenseId) {
      await Expense.findByIdAndDelete(asset.linkedExpenseId);
    }
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    next(error);
  }
};
