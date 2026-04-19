// AuthService: handles business logic for authentication
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { hashToken } from '../utils/token.util.js';
import { JWT_SECRET, FRONTEND_URL, BACKEND_URL } from '../utils/config.js';
import { mailTransporter, smtpConfig, getSmtpRuntimeStatus } from '../utils/mail.util.js';
import { renderAdminNotification, renderPasswordReset, renderRegistrationConfirmation, renderApprovalNotification } from '../utils/email.template.js';
import { t } from '../utils/i18n.util.js';

export { getSmtpRuntimeStatus };

// No DB-backed email queue required — emails are sent immediately using templates.

function generateAccessToken(payload, expiresIn = '1h') {
  // include a unique JTI so we can revoke individual access tokens immediately
  const jti = crypto.randomBytes(16).toString('hex');
  const token = jwt.sign({ ...payload, jti }, JWT_SECRET, { expiresIn });
  return { token, jti };
}

function generateRefreshTokenStr() {
  return crypto.randomBytes(48).toString('hex');
}

function normalizeMetadata(metadata = {}) {
  return {
    ip: metadata.ip ? String(metadata.ip).trim() : null,
    userAgent: metadata.userAgent ? String(metadata.userAgent).trim().toLowerCase() : null,
  };
}

function isMetadataMismatch(refreshTokenRow, metadata = {}) {
  const current = normalizeMetadata(metadata);
  const storedIp = refreshTokenRow?.ip ? String(refreshTokenRow.ip).trim() : null;
  const storedUserAgent = refreshTokenRow?.user_agent ? String(refreshTokenRow.user_agent).trim().toLowerCase() : null;

  if (storedIp && current.ip !== storedIp) return true;
  if (storedUserAgent && current.userAgent !== storedUserAgent) return true;
  return false;
}

const AuthService = {
  // Shared helper: keep at most `maxTokens` refresh tokens per user
  async _cleanupOldTokens(userId, maxTokens = 5) {
    try {
      const tokens = await run(supabase.from('refresh_tokens').select('id,created_at').eq('user_id', userId).order('created_at', { ascending: false }));
      if (tokens && tokens.length > maxTokens) {
        const toRemove = tokens.slice(maxTokens).map((r) => r.id);
        await run(supabase.from('refresh_tokens').delete().in('id', toRemove)).catch(() => null);
      }
    } catch (e) {
      // non-critical
    }
  },

  async register({ email, username, password, fullname, role }, metadata = {}, lang = 'en') {
    const sessionMetadata = normalizeMetadata(metadata);
    const hashed = await bcrypt.hash(password, 12);
    let data;
    try {
      data = await run(
        supabase.from('users').insert({
          email,
          username,
          fullname: fullname || null,
          password_hash: hashed,
          role: role || 'worker',
          // Both admins and workers require approval
          admin_approved: (role === 'admin' || role === 'worker') ? false : true,
        }).select('id,email,username,fullname,role,admin_approved').single()
      );
      console.log('REGISTER: Created user -', { id: data.id, email: data.email, role: data.role, admin_approved: data.admin_approved });
    } catch (e) {
      // Detect unique constraint violations and return field-level errors
      if (e.code === '23505') {
        const detail = (e.details || e.message || '').toLowerCase();
        if (detail.includes('email')) {
          const err = new Error(t(lang, 'user.emailAlreadyExists'));
          err.statusCode = 409;
          err.field = 'email';
          throw err;
        }
        if (detail.includes('username')) {
          const err = new Error(t(lang, 'user.usernameAlreadyExists'));
          err.statusCode = 409;
          err.field = 'username';
          throw err;
        }
        // Generic duplicate
        const err = new Error(t(lang, 'user.emailAlreadyExists'));
        err.statusCode = 409;
        throw err;
      }
      throw e;
    }
    // Both admins and workers require approval - no auto-approval
    if (data.role === 'admin') {
      console.log('REGISTER: Admin awaiting approval -', data.id);
    }
    if (data.role === 'worker') {
      console.log('REGISTER: Worker awaiting approval -', data.id);
    }

    // send registration confirmation to the new user (inform about awaiting approval if admin/worker)
    try {
      const needsApproval = (data.role === 'admin' && !data.admin_approved) || (data.role === 'worker' && !data.admin_approved);
      const regSubject = needsApproval ? t(lang, 'auth.registrationAwaitingSubject') : t(lang, 'auth.registrationSubject');
      const regLink = `${FRONTEND_URL}/`; 
      const regTpl = renderRegistrationConfirmation({ lang, subject: regSubject, username: data.username, fullname: data.fullname || '', link: regLink, awaitingApproval: needsApproval, role: data.role });
      if (mailTransporter) {
        await mailTransporter.sendMail({ to: data.email, from: smtpConfig.from, subject: regTpl.subject, text: regTpl.text, html: regTpl.html }).catch((e) => { throw e; });
      } else {
        console.log('Registration confirmation (no SMTP) ->', data.email, regTpl.text);
      }
    } catch (e) {
      console.warn('Failed to send registration confirmation to', data.email, e && (e.message || e));
    }

    // New admins and workers must be approved before receiving tokens
    if ((data.role === 'admin' && !data.admin_approved) || (data.role === 'worker' && !data.admin_approved)) {
        // Notify existing approved admins by email that a new admin/worker awaits approval
        (async () => {
          try {
            const admins = await run(supabase.from('users').select('id,email').eq('role', 'admin').eq('admin_approved', true));
            if (admins && admins.length) {
              const subject = t(lang, 'auth.notifyAdminsSubject');
              const link = `${FRONTEND_URL}/admin/pending-${data.role === 'admin' ? 'admins' : 'workers'}`;
              for (const a of admins) {
                try {
                  // generate one-click approve/reject tokens for this approver
                  const approveJti = crypto.randomBytes(16).toString('hex');
                  const rejectJti = crypto.randomBytes(16).toString('hex');
                  const approveAction = data.role === 'admin' ? 'approve' : 'approve_worker';
                  const rejectAction = data.role === 'admin' ? 'reject' : 'reject_worker';
                  const approveToken = jwt.sign({ type: 'admin_action', action: approveAction, approver_id: a.id, approver_email: a.email, target_id: data.id, jti: approveJti }, JWT_SECRET, { expiresIn: '7d' });
                  const rejectToken = jwt.sign({ type: 'admin_action', action: rejectAction, approver_id: a.id, approver_email: a.email, target_id: data.id, jti: rejectJti }, JWT_SECRET, { expiresIn: '7d' });
                  const approveUrl = `${BACKEND_URL.replace(/\/$/, '')}/auth/admin/pending-${data.role === 'admin' ? 'admins' : 'workers'}/${data.id}/approve/oneclick?token=${encodeURIComponent(approveToken)}`;
                  const rejectUrl = `${BACKEND_URL.replace(/\/$/, '')}/auth/admin/pending-${data.role === 'admin' ? 'admins' : 'workers'}/${data.id}/reject/oneclick?token=${encodeURIComponent(rejectToken)}`;

                  const tpl = renderAdminNotification({ lang, subject, email: data.email, username: data.username, fullname: data.fullname || '', approveUrl, rejectUrl, reviewLink: link, role: data.role });
                  // send email immediately (no extra tables required). If SMTP missing, fallback to logging.
                  try {
                    if (mailTransporter) {
                      await mailTransporter.sendMail({ to: a.email, from: smtpConfig.from, subject: tpl.subject, text: tpl.text, html: tpl.html });
                    } else {
                      console.log(`${data.role} notification (no SMTP) ->`, a.email, tpl.text, 'approve:', approveUrl, 'reject:', rejectUrl);
                    }
                  } catch (e) {
                    console.warn(`Failed to send ${data.role} notification to`, a.email, e && e.message ? e.message : e);
                  }
                } catch (e) {
                  console.warn('Failed to notify admin', a && a.email ? a.email : a, e && e.message ? e.message : e);
                }
              }
            }
          } catch (e) {
            console.warn('Failed to lookup admins for notification:', e && e.message ? e.message : e);
          }
        })();
      return {
        user: data,
        accessToken: null,
        refreshToken: null,
        refreshExpires: null,
        requiresApproval: true,
        message: data.role === 'admin' ? t(lang, 'auth.registeredAwaitingApproval') : t(lang, 'auth.registeredAwaitingApprovalWorker'),
      };
    }

    // Auto-create customer record for buyer role
    if (data.role === 'buyer') {
      console.log(`[Auth.register] Buyer detected: ${data.username} (${data.email}) - Creating/linking customer...`);
      try {
        // First check if customer already exists with this email
        let customer = null;
        if (data.email) {
          const existing = await run(
            supabase.from('customers').select('id, email').eq('email', data.email).limit(1)
          ).catch((err) => {
            console.warn(`[Auth.register] ERROR checking for existing customer:`, err?.message);
            return null;
          });
          if (existing && existing.length > 0) {
            customer = existing[0];
            console.log(`[Auth.register] ✓ FOUND existing customer: ID=${customer.id}, email=${customer.email}`);
          }
        }

        // If not found, create new customer
        if (!customer) {
          console.log(`[Auth.register] Creating new customer...`);
          customer = await run(
            supabase.from('customers').insert({
              name: data.fullname || data.username || data.email || t(lang, 'common.unknown'),
              email: data.email || null,
              phone: null,
            }).select('id, email').single()
          );
          console.log(`[Auth.register] ✓ CREATED new customer: ID=${customer.id}, email=${customer.email}`);
        }

        if (!customer || !customer.id) {
          throw new Error('Customer object has no ID');
        }

        // Store customer ID in user metadata for quick access
        try {
          await run(
            supabase.from('users').update({ metadata: { customer_id: customer.id } }).eq('id', data.id)
          );
          console.log(`[Auth.register] ✓ LINKED user ${data.id} → customer ${customer.id}`);
        } catch (metaErr) {
          console.warn(`[Auth.register] WARNING: Could not store customer_id in metadata:`, metaErr?.message);
          // Non-critical, continue
        }
      } catch (e) {
        console.error(`[Auth.register] ✗ ERROR during buyer customer creation:`, e?.message || e);
        // Don't throw - registration should succeed even if customer creation fails
        // The customer will be created during first order
      }
    }

    // create access token and refresh token
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: data.id, role: data.role, email: data.email, username: data.username, fullname: data.fullname }, '1h');
    const refreshToken = generateRefreshTokenStr();
    const refreshExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    // try to persist refresh token (store hashed token); if table missing, warn but continue
    try {
      const tokenHash = hashToken(refreshToken);
      await run(supabase.from('refresh_tokens').insert({ user_id: data.id, token_hash: tokenHash, expires_at: refreshExpires, ip: sessionMetadata.ip, user_agent: sessionMetadata.userAgent, access_jti: accessJti }).select().single());
      await this._cleanupOldTokens(data.id);
    } catch (e) {
      console.warn('Could not persist refresh token (refresh_tokens table missing?). Continuing.');
    }
    return { user: data, accessToken, refreshToken, refreshExpires };
  },

  async sendApprovalEmail(userId, lang = 'en') {
    try {
      const user = await run(supabase.from('users').select('email,username').eq('id', userId).single()).catch(() => null);
      if (!user) return;
      const subject = t(lang, 'auth.approvalSubject');
      const loginLink = `${FRONTEND_URL}/login`;
      const tpl = renderApprovalNotification({ lang, subject, username: user.username, loginLink });
      if (mailTransporter) {
        await mailTransporter.sendMail({ to: user.email, from: smtpConfig.from, subject: tpl.subject, text: tpl.text, html: tpl.html });
      } else {
        console.log('Approval notification (no SMTP) ->', user.email, tpl.text);
      }
    } catch (e) {
      console.warn('Failed to send approval notification:', e && e.message ? e.message : e);
    }
  },

  async login({ email, username, password, rememberMe }, lang = 'en', metadata = {}) {
    const sessionMetadata = normalizeMetadata(metadata);
    let query = supabase.from('users').select('*');
    if (email) query = query.eq('email', email);
    else query = query.eq('username', username);
    let data;
    try {
      data = await run(query.single());
    } catch (e) {
      console.warn('Login: user lookup failed for', email || username, ':', e && e.message ? e.message : e);
      const err = new Error(t(lang, 'auth.invalidCredentials'));
      err.statusCode = 401;
      throw err;
    }
    if (!data || !data.password_hash) {
      console.warn('Login: user record missing or has no password_hash for', email || username);
      const err = new Error(t(lang, 'auth.invalidCredentials'));
      err.statusCode = 401;
      throw err;
    }
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) {
      console.warn('Login: password mismatch for user', email || username);
      const err = new Error(t(lang, 'auth.invalidCredentials'));
      err.statusCode = 401;
      throw err;
    }
    console.log('LOGIN: Password verified for user -', { id: data.id, email: data.email, role: data.role, admin_approved: data.admin_approved });
    
    // Block unapproved admin accounts from logging in
    if (data.role === 'admin' && !data.admin_approved) {
      console.warn('LOGIN: Admin not approved, blocking -', data.id);
      const err = new Error(t(lang, 'auth.awaitingApprovalAdmin'));
      err.statusCode = 403;
      throw err;
    }
    // Block unapproved worker accounts from logging in
    if (data.role === 'worker' && !data.admin_approved) {
      console.warn('LOGIN: Worker not approved, blocking -', data.id);
      const err = new Error(t(lang, 'auth.awaitingApprovalWorker'));
      err.statusCode = 403;
      throw err;
    }
    console.log('LOGIN: User approved, issuing tokens -', data.id);
    // Issue short-lived access token and a refresh token (persisted)
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: data.id, role: data.role, email: data.email, username: data.username, fullname: data.fullname }, '1h');
    const refreshToken = generateRefreshTokenStr();
    const refreshExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    // keep up to max tokens per user (append new and cleanup older)
    try {
      const tokenHash = hashToken(refreshToken);
      await run(supabase.from('refresh_tokens').insert({ user_id: data.id, token_hash: tokenHash, expires_at: refreshExpires, ip: sessionMetadata.ip, user_agent: sessionMetadata.userAgent, access_jti: accessJti }).select().single());
      await this._cleanupOldTokens(data.id);
    } catch (e) {
      console.warn('Could not persist refresh token (refresh_tokens table missing?). Continuing.');
    }
    return {
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        fullname: data.fullname,
        role: data.role,
      },
      accessToken,
      refreshToken,
      refreshExpires,
    };
  },

  async refreshAccessToken(token, metadata = {}) {
    if (!token) return null;
    // lookup refresh token by its stored hash
    const tokenHash = hashToken(token);
    const rt = await run(supabase.from('refresh_tokens').select('id,user_id,expires_at,ip,user_agent').eq('token_hash', tokenHash).single()).catch(() => null);
    if (!rt) return null;
    if (new Date(rt.expires_at) < new Date()) {
      // expired: remove
      await run(supabase.from('refresh_tokens').delete().eq('id', rt.id)).catch(() => null);
      return null;
    }
    if (isMetadataMismatch(rt, metadata)) {
      await run(supabase.from('refresh_tokens').delete().eq('id', rt.id)).catch(() => null);
      return null;
    }
    // get user
    const user = await run(supabase.from('users').select('id,role,email,username,fullname').eq('id', rt.user_id).single()).catch(() => null);
    if (!user) return null;
    // rotate refresh token: create a new access token (with jti) and persist the rotated refresh token with that access_jti
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: user.id, role: user.role, email: user.email, username: user.username, fullname: user.fullname }, '1h');
    const newRefresh = generateRefreshTokenStr();
    const newExpires = rt.expires_at;
    try {
      await run(supabase.from('refresh_tokens').delete().eq('id', rt.id));
      const newHash = hashToken(newRefresh);
      await run(supabase.from('refresh_tokens').insert({ user_id: user.id, token_hash: newHash, expires_at: newExpires, ip: rt.ip || null, user_agent: rt.user_agent || null, access_jti: accessJti }).select().single());
      await this._cleanupOldTokens(user.id);
    } catch (e) {
      console.warn('Could not rotate refresh token (refresh_tokens table missing?). Continuing.');
    }
    return { accessToken, refreshToken: newRefresh, refreshExpires: newExpires, user };
  },

  async revokeRefreshToken(token) {
    if (!token) return;
    // attempt to find the refresh token row to capture its access_jti for immediate revocation
    let foundRow = null;
    try {
      const tokenHash = hashToken(token);
      foundRow = await run(supabase.from('refresh_tokens').select('id,access_jti').eq('token_hash', tokenHash).single()).catch(() => null);
      if (foundRow && foundRow.access_jti) {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // revoke for one hour
        await run(supabase.from('revoked_tokens').insert({ jti: foundRow.access_jti, reason: 'user_logout', expires_at: expiresAt })).catch(() => null);
      }
    } catch (e) {
      // ignore errors here
    }
    // delete by id if found, otherwise by token hash
    try {
      if (foundRow && foundRow.id) {
        await run(supabase.from('refresh_tokens').delete().eq('id', foundRow.id)).catch(() => null);
      } else {
        const tokenHash2 = hashToken(token);
        await run(supabase.from('refresh_tokens').delete().eq('token_hash', tokenHash2)).catch(() => null);
      }
    } catch (e) {
      // ignore
    }
  },

  // List refresh tokens for a given user (most recent first)
  async listTokensForUser(userId) {
    const tokens = await run(supabase.from('refresh_tokens').select('id,expires_at,ip,user_agent,created_at').eq('user_id', userId).order('created_at', { ascending: false })).catch(() => []);
    return tokens || [];
  },

  // List all refresh tokens (admin use) with pagination and optional search.
  // params: { page = 1, limit = 25, q = '' }
  async listAllTokens(params = {}) {
    const page = Math.max(1, Number(params.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(params.limit) || 25));
    const q = params.q ? String(params.q).trim() : '';
    const email = params.email ? String(params.email).trim() : '';
    const start = params.start ? String(params.start).trim() : '';
    const end = params.end ? String(params.end).trim() : '';
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    try {
      // If email or q provided, find matching user ids first
      let matchedUserIds = null;
      if (email || q) {
        const search = (email || q).replace(/%/g, '\\%');
        const orClause = `email.ilike.%${search}%,username.ilike.%${search}%`;
        const ures = await supabase.from('users').select('id').or(orClause).limit(1000);
        if (!ures.error) matchedUserIds = (ures.data || []).map((u) => u.id);
        if (matchedUserIds && matchedUserIds.length === 0) return { tokens: [], total: 0 };
      }

      // Build token query
      let query = supabase.from('refresh_tokens').select('id,user_id,expires_at,ip,user_agent,created_at', { count: 'exact' }).order('created_at', { ascending: false });
      if (matchedUserIds) query = query.in('user_id', matchedUserIds);
      if (start) query = query.gte('created_at', start);
      if (end) query = query.lte('created_at', end);
      query = query.range(from, to);

      const res = await query;
      if (res.error) throw new Error(res.error.message || 'Failed to list tokens');
      const tokens = res.data || [];
      const total = typeof res.count === 'number' ? res.count : tokens.length;
      if (!tokens.length) return { tokens: [], total };

      const userIds = Array.from(new Set(tokens.map((t) => t.user_id).filter(Boolean)));
      let users = [];
      try {
        const ures2 = await supabase.from('users').select('id,email,username,fullname').in('id', userIds);
        if (!ures2.error) users = ures2.data || [];
      } catch (e) {
        users = [];
      }
      const usersById = (users || []).reduce((acc, u) => { acc[u.id] = u; return acc; }, {});
      const safe = tokens.map((t) => ({ id: t.id, user_id: t.user_id, user: usersById[t.user_id] || null, ip: t.ip || null, user_agent: t.user_agent || null, created_at: t.created_at, expires_at: t.expires_at }));
      return { tokens: safe, total };
    } catch (e) {
      return { tokens: [], total: 0 };
    }
  },

  // Revoke a refresh token by id. If userIdProvided is supplied, only revoke if it belongs to that user (unless isAdmin true)
  async revokeTokenById(id, userIdProvided = null, isAdmin = false) {
    if (!id) return false;
    // fetch the row first to capture access_jti
    const row = await run(supabase.from('refresh_tokens').select('id,user_id,access_jti').eq('id', id).single()).catch(() => null);
    if (!row) return true;
    if (!isAdmin && row.user_id !== userIdProvided) return false;
    // delete the refresh token
    await run(supabase.from('refresh_tokens').delete().eq('id', id)).catch(() => null);
    // if there was an access_jti, add it to revoked_tokens so any existing access token is immediately invalidated
    if (row.access_jti) {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await run(supabase.from('revoked_tokens').insert({ jti: row.access_jti, reason: isAdmin ? 'admin_revoke' : 'user_revoke', expires_at: expiresAt })).catch(() => null);
    }
    return true;
  },

  async forgotPassword(email, lang = 'en') {
    const user = await run(supabase.from('users').select('id,email').eq('email', email).single()).catch(() => null);
    if (!user) return; // don't reveal existence
    const token = crypto.randomBytes(24).toString('hex');
    const tokenHash = hashToken(token);
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    // Remove any existing reset tokens for this user, then attempt to insert a new one
    await run(supabase.from('password_resets').delete().eq('user_id', user.id)).catch(() => null);
    try {
      await run(supabase.from('password_resets').insert({ user_id: user.id, token_hash: tokenHash, expires_at }).select().single());
    } catch (e) {
      // If the table doesn't exist or insert fails, warn but continue so we still surface the token
      console.warn('Could not persist password reset token (password_resets table missing?). Continuing.');
    }
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
    // Attempt to send email if transporter is configured; return status to caller
    if (mailTransporter) {
      try {
        const subject = t(lang, 'auth.passwordResetSubject');
        const tpl = renderPasswordReset({ lang, subject, resetLink });
        // send immediately; if mailTransporter fails, fall back to logging
        try {
          await mailTransporter.sendMail({ to: email, from: smtpConfig.from, subject: tpl.subject, text: tpl.text, html: tpl.html });
        } catch (e) {
          console.warn('Failed to send reset email via SMTP, logging token instead', e && (e.message || e));
          console.log('Password reset token for', email, token, 'link:', resetLink);
          return { sent: false, message: t(lang, 'auth.passwordResetGeneric') };
        }
        return { sent: true, message: t(lang, 'auth.passwordResetSent') };
      } catch (e) {
        console.warn('Failed to send reset email', e && (e.message || e));
        // Fall back to logging the token so admin can assist
        console.log('Password reset token for', email, token, 'link:', resetLink);
        return { sent: false, message: t(lang, 'auth.passwordResetGeneric') };
      }
    }

    // No SMTP configured: log token for manual retrieval and return sent:false
    console.log('Password reset token for', email, token, 'link:', resetLink);
    return { sent: false, message: t(lang, 'auth.passwordResetGeneric') };
  },

  async resetPassword({ token, newPassword }, lang = 'en') {
    const tokenHash = hashToken(token);
    const pr = await run(supabase.from('password_resets').select('id,user_id,expires_at').eq('token_hash', tokenHash).single()).catch(() => null);
    if (!pr) throw new Error(t(lang, 'auth.invalidOrExpiredToken'));
    if (new Date(pr.expires_at) < new Date()) throw new Error(t(lang, 'auth.tokenExpired'));
    const hashed = await bcrypt.hash(newPassword, 12);
    await run(supabase.from('users').update({ password_hash: hashed }).eq('id', pr.user_id));
    await run(supabase.from('password_resets').delete().eq('id', pr.id));
  },
};

export { mailTransporter, smtpConfig } from '../utils/mail.util.js';
export default AuthService;
