// Middleware to parse Accept-Language header
export function languageMiddleware(req, res, next) {
  const al = req.headers['accept-language'] || req.headers['Accept-Language'];
  if (al && typeof al === 'string') {
    req.lang = al.split(',')[0].split('-')[0];
  } else {
    req.lang = 'en';
  }
  next();
}
