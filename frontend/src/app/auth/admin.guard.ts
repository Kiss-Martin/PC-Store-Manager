import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export const AdminGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // If already authenticated, check role synchronously
  if (auth.isAuthenticated()) {
    if (auth.isAdmin()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  if (!auth.shouldRestoreSession()) {
    router.navigate(['/login']);
    return false;
  }

  // Otherwise try a one-time refresh using the httpOnly cookie
  try {
    return firstValueFrom(auth.refresh()).then(() => {
      if (auth.isAuthenticated() && auth.isAdmin()) return true;
      router.navigate(['/dashboard']);
      return false;
    }).catch(() => {
      router.navigate(['/login']);
      return false;
    });
  } catch (e) {
    router.navigate(['/login']);
    return false;
  }
};
