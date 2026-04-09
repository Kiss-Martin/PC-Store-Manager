const dictionaries = {
  en: {
    'auth.invalidCredentials': 'The email/username or password you entered is incorrect. Please try again.',
    'auth.missingToken': 'Authentication required. Please log in.',
    'auth.invalidToken': 'Your session has expired or is invalid. Please log in again.',
    'auth.roleOnly': '{role} only',
    'auth.passwordResetSubject': 'Password reset',
    'auth.passwordResetText': 'Reset your password: {link}',
    'auth.passwordResetIntro': 'Reset your password',
    'auth.passwordResetFallback': 'No SMTP configured; token logged to server.',
    'auth.passwordResetSent': 'Reset link sent. Check your inbox.',
    'auth.passwordResetGeneric': 'If that email exists, a reset link has been sent.',
    'auth.invalidOrExpiredToken': 'Invalid or expired token',
    'auth.tokenExpired': 'Token expired',
    'auth.awaitingApproval': 'Your admin account is waiting for approval from another administrator.',
    'auth.registeredAwaitingApproval': 'Admin account created and waiting for approval.',
    'auth.notifyAdminsSubject': 'New admin awaiting approval',
    'auth.notifyAdminsText': 'A new administrator account was created and is awaiting approval:\nEmail: {email}\nUsername: {username}\nFull name: {fullname}\n\nReview and approve at: {link}',
    'auth.registrationSubject': 'Registration successful',
    'auth.registrationText': 'Welcome {fullname}! Your account ({username}) has been created. You can log in at: {link}',
    'auth.registrationAwaitingSubject': 'Registration received — awaiting approval',
    'auth.registrationAwaitingText': 'Your admin account ({username}) has been created and is awaiting approval. You will be notified when it is approved.',
    'auth.approvalSubject': 'Your admin account has been approved',

    'user.noValidFields': 'No valid fields to update',
    'user.passwordRequired': 'Current password and new password required',
    'user.passwordMinLength': 'New password must be at least 8 characters with uppercase, lowercase, number, and special character',
    'user.fetchFailed': 'Failed to fetch user',
    'user.currentPasswordIncorrect': 'The current password you entered is incorrect',
    'user.passwordUpdated': 'Password updated successfully',
    'user.emailAlreadyExists': 'An account with this email address already exists. Please use a different email or log in.',
    'user.usernameAlreadyExists': 'This username is already taken. Please choose a different one.',
    'user.deleted': 'Profile deleted successfully',
    'user.deleteFailed': 'Failed to delete profile',

    'order.invalidStatus': 'Invalid status',
    'order.itemNotFound': 'Item not found',
    'order.insufficientStock': 'Insufficient stock. Only {count} available',
    'order.notFound': 'Order not found',

    'customer.nameRequired': 'Customer name is required',
    'customer.emailRequired': 'Customer email is required',
    'customer.phoneRequired': 'Customer phone is required',

    'item.deleteActiveOrders': 'Cannot delete this product because it has active (pending or processing) orders. Complete or cancel them first.',
    'item.deleteFkError': 'Cannot delete this product because it is still referenced by other records.',
    'brand.invalidName': 'Brand name is invalid. Must start with a letter and contain no quantity-like values.',
    'brand.duplicate': 'A brand with this name already exists.',

    'validation.email': 'Please enter a valid email address',
    'validation.usernameMin': 'Username must be at least 3 characters',
    'validation.usernameChars': 'Username can only contain letters, numbers, underscores, dots, and hyphens',
    'validation.passwordRequired': 'Password is required',
    'validation.passwordMin': 'Password must be at least 8 characters',
    'validation.passwordUppercase': 'Password must contain at least one uppercase letter',
    'validation.passwordLowercase': 'Password must contain at least one lowercase letter',
    'validation.passwordDigit': 'Password must contain at least one number',
    'validation.passwordSpecial': 'Password must contain at least one special character',
    'validation.currentPasswordRequired': 'Current password is required',
    'validation.newPasswordMin': 'New password must be at least 8 characters',
    'validation.itemNameRequired': 'Item name is required',
    'validation.priceNonNegative': 'Price must be zero or greater',
    'validation.categoryRequired': 'Category is required',
    'validation.brandRequired': 'Brand is required',
    'validation.amountNonNegative': 'Stock amount must be zero or greater',
    'validation.itemRequired': 'Item is required',
    'validation.customerRequired': 'Customer is required',
    'validation.quantityPositive': 'Quantity must be at least 1',
    'validation.tokenRequired': 'Token is required',
    'validation.emailOrUsernameRequired': 'Email or username is required',
    'validation.invalidRole': 'Invalid role. Must be admin or worker',

    'role.admin': 'Admin',
    'role.worker': 'Worker',
    'role.buyer': 'Buyer',

    'order.buyerCanOnlyCancel': 'Buyers can only cancel orders',
    'order.notAssignedToYou': 'You can only update orders assigned to you',

    'error.internalServerError': 'Internal Server Error',

    'export.orders.title': 'Orders Report',
    'export.orders.generatedOn': 'Generated on {date}',
    'export.orders.statusFilter': 'Status Filter',
    'export.orders.exported': 'Orders Exported',
    'export.orders.totalRevenue': 'Total Revenue',
    'export.orders.id': 'Order ID',
    'export.orders.number': 'Order Number',
    'export.orders.product': 'Product',
    'export.orders.quantity': 'Quantity',
    'export.orders.unitPrice': 'Unit Price',
    'export.orders.totalAmount': 'Total Amount',
    'export.orders.status': 'Status',
    'export.orders.customer': 'Customer',
    'export.orders.date': 'Date',

    'export.sales.title': 'Sales Report',
    'export.sales.periodLine': 'Period: {period} | Generated on {date}',
    'export.sales.transactions': 'Transactions Exported',
    'export.sales.totalRevenue': 'Total Revenue',
    'export.sales.averageOrderValue': 'Average Order Value',
    'export.sales.topProduct': 'Top Product',
    'export.sales.date': 'Date',
    'export.sales.product': 'Product',
    'export.sales.brand': 'Brand',
    'export.sales.category': 'Category',
    'export.sales.quantity': 'Quantity',
    'export.sales.unitPrice': 'Unit Price',
    'export.sales.total': 'Total',
    'export.sales.orderId': 'Order ID',
    'export.summary': 'Summary',
    'export.period.7days': 'Last 7 Days',
    'export.period.30days': 'Last 30 Days',
    'export.period.90days': 'Last 90 Days',
    'status.pending': 'Pending',
    'status.processing': 'Processing',
    'status.completed': 'Completed',
    'status.cancelled': 'Cancelled',
    'common.all': 'All',
    'common.na': 'N/A',
    'common.unknown': 'Unknown',

    'support.messagRequired': 'Message is required',
    'support.sent': 'Your message has been sent. We will get back to you soon.',
    'support.failed': 'Failed to send your message. Please try again later.',
    'support.emailSubject': 'Support Request — PC Store Manager',
  },
  hu: {
    'auth.invalidCredentials': 'A megadott e-mail/felhasználónév vagy jelszó helytelen. Kérjük, próbáld újra.',
    'auth.missingToken': 'Hitelesítés szükséges. Kérjük, jelentkezz be.',
    'auth.invalidToken': 'A munkameneted lejárt vagy érvénytelen. Kérjük, jelentkezz be újra.',
    'auth.roleOnly': 'Csak {role} számára',
    'auth.passwordResetSubject': 'Jelszó visszaállítása',
    'auth.passwordResetText': 'A jelszó visszaállítása: {link}',
    'auth.passwordResetIntro': 'Állítsd vissza a jelszavad',
    'auth.passwordResetFallback': 'Nincs SMTP beállítva; a token a szervernaplóba került.',
    'auth.passwordResetSent': 'A visszaállító link elküldve. Ellenőrizd a postaládádat.',
    'auth.passwordResetGeneric': 'Ha az e-mail cím létezik, elküldtük a visszaállító linket.',
    'auth.invalidOrExpiredToken': 'Érvénytelen vagy lejárt token',
    'auth.tokenExpired': 'A token lejárt',
    'auth.awaitingApproval': 'Az admin fiókod jóváhagyásra vár egy másik adminisztrátortól.',
    'auth.registeredAwaitingApproval': 'Az admin fiók létrejött, és jóváhagyásra vár.',
    'auth.notifyAdminsSubject': 'Új admin jóváhagyásra vár',
    'auth.notifyAdminsText': 'Egy új adminisztrátor fiók jött létre és jóváhagyásra vár:\nE-mail: {email}\nFelhasználónév: {username}\nTeljes név: {fullname}\n\nEllenőrizd és jóváhagyhatod itt: {link}',
    'auth.registrationSubject': 'Sikeres regisztráció',
    'auth.registrationText': 'Üdvözlünk {fullname}! A fiókod ({username}) létrejött. Bejelentkezhetsz: {link}',
    'auth.registrationAwaitingSubject': 'Regisztráció beérkezett — jóváhagyásra vár',
    'auth.registrationAwaitingText': 'Az admin fiók ({username}) létrejött és jóváhagyásra vár. Értesítünk, ha jóváhagyásra kerül.',
    'auth.approvalSubject': 'Az admin fiókodat jóváhagyták',

    'support.messagRequired': 'Az üzenet megadása kötelező',
    'support.sent': 'Az üzeneted elküldve. Hamarosan felvesszük veled a kapcsolatot.',
    'support.failed': 'Az üzenet küldése sikertelen. Kérjük, próbáld meg újra.',
    'support.emailSubject': 'Támogatási kérelem — PC Store Manager',

    'user.noValidFields': 'Nincs frissíthető mező',
    'user.passwordRequired': 'A jelenlegi és az új jelszó megadása kötelező',
    'user.passwordMinLength': 'Az új jelszó legalább 8 karakter legyen, nagybetűvel, kisbetűvel, számmal és speciális karakterrel',
    'user.fetchFailed': 'Nem sikerült lekérni a felhasználót',
    'user.currentPasswordIncorrect': 'A megadott jelenlegi jelszó hibás',
    'user.passwordUpdated': 'A jelszó sikeresen frissítve',
    'user.emailAlreadyExists': 'Ezzel az e-mail címmel már létezik fiók. Használj másik e-mailt, vagy jelentkezz be.',
    'user.usernameAlreadyExists': 'Ez a felhasználónév már foglalt. Kérjük, válassz másikat.',
    'user.deleted': 'A profil sikeresen törölve',
    'user.deleteFailed': 'Nem sikerült törölni a profilt',

    'order.invalidStatus': 'Érvénytelen állapot',
    'order.itemNotFound': 'A termék nem található',
    'order.insufficientStock': 'Nincs elegendő készlet. Csak {count} db érhető el',
    'order.notFound': 'A rendelés nem található',

    'customer.nameRequired': 'A vásárló neve kötelező',
    'customer.emailRequired': 'A vásárló e-mail címe kötelező',
    'customer.phoneRequired': 'A vásárló telefonszáma kötelező',

    'item.deleteActiveOrders': 'A termék nem törölhető, mert aktív (függőben lévő vagy feldolgozás alatt álló) rendelései vannak. Előbb teljesítsd vagy töröld őket.',
    'item.deleteFkError': 'A termék nem törölhető, mert más rekordok hivatkoznak rá.',
    'brand.invalidName': 'A márkanév érvénytelen. Betűvel kell kezdődnie, és nem tartalmazhat mennyiség-szerű értékeket.',
    'brand.duplicate': 'Már létezik ilyen nevű márka.',

    'validation.email': 'Adj meg egy érvényes e-mail címet',
    'validation.usernameMin': 'A felhasználónév legalább 3 karakter legyen',
    'validation.usernameChars': 'A felhasználónév csak betűket, számokat, aláhúzást, pontot és kötőjelet tartalmazhat',
    'validation.passwordRequired': 'A jelszó megadása kötelező',
    'validation.passwordMin': 'A jelszó legalább 8 karakter legyen',
    'validation.passwordUppercase': 'A jelszónak tartalmaznia kell legalább egy nagybetűt',
    'validation.passwordLowercase': 'A jelszónak tartalmaznia kell legalább egy kisbetűt',
    'validation.passwordDigit': 'A jelszónak tartalmaznia kell legalább egy számot',
    'validation.passwordSpecial': 'A jelszónak tartalmaznia kell legalább egy speciális karaktert',
    'validation.currentPasswordRequired': 'A jelenlegi jelszó megadása kötelező',
    'validation.newPasswordMin': 'Az új jelszó legalább 8 karakter legyen',
    'validation.itemNameRequired': 'A termék neve kötelező',
    'validation.priceNonNegative': 'Az ár nem lehet negatív',
    'validation.categoryRequired': 'A kategória megadása kötelező',
    'validation.brandRequired': 'A márka megadása kötelező',
    'validation.amountNonNegative': 'A készlet mennyisége nem lehet negatív',
    'validation.itemRequired': 'A termék kiválasztása kötelező',
    'validation.customerRequired': 'A vásárló kiválasztása kötelező',
    'validation.quantityPositive': 'A mennyiség legalább 1 legyen',
    'validation.tokenRequired': 'A token megadása kötelező',
    'validation.emailOrUsernameRequired': 'E-mail vagy felhasználónév megadása kötelező',
    'validation.invalidRole': 'Érvénytelen szerepkör. Admin vagy dolgozó lehet',

    'role.admin': 'adminisztrátor',
    'role.worker': 'dolgozó',
    'role.buyer': 'vásárló',

    'order.buyerCanOnlyCancel': 'A vásárlók csak lemondhatják a rendeléseket',
    'order.notAssignedToYou': 'Csak a hozzád rendelt rendelések állapotát módosíthatod',

    'error.internalServerError': 'Belső szerverhiba',

    'export.orders.title': 'Rendelésjelentés',
    'export.orders.generatedOn': 'Létrehozva: {date}',
    'export.orders.statusFilter': 'Állapotszűrő',
    'export.orders.exported': 'Exportált rendelések',
    'export.orders.totalRevenue': 'Teljes bevétel',
    'export.orders.id': 'Rendelés azonosító',
    'export.orders.number': 'Rendelésszám',
    'export.orders.product': 'Termék',
    'export.orders.quantity': 'Mennyiség',
    'export.orders.unitPrice': 'Egységár',
    'export.orders.totalAmount': 'Végösszeg',
    'export.orders.status': 'Állapot',
    'export.orders.customer': 'Vásárló',
    'export.orders.date': 'Dátum',

    'export.sales.title': 'Értékesítési jelentés',
    'export.sales.periodLine': 'Időszak: {period} | Létrehozva: {date}',
    'export.sales.transactions': 'Exportált tranzakciók',
    'export.sales.totalRevenue': 'Teljes bevétel',
    'export.sales.averageOrderValue': 'Átlagos rendelési érték',
    'export.sales.topProduct': 'Legjobb termék',
    'export.sales.date': 'Dátum',
    'export.sales.product': 'Termék',
    'export.sales.brand': 'Márka',
    'export.sales.category': 'Kategória',
    'export.sales.quantity': 'Mennyiség',
    'export.sales.unitPrice': 'Egységár',
    'export.sales.total': 'Összesen',
    'export.sales.orderId': 'Rendelés azonosító',
    'export.summary': 'Összefoglaló',
    'export.period.7days': 'Utolsó 7 nap',
    'export.period.30days': 'Utolsó 30 nap',
    'export.period.90days': 'Utolsó 90 nap',
    'status.pending': 'Függőben',
    'status.processing': 'Feldolgozás',
    'status.completed': 'Teljesítve',
    'status.cancelled': 'Törölve',
    'common.all': 'Összes',
    'common.na': 'N/A',
    'common.unknown': 'Ismeretlen',
  },
};

export function normalizeLanguage(lang) {
  return lang === 'hu' ? 'hu' : 'en';
}

export function t(lang, key, params = {}) {
  const locale = normalizeLanguage(lang);
  let value = dictionaries[locale][key] || dictionaries.en[key] || key;

  for (const [paramKey, paramValue] of Object.entries(params)) {
    value = value.replaceAll(`{${paramKey}}`, String(paramValue ?? ''));
  }

  return value;
}

export function localizedStatus(lang, status) {
  return t(lang, `status.${status}`);
}

export function localizedPeriod(lang, period) {
  return t(lang, `export.period.${period}`);
}

export function localizeValidationErrors(lang, issues = []) {
  return issues.map((issue) => {
    const field = issue.path?.[0];

    if (issue.message === 'email or username required') {
      return t(lang, 'validation.emailOrUsernameRequired');
    }

    // Handle regex-based custom messages (password complexity, username chars)
    if (issue.code === 'invalid_string' && issue.validation === 'regex') {
      const msg = issue.message;
      if (msg === 'passwordUppercase') return t(lang, 'validation.passwordUppercase');
      if (msg === 'passwordLowercase') return t(lang, 'validation.passwordLowercase');
      if (msg === 'passwordDigit') return t(lang, 'validation.passwordDigit');
      if (msg === 'passwordSpecial') return t(lang, 'validation.passwordSpecial');
      if (msg === 'usernameChars') return t(lang, 'validation.usernameChars');
    }

    if ((issue.validation === 'email' || issue.code === 'invalid_string') && field === 'email') {
      return t(lang, 'validation.email');
    }

    // Handle invalid_enum_value for role field
    if (issue.code === 'invalid_enum_value' && field === 'role') {
      return t(lang, 'validation.invalidRole');
    }

    if (issue.code === 'too_small' || issue.code === 'invalid_type') {
      switch (field) {
        case 'username':
          return t(lang, 'validation.usernameMin');
        case 'password':
          return issue.minimum === 1
            ? t(lang, 'validation.passwordRequired')
            : t(lang, 'validation.passwordMin');
        case 'currentPassword':
          return t(lang, 'validation.currentPasswordRequired');
        case 'newPassword':
          return t(lang, 'validation.newPasswordMin');
        case 'name':
          return t(lang, 'validation.itemNameRequired');
        case 'price':
          return t(lang, 'validation.priceNonNegative');
        case 'category_id':
          return t(lang, 'validation.categoryRequired');
        case 'brand_id':
          return t(lang, 'validation.brandRequired');
        case 'amount':
          return t(lang, 'validation.amountNonNegative');
        case 'item_id':
          return t(lang, 'validation.itemRequired');
        case 'customer_id':
          return t(lang, 'validation.customerRequired');
        case 'quantity':
          return t(lang, 'validation.quantityPositive');
        case 'token':
          return t(lang, 'validation.tokenRequired');
        default:
          break;
      }
    }

    return issue.message;
  });
}