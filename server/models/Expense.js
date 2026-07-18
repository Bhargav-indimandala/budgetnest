const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    quantity: {
      type: Number,
      default: 1,
      min: [1, 'Quantity must be at least 1'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Online', 'Other'],
      default: 'Cash',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      trim: true,
    },
    // Planned/upcoming expenses (e.g. "I'll spend ₹500 tomorrow") can have a
    // future date and are excluded from all spending totals (today/week/month/
    // budget usage) until marked as actually spent (isPlanned set back to false).
    isPlanned: {
      type: Boolean,
      default: false,
    },
    attachment: {
      type: String,
      default: '',
    },
    // Records what was folded into this expense when merged with duplicates,
    // so the merge is never silently destructive.
    mergeHistory: {
      type: [
        {
          title: String,
          category: String,
          amount: Number,
          quantity: Number,
          date: Date,
          paymentMethod: String,
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
expenseSchema.index({ userId: 1, date: -1 });
expenseSchema.index({ userId: 1, category: 1 });
expenseSchema.index({ userId: 1, date: -1, category: 1 });

// Text index for search
expenseSchema.index({ title: 'text', notes: 'text', tags: 'text' });

module.exports = mongoose.model('Expense', expenseSchema);
