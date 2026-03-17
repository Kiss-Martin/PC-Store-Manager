// Middleware to sanitize request payloads
// Keys that must never be sanitized (passwords, tokens, etc.)
const SKIP_KEYS = new Set(['password', 'currentPassword', 'newPassword', 'token', 'refreshToken']);

export function sanitizeMiddleware(req, res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const k of Object.keys(obj)) {
      if (SKIP_KEYS.has(k)) continue;
      const v = obj[k];
      if (typeof v === 'string') {
        obj[k] = v.replace(/\0/g, '').replace(/[<>]/g, '');
      } else if (typeof v === 'object') sanitize(v);
    }
  };
  if (req.body) sanitize(req.body);
  next();
}
