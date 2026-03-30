// Tests for the Express app (route integration tests)
// These tests mock Supabase and test HTTP endpoints using the exported app.
import { jest } from '@jest/globals';

// ─── Mock supabase (db.js) before importing app ─────────

// Build a chainable mock that supports Supabase's fluent API.
function chainable(resolveData = []) {
  const self = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    or: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    // final await resolves to { data, error }
    then: (resolve) => resolve({ data: resolveData, error: null }),
  };
  return self;
}

const mockFrom = jest.fn(() => chainable());

jest.unstable_mockModule('../src/db.js', () => ({
  default: { from: mockFrom },
  supabase: { from: mockFrom },
}));

// Now dynamically import the app (which imports db.js)
const { default: app } = await import('../src/index.js');

// Use a small HTTP helper rather than pulling in supertest
import http from 'http';

function request(app, method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const server = app.listen(0, () => {
      const { port } = server.address();
      const options = {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          server.close();
          try {
            resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, headers: res.headers, body: data });
          }
        });
      });
      req.on('error', (err) => {
        server.close();
        reject(err);
      });
      if (body) req.write(JSON.stringify(body));
      req.end();
    });
  });
}

// ─── Tests ───────────────────────────────────────────────

describe('GET /', () => {
  it('should return API info with status online', async () => {
    const res = await request(app, 'GET', '/');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body.message).toBe('PC Store Manager API');
    expect(res.body.endpoints).toBeDefined();
  });
});

describe('Auth routes', () => {
  describe('POST /auth/login', () => {
    it('should return 400 when body is empty', async () => {
      const res = await request(app, 'POST', '/auth/login', {});
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 when password is missing', async () => {
      const res = await request(app, 'POST', '/auth/login', { email: 'a@b.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/register', () => {
    it('should return 400 with invalid registration data', async () => {
      const res = await request(app, 'POST', '/auth/register', { email: 'bad' });
      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/forgot-password', () => {
    it('should return 400 with invalid email', async () => {
      const res = await request(app, 'POST', '/auth/forgot-password', { email: 'invalid' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/reset-password', () => {
    it('should return 400 with no token', async () => {
      const res = await request(app, 'POST', '/auth/reset-password', { newPassword: 'abc123' });
      expect(res.status).toBe(400);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should return 401 when no refresh token is provided', async () => {
      const res = await request(app, 'POST', '/auth/refresh', {});
      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });
  });

  describe('POST /auth/logout', () => {
    it('should succeed even without a token', async () => {
      const res = await request(app, 'POST', '/auth/logout', {});
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});

describe('Protected routes without auth', () => {
  it('GET /items should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/items');
    expect(res.status).toBe(401);
  });

  it('GET /orders should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/orders');
    expect(res.status).toBe(401);
  });

  it('GET /customers should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/customers');
    expect(res.status).toBe(401);
  });

  it('GET /analytics should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/analytics');
    expect(res.status).toBe(401);
  });

  it('GET /dashboard should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/dashboard');
    expect(res.status).toBe(401);
  });

  it('GET /users/me should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/users/me');
    expect(res.status).toBe(401);
  });

  it('GET /users/workers should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/users/workers');
    expect(res.status).toBe(401);
  });

  it('GET /auth/tokens should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/auth/tokens');
    expect(res.status).toBe(401);
  });

  it('GET /auth/admin/sessions should return 401 without auth header', async () => {
    const res = await request(app, 'GET', '/auth/admin/sessions');
    expect(res.status).toBe(401);
  });
});

describe('POST /support/contact', () => {
  it('should return 400 when message is empty', async () => {
    const res = await request(app, 'POST', '/support/contact', { message: '' });
    expect(res.status).toBe(400);
  });

  it('should succeed when message is provided', async () => {
    const res = await request(app, 'POST', '/support/contact', {
      name: 'John',
      email: 'john@example.com',
      message: 'I need help with my order',
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe('Swagger docs', () => {
  it('GET /docs.json should return swagger spec', async () => {
    const res = await request(app, 'GET', '/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.0');
    expect(res.body.info.title).toBe('PC Store Manager API');
  });
});

describe('Protected routes with valid JWT', () => {
  let token;
  let buyerToken;

  beforeAll(async () => {
    // generate a JWT matching the app's secret
    const jwt = await import('jsonwebtoken');
    const secret = process.env.JWT_SECRET || 'change-this-secret';
    token = jwt.default.sign({ id: 'test-user-id', role: 'admin', jti: 'test-jti' }, secret, { expiresIn: '1h' });
    buyerToken = jwt.default.sign({ id: 'buyer-user-id', role: 'buyer', jti: 'buyer-jti' }, secret, { expiresIn: '1h' });
  });

  it('GET /items should return 200 with valid token', async () => {
    const res = await request(app, 'GET', '/items', null, { Authorization: `Bearer ${token}` });
    // Even though supabase is mocked, the route handler should process
    expect(res.status).toBe(200);
  });

  it('GET /orders should return 200 with valid token', async () => {
    const res = await request(app, 'GET', '/orders', null, { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });

  it('GET /customers should return 200 with valid token', async () => {
    const res = await request(app, 'GET', '/customers', null, { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });

  it('GET /users/me should return 200 with valid token', async () => {
    const res = await request(app, 'GET', '/users/me', null, { Authorization: `Bearer ${token}` });
    expect(res.status).toBe(200);
  });

  // ── Buyer role route access tests ──

  it('GET /items should return 200 for buyer (view products)', async () => {
    const res = await request(app, 'GET', '/items', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(200);
  });

  it('GET /orders should return 200 for buyer (own orders)', async () => {
    const res = await request(app, 'GET', '/orders', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(200);
  });

  it('GET /customers should return 200 for buyer', async () => {
    const res = await request(app, 'GET', '/customers', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(200);
  });

  it('GET /analytics should return 200 for buyer', async () => {
    const res = await request(app, 'GET', '/analytics', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(200);
  });

  it('DELETE /items/fake-id should return 403 for buyer', async () => {
    const res = await request(app, 'DELETE', '/items/fake-id', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(403);
  });

  it('PATCH /orders/fake-id/assign should return 403 for buyer', async () => {
    const res = await request(app, 'PATCH', '/orders/fake-id/assign', { userId: 'u1' }, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(403);
  });

  it('DELETE /orders/fake-id should return 403 for buyer', async () => {
    const res = await request(app, 'DELETE', '/orders/fake-id', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(403);
  });

  it('GET /analytics/export should return 403 for buyer', async () => {
    const res = await request(app, 'GET', '/analytics/export?period=7days&format=csv', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(403);
  });

  it('GET /users/workers should return 403 for buyer', async () => {
    const res = await request(app, 'GET', '/users/workers', null, { Authorization: `Bearer ${buyerToken}` });
    expect(res.status).toBe(403);
  });
});
