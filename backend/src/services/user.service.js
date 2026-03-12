// UserService: handles business logic for users (workers, profile, password)
import supabase from '../db.js';
import { run } from '../utils/supabase.util.js';
import bcrypt from 'bcryptjs';

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

  async updateProfile(userId, updates) {
    const allowed = ['email', 'username', 'fullname'];
    const filtered = {};
    for (const k of allowed) {
      if (k in updates) filtered[k] = updates[k];
    }
    if (Object.keys(filtered).length === 0) throw new Error('No valid fields to update');
    const data = await run(
      supabase.from('users').update(filtered).eq('id', userId).select('id,email,username,fullname,role').single()
    );
    return data;
  },

  async changePassword(userId, { currentPassword, newPassword }) {
    if (!currentPassword || !newPassword) throw new Error('Current password and new password required');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    const user = await run(supabase.from('users').select('password_hash').eq('id', userId).single());
    if (!user) throw new Error('Failed to fetch user');
    const isValid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isValid) throw new Error('Current password is incorrect');
    const hashed = await bcrypt.hash(newPassword, 10);
    await run(supabase.from('users').update({ password_hash: hashed }).eq('id', userId));
    return { success: true, message: 'Password updated successfully' };
  },
};

export default UserService;
