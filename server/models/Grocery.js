const mongoose = require('mongoose');

const grocerySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Grocery name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: ['kg', 'g', 'L', 'ml', 'pcs', 'dozen', 'packet'],
    },
    purchaseDate: {
      type: Date,
      required: [true, 'Purchase date is required'],
      default: Date.now,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    estimatedRemainingQty: {
      type: Number,
      default: 0,
      min: [0, 'Remaining quantity cannot be negative'],
    },
    category: {
      type: String,
      default: 'General',
      enum: ['Grains', 'Dairy', 'Vegetables', 'Fruits', 'Spices', 'Oil', 'Snacks', 'Beverages', 'General'],
    },
    // Links to the auto-created Expense record for this purchase, so grocery
    // spending flows into monthly totals/budget/analytics automatically while
    // still being tracked separately here for inventory purposes.
    linkedExpenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

grocerySchema.index({ userId: 1, purchaseDate: -1 });

module.exports = mongoose.model('Grocery', grocerySchema);
