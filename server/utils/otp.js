const crypto = require('crypto');

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const OTP_RESEND_COOLDOWN_SECONDS = 60;

// 6-digit numeric code — easy to type on a phone, ~1M possibilities which is
// plenty given it's rate-limited and expires in 10 minutes.
const generateOtp = () => {
  return crypto.randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, '0');
};

// Store only a hash of the OTP (like a password) — if the DB ever leaks,
// outstanding codes shouldn't be directly usable.
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');

const verifyOtp = (providedOtp, storedHash, expiresAt) => {
  if (!storedHash || !expiresAt) return { valid: false, reason: 'No code was requested' };
  if (new Date() > new Date(expiresAt)) return { valid: false, reason: 'Code has expired' };
  if (hashOtp(String(providedOtp).trim()) !== storedHash) return { valid: false, reason: 'Incorrect code' };
  return { valid: true };
};

module.exports = {
  OTP_EXPIRY_MINUTES,
  OTP_RESEND_COOLDOWN_SECONDS,
  generateOtp,
  hashOtp,
  verifyOtp,
};
