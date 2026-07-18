const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Generate JWT token
// tokenVersion is embedded so that bumping User.tokenVersion (on password
// change or explicit logout-everywhere) instantly invalidates every token
// issued before that point, even though JWTs can't be revoked individually.
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id, user.tokenVersion);

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        monthlyIncome: user.monthlyIncome,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency,
        theme: user.theme,
        notificationPrefs: user.notificationPrefs,
        defaultCategories: user.defaultCategories,
        favoriteCategories: user.favoriteCategories,
        reminderTime: user.reminderTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password +tokenVersion');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        monthlyIncome: user.monthlyIncome,
        monthlyBudget: user.monthlyBudget,
        currency: user.currency,
        theme: user.theme,
        notificationPrefs: user.notificationPrefs,
        defaultCategories: user.defaultCategories,
        favoriteCategories: user.favoriteCategories,
        reminderTime: user.reminderTime,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'name', 'avatar', 'monthlyIncome', 'monthlyBudget',
      'currency', 'theme', 'notificationPrefs', 'defaultCategories',
      'favoriteCategories', 'reminderTime',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id).select('+password +tokenVersion');

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    // Invalidate every token issued before this point (e.g. a stolen token
    // from an old session) — not just the one making this request.
    user.tokenVersion += 1;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({ success: true, message: 'Password changed successfully', token });
  } catch (error) {
    next(error);
  }
};

// @desc    Invalidate all previously issued tokens (e.g. lost device, suspected leak)
//          without requiring a password change. Issues a fresh token for the
//          current request so this session stays logged in.
// @route   POST /api/auth/logout-all
exports.logoutAll = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+tokenVersion');
    user.tokenVersion += 1;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      message: 'Logged out of all other sessions',
      token,
    });
  } catch (error) {
    next(error);
  }
};
