import 'dotenv/config';
import AuthService from '../src/services/auth.service.js';

(async () => {
  try {
    console.log('Invoking AuthService.forgotPassword for test+reset@example.com');
    await AuthService.forgotPassword('test+reset@example.com');
    console.log('AuthService.forgotPassword completed');
  } catch (e) {
    console.error('Error running forgotPassword test:', e.message || e);
    process.exitCode = 1;
  }
})();
