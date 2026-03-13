// Auth controller: handles authentication-related endpoints
import AuthService from '../services/auth.service.js';
import { localizeValidationErrors } from '../utils/i18n.util.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validators.js';

import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import jwt from 'jsonwebtoken';

function buildCookieOptions(maxAge) {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  };
  if (typeof maxAge === 'number') options.maxAge = maxAge;
  return options;
}

function setRememberCookies(res, refreshToken, refreshExpires, rememberMe) {
  const expiresDate = refreshExpires ? new Date(refreshExpires) : null;
  const maxAge = expiresDate ? (expiresDate.getTime() - Date.now()) : undefined;
  const refreshCookieOptions = buildCookieOptions(rememberMe && typeof maxAge === 'number' ? maxAge : undefined);
  if (refreshToken) res.cookie('refresh_token', refreshToken, refreshCookieOptions);
  if (rememberMe && typeof maxAge === 'number') {
    res.cookie('remember_session', '1', buildCookieOptions(maxAge));
  } else {
    res.clearCookie('remember_session', buildCookieOptions(undefined));
  }
}

// Register a new user
export const register = async (req, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const metadata = { ip: req.ip, userAgent: req.get('User-Agent') };
  const result = await AuthService.register(parse.data, metadata, req.lang);
  // set refresh cookie if present
  if (result.refreshToken) {
    setRememberCookies(res, result.refreshToken, result.refreshExpires, false);
  }
  res.json({ user: result.user, accessToken: result.accessToken, requiresApproval: !!result.requiresApproval, message: result.message || null });
};

// Login
export const login = async (req, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const metadata = { ip: req.ip, userAgent: req.get('User-Agent') };
  const result = await AuthService.login(parse.data, req.lang, metadata);
  // result: { user, accessToken, refreshToken, refreshExpires }
  setRememberCookies(res, result.refreshToken, result.refreshExpires, !!parse.data.rememberMe);
  res.json({ user: result.user, accessToken: result.accessToken });
};

// Refresh access token
export const refresh = async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  const metadata = { ip: req.ip, userAgent: req.get('User-Agent') };
  const rememberMe = req.cookies?.remember_session === '1';
  const result = await AuthService.refreshAccessToken(token, metadata);
  if (!result) return res.status(401).json({ error: 'Invalid or expired refresh token' });
  setRememberCookies(res, result.refreshToken, result.refreshExpires, rememberMe);
  res.json({ user: result.user, accessToken: result.accessToken });
};

// Logout / revoke refresh token
export const logout = async (req, res) => {
  const token = req.cookies?.refresh_token || req.body?.refreshToken;
  // try to determine actor user id from Authorization header if present
  let actorId = null;
  try {
    const auth = req.headers.authorization;
    if (auth && auth.startsWith('Bearer ')) {
      const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'change-this-secret');
      actorId = decoded?.id || null;
    }
  } catch (e) {
    actorId = null;
  }
  // fetch token row for target user
  let targetUserId = null;
  try {
    const tokenHash = hashToken(token);
    const row = await run(supabase.from('refresh_tokens').select('id,user_id').eq('token_hash', tokenHash).single()).catch(() => null);
    if (row) targetUserId = row.user_id;
  } catch (e) {
    targetUserId = null;
  }

  if (token) await AuthService.revokeRefreshToken(token);
  try {
    await run(supabase.from('audit_logs').insert({ event_type: 'logout', actor_user_id: actorId, target_user_id: targetUserId, details: { method: 'logout' } }).select().single()).catch(() => null);
  } catch (e) {
    // ignore audit log failures
  }
  res.clearCookie('refresh_token', { path: '/' });
  res.clearCookie('remember_session', { path: '/' });
  res.json({ success: true });
};

// List refresh tokens for current user
export const listTokens = async (req, res) => {
  const tokens = await AuthService.listTokensForUser(req.user.id);
  // do not return raw token value to client for security; return id, ip, user_agent, created_at, expires_at
  const safe = tokens.map((t) => ({ id: t.id, ip: t.ip || null, user_agent: t.user_agent || null, created_at: t.created_at, expires_at: t.expires_at }));
  res.json({ tokens: safe });
};

// Revoke token by id (user can revoke their own tokens; admin can revoke any)
export const revokeToken = async (req, res) => {
  const id = req.params.id;
  const isAdmin = req.user?.role === 'admin';
  // fetch the token row to capture target user for audit
  const row = await run(supabase.from('refresh_tokens').select('id,user_id').eq('id', id).single()).catch(() => null);
  await AuthService.revokeTokenById(id, req.user.id, isAdmin);
  // write audit log
  try {
    await run(supabase.from('audit_logs').insert({ event_type: 'revoke_session', actor_user_id: req.user?.id || null, target_user_id: row?.user_id || null, details: { token_id: id } }).select().single()).catch(() => null);
  } catch (e) {
    // ignore audit errors
  }
  res.json({ success: true });
};

// Admin: list all sessions across users
export const listAllSessions = async (req, res) => {
  // only allow admin (route should already protect, but double-check)
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const page = req.query?.page ? Number(req.query.page) : 1;
  const limit = req.query?.limit ? Number(req.query.limit) : 25;
  const q = req.query?.q ? String(req.query.q) : '';
  const email = req.query?.email ? String(req.query.email) : '';
  const start = req.query?.start ? String(req.query.start) : '';
  const end = req.query?.end ? String(req.query.end) : '';
  const resp = await AuthService.listAllTokens({ page, limit, q, email, start, end });

  // Log admin viewing sessions for audit
  try {
    await run(supabase.from('audit_logs').insert({ event_type: 'view_sessions', actor_user_id: req.user?.id || null, target_user_id: null, details: { page, limit, q, email, start, end } }).select().single()).catch(() => null);
  } catch (e) {
    // ignore audit failures
  }

  res.json({ tokens: resp.tokens || [], total: resp.total || 0, page, limit });
};

// Admin: list pending admin approvals
export const listPendingAdmins = async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const resp = await run(supabase.from('users').select('id,email,username,fullname,created_at').eq('role', 'admin').eq('admin_approved', false).order('created_at', { ascending: true }));
    res.json({ users: resp });
  } catch (e) {
    res.status(500).json({ error: 'Failed to list pending admins' });
  }
};

// Admin: approve a pending admin
export const approveAdmin = async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const id = req.params.id;
  try {
    await run(supabase.from('users').update({ admin_approved: true, admin_approved_by: req.user.id, admin_approved_at: new Date().toISOString() }).eq('id', id));
    // audit
    try { await run(supabase.from('audit_logs').insert({ event_type: 'approve_admin', actor_user_id: req.user?.id || null, target_user_id: id, details: null }).select().single()).catch(() => null); } catch (e) { /* ignore audit errors */ }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to approve admin' });
  }
};

// Admin: reject (delete) a pending admin
export const rejectAdmin = async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const id = req.params.id;
  try {
    await run(supabase.from('users').delete().eq('id', id).eq('role', 'admin').eq('admin_approved', false));
    try { await run(supabase.from('audit_logs').insert({ event_type: 'reject_admin', actor_user_id: req.user?.id || null, target_user_id: id, details: null }).select().single()).catch(() => null); } catch (e) { /* ignore audit errors */ }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reject admin' });
  }
};

// One-click approve via signed token (no auth required)
export const approveAdminOneClick = async (req, res) => {
  const token = req.query?.token || req.body?.token;
  if (!token) return res.status(400).send('Missing token');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    if (!payload || payload.type !== 'admin_action' || payload.action !== 'approve' || String(payload.target_id) !== String(req.params.id)) {
      return res.status(400).send('Invalid token');
    }
    const approverId = payload.approver_id;
    // verify approver is still an approved admin
    const approver = await run(supabase.from('users').select('id,role,admin_approved').eq('id', approverId).single()).catch(() => null);
    if (!approver || approver.role !== 'admin' || !approver.admin_approved) return res.status(403).send('Approver not authorized');

    // ensure token JTI not already consumed (use revoked_tokens to track one-time use)
    const nowIso = new Date().toISOString();
    const tokenJti = payload.jti;
    if (!tokenJti) return res.status(400).send('Invalid token');
    const existing = await run(supabase.from('revoked_tokens').select('id,expires_at').eq('jti', tokenJti).limit(1).single()).catch(() => null);
    if (existing) return res.status(400).send('Token already used or invalid');

    // mark token jti as consumed (store until JWT expiry)
    const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await run(supabase.from('revoked_tokens').insert({ jti: tokenJti, reason: 'admin_action_consumed', expires_at: expiresAt }).select().single()).catch(() => null);

    await run(supabase.from('users').update({ admin_approved: true, admin_approved_by: approverId, admin_approved_at: nowIso }).eq('id', req.params.id));
    try { await run(supabase.from('audit_logs').insert({ event_type: 'approve_admin_oneclick', actor_user_id: approverId, target_user_id: req.params.id, details: { via: 'email' } }).select().single()).catch(() => null); } catch (e) { /* ignore */ }

    const redirectTo = (process.env.FRONTEND_URL || 'http://localhost:4200') + '/admin/action-result?result=approved';
    return res.redirect(302, redirectTo);
  } catch (e) {
    return res.status(400).send('Invalid or expired token');
  }
};

// One-click reject via signed token (no auth required)
export const rejectAdminOneClick = async (req, res) => {
  const token = req.query?.token || req.body?.token;
  if (!token) return res.status(400).send('Missing token');
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret');
    if (!payload || payload.type !== 'admin_action' || payload.action !== 'reject' || String(payload.target_id) !== String(req.params.id)) {
      return res.status(400).send('Invalid token');
    }
    const approverId = payload.approver_id;
    const approver = await run(supabase.from('users').select('id,role,admin_approved').eq('id', approverId).single()).catch(() => null);
    if (!approver || approver.role !== 'admin' || !approver.admin_approved) return res.status(403).send('Approver not authorized');
    const nowIso = new Date().toISOString();
    const tokenJti = payload.jti;
    if (!tokenJti) return res.status(400).send('Invalid token');
    const existing = await run(supabase.from('revoked_tokens').select('id,expires_at').eq('jti', tokenJti).limit(1).single()).catch(() => null);
    if (existing) return res.status(400).send('Token already used or invalid');
    const expiresAt = payload.exp ? new Date(payload.exp * 1000).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await run(supabase.from('revoked_tokens').insert({ jti: tokenJti, reason: 'admin_action_consumed', expires_at: expiresAt }).select().single()).catch(() => null);
    await run(supabase.from('users').delete().eq('id', req.params.id).eq('role', 'admin').eq('admin_approved', false));
    try { await run(supabase.from('audit_logs').insert({ event_type: 'reject_admin_oneclick', actor_user_id: approverId, target_user_id: req.params.id, details: { via: 'email' } }).select().single()).catch(() => null); } catch (e) { /* ignore */ }

    const redirectTo = (process.env.FRONTEND_URL || 'http://localhost:4200') + '/admin/action-result?result=rejected';
    return res.redirect(302, redirectTo);
  } catch (e) {
    return res.status(400).send('Invalid or expired token');
  }
};

// Admin: list audit logs
export const listAuditLogs = async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const page = req.query?.page ? Number(req.query.page) : 1;
  const limit = req.query?.limit ? Number(req.query.limit) : 25;
  const from = (Math.max(1, page) - 1) * limit;
  const to = from + limit - 1;
  try {
    const result = await supabase.from('audit_logs').select('id,event_type,actor_user_id,target_user_id,details,created_at', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to);
    if (result.error) throw result.error;
    res.json({ logs: result.data || [], total: result.count || (result.data || []).length, page, limit });
  } catch (e) {
    res.status(500).json({ error: 'Failed to load audit logs' });
  }
};

// Admin: cleanup expired revoked tokens
export const cleanupRevoked = async (req, res) => {
  if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const nowIso = new Date().toISOString();
    await run(supabase.from('revoked_tokens').delete().lt('expires_at', nowIso));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to cleanup revoked tokens' });
  }
};

// Forgot password
export const forgotPassword = async (req, res) => {
  const parse = forgotPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const result = await AuthService.forgotPassword(parse.data.email, req.lang);
  // result may be undefined (user not found) or an object with send status
  if (!result) return res.json({ success: true });
  return res.json({ success: true, sent: !!result.sent, message: result.message });
};

// Reset password
export const resetPassword = async (req, res) => {
  const parse = resetPasswordSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  await AuthService.resetPassword(parse.data, req.lang);
  res.json({ success: true });
};
