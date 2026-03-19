
# Backend Documentation

Last updated: March 19, 2026

## 1) Overview

The backend is an Express 5 API (ES modules) with Supabase/PostgreSQL persistence, JWT auth, refresh-token session management, localization (`en`/`hu`), CSV/PDF exports, and SMTP-based email flows.

Core stack:
- Node.js + Express 5
- Supabase JS client (`users`, `items`, `logs`, `orders_status`, etc.)
- JWT access tokens + DB-backed refresh tokens
- `bcryptjs` for password hashing
- `zod` for request validation
- `helmet`, rate limiting, and payload sanitization
- `nodemailer` for password reset/support/admin approval emails
- Swagger UI at `/docs` (minimal generated spec)

## 2) Project structure (backend)

- `src/index.js` — app bootstrap, middleware stack, route mounting, HTTP server, Socket.IO, startup logging
- `src/routes/*` — endpoint definitions and access guards
- `src/controllers/*` — request/response orchestration
- `src/services/*` — data/business logic
- `src/middlewares/*` — auth, language, sanitization, error handling
- `src/utils/*` — i18n, CSV/PDF generators, scrubbing, async wrapper, token hashing
- `src/validators.js` — Zod schemas
- `test.http` — manual API request collection

## 3) Runtime and middleware pipeline

Global middleware in order:
1. CORS (frontend production URL + localhost:4200, credentials enabled)
2. JSON body parser
3. Cookie parser
4. `helmet`
5. Global rate limiter (`200` requests / `15 min` / IP)
6. Request sanitizer (`sanitizeMiddleware`)
7. Language resolver (`Accept-Language` → `req.lang`)
8. Response scrubbing middleware
9. Route handlers
10. Centralized `errorHandler`

`trust proxy` is configurable through `TRUST_PROXY`; defaults to `1` in production, otherwise `false`.

## 4) Environment variables

Required:
- `SUPABASE_URL`
- `SUPABASE_KEY`
- `JWT_SECRET`

Common optional:
- `PORT` (default `3000`)
- `NODE_ENV`
- `FRONTEND_URL` (used in links and redirects)
- `BACKEND_URL` (used for one-click admin action email links)
- `TRUST_PROXY`

SMTP / mail:
- `SMTP_HOST`
- `SMTP_PORT` (default `587`)
- `SMTP_SECURE` (`true` / `false`)
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`
- `SUPPORT_EMAIL` (fallback inbox for support form)

If SMTP is not fully configured, email flows fall back to logging to server output where applicable.

## 5) Authentication and session model

### Access token
- Signed JWT (`~1 hour` expiry)
- Includes user id, role, and `jti`
- Sent by client as `Authorization: Bearer <token>`

### Refresh token
- Random opaque token persisted hashed in `refresh_tokens`
- Stored in httpOnly cookie `refresh_token`
- Optional remember cookie: `remember_session=1`
- Rotated on `/auth/refresh`
- Device metadata checks (`ip`, `user_agent`) on refresh
- Max `5` refresh tokens retained per user

### Revocation
- Access token `jti` values can be invalidated via `revoked_tokens`
- Logout and session revoke operations populate revocation entries
- Cleanup runs at startup and hourly

## 6) Role model

Supported roles:
- `admin`
- `worker`

Admin-specific behavior:
- New `admin` registrations are created with `admin_approved=false`
- First ever admin auto-approves if no approved admin exists
- Approved admins can approve/reject pending admin accounts
- One-click approval/rejection links are signed JWT action tokens

## 7) API endpoints

Base URL (local): `http://localhost:3000`

### Health and meta
- `GET /` — API metadata summary
- `GET /health` — liveness + DB reachability info
- `GET /health/ready` — readiness probe

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh` (rate-limited)
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `GET /auth/tokens` (auth)
- `DELETE /auth/tokens/:id` (auth)

Admin auth/session endpoints:
- `GET /auth/admin/sessions` (admin)
- `GET /auth/admin/audit` (admin)
- `DELETE /auth/admin/revoked/cleanup` (admin)
- `GET /auth/admin/pending-admins` (admin)
- `POST /auth/admin/pending-admins/:id/approve` (admin)
- `POST /auth/admin/pending-admins/:id/reject` (admin)
- `GET /auth/admin/pending-admins/:id/approve/oneclick?token=...`
- `GET /auth/admin/pending-admins/:id/reject/oneclick?token=...`

### Users
- `GET /users/me` (auth)
- `PATCH /users/me` (auth)
- `PATCH /users/me/password` (auth)
- `GET /users/workers` (admin)

Avatar endpoints:
- `POST /users/me/avatar` (multipart `avatar`, max 2MB, image only)
- `GET /users/me/avatar`
- `DELETE /users/me/avatar`
- `GET /users/:id/avatar` (restricted: user can access own id only)

### Items / inventory
- `GET /items` (auth)
- `GET /items/categories` (auth)
- `GET /items/brands` (auth)
- `POST /items` (admin)
- `PATCH /items/:id` (admin)
- `DELETE /items/:id` (admin)

### Customers
- `GET /customers` (auth)
- `POST /customers` (admin)

### Orders
- `GET /orders` (auth; non-admin only assigned orders)
- `POST /orders` (admin)
- `PATCH /orders/:id/status` (admin)
- `PATCH /orders/:id/assign` (admin)
- `DELETE /orders/:id` (admin)
- `GET /orders/export?status=all|pending|processing|completed|cancelled&format=csv|pdf` (admin)

### Analytics and dashboard
- `GET /analytics?period=7days|30days|90days` (auth)
- `GET /analytics/export?period=...&format=csv|pdf` (admin)
- `GET /dashboard` (auth)

### Support
- `POST /support/contact` (public; strict rate-limit 5 requests / 15 min / IP)

### Docs
- `GET /docs`
- `GET /docs.json`

## 8) Validation and localization

Request payloads are validated with `zod` in controllers (`register`, `login`, `createItem`, `createOrder`, password reset, etc.).

Localization:
- Backend uses `Accept-Language` (`en` fallback)
- Translation dictionary in `src/utils/i18n.util.js`
- Validation errors are mapped to localized user-facing text

## 9) Data model assumptions

The backend currently expects at least these tables:
- `users`
- `items`
- `categories`
- `brands`
- `customers`
- `logs`
- `orders_status`
- `refresh_tokens`
- `revoked_tokens`
- `password_resets`
- `audit_logs`

Note: brands/categories are read-only via API and managed directly in DB.

## 10) Reporting and exports

- Orders export: CSV or PDF from order list and status filters
- Analytics export: CSV or PDF sales report for selected period
- PDF generation uses `pdfkit`
- CSV generation uses shared utility (`csv.util.js`)

## 11) Security notes

- Keep `JWT_SECRET` strong and private
- Use service-role credentials responsibly (`SUPABASE_KEY`)
- Set `TRUST_PROXY=1` behind reverse proxies (Render, etc.)
- Prefer HTTPS in production for secure cookies (`sameSite='none'` in prod)
- Monitor logs if SMTP is intentionally disabled (reset/support messages may be logged)

## 12) Run and test

```bash
cd backend
npm install
npm run dev
```

Manual API smoke tests:
- `backend/test.http`

## 13) Deployment snapshot (Render)

Current repo includes a `render.yaml` defining:
- Node web service for backend (`rootDir: backend`)
- Static frontend service (`rootDir: frontend`)

Backend production config should include at minimum:
- `NODE_ENV=production`
- `TRUST_PROXY=1`
- Supabase/JWT/SMTP values as applicable