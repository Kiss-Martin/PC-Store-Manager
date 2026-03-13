import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isAuthEndpoint = /\/auth\/(login|register|logout|refresh)(\?|$)/.test(req.url);

  // Look for token in localStorage (persistent) or sessionStorage (temporary)
  const getStoredToken = () => localStorage.getItem('pc_token') || localStorage.getItem('token') || sessionStorage.getItem('pc_token') || sessionStorage.getItem('token');
  const token = getStoredToken();
  const language = localStorage.getItem('pc_language') || sessionStorage.getItem('pc_language') || 'en';

  let outgoing = req.clone({
    setHeaders: {
      'Accept-Language': language,
    }
  });

  if (token) {
    outgoing = outgoing.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': language,
      }
    });
  }

  return next(outgoing).pipe(
    catchError((err) => {
      if (err?.status === 401 && !isAuthEndpoint && !authService.isLogoutInProgress()) {
        // Try to refresh the access token using refresh cookie
        return authService.refresh().pipe(
          switchMap(() => {
            const newToken = getStoredToken();
            const retried = req.clone({
              setHeaders: {
                Authorization: newToken ? `Bearer ${newToken}` : '',
                'Accept-Language': language,
              }
            });
            return next(retried);
          }),
          catchError((refreshErr) => {
            authService.logout('expired');
            return throwError(() => refreshErr);
          })
        );
      }
      return throwError(() => err);
    })
  );
};
