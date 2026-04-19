const emailStrings = {
  en: {
    adminNotify: {
      body: 'A new administrator account was created and is awaiting approval.',
      bodyWorker: 'A new worker account was created and is awaiting approval.',
      email: 'Email',
      username: 'Username',
      fullname: 'Full name',
      role: 'Role',
      approve: 'Approve',
      reject: 'Reject',
      review: 'You can also review pending admins at',
      reviewWorker: 'You can also review pending workers at',
    },
    registration: {
      awaitingBody: 'Your admin account has been created and is awaiting approval by another administrator. You will receive an update once it is approved.',
      welcomeBody: 'Welcome! Your account has been created successfully.',
      goToDashboard: 'Go to Dashboard',
      disclaimer: 'If you did not perform this action, please contact support.',
    },
    workerRegistration: {
      awaitingBody: 'Your worker account has been created and is awaiting approval by an administrator. You will receive an update once it is approved.',
      welcomeBody: 'Welcome! Your worker account has been created successfully.',
      goToDashboard: 'Go to Dashboard',
      disclaimer: 'If you did not perform this action, please contact support.',
    },
    approval: {
      body: 'Your administrator account has been approved! You can now log in and access the admin panel.',
      goToDashboard: 'Go to Dashboard',
      disclaimer: 'If you did not register for this account, please contact support.',
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
    newOrder: {
      heading: '&#128230; New Order Placed',
      body: 'A new order has been placed in the PC Store Manager system.',
      orderNumber: 'Order Number',
      product: 'Product',
      quantity: 'Quantity',
      total: 'Total Amount',
      customer: 'Customer',
      status: 'Status',
      footer: 'This notification was sent automatically by the PC Store Manager application.',
    },
    buyerOrderConfirm: {
      heading: '&#128230; Order Confirmed',
      body: 'Your order has been received and is now in the system.',
      orderNumber: 'Order Number',
      product: 'Product',
      quantity: 'Quantity',
      total: 'Total',
      status: 'Status',
      footer: 'Thank you for your order. You will receive updates as your order is processed.',
    },
    orderStatusChange: {
      heading: '&#128230; Order Status Updated',
      body: 'Your order status has been updated.',
      orderNumber: 'Order Number',
      product: 'Product',
      newStatus: 'New Status',
      footer: 'This notification was sent automatically by the PC Store Manager application.',
    },
    stockUpdate: {
      heading: '&#128315; Stock Updated',
      body: 'Product stock has been updated in the system.',
      product: 'Product',
      oldQuantity: 'Previous Quantity',
      newQuantity: 'New Quantity',
      change: 'Change',
      footer: 'This notification was sent automatically by the PC Store Manager application.',
    },
  },
  hu: {
    adminNotify: {
      body: 'Egy új adminisztrátori fiók jött létre, és jóváhagyásra vár.',
      bodyWorker: 'Egy új dolgozói fiók jött létre, és jóváhagyásra vár.',
      email: 'E-mail',
      username: 'Felhasználónév',
      fullname: 'Teljes név',
      role: 'Szerep',
      approve: 'Jóváhagyás',
      reject: 'Elutasítás',
      review: 'A függőben lévő adminokat itt is ellenőrizheted',
      reviewWorker: 'A függőben lévő dolgozókat itt is ellenőrizheted',
    },
    registration: {
      awaitingBody: 'Az admin fiókodat létrehoztuk, és egy másik adminisztrátor jóváhagyására vár. Értesítünk, amint jóváhagyásra kerül.',
      welcomeBody: 'Üdvözlünk! A fiókod sikeresen létrejött.',
      goToDashboard: 'Ugrás a vezérlőpultra',
      disclaimer: 'Ha nem te végezted ezt a műveletet, kérjük, lépj kapcsolatba a támogatással.',
    },
    workerRegistration: {
      awaitingBody: 'A dolgozói fiókodat létrehoztuk, és egy adminisztrátor jóváhagyására vár. Értesítünk, amint jóváhagyásra kerül.',
      welcomeBody: 'Üdvözlünk! A dolgozói fiókodat sikeresen létrejött.',
      goToDashboard: 'Ugrás a vezérlőpultra',
      disclaimer: 'Ha nem te végezted ezt a műveletet, kérjük, lépj kapcsolatba a támogatással.',
    },
    approval: {
      body: 'Az adminisztrátori fiókodat jóváhagyták! Most már bejelentkezhetsz és használhatod az admin felületet.',
      goToDashboard: 'Ugrás a vezérlőpultra',
      disclaimer: 'Ha nem te regisztráltad ezt a fiókot, kérjük, lépj kapcsolatba a támogatással.',
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
    newOrder: {
      heading: '&#128230; Új rendelés érkezett',
      body: 'Új rendelés érkezett a PC Store Manager rendszerben.',
      orderNumber: 'Rendelés száma',
      product: 'Termék',
      quantity: 'Mennyiség',
      total: 'Összeg',
      customer: 'Ügyfél',
      status: 'Státusz',
      footer: 'Ezt az értesítést automatikusan küldte a PC Store Manager alkalmazás.',
    },
    buyerOrderConfirm: {
      heading: '&#128230; Rendelés megerősítve',
      body: 'A rendelésed beérkezett a rendszerbe.',
      orderNumber: 'Rendelés száma',
      product: 'Termék',
      quantity: 'Mennyiség',
      total: 'Végösszeg',
      status: 'Státusz',
      footer: 'Köszönjük a rendelésed. Értesítést küldünk, ahogy a rendelés feldolgozása halad.',
    },
    orderStatusChange: {
      heading: '&#128230; Rendelés státusza frissült',
      body: 'A rendelésed státusza frissítésre került.',
      orderNumber: 'Rendelés száma',
      product: 'Termék',
      newStatus: 'Új státusz',
      footer: 'Ezt az értesítést automatikusan küldte a PC Store Manager alkalmazás.',
    },
    stockUpdate: {
      heading: '&#128315; Készlet frissítve',
      body: 'A termék készlete frissítésre került a rendszerben.',
      product: 'Termék',
      oldQuantity: 'Előző mennyiség',
      newQuantity: 'Új mennyiség',
      change: 'Változás',
      footer: 'Ezt az értesítést automatikusan küldte a PC Store Manager alkalmazás.',
    },
  },
};

function getEmailStrings(lang) {
  return emailStrings[lang === 'hu' ? 'hu' : 'en'];
}

/** Escape user-supplied values for safe HTML embedding */
function safe(str = '') {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export function renderAdminNotification({ lang = 'en', subject, email, username, fullname, approveUrl, rejectUrl, reviewLink, role = 'admin' }) {
  const s = getEmailStrings(lang);
  const isWorker = role === 'worker';
  const body = isWorker ? s.adminNotify.bodyWorker : s.adminNotify.body;
  const review = isWorker ? s.adminNotify.reviewWorker : s.adminNotify.review;
  const roleDisplay = isWorker ? 'Worker' : 'Administrator';
  const roleDisplayLang = isWorker ? (lang === 'hu' ? 'Dolgozó' : 'Worker') : (lang === 'hu' ? 'Adminisztrátor' : 'Administrator');
  const plain = `${body}\n${s.adminNotify.email}: ${email}\n${s.adminNotify.username}: ${username}\n${s.adminNotify.fullname}: ${fullname}\n${s.adminNotify.role}: ${roleDisplayLang}\n\n${review}: ${reviewLink}\n${s.adminNotify.approve}: ${approveUrl}\n${s.adminNotify.reject}: ${rejectUrl}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${safe(subject)}</h2>
    <p>${body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px">
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.email}</td><td style="padding:6px">${safe(email)}</td></tr>
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.username}</td><td style="padding:6px">${safe(username)}</td></tr>
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.fullname}</td><td style="padding:6px">${safe(fullname)}</td></tr>
      <tr><td style="padding:6px;font-weight:600">${s.adminNotify.role}</td><td style="padding:6px">${safe(roleDisplayLang)}</td></tr>
    </table>
    <p style="margin-top:18px">
      <a href="${safe(approveUrl)}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none;margin-right:8px">${s.adminNotify.approve}</a>
      <a href="${safe(rejectUrl)}" style="display:inline-block;padding:10px 16px;background:#ef4444;color:#fff;border-radius:6px;text-decoration:none">${s.adminNotify.reject}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${review} <a href="${safe(reviewLink)}">${safe(reviewLink)}</a></p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderRegistrationConfirmation({ lang = 'en', subject, username, fullname, link, awaitingApproval = false, role = 'admin' }) {
  const s = getEmailStrings(lang);
  // Use workerRegistration strings if role is 'worker', otherwise use registration strings (for admin)
  const strings = role === 'worker' ? s.workerRegistration : s.registration;
  const plain = awaitingApproval
    ? `${strings.awaitingBody} (${username} - ${fullname})`
    : `${strings.welcomeBody} (${username} - ${fullname}) — ${link}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${safe(subject)}</h2>
    <p>${awaitingApproval ? strings.awaitingBody : strings.welcomeBody}</p>
    ${awaitingApproval ? '' : `<p style="margin-top:18px"><a href="${safe(link)}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${strings.goToDashboard}</a></p>`}
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${strings.disclaimer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderPasswordReset({ lang = 'en', subject, resetLink }) {
  const s = getEmailStrings(lang);
  const text = `${s.passwordReset.body}: ${resetLink}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${safe(subject)}</h2>
    <p>${s.passwordReset.body}</p>
    <p style="margin-top:18px">
      <a href="${safe(resetLink)}" style="display:inline-block;padding:10px 16px;background:#2563eb;color:#fff;border-radius:6px;text-decoration:none">${s.passwordReset.button}</a>
    </p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${s.passwordReset.disclaimer}</p>
  </div>
  `;
  return { subject, text, html };
}

export function renderSupportContact({ lang = 'en', senderName, senderEmail, message }) {
  const s = getEmailStrings(lang);
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

export function renderApprovalNotification({ lang = 'en', subject, username, loginLink }) {
  const s = getEmailStrings(lang);
  const plain = `${s.approval.body} (${username}) — ${loginLink}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${safe(subject)}</h2>
    <p>${s.approval.body}</p>
    <p style="margin-top:18px"><a href="${safe(loginLink)}" style="display:inline-block;padding:10px 16px;background:#10b981;color:#fff;border-radius:6px;text-decoration:none">${s.approval.goToDashboard}</a></p>
    <p style="font-size:12px;color:#6b7280;margin-top:14px">${s.approval.disclaimer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderNewOrderNotification({ lang = 'en', orderNumber, product, quantity, totalAmount, customer, status }) {
  const s = getEmailStrings(lang);
  const n = s.newOrder;
  const subject = `${n.heading} — ${orderNumber}`;
  const plain = `${n.body}\n\n${n.orderNumber}: ${orderNumber}\n${n.product}: ${product}\n${n.quantity}: ${quantity}\n${n.total}: $${totalAmount}\n${n.customer}: ${customer}\n${n.status}: ${status}\n\n${n.footer}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${n.heading}</h2>
    <p>${n.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:10px 14px;font-weight:600;width:140px">${n.orderNumber}</td><td style="padding:10px 14px">${safe(orderNumber)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.product}</td><td style="padding:10px 14px">${safe(product)}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${n.quantity}</td><td style="padding:10px 14px">${safe(quantity)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.total}</td><td style="padding:10px 14px">$${safe(totalAmount)}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${n.customer}</td><td style="padding:10px 14px">${safe(customer)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.status}</td><td style="padding:10px 14px">${safe(status)}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:18px">${n.footer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderOrderStatusChangeNotification({ lang = 'en', orderNumber, product, newStatus }) {
  const s = getEmailStrings(lang);
  const n = s.orderStatusChange;
  const subject = `${n.heading} — ${orderNumber}`;
  const plain = `${n.body}\n\n${n.orderNumber}: ${orderNumber}\n${n.product}: ${product}\n${n.newStatus}: ${newStatus}\n\n${n.footer}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${n.heading}</h2>
    <p>${n.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:10px 14px;font-weight:600;width:140px">${n.orderNumber}</td><td style="padding:10px 14px">${safe(orderNumber)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.product}</td><td style="padding:10px 14px">${safe(product)}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${n.newStatus}</td><td style="padding:10px 14px">${safe(newStatus)}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:18px">${n.footer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderBuyerOrderConfirmation({ lang = 'en', orderNumber, product, quantity, totalAmount, status }) {
  const s = getEmailStrings(lang);
  const n = s.buyerOrderConfirm;
  const subject = `${n.heading} — ${orderNumber}`;
  const plain = `${n.body}\n\n${n.orderNumber}: ${orderNumber}\n${n.product}: ${product}\n${n.quantity}: ${quantity}\n${n.total}: $${totalAmount}\n${n.status}: ${status}\n\n${n.footer}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${n.heading}</h2>
    <p>${n.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:10px 14px;font-weight:600;width:140px">${n.orderNumber}</td><td style="padding:10px 14px">${safe(orderNumber)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.product}</td><td style="padding:10px 14px">${safe(product)}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${n.quantity}</td><td style="padding:10px 14px">${safe(quantity)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${n.total}</td><td style="padding:10px 14px">$${safe(totalAmount)}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${n.status}</td><td style="padding:10px 14px">${safe(status)}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:18px">${n.footer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export function renderStockUpdateNotification({ lang = 'en', productName, oldQuantity, newQuantity }) {
  const s = getEmailStrings(lang);
  const st = s.stockUpdate;
  const quantityChange = newQuantity - oldQuantity;
  const changeStr = quantityChange > 0 ? `+${quantityChange}` : `${quantityChange}`;
  const subject = `${st.heading} — ${productName}`;
  const plain = `${st.body}\n\n${st.product}: ${productName}\n${st.oldQuantity}: ${oldQuantity}\n${st.newQuantity}: ${newQuantity}\n${st.change}: ${changeStr}\n\n${st.footer}`;
  const html = `
  <div style="font-family: Arial, Helvetica, sans-serif; color:#111;">
    <h2 style="color:#111827">${st.heading}</h2>
    <p>${st.body}</p>
    <table style="width:100%;border-collapse:collapse;margin-top:8px;background:#f9fafb;border-radius:8px">
      <tr><td style="padding:10px 14px;font-weight:600;width:140px">${st.product}</td><td style="padding:10px 14px">${safe(productName)}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${st.oldQuantity}</td><td style="padding:10px 14px">${oldQuantity}</td></tr>
      <tr><td style="padding:10px 14px;font-weight:600">${st.newQuantity}</td><td style="padding:10px 14px">${newQuantity}</td></tr>
      <tr style="background:#fff"><td style="padding:10px 14px;font-weight:600">${st.change}</td><td style="padding:10px 14px;color:${quantityChange > 0 ? '#10b981' : '#ef4444'}">${changeStr}</td></tr>
    </table>
    <p style="font-size:12px;color:#6b7280;margin-top:18px">${st.footer}</p>
  </div>
  `;
  return { subject, text: plain, html };
}

export default { renderAdminNotification, renderPasswordReset, renderSupportContact, renderApprovalNotification, renderNewOrderNotification, renderOrderStatusChangeNotification, renderBuyerOrderConfirmation, renderStockUpdateNotification };
