import crypto from 'crypto';
import { JWT_SECRET } from './config.js';

const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET || JWT_SECRET;

export function hashToken(token) {
  if (!token) return null;
  return crypto.createHmac('sha256', REFRESH_SECRET).update(token).digest('hex');
}

export default { hashToken };
