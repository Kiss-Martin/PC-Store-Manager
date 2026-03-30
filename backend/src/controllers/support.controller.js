// Support controller: sends automated email to the support inbox
import { mailTransporter, smtpConfig, SUPPORT_INBOX } from '../utils/mail.util.js';
import { renderSupportContact } from '../utils/email.template.js';
import { t } from '../utils/i18n.util.js';

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
