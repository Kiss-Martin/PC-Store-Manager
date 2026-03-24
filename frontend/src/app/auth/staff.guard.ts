import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

/**
 * Guard that blocks buyer accounts from accessing staff-only pages
 * (e.g. Analytics). Allows admin and worker roles through.
 */
export const StaffGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    if (!auth.isBuyer()) return true;
    router.navigate(['/dashboard']);
    return false;
  }

  if (!auth.shouldRestoreSession()) {
    router.navigate(['/login']);
    return false;
  }

  try {
    return firstValueFrom(auth.refresh()).then(() => {
      if (auth.isAuthenticated() && !auth.isBuyer()) return true;
      router.navigate(['/dashboard']);
      return false;
    }).catch(() => {
      router.navigate(['/login']);
      return false;
    });
  } catch {
    router.navigate(['/login']);
    return false;
  }
};
