// Middleware for authentication (JWT)
import jwt from 'jsonwebtoken';
import { t } from '../utils/i18n.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: t(req.lang, 'auth.missingToken') });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: t(req.lang, 'auth.invalidToken') });
  }
}

// Middleware for role-based access
export function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({
        error: t(req.lang, 'auth.roleOnly', { role: t(req.lang, `role.${role}`) }),
      });
    }
    next();
  };
}
