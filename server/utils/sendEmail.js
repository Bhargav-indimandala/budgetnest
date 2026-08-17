const { Resend } = require('resend');

const isConfigured = !!process.env.RESEND_API_KEY;
const resend = isConfigured ? new Resend(process.env.RESEND_API_KEY) : null;

// Sends an email via Resend, or — if RESEND_API_KEY isn't set (e.g. local
// dev) — just logs it to the console so the reset flow is still testable
// without a real API key.
const sendEmail = async ({ to, subject, html }) => {
  if (!isConfigured) {
    console.log(`\n[Email:DEV] RESEND_API_KEY not set — would have sent to ${to}`);
    console.log(`[Email:DEV] Subject: ${subject}`);
    console.log(`[Email:DEV] Body:\n${html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}\n`);
    return { devMode: true };
  }

  // process.env.EMAIL_FROM lets you switch to a verified domain address
  // later without touching code — until then, Resend's shared sandbox
  // sender only delivers to the email address on the Resend account itself.
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || 'BudgetNest <onboarding@resend.dev>',
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error('[Resend] Send failed:', error);
    throw new Error(error.message || 'Failed to send email');
  }

  return data;
};

// Minimal branded OTP template — kept inline (no external template engine)
// since it's just one email type used for password resets.
const otpEmailTemplate = ({ name, otp }) => {
  return `
    <div style="font-family: -apple-system, Segoe UI, Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
      <h2 style="margin: 0 0 4px; color: #16a34a;">BudgetNest</h2>
      <p style="margin: 0 0 20px; color: #6b7280; font-size: 14px;">Reset your password</p>
      <p style="font-size: 14px;">Hi ${name || 'there'},</p>
      <p style="font-size: 14px;">Use the code below to reset your BudgetNest password.</p>
      <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #111827;">${otp}</span>
      </div>
      <p style="font-size: 13px; color: #6b7280;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;
};

module.exports = { sendEmail, otpEmailTemplate };
