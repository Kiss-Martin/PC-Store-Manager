// AuthService: handles business logic for authentication
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

let mailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  mailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
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

  async login({ email, username, password }) {
    let query = supabase.from('users').select('*');
    if (email) query = query.eq('email', email);
    else query = query.eq('username', username);
    let data;
    try {
      data = await run(query.single());
    } catch (e) {
      throw new Error('Invalid credentials');
    }
    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) throw new Error('Invalid credentials');
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

  async forgotPassword(email) {
    const user = await run(supabase.from('users').select('id,email').eq('email', email).single()).catch(() => null);
    if (!user) return; // don't reveal existence
    const token = crypto.randomBytes(24).toString('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    await supabase.from('password_resets').insert({ user_id: user.id, token, expires_at });
    const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
    if (mailTransporter) {
      try {
        await mailTransporter.sendMail({
          to: email,
          from: process.env.SMTP_FROM || 'noreply@pcstore.local',
          subject: 'Password reset',
          text: `Reset your password: ${resetLink}`,
          html: `<p>Reset your password: <a href="${resetLink}">${resetLink}</a></p>`,
        });
      } catch (e) {
        console.warn('Failed to send reset email', e.message || e);
      }
    } else {
      console.log('Password reset token for', email, token, 'link:', resetLink);
    }
  },

  async resetPassword({ token, newPassword }) {
    const pr = await run(supabase.from('password_resets').select('id,user_id,expires_at').eq('token', token).single()).catch(() => null);
    if (!pr) throw new Error('Invalid or expired token');
    if (new Date(pr.expires_at) < new Date()) throw new Error('Token expired');
    const hashed = await bcrypt.hash(newPassword, 10);
    await run(supabase.from('users').update({ password_hash: hashed }).eq('id', pr.user_id));
    await run(supabase.from('password_resets').delete().eq('id', pr.id));
  },
};

export default AuthService;
