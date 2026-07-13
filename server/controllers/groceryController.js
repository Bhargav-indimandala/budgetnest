const Grocery = require('../models/Grocery');

// @desc    Get all groceries
// @route   GET /api/groceries
exports.getGroceries = async (req, res, next) => {
  try {
    const { category, sort = '-purchaseDate' } = req.query;
    const filter = { userId: req.user._id };
    if (category) filter.category = category;

    const groceries = await Grocery.find(filter).sort(sort);
    res.json({ success: true, groceries });
  } catch (error) {
    next(error);
  }
};

// @desc    Create grocery item
// @route   POST /api/groceries
exports.createGrocery = async (req, res, next) => {
  try {
    req.body.userId = req.user._id;
    if (!req.body.estimatedRemainingQty) {
      req.body.estimatedRemainingQty = req.body.quantity;
    }
    const grocery = await Grocery.create(req.body);
    res.status(201).json({ success: true, grocery });
  } catch (error) {
    next(error);
  }
};

// @desc    Update grocery
// @route   PUT /api/groceries/:id
exports.updateGrocery = async (req, res, next) => {
  try {
    const grocery = await Grocery.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }
    res.json({ success: true, grocery });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete grocery
// @route   DELETE /api/groceries/:id
exports.deleteGrocery = async (req, res, next) => {
  try {
    const grocery = await Grocery.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!grocery) {
      return res.status(404).json({ success: false, message: 'Grocery item not found' });
    }
    res.json({ success: true, message: 'Grocery item deleted' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get inventory dashboard
// @route   GET /api/groceries/inventory
exports.getInventory = async (req, res, next) => {
  try {
    const groceries = await Grocery.find({ userId: req.user._id }).sort('-purchaseDate');

    // Group by name and get latest entry
    const inventoryMap = {};
    groceries.forEach((g) => {
      if (!inventoryMap[g.name] || g.purchaseDate > inventoryMap[g.name].purchaseDate) {
        inventoryMap[g.name] = g;
      }
    });

    const inventory = Object.values(inventoryMap).map((g) => {
      const percentRemaining = g.quantity > 0
        ? Math.round((g.estimatedRemainingQty / g.quantity) * 100)
        : 0;

      let status = 'good';
      if (percentRemaining <= 10) status = 'critical';
      else if (percentRemaining <= 30) status = 'low';
      else if (percentRemaining <= 60) status = 'moderate';

      return {
        ...g.toObject(),
        percentRemaining,
        status,
      };
    });

    // Stats
    const totalSpent = groceries.reduce((sum, g) => sum + g.price, 0);
    const lowStockItems = inventory.filter((i) => i.status === 'critical' || i.status === 'low');

    res.json({
      success: true,
      inventory,
      stats: {
        totalItems: inventory.length,
        lowStockCount: lowStockItems.length,
        totalSpent,
      },
    });
  } catch (error) {
    next(error);
  }
};
