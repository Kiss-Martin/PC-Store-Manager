# Backend Documentation

This document describes the backend for the PC-Store-Manager project. The backend is a small Express.js service that uses Supabase (Postgres) as the data store. It provides authentication, product, and order endpoints and is intentionally independent from the frontend; do not modify the frontend.

**Contents**
- Overview
- Requirements
- Environment
- Installation & run
- API reference
- Database schema and seed
- Security notes
- Next steps

**Overview**

The backend exposes REST endpoints used by the frontend and for administrative tasks. It uses the official `@supabase/supabase-js` client to interact with a Supabase-hosted Postgres database. Authentication in the service is implemented using JSON Web Tokens (JWT) for simplicity; passwords are hashed before being stored.

**Requirements**

- Node.js 18+ (or compatible runtime supporting ESM)
- npm
- A Supabase project (URL is included in the codebase) and a `SUPABASE_KEY` with appropriate permissions

**Environment variables**

- `SUPABASE_KEY` — service role or anon key used by the backend to access Supabase. For production, use a key with only the required privileges.
- `JWT_SECRET` — secret used to sign JWTs (change from the default in `.env.example`).
- `PORT` — optional server port (defaults to 3000).

See `backend/.env.example` for an editable template.

**Installation & run**

1. Open a terminal and change to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file from `.env.example` and set `SUPABASE_KEY` and `JWT_SECRET`.

4. Run the server (development):

```bash
npm run dev
```

The health endpoint will be available at `http://localhost:3000/health` (or the port you set).

**API reference**

All endpoints accept and return JSON. Endpoints that require authentication need an `Authorization: Bearer <token>` header.

- `GET /health`
	- Purpose: Service health and Supabase reachability.
	- Response: `{ status: 'ok', supabase: 'reachable' }` or error details.

- `POST /auth/register`
	- Purpose: Create a new user.
	- Body: `{ email, password, username?, fullName?, role? }`
	- Response: `{ user: { id, email, username, fullName, role }, token }
	- Notes: Passwords are hashed and stored in `users.password_hash`.

- `POST /auth/login`
	- Purpose: Authenticate with `email` or `username` and `password`.
	- Body: `{ email? | username?, password }
	- Response: `{ user: { id, email, username, fullName, role }, token }

- `GET /me`
	- Purpose: Get current user's profile.
	- Auth: required.
	- Response: `{ user: { id, email, username, fullName, role } }

- `GET /products`
	- Purpose: List all products.
	- Response: `{ products: [ ... ] }`

- `POST /products`
	- Purpose: Create a product.
	- Auth: required.
	- Body: any product fields (e.g., `{ name, description, price, stock, metadata }`)
	- Response: `{ product: { ... } }`

- `POST /orders`
	- Purpose: Create an order for the authenticated user.
	- Auth: required.
	- Body: e.g., `{ total, items: [ { product_id, qty, price } ], status? }`
	- Response: `{ order: { ... } }`

- `GET /orders`
	- Purpose: List orders. Admins may see all orders.
	- Auth: required.
	- Query: `?userId=all` may return all orders for admin (endpoint uses role check).
	- Response: `{ orders: [ ... ] }`

**Database schema**

This backend expects three primary tables: `users`, `products`, and `orders`. The code is permissive with product and order schemas (inserting supplied JSON), but a recommended minimal schema is shown below.

Suggested SQL (Postgres):

```sql
-- users
CREATE TABLE users (
	id BIGSERIAL PRIMARY KEY,
	email TEXT UNIQUE NOT NULL,
	username TEXT UNIQUE,
	password_hash TEXT NOT NULL,
	full_name TEXT,
	role TEXT NOT NULL DEFAULT 'user',
	created_at TIMESTAMPTZ DEFAULT now()
);

-- products
CREATE TABLE products (
	id BIGSERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	description TEXT,
	price NUMERIC(10,2) NOT NULL DEFAULT 0,
	stock INTEGER DEFAULT 0,
	metadata JSONB,
	created_at TIMESTAMPTZ DEFAULT now()
);

-- orders
CREATE TABLE orders (
	id BIGSERIAL PRIMARY KEY,
	user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
	total NUMERIC(10,2) NOT NULL DEFAULT 0,
	status TEXT DEFAULT 'pending',
	items JSONB,
	created_at TIMESTAMPTZ DEFAULT now()
);
```

If you use Supabase, you can run this SQL in the Supabase SQL editor or apply it through migrations.

**Seeding data**

Use the SQL above then insert sample records. Example inserts:

```sql
INSERT INTO users (email, username, password_hash, full_name, role)
VALUES
	('admin@example.com', 'admin', crypt('AdminPass123!', gen_salt('bf')), 'Admin User', 'admin'),
	('alice@example.com', 'alice', crypt('password123', gen_salt('bf')), 'Alice Johnson', 'user');

INSERT INTO products (name, description, price, stock, metadata)
VALUES ('Gaming PC - GTX', 'High performance gaming PC', 1299.99, 5, '{"category":"gaming"}');

INSERT INTO orders (user_id, total, status, items)
VALUES ( (SELECT id FROM users WHERE email='alice@example.com'), 1299.99, 'completed', '[{"product_id":1,"qty":1,"price":1299.99}]' );
```

Notes:
- `pgcrypto` extension is useful for `crypt()` password hashing if you seed directly on Postgres. The backend uses `bcryptjs` and manages hashing in application code.

**Security notes**

- Use a least-privilege `SUPABASE_KEY` for the backend in production. For administrative actions you may need a service role key — store it securely and do not commit secrets.
- Change `JWT_SECRET` to a strong, random value and rotate keys periodically.
- Consider integrating Supabase Auth for production authentication flows (email verification, password reset) instead of rolling a custom JWT solution.
- Validate and sanitize user input before inserting into the database. The current code is demonstrative and intentionally minimal.

**Next steps and suggestions**

- Add database migrations and a seed script to keep environments reproducible.
- Replace custom JWT implementation with Supabase Auth to leverage built-in security features.
- Add input validation middleware (e.g., `joi` or `zod`).
- Add role-based access control for admin-only endpoints.
- Add tests for endpoints (supertest + mocha/jest) and a CI job to run them.

If you want, I can:
- generate migration SQL files for Supabase,
- create a `scripts/seed.js` runner that uses the Supabase client to populate data,
- or update the endpoints to match fields expected by the frontend.
