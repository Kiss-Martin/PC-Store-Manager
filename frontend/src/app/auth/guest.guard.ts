import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { AuthService } from './auth.service';

export const GuestGuard = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    router.navigate(['/dashboard']);
    return false;
  }

  if (!auth.shouldRestoreSession()) {
    return true;
  }

  try {
    return firstValueFrom(auth.refresh())
      .then(() => {
        if (auth.isAuthenticated()) {
          router.navigate(['/dashboard']);
          return false;
        }
        return true;
      })
      .catch(() => true);
  } catch (e) {
    return true;
  }
};