// Support controller: sends automated email to admin users
import { mailTransporter, smtpConfig, SUPPORT_INBOX } from '../utils/mail.util.js';
import { renderSupportContact } from '../utils/email.template.js';
import { t } from '../utils/i18n.util.js';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

export const sendSupportEmail = async (req, res) => {
  const lang = req.lang || 'en';
  const { name, email, message } = req.body || {};

  if (!message || !String(message).trim()) {
    return res.status(400).json({ error: t(lang, 'support.messagRequired') });
  }

  const senderName = name ? String(name).trim().slice(0, 120) : '';
  const senderEmail = email ? String(email).trim().slice(0, 200) : '';
  const safeMessage = String(message).trim().slice(0, 4000);

  const tpl = renderSupportContact({ lang, senderName, senderEmail, message: safeMessage });

  // Gather all admin email addresses to send the support message to
  let recipients = [SUPPORT_INBOX];
  try {
    const admins = await run(
      supabase.from('users').select('email').eq('role', 'admin')
    );
    if (admins && admins.length > 0) {
      const adminEmails = admins.map((a) => a.email).filter(Boolean);
      // Merge with SUPPORT_INBOX, deduplicate
      const allRecipients = new Set([SUPPORT_INBOX, ...adminEmails]);
      recipients = [...allRecipients];
    }
  } catch (_e) {
    // If admin lookup fails, fall back to SUPPORT_INBOX only
  }

  if (mailTransporter) {
    try {
      await Promise.allSettled(
        recipients.map((to) =>
          mailTransporter.sendMail({
            to,
            from: smtpConfig.from,
            replyTo: senderEmail || undefined,
            subject: tpl.subject,
            text: tpl.text,
            html: tpl.html,
          })
        )
      );
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
