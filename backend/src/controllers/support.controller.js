// Support controller: sends automated email to the support inbox
import nodemailer from 'nodemailer';
import { renderSupportContact } from '../utils/email.template.js';
import { t } from '../utils/i18n.util.js';

const smtpConfig = {
  host: process.env.SMTP_HOST?.trim(),
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER?.trim(),
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM?.trim() || 'noreply@pcstore.local',
};

const SUPPORT_INBOX = process.env.SUPPORT_EMAIL || process.env.SMTP_FROM || 'pcstorenoreply4@gmail.com';

let mailTransporter = null;
if (smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
  mailTransporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: { user: smtpConfig.user, pass: smtpConfig.pass },
  });
}

export const sendSupportEmail = async (req, res) => {
  const lang = req.lang || 'en';
  const { name, email, message } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: t(lang, 'support.messagRequired') });
  }

  const senderName = name ? String(name).trim().slice(0, 120) : '';
  const senderEmail = email ? String(email).trim().slice(0, 200) : '';
  const safeMessage = String(message).trim().slice(0, 4000);

  const tpl = renderSupportContact({ senderName, senderEmail, message: safeMessage });

  if (mailTransporter) {
    try {
      await mailTransporter.sendMail({
        to: SUPPORT_INBOX,
        from: smtpConfig.from,
        replyTo: senderEmail || undefined,
        subject: tpl.subject,
        text: tpl.text,
        html: tpl.html,
      });
      return res.json({ success: true, message: t(lang, 'support.sent') });
    } catch (err) {
      console.error('Failed to send support email:', err && err.message ? err.message : err);
      return res.status(500).json({ error: t(lang, 'support.failed') });
    }
  } else {
    // No SMTP — log to console so no message is silently lost
    console.log('[SUPPORT REQUEST] to:', SUPPORT_INBOX);
    console.log('  Name:', senderName || '(none)');
    console.log('  Email:', senderEmail || '(none)');
    console.log('  Message:', safeMessage);
    return res.json({ success: true, message: t(lang, 'support.sent') });
  }
};
