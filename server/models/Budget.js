const mongoose = require('mongoose');

const categoryBudgetSchema = new mongoose.Schema(
  {
    category: { type: String, required: true },
    limit: { type: Number, required: true, min: 0 },
    spent: { type: Number, default: 0 },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    totalBudget: {
      type: Number,
      required: [true, 'Total budget is required'],
      min: [0, 'Budget cannot be negative'],
    },
    categoryBudgets: {
      type: [categoryBudgetSchema],
      default: [],
    },
    alerts: {
      type: [
        {
          type: { type: String, enum: ['warning', 'exceeded'] },
          category: String,
          message: String,
          triggeredAt: Date,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one budget per user per month
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Budget', budgetSchema);
