// AuthService: handles business logic for authentication
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { hashToken } from '../utils/token.util.js';
import { renderAdminNotification, renderPasswordReset, renderRegistrationConfirmation } from '../utils/email.template.js';
import { t } from '../utils/i18n.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;

const smtpConfig = {
  host: process.env.SMTP_HOST?.trim(),
  port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
  secure: process.env.SMTP_SECURE === 'true',
  user: process.env.SMTP_USER?.trim(),
  pass: process.env.SMTP_PASS,
  from: process.env.SMTP_FROM?.trim() || 'noreply@pcstore.local',
};

const requiredSmtpFields = ['host', 'user', 'pass'];
const missingSmtpFields = requiredSmtpFields.filter((field) => !smtpConfig[field]);
const hasAnySmtpConfig = requiredSmtpFields.some((field) => Boolean(smtpConfig[field]));
const hasCompleteSmtpConfig = missingSmtpFields.length === 0;

export function getSmtpRuntimeStatus() {
  return {
    configured: hasCompleteSmtpConfig,
    partiallyConfigured: hasAnySmtpConfig && !hasCompleteSmtpConfig,
    missingFields: missingSmtpFields,
    host: smtpConfig.host || null,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    from: smtpConfig.from,
  };
}

let mailTransporter = null;
if (hasCompleteSmtpConfig) {
  mailTransporter = nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.user,
      pass: smtpConfig.pass,
    },
  });

  // Verify transporter connectivity at startup; log result but do not throw.
  mailTransporter.verify()
    .then(() => console.log('SMTP transporter verified'))
    .catch((err) => console.warn('SMTP transporter verification failed:', err && err.message ? err.message : err));
} else if (hasAnySmtpConfig) {
  console.warn(`SMTP configuration is incomplete. Missing: ${missingSmtpFields.join(', ')}. Password reset emails will be logged instead of sent.`);
}

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
  async register({ email, username, password, fullname, role }, metadata = {}, lang = 'en') {
    const sessionMetadata = normalizeMetadata(metadata);
    const hashed = await bcrypt.hash(password, 10);
    const data = await run(
      supabase.from('users').insert({
        email,
        username,
        fullname: fullname || null,
        password_hash: hashed,
        role: role || 'worker',
        // if creating an admin, require approval by another admin
        admin_approved: role === 'admin' ? false : true,
      }).select('id,email,username,fullname,role,admin_approved').single()
    );
    // send registration confirmation to the new user (inform about awaiting approval if admin)
    try {
      const regSubject = data.role === 'admin' && !data.admin_approved ? t(lang, 'auth.registrationAwaitingSubject') : t(lang, 'auth.registrationSubject');
      const regLink = `${FRONTEND_URL}/`; 
      const regTpl = renderRegistrationConfirmation({ lang, subject: regSubject, username: data.username, fullname: data.fullname || '', link: regLink, awaitingApproval: data.role === 'admin' && !data.admin_approved });
      if (mailTransporter) {
        await mailTransporter.sendMail({ to: data.email, from: smtpConfig.from, subject: regTpl.subject, text: regTpl.text, html: regTpl.html }).catch((e) => { throw e; });
      } else {
        console.log('Registration confirmation (no SMTP) ->', data.email, regTpl.text);
      }
    } catch (e) {
      console.warn('Failed to send registration confirmation to', data.email, e && (e.message || e));
    }

    // New admins must be approved before receiving tokens
    if (data.role === 'admin' && !data.admin_approved) {
        // Notify existing approved admins by email that a new admin awaits approval
        (async () => {
          try {
            const admins = await run(supabase.from('users').select('id,email').eq('role', 'admin').eq('admin_approved', true));
            if (admins && admins.length) {
              const subject = t(lang, 'auth.notifyAdminsSubject');
              const link = `${FRONTEND_URL}/admin/pending-admins`;
              for (const a of admins) {
                try {
                  // generate one-click approve/reject tokens for this approver
                  const approveJti = crypto.randomBytes(16).toString('hex');
                  const rejectJti = crypto.randomBytes(16).toString('hex');
                  const approveToken = jwt.sign({ type: 'admin_action', action: 'approve', approver_id: a.id, approver_email: a.email, target_id: data.id, jti: approveJti }, JWT_SECRET, { expiresIn: '7d' });
                  const rejectToken = jwt.sign({ type: 'admin_action', action: 'reject', approver_id: a.id, approver_email: a.email, target_id: data.id, jti: rejectJti }, JWT_SECRET, { expiresIn: '7d' });
                  const approveUrl = `${BACKEND_URL.replace(/\/$/, '')}/auth/admin/pending-admins/${data.id}/approve/oneclick?token=${encodeURIComponent(approveToken)}`;
                  const rejectUrl = `${BACKEND_URL.replace(/\/$/, '')}/auth/admin/pending-admins/${data.id}/reject/oneclick?token=${encodeURIComponent(rejectToken)}`;

                  const tpl = renderAdminNotification({ lang, subject, email: data.email, username: data.username, fullname: data.fullname || '', approveUrl, rejectUrl, reviewLink: link });
                  // send email immediately (no extra tables required). If SMTP missing, fallback to logging.
                  try {
                    if (mailTransporter) {
                      await mailTransporter.sendMail({ to: a.email, from: smtpConfig.from, subject: tpl.subject, text: tpl.text, html: tpl.html });
                    } else {
                      console.log('Admin notification (no SMTP) ->', a.email, tpl.text, 'approve:', approveUrl, 'reject:', rejectUrl);
                    }
                  } catch (e) {
                    console.warn('Failed to send admin notification to', a.email, e && e.message ? e.message : e);
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
        message: t(lang, 'auth.registeredAwaitingApproval'),
      };
    }

    // create access token and refresh token
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: data.id, role: data.role }, '1h');
    const refreshToken = generateRefreshTokenStr();
    const refreshExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    // try to persist refresh token (store hashed token); if table missing, warn but continue
    try {
      const tokenHash = hashToken(refreshToken);
      await run(supabase.from('refresh_tokens').insert({ user_id: data.id, token_hash: tokenHash, expires_at: refreshExpires, ip: sessionMetadata.ip, user_agent: sessionMetadata.userAgent, access_jti: accessJti }).select().single());
      // cleanup old tokens for this user (keep max 5)
      const { data: tokens } = await run(supabase.from('refresh_tokens').select('id,created_at').eq('user_id', data.id).order('created_at', { ascending: false }));
      const maxTokens = 5;
      if (tokens && tokens.length > maxTokens) {
        const toRemove = tokens.slice(maxTokens).map((r) => r.id);
        await run(supabase.from('refresh_tokens').delete().in('id', toRemove)).catch(() => null);
      }
    } catch (e) {
      console.warn('Could not persist refresh token (refresh_tokens table missing?). Continuing.');
    }
    return { user: data, accessToken, refreshToken, refreshExpires };
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
      throw new Error(t(lang, 'auth.invalidCredentials'));
    }
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) throw new Error(t(lang, 'auth.invalidCredentials'));
    // Issue short-lived access token and a refresh token (persisted)
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: data.id, role: data.role }, '1h');
    const refreshToken = generateRefreshTokenStr();
    const expiresDays = rememberMe ? 30 : 7;
    const refreshExpires = new Date(Date.now() + expiresDays * 24 * 60 * 60 * 1000).toISOString();
    // keep up to max tokens per user (append new and cleanup older)
    const maxTokens = 5;
    try {
      const tokenHash = hashToken(refreshToken);
      await run(supabase.from('refresh_tokens').insert({ user_id: data.id, token_hash: tokenHash, expires_at: refreshExpires, ip: sessionMetadata.ip, user_agent: sessionMetadata.userAgent, access_jti: accessJti }).select().single());
      const { data: tokens } = await run(supabase.from('refresh_tokens').select('id,created_at').eq('user_id', data.id).order('created_at', { ascending: false }));
      if (tokens && tokens.length > maxTokens) {
        const toRemove = tokens.slice(maxTokens).map((r) => r.id);
        await run(supabase.from('refresh_tokens').delete().in('id', toRemove)).catch(() => null);
      }
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
    const { token: accessToken, jti: accessJti } = generateAccessToken({ id: user.id, role: user.role }, '1h');
    const newRefresh = generateRefreshTokenStr();
    const newExpires = rt.expires_at;
    try {
      await run(supabase.from('refresh_tokens').delete().eq('id', rt.id));
      const newHash = hashToken(newRefresh);
      await run(supabase.from('refresh_tokens').insert({ user_id: user.id, token_hash: newHash, expires_at: newExpires, ip: rt.ip || null, user_agent: rt.user_agent || null, access_jti: accessJti }).select().single());
      // cleanup old tokens
      const { data: tokens } = await run(supabase.from('refresh_tokens').select('id,created_at').eq('user_id', user.id).order('created_at', { ascending: false }));
      const maxTokens = 5;
      if (tokens && tokens.length > maxTokens) {
        const toRemove = tokens.slice(maxTokens).map((r) => r.id);
        await run(supabase.from('refresh_tokens').delete().in('id', toRemove)).catch(() => null);
      }
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
    const resp = await run(supabase.from('refresh_tokens').select('id,expires_at,ip,user_agent,created_at').eq('user_id', userId).order('created_at', { ascending: false })).catch(() => ({ data: [] }));
    return resp.data || [];
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
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    // Remove any existing reset tokens for this user, then attempt to insert a new one
    await run(supabase.from('password_resets').delete().eq('user_id', user.id)).catch(() => null);
    try {
      await run(supabase.from('password_resets').insert({ user_id: user.id, token, expires_at }).select().single());
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
    const pr = await run(supabase.from('password_resets').select('id,user_id,expires_at').eq('token', token).single()).catch(() => null);
    if (!pr) throw new Error(t(lang, 'auth.invalidOrExpiredToken'));
    if (new Date(pr.expires_at) < new Date()) throw new Error(t(lang, 'auth.tokenExpired'));
    const hashed = await bcrypt.hash(newPassword, 10);
    await run(supabase.from('users').update({ password_hash: hashed }).eq('id', pr.user_id));
    await run(supabase.from('password_resets').delete().eq('id', pr.id));
  },
};

export default AuthService;
