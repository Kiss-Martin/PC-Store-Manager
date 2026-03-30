// Shared mail transporter — single source of truth for SMTP configuration
import nodemailer from 'nodemailer';

const smtpConfig = {
  host: process.env.SMTP_HOST?.trim(),
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER?.trim(),
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM?.trim() || 'noreply@pcstore.local',
};

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || 'pcstorenoreply4@gmail.com';

const requiredSmtpFields = ['host', 'user', 'pass'];
const missingSmtpFields = requiredSmtpFields.filter((field) => !smtpConfig[field]);
const hasAnySmtpConfig = requiredSmtpFields.some((field) => Boolean(smtpConfig[field]));
const hasCompleteSmtpConfig = missingSmtpFields.length === 0;

let mailTransporter = null;
if (hasCompleteSmtpConfig) {
  mailTransporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  // Verify transporter connectivity at startup; log result but do not throw.
  mailTransporter.verify()
    .then(() => console.log('SMTP transporter verified'))
    .catch((err) => console.warn('SMTP transporter verification failed:', err && err.message ? err.message : err));
} else if (hasAnySmtpConfig) {
  console.warn(`SMTP configuration is incomplete. Missing: ${missingSmtpFields.join(', ')}. Password reset emails will be logged instead of sent.`);
}

export function getSmtpRuntimeStatus() {
  return {
    configured: hasCompleteSmtpConfig,
    partiallyConfigured: hasAnySmtpConfig && !hasCompleteSmtpConfig,
    missingFields: missingSmtpFields,
    host: smtpConfig.host || null,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    from: smtpConfig.from,
  };
}

export { mailTransporter, smtpConfig, SUPPORT_INBOX };
