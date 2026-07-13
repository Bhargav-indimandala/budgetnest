const Asset = require('../models/Asset');

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

// @desc    Create asset
// @route   POST /api/assets
exports.createAsset = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;
    const asset = await Asset.create(req.body);
    res.status(201).json({ success: true, asset });
  } catch (error) {
    next(error);
  }
};

// @desc    Update asset
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
    res.json({ success: true, asset });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete asset
// @route   DELETE /api/assets/:id
exports.deleteAsset = async (req, res, next) => {
  try {
    const asset = await Asset.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }
    res.json({ success: true, message: 'Asset deleted' });
  } catch (error) {
    next(error);
  }
};
