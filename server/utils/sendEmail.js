const nodemailer = require('nodemailer');

let transporter = null;
const isConfigured = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465, // true for port 465, false for 587/others (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Sends an email, or — if SMTP env vars aren't set (e.g. local dev) — just
// logs it to the console so OTP flows are still testable without real SMTP.
const sendEmail = async ({ to, subject, html }) => {
  if (!isConfigured) {
    console.log(`\n[Email:DEV] SMTP not configured — would have sent to ${to}`);
    console.log(`[Email:DEV] Subject: ${subject}`);
    console.log(`[Email:DEV] Body:\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`);
    return { devMode: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || `"BudgetNest" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

// Minimal branded OTP template — kept inline (no external template engine)
// since it's just one email type used two ways (verify / reset).
const otpEmailTemplate = ({ name, otp, purpose }) => {
  const heading = purpose === 'reset' ? 'Reset your password' : 'Verify your email';
  const bodyLine = purpose === 'reset'
    ? 'Use the code below to reset your BudgetNest password.'
    : 'Use the code below to verify your email and finish creating your BudgetNest account.';

  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
      <h2 style="margin: 0 0 4px; color: #16a34a;">BudgetNest</h2>
      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">${heading}</p>
      <p style="font-size: 14px;">Hi ${name || 'there'},</p>
      <p style="font-size: 14px;">${bodyLine}</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #6b7280;">This code expires in ${process.env.OTP_EXPIRY_MINUTES || 10} minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
};

module.exports = { sendEmail, otpEmailTemplate };
