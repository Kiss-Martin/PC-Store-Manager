export function renderAdminNotification({ lang = 'en', subject, email, username, fullname, approveUrl, rejectUrl, reviewLink }) {
  const plain = `A new administrator account was created and is awaiting approval:\nEmail: ${email}\nUsername: ${username}\nFull name: ${fullname}\n\nReview pending admins at: ${reviewLink}\nApprove: ${approveUrl}\nReject: ${rejectUrl}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>A new administrator account was created and is awaiting approval.</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr><td style="padding:6px;font-weight:600">Email</td><td style="padding:6px">${email}</td></tr>
      <tr><td style="padding:6px;font-weight:600">Username</td><td style="padding:6px">${username}</td></tr>
      <tr><td style="padding:6px;font-weight:600">Full name</td><td style="padding:6px">${fullname}</td></tr>
    </table>
    <p style="margin-top:18px">
      <a href="${approveUrl}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px">Approve</a>
      <a href="${rejectUrl}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">Reject</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">You can also review pending admins at <a href="${reviewLink}">${reviewLink}</a></p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderRegistrationConfirmation({ lang = 'en', subject, username, fullname, link, awaitingApproval = false }) {
  const plain = awaitingApproval
    ? `Your admin account (${username}) has been created and is awaiting approval. You will be notified once it is approved.`
    : `Welcome ${fullname || username}! Your account (${username}) has been created successfully. You can log in at: ${link}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>${awaitingApproval ? 'Your admin account has been created and is awaiting approval by another administrator. You will receive an update once it is approved.' : 'Welcome! Your account has been created successfully.'}</p>
    ${awaitingApproval ? '' : `<p style="margin-top:18px"><a href="${link}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Go to Dashboard</a></p>`}
    <p style="font-size:12px;color:#6b7280;margin-top:14px">If you did not perform this action, please contact support.</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderPasswordReset({ lang = 'en', subject, resetLink }) {
  const text = `Reset your password by visiting this link: ${resetLink}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${subject}</h2>
    <p>We received a request to reset your password. Click the button below to reset it.</p>
    <p style="margin-top:18px">
      <a href="${resetLink}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">Reset Password</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">If you did not request this, you can safely ignore this email.</p>
  </div>
  `;
  return { subject, text, html };
}

export default { renderAdminNotification, renderPasswordReset };
