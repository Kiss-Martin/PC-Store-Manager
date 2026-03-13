import crypto from 'crypto';

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'change-this-secret';

export function hashToken(token) {
  if (!token) return null;
  return crypto.createHmac('sha256', REFRESH_SECRET).update(token).digest('hex');
}

export default { hashToken };
