/**
 * Email Service
 * 
 * Handles sending transactional emails using Nodemailer.
 * Supports SMTP, SendGrid, and AWS SES transports.
 * 
 * Features:
 * - Email verification
 * - Password reset
 * - Welcome emails
 * - Template-based HTML emails
 */

const nodemailer = require('nodemailer');
const crypto = require('crypto');
const config = require('../config/env');
const logger = require('../config/logger');

// ============================================================
// TRANSPORT CONFIGURATION
// ============================================================

/**
 * Create email transport based on configuration
 */
const createTransport = () => {
  // SendGrid
  if (config.email?.provider === 'sendgrid') {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: config.email.sendgridApiKey,
      },
    });
  }

  // AWS SES
  if (config.email?.provider === 'ses') {
    return nodemailer.createTransport({
      host: config.email.sesHost || 'email-smtp.us-east-1.amazonaws.com',
      port: 587,
      auth: {
        user: config.email.sesUser,
        pass: config.email.sesPass,
      },
    });
  }

  // Default SMTP (works with Mailtrap for dev, any SMTP for prod)
  return nodemailer.createTransport({
    host: config.email?.smtpHost || 'smtp.mailtrap.io',
    port: parseInt(config.email?.smtpPort) || 587,
    secure: config.email?.smtpSecure === 'true',
    auth: {
      user: config.email?.smtpUser || '',
      pass: config.email?.smtpPass || '',
    },
  });
};

let transporter = null;

/**
 * Get or create the email transporter
 */
const getTransporter = () => {
  if (!transporter) {
    transporter = createTransport();
  }
  return transporter;
};

// ============================================================
// EMAIL TEMPLATES
// ============================================================

const baseTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background: #f4f4f5; }
    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .logo { text-align: center; margin-bottom: 30px; }
    .logo h1 { color: #18181b; font-size: 24px; margin: 0; }
    .logo span { color: #6366f1; }
    h2 { color: #18181b; font-size: 20px; margin: 0 0 16px; }
    p { color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 16px; }
    .btn { display: inline-block; background: #18181b; color: #ffffff !important; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; font-size: 15px; margin: 8px 0 24px; }
    .btn:hover { background: #27272a; }
    .code { display: inline-block; background: #f4f4f5; color: #18181b; padding: 12px 24px; border-radius: 8px; font-size: 28px; font-weight: 700; letter-spacing: 4px; margin: 8px 0 24px; border: 2px dashed #d4d4d8; }
    .footer { text-align: center; margin-top: 30px; }
    .footer p { color: #a1a1aa; font-size: 13px; }
    .divider { border: none; border-top: 1px solid #e4e4e7; margin: 24px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">
        <h1>Career<span>AI</span></h1>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} CareerAI. All rights reserved.</p>
      <p>AI-Powered Resume & Interview Coach</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Email verification template
 */
const verificationEmailTemplate = (name, verificationUrl, code) => baseTemplate(`
  <h2>Verify Your Email</h2>
  <p>Hi ${name},</p>
  <p>Welcome to CareerAI! Please verify your email address to unlock all features.</p>
  <p>Your verification code is:</p>
  <div style="text-align: center;">
    <span class="code">${code}</span>
  </div>
  <p>Or click the button below:</p>
  <div style="text-align: center;">
    <a href="${verificationUrl}" class="btn">Verify Email</a>
  </div>
  <hr class="divider">
  <p style="font-size: 13px; color: #a1a1aa;">This code expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
`);

/**
 * Password reset template
 */
const passwordResetTemplate = (name, resetUrl, code) => baseTemplate(`
  <h2>Reset Your Password</h2>
  <p>Hi ${name},</p>
  <p>We received a request to reset your password. Use the code below:</p>
  <div style="text-align: center;">
    <span class="code">${code}</span>
  </div>
  <p>Or click the button below:</p>
  <div style="text-align: center;">
    <a href="${resetUrl}" class="btn">Reset Password</a>
  </div>
  <hr class="divider">
  <p style="font-size: 13px; color: #a1a1aa;">This code expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
`);

/**
 * Welcome email template
 */
const welcomeEmailTemplate = (name) => baseTemplate(`
  <h2>Welcome to CareerAI! 🎉</h2>
  <p>Hi ${name},</p>
  <p>Your email has been verified and your account is ready to go!</p>
  <p>Here's what you can do:</p>
  <ul style="color: #52525b; font-size: 15px; line-height: 2;">
    <li><strong>Upload your resume</strong> — Get an instant ATS compatibility score</li>
    <li><strong>Practice interviews</strong> — AI-powered mock interviews with personalized feedback</li>
    <li><strong>Track your progress</strong> — See your improvement over time</li>
  </ul>
  <div style="text-align: center;">
    <a href="${config.email?.frontendUrl || 'http://localhost:3000'}/dashboard" class="btn">Go to Dashboard</a>
  </div>
`);

// ============================================================
// TOKEN GENERATION
// ============================================================

/**
 * Generate a 6-digit verification code
 */
const generateVerificationCode = () => {
  return crypto.randomInt(100000, 999999).toString();
};

/**
 * Generate a secure token for email links
 */
const generateSecureToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a token for secure storage
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

// ============================================================
// SEND FUNCTIONS
// ============================================================

/**
 * Send an email
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transport = getTransporter();
    const fromAddress = config.email?.fromAddress || 'noreply@careerai.com';
    const fromName = config.email?.fromName || 'CareerAI';

    const info = await transport.sendMail({
      from: `"${fromName}" <${fromAddress}>`,
      to,
      subject,
      html,
      text: text || subject,
    });

    logger.info('Email sent successfully', { to, subject, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Failed to send email', { to, subject, error: error.message });
    // Don't throw - email failure shouldn't break the flow
    return { success: false, error: error.message };
  }
};

/**
 * Send verification email
 */
const sendVerificationEmail = async (user, code, token) => {
  const frontendUrl = config.email?.frontendUrl || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/verify-email?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'Verify Your Email - CareerAI',
    html: verificationEmailTemplate(user.name, verificationUrl, code),
  });
};

/**
 * Send password reset email
 */
const sendPasswordResetEmail = async (user, code, token) => {
  const frontendUrl = config.email?.frontendUrl || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  return sendEmail({
    to: user.email,
    subject: 'Reset Your Password - CareerAI',
    html: passwordResetTemplate(user.name, resetUrl, code),
  });
};

/**
 * Send welcome email after verification
 */
const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to CareerAI! 🎉',
    html: welcomeEmailTemplate(user.name),
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendWelcomeEmail,
  generateVerificationCode,
  generateSecureToken,
  hashToken,
};
