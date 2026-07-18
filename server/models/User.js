const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    monthlyIncome: {
      type: Number,
      default: 0,
      min: [0, 'Income cannot be negative'],
    },
    monthlyBudget: {
      type: Number,
      default: 0,
      min: [0, 'Budget cannot be negative'],
    },
    currency: {
      type: String,
      default: 'INR',
      enum: ['INR', 'USD', 'EUR', 'GBP'],
    },
    theme: {
      type: String,
      default: 'dark',
      enum: ['dark', 'light'],
    },
    notificationPrefs: {
      rentReminder: { type: Boolean, default: true },
      budgetExceeded: { type: Boolean, default: true },
      dailyReminder: { type: Boolean, default: false },
      recurringReminder: { type: Boolean, default: true },
    },
    defaultCategories: {
      type: [String],
      default: [
        'Rent', 'Food', 'Vegetables', 'Milk', 'Curd', 'Eggs', 'Chicken',
        'Rice', 'Oil', 'Electricity', 'Water', 'Internet', 'Mobile Recharge',
        'Transport', 'Auto', 'Medicine', 'Entertainment', 'Shopping',
        'Emergency', 'Other',
      ],
    },
    reminderTime: {
      type: String,
      default: '20:00',
    },
    favoriteCategories: {
      type: [String],
      default: ['Food', 'Transport', 'Rent'],
    },
    // Incremented to instantly invalidate all previously issued JWTs
    // (e.g. on password change or "log out everywhere"), since JWTs
    // can't otherwise be revoked before they naturally expire.
    tokenVersion: {
      type: Number,
      default: 0,
      select: false,
    },
    // Set true once the user has confirmed their email via OTP at signup.
    // Login is blocked until this is true, so only real, reachable email
    // addresses can actually use the app.
    isVerified: {
      type: Boolean,
      default: false,
    },
    // OTP state for the email-verification flow (signup). Hidden by default
    // like password/tokenVersion — never returned in normal queries.
    emailVerification: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
    },
    // OTP state for the forgot-password flow. Separate from emailVerification
    // so an in-progress signup verification and a password reset never collide.
    passwordReset: {
      codeHash: { type: String, select: false },
      expiresAt: { type: Date, select: false },
      lastSentAt: { type: Date, select: false },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
