import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {

  const token = localStorage.getItem('pc_token') || localStorage.getItem('token');
  const language = localStorage.getItem('pc_language') || 'en';

  req = req.clone({
    setHeaders: {
      'Accept-Language': language,
    }
  });

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
        'Accept-Language': language,
      }
    });
  }

  return next(req);
};
