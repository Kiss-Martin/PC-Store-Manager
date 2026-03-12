import 'dotenv/config';
import AuthService from '../src/services/auth.service.js';
import supabase from '../src/db.js';

(async () => {
  try {
    const email = 'test+reset@example.com';
    let existingUser = null;
    try {
      const r = await supabase.from('users').select('id').eq('email', email).single();
      existingUser = r.data;
    } catch (e) {
      existingUser = null;
    }
    if (!existingUser) {
      console.log('User not found; registering new user');
      const username = 'testreset' + Date.now();
      const res = await AuthService.register({ email, username, password: 'Password123!', fullname: 'Test Reset', role: 'worker' });
      console.log('Registered user id:', res.user.id);
    } else {
      console.log('User exists with id:', existingUser.id);
    }

    console.log('Invoking forgotPassword...');
    await AuthService.forgotPassword(email);
    console.log('forgotPassword invocation complete');
  } catch (e) {
    console.error('Error in ensure_user_and_forgot:', e.message || e);
    process.exitCode = 1;
  }
})();
