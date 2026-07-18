const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { generateOtp, hashOtp, verifyOtp, OTP_EXPIRY_MINUTES, OTP_RESEND_COOLDOWN_SECONDS } = require('../utils/otp');
const { sendEmail, otpEmailTemplate } = require('../utils/sendEmail');

// Generate JWT token
// tokenVersion is embedded so that bumping User.tokenVersion (on password
// change or explicit logout-everywhere) instantly invalidates every token
// issued before that point, even though JWTs can't be revoked individually.
const generateToken = (id, tokenVersion = 0) => {
  return jwt.sign({ id, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// The subset of a user document that's safe to send back to the client —
// reused across register/login/verify/reset so the shape never drifts.
const publicUser = (user) => ({
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
  isVerified: user.isVerified,
});

// @desc    Register new user — creates an unverified account and emails a
//          6-digit code. The account can't log in until POST /verify-email
//          succeeds, so a made-up or someone-else's email can never be used.
// @route   POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const user = await User.create({ name, email, password });

    const otp = generateOtp();
    user.emailVerification = {
      codeHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      lastSentAt: new Date(),
    };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Verify your email — BudgetNest',
      html: otpEmailTemplate({ name: user.name, otp, purpose: 'verify' }),
    });

    res.status(201).json({
      success: true,
      message: 'Verification code sent to your email',
      email: user.email,
      needsVerification: true,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify a signup OTP and log the (now-verified) user in
// @route   POST /api/auth/verify-email
exports.verifyEmail = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email }).select('+emailVerification.codeHash +emailVerification.expiresAt +tokenVersion');
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for that email' });
    }
    if (user.isVerified) {
      return res.status(400).json({ success: false, message: 'This account is already verified — try logging in' });
    }

    const result = verifyOtp(otp, user.emailVerification?.codeHash, user.emailVerification?.expiresAt);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    user.isVerified = true;
    user.emailVerification = undefined;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      message: 'Email verified',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend the signup verification OTP (cooldown-limited per account)
// @route   POST /api/auth/resend-otp
exports.resendVerificationOtp = async (req, res, next) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).select('+emailVerification.lastSentAt');
    // Deliberately vague response either way — don't reveal whether this
    // email is registered, and don't reveal whether it's already verified.
    const genericResponse = { success: true, message: 'If that account needs verification, a new code has been sent' };

    if (!user || user.isVerified) {
      return res.json(genericResponse);
    }

    const lastSentAt = user.emailVerification?.lastSentAt;
    if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil(
        (OTP_RESEND_COOLDOWN_SECONDS * 1000 - (Date.now() - new Date(lastSentAt).getTime())) / 1000
      );
      return res.status(429).json({ success: false, message: `Please wait ${waitSeconds}s before requesting another code` });
    }

    const otp = generateOtp();
    user.emailVerification = {
      codeHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      lastSentAt: new Date(),
    };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Verify your email — BudgetNest',
      html: otpEmailTemplate({ name: user.name, otp, purpose: 'verify' }),
    });

    res.json(genericResponse);
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

    // Login itself never asks for a fresh OTP — this just checks the account
    // was verified once, at signup, so only a reachable real email got this far.
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in',
        needsVerification: true,
        email: user.email,
      });
    }

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      token,
      user: publicUser(user),
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

// @desc    Request a password-reset OTP by email. Always responds with the
//          same generic message whether or not the email exists, so this
//          can't be used to enumerate registered accounts.
// @route   POST /api/auth/forgot-password
exports.forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const genericResponse = { success: true, message: 'If that email is registered, a reset code has been sent' };

    const user = await User.findOne({ email }).select('+passwordReset.lastSentAt');
    if (!user) {
      return res.json(genericResponse);
    }

    const lastSentAt = user.passwordReset?.lastSentAt;
    if (lastSentAt && Date.now() - new Date(lastSentAt).getTime() < OTP_RESEND_COOLDOWN_SECONDS * 1000) {
      // Still return the generic message here — a precise "wait Ns" response
      // would itself confirm the email exists, undoing the point above.
      return res.json(genericResponse);
    }

    const otp = generateOtp();
    user.passwordReset = {
      codeHash: hashOtp(otp),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
      lastSentAt: new Date(),
    };
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Reset your password — BudgetNest',
      html: otpEmailTemplate({ name: user.name, otp, purpose: 'reset' }),
    });

    res.json(genericResponse);
  } catch (error) {
    next(error);
  }
};

// @desc    Complete a password reset with the emailed OTP. Also bumps
//          tokenVersion, since a forgotten/reset password is exactly the
//          moment any old leaked sessions should stop working.
// @route   POST /api/auth/reset-password
exports.resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email }).select(
      '+passwordReset.codeHash +passwordReset.expiresAt +tokenVersion'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found for that email' });
    }

    const result = verifyOtp(otp, user.passwordReset?.codeHash, user.passwordReset?.expiresAt);
    if (!result.valid) {
      return res.status(400).json({ success: false, message: result.reason });
    }

    user.password = newPassword;
    user.passwordReset = undefined;
    user.tokenVersion += 1;
    // A password reset via emailed OTP is itself sufficient proof of email
    // ownership — verify the account too, in case it somehow wasn't already.
    user.isVerified = true;
    await user.save();

    const token = generateToken(user._id, user.tokenVersion);

    res.json({
      success: true,
      message: 'Password reset successfully',
      token,
      user: publicUser(user),
    });
  } catch (error) {
    next(error);
  }
};
