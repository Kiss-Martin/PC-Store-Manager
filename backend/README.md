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
- `POST /auth/register` — register user (body: `email`, `password`, `username`, `fullName`, `role`)
- `POST /auth/login` — login (body: `email` or `username`, and `password`)
- `POST /auth/login` — login (body: `email` or `username`, and `password`; sends an httpOnly `refresh_token` cookie and returns a short-lived access token)
- `POST /auth/refresh` — refresh access token (uses httpOnly `refresh_token` cookie; returns new access token and rotates the refresh cookie)
- `POST /auth/logout` — revoke refresh token and clear cookie
- `GET /me` — current user profile (requires `Authorization: Bearer <token>`)
- `GET /products` — list products
- `POST /products` — create product (requires auth)
- `POST /orders` — create order (requires auth)
- `GET /orders` — list orders (requires auth; non-admins see their own orders)

Notes

- This server expects Supabase tables `users`, `products`, and `orders` to exist. Each row's shape is flexible; the code inserts whatever JSON is given for products/orders.
- Passwords are stored as hashed values in `users.password_hash`.
- Adjust role checks and permissions as needed for your application.
- Password reset links use `FRONTEND_URL`. In production this must point at the deployed frontend, otherwise reset emails will contain a localhost link.
- SMTP is only enabled when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are all present. If the config is incomplete, the backend logs reset tokens instead of sending mail.

Refresh tokens

- This backend uses a short-lived JWT access token (1 hour) and a server-side refresh token persisted in `refresh_tokens`.

- Refresh tokens are stored with optional device metadata (`ip`, `user_agent`) and the server keeps at most 5 active refresh tokens per user (oldest removed when limit exceeded).
- The `/auth/refresh` endpoint is rate-limited to reduce abuse. Adjust settings in `src/routes/auth.routes.js`.
- The refresh token is sent to the client in an httpOnly cookie named `refresh_token`. The client should call `POST /auth/refresh` to rotate the refresh token and obtain a new access token.
- When you use the "remain signed in" flow with IP/browser checks behind Render or another reverse proxy, set `TRUST_PROXY=1` so Express resolves the real client IP from forwarded headers.
A SQL script to create the `refresh_tokens` table for Supabase is provided at `db/supabase_create_refresh_tokens.sql` (paste it into the Supabase SQL editor and run).

To apply the table in Supabase: open your project → SQL editor, paste the contents of `backend/db/supabase_create_refresh_tokens.sql`, and run it.

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
