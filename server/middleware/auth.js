const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password +tokenVersion');

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    // If the user's tokenVersion has since been bumped (password change,
    // logout-everywhere), this token was issued before that point and is
    // now revoked even though its signature/expiry are still technically valid.
    const tokenVersion = decoded.tokenVersion || 0;
    if (tokenVersion !== req.user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: 'Session expired, please log in again',
      });
    }

    req.user.tokenVersion = undefined; // don't leak it onward to controllers/responses

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid',
    });
  }
};

module.exports = { protect };
