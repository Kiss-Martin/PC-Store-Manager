const emailStrings = {
  en: {
    adminNotify: {
      body: 'A new administrator account was created and is awaiting approval.',
      email: 'Email',
      username: 'Username',
      fullname: 'Full name',
      approve: 'Approve',
      reject: 'Reject',
      review: 'You can also review pending admins at',
    },
    registration: {
      awaitingBody: 'Your admin account has been created and is awaiting approval by another administrator. You will receive an update once it is approved.',
      welcomeBody: 'Welcome! Your account has been created successfully.',
      goToDashboard: 'Go to Dashboard',
      disclaimer: 'If you did not perform this action, please contact support.',
    },
    passwordReset: {
      body: 'We received a request to reset your password. Click the button below to reset it.',
      button: 'Reset Password',
      disclaimer: 'If you did not request this, you can safely ignore this email.',
    },
    support: {
      heading: '&#128226; New Support Request',
      body: 'A user has submitted a support request through the PC Store Manager portal.',
      name: 'Name',
      email: 'Email',
      message: 'Message',
      notProvided: 'not provided',
      footer: 'This message was sent automatically by the PC Store Manager application.',
    },
  },
  hu: {
    adminNotify: {
      body: 'Egy új adminisztrátori fiók jött létre, és jóváhagyásra vár.',
      email: 'E-mail',
      username: 'Felhasználónév',
      fullname: 'Teljes név',
      approve: 'Jóváhagyás',
      reject: 'Elutasítás',
      review: 'A függőben lévő adminokat itt is ellenőrizheted',
    },
    registration: {
      awaitingBody: 'Az admin fiókodat létrehoztuk, és egy másik adminisztrátor jóváhagyására vár. Értesítünk, amint jóváhagyásra kerül.',
      welcomeBody: 'Üdvözlünk! A fiókod sikeresen létrejött.',
      goToDashboard: 'Ugrás a vezérlőpultra',
      disclaimer: 'Ha nem te végezted ezt a műveletet, kérjük, lépj kapcsolatba a támogatással.',
    },
    passwordReset: {
      body: 'Jelszó-visszaállítási kérelmet kaptunk. Kattints az alábbi gombra a visszaállításhoz.',
      button: 'Jelszó visszaállítása',
      disclaimer: 'Ha nem te kérted, nyugodtan figyelmen kívül hagyhatod ezt az e-mailt.',
    },
    support: {
      heading: '&#128226; Új támogatási kérelem',
      body: 'Egy felhasználó támogatási kérelmet küldött a PC Store Manager portálon keresztül.',
      name: 'Név',
      email: 'E-mail',
      message: 'Üzenet',
      notProvided: 'nem adta meg',
      footer: 'Ezt az üzenetet automatikusan küldte a PC Store Manager alkalmazás.',
    },
  },
};

function getEmailStrings(lang) {
  return emailStrings[lang === 'hu' ? 'hu' : 'en'];
}

export function renderAdminNotification({ lang = 'en', subject, email, username, fullname, approveUrl, rejectUrl, reviewLink }) {
  const s = getEmailStrings(lang);
  const plain = `${s.adminNotify.body}\n${s.adminNotify.email}: ${email}\n${s.adminNotify.username}: ${username}\n${s.adminNotify.fullname}: ${fullname}\n\n${s.adminNotify.review}: ${reviewLink}\n${s.adminNotify.approve}: ${approveUrl}\n${s.adminNotify.reject}: ${rejectUrl}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>${s.adminNotify.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.email}</td><td style="padding:6px">${email}</td></tr>
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.username}</td><td style="padding:6px">${username}</td></tr>
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.fullname}</td><td style="padding:6px">${fullname}</td></tr>
    </table>
    <p style="margin-top:18px">
      <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px">${s.adminNotify.approve}</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">${s.adminNotify.reject}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${s.adminNotify.review} <a href="${reviewLink}">${reviewLink}</a></p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderRegistrationConfirmation({ lang = 'en', subject, username, fullname, link, awaitingApproval = false }) {
  const s = getEmailStrings(lang);
  const plain = awaitingApproval
    ? `${s.registration.awaitingBody} (${username})`
    : `${s.registration.welcomeBody} (${username}) — ${link}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>${awaitingApproval ? s.registration.awaitingBody : s.registration.welcomeBody}</p>
    ${awaitingApproval ? '' : `<p style="margin-top:18px"><a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${s.registration.goToDashboard}</a></p>`}
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${s.registration.disclaimer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderPasswordReset({ lang = 'en', subject, resetLink }) {
  const s = getEmailStrings(lang);
  const text = `${s.passwordReset.body}: ${resetLink}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>${s.passwordReset.body}</p>
    <p style="margin-top:18px">
      <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${s.passwordReset.button}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${s.passwordReset.disclaimer}</p>
  </div>
  `;
  return { subject, text, html };
}

export function renderSupportContact({ lang = 'en', senderName, senderEmail, message }) {
  const s = getEmailStrings(lang);
  const safe = (str = '') => String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const plain = `${s.support.heading}\n\n${s.support.name}: ${senderName || s.support.notProvided} <${senderEmail || s.support.notProvided}>\n\n${s.support.message}:\n${message}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${s.support.heading}</h2>
    <p>${s.support.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:10px 14px;font-weight:600;width:120px">${s.support.name}</td><td style="padding:10px 14px">${safe(senderName) || `<em style="color:#9ca3af">${s.support.notProvided}</em>`}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${s.support.email}</td><td style="padding:10px 14px">${senderEmail ? `<a href="mailto:${safe(senderEmail)}">${safe(senderEmail)}</a>` : `<em style="color:#9ca3af">${s.support.notProvided}</em>`}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600;vertical-align:top">${s.support.message}</td><td style="padding:10px 14px;white-space:pre-wrap">${safe(message)}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:18px">${s.support.footer}</p>
  </div>
  `;
  return { subject: 'Support Request — PC Store Manager', text: plain, html };
}

export default { renderAdminNotification, renderPasswordReset, renderSupportContact };
