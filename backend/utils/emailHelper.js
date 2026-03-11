import nodemailer from 'nodemailer';
import config from '../config/environment.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: config.EMAIL_USER,
      pass: config.EMAIL_PASSWORD,
    },
  });

  return transporter;
};

export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    if (!config.EMAIL_USER || !config.EMAIL_PASSWORD) {
      console.log(`📧 Email (dev mode) TO: ${to} | SUBJECT: ${subject}`);
      return { messageId: 'dev_' + Date.now() };
    }
    const info = await getTransporter().sendMail({
      from: `"${config.EMAIL_FROM_NAME}" <${config.EMAIL_FROM_EMAIL}>`,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
    });
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    throw error;
  }
};

export const sendVerificationEmail = async (user, token) => {
  const frontendBase = (config.FRONTEND_URL && !config.FRONTEND_URL.includes('YOUR_RAILWAY')) ? config.FRONTEND_URL : '';
  const verifyUrl = `${frontendBase}/verify-email.html?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Verify your Writavo account ✍️',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fafaf8;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #1a1a1a; letter-spacing: -1px; margin: 0;">Writavo</h1>
          <p style="color: #888; font-size: 13px; margin: 4px 0 0;">For writers, by writers</p>
        </div>
        <div style="background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">Welcome, ${user.firstName}! 👋</h2>
          <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Thanks for joining Writavo. Please verify your email to unlock all features and start writing.</p>
          <a href="${verifyUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Verify My Email</a>
          <p style="color: #aaa; font-size: 12px; margin: 24px 0 0;">This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendPasswordResetEmail = async (user, token) => {
  const frontendBase2 = (config.FRONTEND_URL && !config.FRONTEND_URL.includes('YOUR_RAILWAY')) ? config.FRONTEND_URL : '';
  const resetUrl = `${frontendBase2}/reset-password.html?token=${token}`;
  return sendEmail({
    to: user.email,
    subject: 'Reset your Writavo password 🔒',
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fafaf8;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #1a1a1a; letter-spacing: -1px; margin: 0;">Writavo</h1>
        </div>
        <div style="background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">Reset your password</h2>
          <p style="color: #555; line-height: 1.7; margin: 0 0 24px;">Hi ${user.firstName}, we received a request to reset your Writavo password. Click the button below to choose a new password.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">Reset Password</a>
          <p style="color: #aaa; font-size: 12px; margin: 24px 0 0;">This link expires in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>
        </div>
      </div>
    `,
  });
};

export const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: `Welcome to Writavo, ${user.firstName}! 🎉`,
    html: `
      <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #fafaf8;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 32px; color: #1a1a1a; letter-spacing: -1px; margin: 0;">Writavo</h1>
          <p style="color: #888; font-size: 13px;">For writers, by writers</p>
        </div>
        <div style="background: white; border: 1px solid #e8e8e8; border-radius: 12px; padding: 40px;">
          <h2 style="color: #1a1a1a; font-size: 22px; margin: 0 0 16px;">You're in! 🎊</h2>
          <p style="color: #555; line-height: 1.7;">Your email is verified and your Writavo account is ready. Start writing, exploring communities, and connecting with writers from around the world.</p>
          <a href="${(config.FRONTEND_URL && !config.FRONTEND_URL.includes('YOUR_RAILWAY')) ? config.FRONTEND_URL : ''}/discover.html" style="display: inline-block; background: #1a1a1a; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin-top: 20px;">Explore Writavo</a>
        </div>
      </div>
    `,
  });
};
