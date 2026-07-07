const nodemailer = require('nodemailer');

/**
 * Sends a transactional email using Nodemailer.
 * If SMTP variables are missing from .env, it safely logs the email to the console to prevent runtime failure.
 * @param {Object} options - Options containing to, subject, text, and html content.
 */
const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const fromEmail = process.env.FROM_EMAIL || 'ExamShield AI <no-reply@examshield.com>';

  // Robust fallback logic for local development or missing SMTP configs
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("⚠️ SMTP credentials not fully configured in .env. Logging email to terminal output:");
    console.log("==================== EMAIL OUTBOX LOG ====================");
    console.log(`FROM:    ${fromEmail}`);
    console.log(`TO:      ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`TEXT:\n${options.text}`);
    console.log("==========================================================");
    return { success: true, logged: true };
  }

  // Define transport parameters
  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: parseInt(smtpPort),
    secure: parseInt(smtpPort) === 465, // True for SSL, false for TLS/STARTTLS
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
    tls: {
      rejectUnauthorized: false // Bypass self-signed cert blocks if any
    }
  });

  const mailOptions = {
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Email successfully delivered to ${options.to} (ID: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Email delivery failed:", error.message);
    throw error;
  }
};

module.exports = sendEmail;
