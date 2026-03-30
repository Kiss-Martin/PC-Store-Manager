// Middleware to sanitize request payloads
// Strips null bytes and HTML-encodes dangerous characters instead of removing them,
// so legitimate data (e.g. product descriptions with comparisons) is preserved.
const htmlEncodeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function sanitizeMiddleware(req, res, next) {
  const sanitize = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    for (const k of Object.keys(obj)) {
      const v = obj[k];
      if (typeof v === 'string') {
        // Remove null bytes (never valid), HTML-encode dangerous characters
        obj[k] = v.replace(/\0/g, '').replace(/[&<>"']/g, (ch) => htmlEncodeMap[ch] || ch);
      } else if (typeof v === 'object') sanitize(v);
    }
  };
  if (req.body) sanitize(req.body);
  next();
}
