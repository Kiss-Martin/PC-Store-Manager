# Backend (Supabase + Express)

This backend implements a small REST API using Supabase as the data store.

Quick start

1. Copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, and `FRONTEND_URL`.
2. If you want password reset emails to be delivered instead of logged, also set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_SECURE`, and `SMTP_FROM`.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Run in development:

```bash
npm run dev
```

API endpoints

- `GET /health` — service health and Supabase reachability
- `GET /health/ready` — readiness probe (fails fast if Supabase is unreachable)
- `POST /auth/register` — register user (body: `email`, `password`, `username`, `fullname`, `role`)
- `POST /auth/login` — login (body: `email` or `username`, and `password`; sends an httpOnly `refresh_token` cookie and returns a short-lived access token)
- `POST /auth/refresh` — refresh access token (uses httpOnly `refresh_token` cookie; returns new access token and rotates the refresh cookie)
- `POST /auth/logout` — revoke refresh token and clear cookie
- `POST /auth/forgot-password` — initiate password reset email
- `POST /auth/reset-password` — complete password reset with token
- `GET /auth/tokens` — list current user's active sessions (requires auth)
- `DELETE /auth/tokens/:id` — revoke a specific session (requires auth)
- `GET /users/me` — current user profile (requires `Authorization: Bearer <token>`)
- `PATCH /users/me` — update profile (requires auth)
- `PATCH /users/me/password` — change password (requires auth)
- `GET /items` — list products (requires auth)
- `POST /items` — create product (requires admin)
- `PATCH /items/:id` — update product (requires admin)
- `DELETE /items/:id` — delete product (requires admin)
- `GET /items/categories` — list categories (requires auth)
- `GET /items/brands` — list brands (requires auth)
- `GET /orders` — list orders (requires auth; admin: all, worker: assigned, buyer: own)
- `POST /orders` — create order (requires admin or buyer)
- `PATCH /orders/:id/status` — update order status (requires admin or buyer)
- `PATCH /orders/:id/assign` — assign order to worker (requires admin)
- `DELETE /orders/:id` — delete order (requires admin)
- `GET /orders/export` — export orders as CSV/PDF (requires admin or buyer)
- `GET /customers` — list customers (requires auth)
- `POST /customers` — create customer (requires admin or buyer)
- `GET /analytics` — analytics summary (requires auth)
- `GET /analytics/export` — export analytics report (requires admin)
- `GET /dashboard` — dashboard stats and activities (requires auth)
- `POST /support/contact` — contact support form (no auth required)

Notes

- This server expects Supabase tables `users`, `items`, `categories`, `brands`, `customers`, `logs`, `orders_status`, `refresh_tokens`, `revoked_tokens`, `password_resets`, and `audit_logs` to exist.
- Passwords are stored as hashed values in `users.password_hash`.
- Three roles are supported: `admin` (full access), `worker` (product/order CRUD + assigned orders), `buyer` (place/view own orders).
- Password reset links use `FRONTEND_URL`. In production this must point at the deployed frontend, otherwise reset emails will contain a localhost link.
- SMTP is only enabled when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are all present. If the config is incomplete, the backend logs reset tokens instead of sending mail.

Refresh tokens

- This backend uses a short-lived JWT access token (1 hour) and a server-side refresh token persisted in `refresh_tokens`.

- Refresh tokens are stored with optional device metadata (`ip`, `user_agent`) and the server keeps at most 5 active refresh tokens per user (oldest removed when limit exceeded).
- The `/auth/refresh` endpoint is rate-limited to reduce abuse. Adjust settings in `src/routes/auth.routes.js`.
- The refresh token is sent to the client in an httpOnly cookie named `refresh_token`. The client should call `POST /auth/refresh` to rotate the refresh token and obtain a new access token.
- When you use the "remain signed in" flow with IP/browser checks behind Render or another reverse proxy, set `TRUST_PROXY=1` so Express resolves the real client IP from forwarded headers.

To create the `refresh_tokens` table in Supabase: open your project → SQL editor, and create the table with columns: `id` (uuid), `user_id` (uuid, FK → users), `token_hash` (text), `expires_at` (timestamptz), `ip` (text), `user_agent` (text), `access_jti` (text), `created_at` (timestamptz).

Render production environment variables

- `SUPABASE_URL=<your-supabase-project-url>`
- `SUPABASE_KEY=<your-supabase-service-key>`
- `JWT_SECRET=<strong-random-secret>`
- `FRONTEND_URL=https://pc-store-manager-frontend.onrender.com`
- `TRUST_PROXY=1`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=<your-sender-email>`
- `SMTP_PASS=<your-app-password>`
- `SMTP_FROM=PC Store Manager <your-sender-email>`
