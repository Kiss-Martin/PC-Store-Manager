import 'dotenv/config';
import supabase from '../src/db.js';

(async () => {
  try {
    const email = 'test+reset@example.com';
    // Find user
    const { data: user, error: userErr } = await supabase.from('users').select('id').eq('email', email).single();
    if (userErr || !user) {
      console.error('User not found or error:', userErr || 'no user');
      process.exitCode = 1;
      return;
    }
    const { data: resets, error } = await supabase.from('password_resets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
    if (error || !resets) {
      console.error('No reset token found or error:', error || 'no token');
      process.exitCode = 1;
      return;
    }
    console.log('Found reset row:', resets);
  } catch (e) {
    console.error('Error checking resets:', e.message || e);
    process.exitCode = 1;
  }
})();
