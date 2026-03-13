
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware.js';
import { languageMiddleware } from './middlewares/language.middleware.js';
import { scrubResponseMiddleware } from './utils/scrub.util.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { getSmtpRuntimeStatus } from './services/auth.service.js';
import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import orderRoutes from './routes/order.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import customerRoutes from './routes/customer.routes.js';
import userRoutes from './routes/user.routes.js';
import healthRoutes from './routes/health.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import supportRoutes from './routes/support.routes.js';
import { run } from './utils/supabase.util.js';
import supabase from './db.js';

const app = express();

function resolveTrustProxySetting(value) {
  if (value === undefined || value === null || value === '') {
    return process.env.NODE_ENV === 'production' ? 1 : false;
  }

  const normalized = String(value).trim().toLowerCase();
  if (['false', '0', 'off', 'no'].includes(normalized)) return false;
  if (['true', 'on', 'yes'].includes(normalized)) return true;

  const asNumber = Number(normalized);
  if (Number.isInteger(asNumber) && asNumber >= 0) return asNumber;

  return value;
}

const trustProxySetting = resolveTrustProxySetting(process.env.TRUST_PROXY);

app.set('trust proxy', trustProxySetting);

app.use(
  cors({
    origin: [
      "https://pc-store-manager-frontend.onrender.com",
      "http://localhost:4200",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept-Language"],
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(helmet());
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));
app.use(sanitizeMiddleware);
app.use(languageMiddleware);
app.use(scrubResponseMiddleware);

// Swagger/OpenAPI (minimal)
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: { title: 'PC Store Manager API', version: '1.0.0' },
  },
  apis: [],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/docs.json', (req, res) => res.json(swaggerSpec));

// --- ROUTES ---
app.use('/health', healthRoutes);
app.use('/users', userRoutes);
app.use('/customers', customerRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/orders', orderRoutes);
app.use('/items', itemRoutes);
app.use('/auth', authRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/support', supportRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'PC Store Manager API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      health: 'GET /health',
      auth: 'POST /auth/login, POST /auth/register',
      items: 'GET /items',
      analytics: 'GET /analytics',
      orders: 'GET /orders',
      users: 'GET /users',
      customers: 'GET /customers',
    },
  });
});

// Central error handler (consistent JSON responses)
app.use(errorHandler);

export default app;

// Create HTTP server and attach socket.io
const PORT = process.env.PORT || 3000;
const server = createServer(app);
let io = new IO(server, {
  cors: {
    origin: ["https://pc-store-manager-frontend.onrender.com", "http://localhost:4200"],
    methods: ["GET", "POST"],
  },
});

io.on('connection', (socket) => {
  console.log('Websocket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});

// Start server
server.listen(PORT, () => {
const reset = "\x1b[0m";
const bold = "\x1b[1m";
const cyan = "\x1b[36m";
const green = "\x1b[32m";
const yellow = "\x1b[33m";
const red = "\x1b[31m";
const smtpStatus = getSmtpRuntimeStatus();
const smtpSummary = smtpStatus.configured
  ? `${bold}${green}configured${reset} (${smtpStatus.host}:${smtpStatus.port}, secure=${smtpStatus.secure})`
  : smtpStatus.partiallyConfigured
    ? `${bold}${yellow}incomplete${reset} (missing: ${smtpStatus.missingFields.join(', ')})`
    : `${bold}${red}disabled${reset} (reset links will be logged)`;

console.log("\n" + cyan + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + reset);
console.log(`${bold}${green}   BACKEND SZERVER ELINDÍTVA ${reset}`);
console.log(cyan + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" + reset);
console.log(`   Port:        ${bold}${yellow}${PORT}${reset}`);
console.log(
  `   Environment: ${bold}${yellow}${process.env.NODE_ENV || "development"}${reset}`,
);
console.log(`   SMTP:        ${smtpSummary}`);
console.log(`   Trust proxy: ${bold}${yellow}${String(trustProxySetting)}${reset}`);
console.log(cyan + "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n" + reset);
});

// Schedule periodic cleanup of expired revoked tokens
async function cleanupExpiredRevoked() {
  try {
    const nowIso = new Date().toISOString();
    await run(supabase.from('revoked_tokens').delete().lt('expires_at', nowIso));
    // eslint-disable-next-line no-console
    console.log('[cleanup] expired revoked_tokens cleaned up at', nowIso);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[cleanup] failed to cleanup revoked_tokens:', e && e.message ? e.message : e);
  }
}

// Run once at startup, then every hour
cleanupExpiredRevoked().catch(() => null);
setInterval(() => cleanupExpiredRevoked().catch(() => null), 60 * 60 * 1000);
