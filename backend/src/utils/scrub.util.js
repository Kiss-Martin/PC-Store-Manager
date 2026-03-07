// Utility to scrub sensitive fields from JSON responses
export function scrubSensitive(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(scrubSensitive);
  const out = {};
  for (const k of Object.keys(obj)) {
    if (['password_hash', 'password', 'supabaseKey'].includes(k)) continue;
    const v = obj[k];
    out[k] = typeof v === 'object' ? scrubSensitive(v) : v;
  }
  return out;
}

// Express middleware to scrub sensitive fields from all JSON responses
export function scrubResponseMiddleware(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (payload) => {
    try {
      const cleaned = scrubSensitive(payload);
      return originalJson(cleaned);
    } catch (e) {
      return originalJson(payload);
    }
  };
  next();
}
