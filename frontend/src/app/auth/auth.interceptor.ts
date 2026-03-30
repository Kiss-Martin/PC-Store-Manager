import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { getStoredToken } from '../utils/token.util';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const isAuthEndpoint = /\/auth\/(login|register|logout|refresh)(\?|$)/.test(req.url);

  const token = getStoredToken();
  const language = localStorage.getItem('pc_language') || 'en';

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
