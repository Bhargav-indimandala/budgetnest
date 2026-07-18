const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, logoutAll } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, registerRules, loginRules, changePasswordRules } = require('../middleware/validate');

router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePasswordRules, validate, changePassword);
router.post('/logout-all', protect, logoutAll);

module.exports = router;
