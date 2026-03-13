// Middleware for authentication (JWT)
import jwt from 'jsonwebtoken';
import { t } from '../utils/i18n.util.js';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer '))
    return res.status(401).json({ error: t(req.lang, 'auth.missingToken') });
  const token = auth.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // If the token carries a jti, check whether it has been revoked
    if (decoded && decoded.jti) {
      try {
        const nowIso = new Date().toISOString();
        const revoked = await run(supabase.from('revoked_tokens').select('id').eq('jti', decoded.jti).gt('expires_at', nowIso).limit(1)).catch(() => null);
        if (revoked && revoked.length) {
          return res.status(401).json({ error: t(req.lang, 'auth.invalidToken') });
        }
      } catch (e) {
        // If the revoked_tokens table doesn't exist or query fails, don't block auth; log and continue
        // eslint-disable-next-line no-console
        console.warn('Could not check revoked_tokens table:', e && e.message ? e.message : e);
      }
    }
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
