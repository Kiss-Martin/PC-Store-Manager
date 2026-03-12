import 'dotenv/config';
import AuthService from '../src/services/auth.service.js';
import supabase from '../src/db.js';

(async () => {
  try {
    const email = 'test+reset@example.com';
    const username = 'testreset' + Date.now();
    console.log('Registering user', email);
    const res = await AuthService.register({ email, username, password: 'Password123!', fullname: 'Test Reset', role: 'worker' });
    console.log('Registered user id:', res.user.id);
    console.log('Invoking forgotPassword...');
    await AuthService.forgotPassword(email);
    // fetch password_resets
    const { data: user } = await supabase.from('users').select('id').eq('email', email).single();
    const { data: reset } = await supabase.from('password_resets').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).single();
    console.log('Reset row:', reset);
  } catch (e) {
    console.error('Error:', e.message || e);
    process.exitCode = 1;
  }
})();
