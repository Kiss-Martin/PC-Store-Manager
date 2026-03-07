
import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';
import { sanitizeMiddleware } from './middlewares/sanitize.middleware.js';
import { languageMiddleware } from './middlewares/language.middleware.js';
import { scrubResponseMiddleware } from './utils/scrub.util.js';
import { errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import itemRoutes from './routes/item.routes.js';
import orderRoutes from './routes/order.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import customerRoutes from './routes/customer.routes.js';
import userRoutes from './routes/user.routes.js';
import healthRoutes from './routes/health.routes.js';

const app = express();

app.use(
  cors({
    origin: ['https://pc-store-manager.vercel.app', 'http://localhost:4200'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  })
);
app.use(express.json());
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
    origin: ['https://pc-store-manager.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  console.log('Websocket connected:', socket.id);
  socket.on('disconnect', () => console.log('Socket disconnected', socket.id));
});





// Dashboard summary endpoint


