// Centralized error handler middleware
import { t } from '../utils/i18n.util.js';

export function errorHandler(err, req, res, _next) {
  // Only log stack trace for unexpected (5xx) errors
  if (!err.statusCode || err.statusCode >= 500) {
    console.error(err && err.stack ? err.stack : err);
  }
  const status = err.statusCode || 500;
  const message = err.message || t(req.lang, 'error.internalServerError');
  const response = { error: message };
  // Include field name when available for frontend field-level error display
  if (err.field) response.field = err.field;
  res.status(status).json(response);
}
