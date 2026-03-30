// Centralized configuration — single source of truth for secrets and env settings
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

if (process.env.NODE_ENV === 'production' && JWT_SECRET === 'change-this-secret') {
  console.error('FATAL: JWT_SECRET must be set in production. Using the default is insecure.');
  process.exit(1);
}

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
const PORT = process.env.PORT || 3000;

const CORS_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((s) => s.trim())
  : ['https://pc-store-manager-frontend.onrender.com', 'http://localhost:4200'];

export { JWT_SECRET, FRONTEND_URL, BACKEND_URL, PORT, CORS_ORIGINS };
