// AuthService: handles business logic for authentication
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import { t } from '../utils/i18n.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

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

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

const AuthService = {
  async register({ email, username, password, fullname, role }) {
    const hashed = await bcrypt.hash(password, 10);
    const data = await run(
      supabase.from('users').insert({
        email,
        username,
        fullname: fullname || null,
        password_hash: hashed,
        role: role || 'worker',
      }).select('id,email,username,fullname,role').single()
    );
    const token = generateToken({ id: data.id, role: data.role });
    return { user: data, token };
  },

  async login({ email, username, password }, lang = 'en') {
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
    const token = generateToken({ id: data.id, role: data.role });
    return {
      user: {
        id: data.id,
        email: data.email,
        username: data.username,
        fullname: data.fullname,
        role: data.role,
      },
      token,
    };
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
        await mailTransporter.sendMail({
          to: email,
          from: smtpConfig.from,
          subject: t(lang, 'auth.passwordResetSubject'),
          text: t(lang, 'auth.passwordResetText', { link: resetLink }),
          html: `<p>${t(lang, 'auth.passwordResetIntro')}: <a href="${resetLink}">${resetLink}</a></p>`,
        });
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
