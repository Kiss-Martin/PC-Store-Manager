
# Backend Documentation (Current State)

This document describes the backend of the PC Store Manager project. The backend is an Express.js application using Supabase (Postgres) for data storage, JWT for authentication, Zod for validation, and Socket.IO for real-time notifications. All business logic is organized into controllers and routes, and the API is documented with Swagger UI.

## Table of Contents
- Overview
- Requirements
- Environment Variables
- Installation & Running
- Main Endpoints
- Database Structure (Recommended)
- Security Notes

## Overview

**Key technologies:**
- Express.js (ESM)
- Supabase (Postgres) via `backend/src/db.js`
- JWT authentication (`JWT_SECRET`), password hashing with `bcryptjs`
- Input validation with Zod (`backend/src/validators.js`)
- Security: `helmet`, `express-rate-limit`, request sanitization, response scrubbing
- Real-time: Socket.IO (`order_created` event)
- API docs: Swagger UI at `/docs`
- Email (for password reset): `nodemailer` (if SMTP not set, token is logged)

## Requirements

- Node.js 18+
- npm
- Supabase project and key (`SUPABASE_KEY`)

## Environment Variables

- `SUPABASE_KEY` — Supabase service/anon key
- `JWT_SECRET` — JWT signing secret
- `PORT` — server port (default: 3000)
- `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_FROM` — (optional) for sending emails
- `FRONTEND_URL` — for generating password reset links

## Installation & Running

```bash
cd backend
npm install
# Create a .env file with the required variables
npm run dev
```


## Main Endpoints

All private endpoints require `Authorization: Bearer <token>`.

### General
- `GET /health` — Service and Supabase health check
- `GET /` — API meta info

### Auth
- `POST /auth/register` — Register; `{ email, password, username?, fullname?, role? }`
- `POST /auth/login` — Login; `{ email or username, password }`
- `POST /auth/forgot-password` — Request password reset token (email)
- `POST /auth/reset-password` — Reset password with token; `{ token, newPassword }`

### Users
- `GET /users/me` — Get own profile (auth required)
- `PATCH /users/me` — Update profile
- `PATCH /users/me/password` — Change password
- `GET /users/workers` — List workers (admin only)

### Items / Inventory
- `GET /items` — List items (auth required)
- `POST /items` — Create item (admin only)
- `PATCH /items/:id` — Update item (admin only)
- `DELETE /items/:id` — Delete item (admin only)

### Customers
- `GET /customers` — List customers (auth required)
- `POST /customers` — Create customer (admin only)

### Orders
- `POST /orders` — Create manual order (admin only, emits `order_created` via Socket.IO)
- `GET /orders` — List orders (admins see all, workers see assigned)
- `PATCH /orders/:id/status` — Update order status (admin only)
- `PATCH /orders/:id/assign` — Assign order to worker (admin only)
- `GET /orders/export` — Export orders as CSV (admin only)

### Analytics & Reports
- `GET /analytics` — Get analytics summary (auth required)
- `GET /analytics/export` — Export analytics as CSV (admin only)
- `GET /reports/business` — Business report CSV (admin only)

## Real-time

Socket.IO is attached to the server. When a new order is created, the backend emits an `order_created` event to all connected clients with the order summary.

## Validation & Error Handling

- All payloads are validated with Zod schemas (`backend/src/validators.js`). Invalid requests return 400 with schema errors.
- Central error middleware ensures consistent JSON error format.
- Async routes are wrapped for centralized error handling.

## Email / Password Reset

- `/auth/forgot-password` creates a token in the `password_resets` table (with expiry) and attempts to send an email. If SMTP is not configured, the token and link are logged.
- `/auth/reset-password` checks the token and updates the user's password.

**Recommended `password_resets` table:**
```sql
CREATE TABLE password_resets (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);
```

## Database Structure (Recommended)

- `users` (id, email, username, password_hash, fullname, role, created_at)
- `items` (id, name, price, amount, category_id, brand_id, date_added, ...)
- `brands`, `categories` (lookup tables, managed outside API)
- `customers` (id, name, email, phone)
- `logs` (transaction log, created on order)
- `orders_status` (order statuses and changes)
- `password_resets` (password reset tokens)

## Security Notes

- Use a strong `JWT_SECRET` and restrict `SUPABASE_KEY` permissions in production.
- Check SMTP config to avoid logging sensitive tokens in production.
- `helmet` and rate limiting reduce attack surface, but always use additional security layers (TLS, WAF, etc.) in production.

## Documentation, Testing, and CI

- Swagger UI: `GET /docs` and `GET /docs.json` (minimal OpenAPI spec)
- Manual API tests: see `backend/test.http` (for REST Client)
- CI: GitHub Actions workflow in `/.github/workflows` for install and basic checks

## Common Commands

```bash
cd backend
npm install
npm run dev
```

---

**Key files:**
- `backend/src/index.js` — main server entry point
- `backend/src/validators.js` — Zod schemas
- `backend/test.http` — manual test suite

---

**Note:** Brands and categories are managed outside the API (directly in the database). Set their IDs manually when creating items.