const express = require('express');
const router = express.Router();
const {
  register, login, getMe, updateProfile, changePassword, logoutAll,
  verifyEmail, resendVerificationOtp, forgotPassword, resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const {
  validate, registerRules, loginRules, changePasswordRules,
  verifyEmailRules, resendOtpRules, forgotPasswordRules, resetPasswordRules,
} = require('../middleware/validate');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/verify-email', verifyEmailRules, validate, verifyEmail);
router.post('/resend-otp', resendOtpRules, validate, resendVerificationOtp);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePasswordRules, validate, changePassword);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
