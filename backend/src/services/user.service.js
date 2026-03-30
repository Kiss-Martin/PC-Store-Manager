// UserService: handles business logic for users (workers, profile, password)
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import bcrypt from 'bcryptjs';
import { t } from '../utils/i18n.util.js';

const UserService = {
  async getWorkers() {
    const data = await run(
      supabase.from('users').select('id, username, email, fullname').in('role', ['admin', 'worker']).order('username', { ascending: true })
    );
    return data || [];
  },

  async getProfile(userId) {
    const data = await run(supabase.from('users').select('id,email,username,fullname,role').eq('id', userId).single());
    return data;
  },

  async updateProfile(userId, updates, lang = 'en') {
    const allowed = ['email', 'username', 'fullname'];
    const filtered = {};
    for (const k of allowed) {
      if (k in updates) filtered[k] = updates[k];
    }
    if (Object.keys(filtered).length === 0) throw new Error(t(lang, 'user.noValidFields'));
    const data = await run(
      supabase.from('users').update(filtered).eq('id', userId).select('id,email,username,fullname,role').single()
    );
    return data;
  },

  async changePassword(userId, { currentPassword, newPassword }, lang = 'en') {
    if (!currentPassword || !newPassword) throw new Error(t(lang, 'user.passwordRequired'));
    if (newPassword.length < 8) throw new Error(t(lang, 'user.passwordMinLength'));
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      throw new Error(t(lang, 'user.passwordMinLength'));
    }
    const user = await run(supabase.from('users').select('password_hash').eq('id', userId).single());
    if (!user) throw new Error(t(lang, 'user.fetchFailed'));
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error(t(lang, 'user.currentPasswordIncorrect'));
    const hashed = await bcrypt.hash(newPassword, 12);
    await run(supabase.from('users').update({ password_hash: hashed }).eq('id', userId));
    return { success: true, message: t(lang, 'user.passwordUpdated') };
  },

  async deleteProfile(userId, lang = 'en') {
    const user = await run(supabase.from('users').select('id').eq('id', userId).single()).catch(() => null);
    if (!user) throw new Error(t(lang, 'user.fetchFailed'));

    await run(supabase.from('refresh_tokens').delete().eq('user_id', userId)).catch(() => null);
    await run(supabase.from('password_resets').delete().eq('user_id', userId)).catch(() => null);

    await run(supabase.from('logs').update({ user_id: null }).eq('user_id', userId)).catch(() => null);
    await run(supabase.from('logs').update({ assigned_to: null }).eq('assigned_to', userId)).catch(() => null);
    await run(supabase.from('orders_status').update({ updated_by: null }).eq('updated_by', userId)).catch(() => null);
    await run(supabase.from('users').update({ admin_approved_by: null }).eq('admin_approved_by', userId)).catch(() => null);
    await run(supabase.from('audit_logs').update({ actor_user_id: null }).eq('actor_user_id', userId)).catch(() => null);
    await run(supabase.from('audit_logs').update({ target_user_id: null }).eq('target_user_id', userId)).catch(() => null);

    const deleted = await run(supabase.from('users').delete().eq('id', userId).select('id')).catch(() => null);
    if (!deleted || deleted.length === 0) {
      throw new Error(t(lang, 'user.deleteFailed'));
    }
    return { success: true, message: t(lang, 'user.deleted') };
  },
};

export default UserService;
