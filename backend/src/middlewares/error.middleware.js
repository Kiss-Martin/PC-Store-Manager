// Centralized error handler middleware
import { t } from '../utils/i18n.util.js';

export function errorHandler(err, req, res, _next) {
  console.error(err && err.stack ? err.stack : err);
  const status = err.statusCode || 500;
  const message = err.message || t(req.lang, 'error.internalServerError');
  res.status(status).json({ error: message });
}
