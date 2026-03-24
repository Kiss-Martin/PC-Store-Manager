# Backend Documentation

Last updated: March 24, 2026

## 1) Overview

The backend is an Express 5 API (ES modules) with Supabase/PostgreSQL persistence, JWT authentication, refresh-token session management, bilingual localization (`en`/`hu`), CSV/PDF exports, avatar file uploads, and SMTP-based email flows.

Core stack:

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js + Express 5 (ES modules) |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` |
| Auth | JWT access tokens + DB-backed refresh tokens (httpOnly cookie) |
| Password hashing | `bcryptjs` |
| Validation | `zod` schemas |
| Security | `helmet`, `express-rate-limit`, custom payload sanitization |
| Email | `nodemailer` (password reset, support forms, admin approval emails) |
| File uploads | `multer` (avatar images, stored on disk) |
| PDF generation | `pdfkit` |
| Realtime | `socket.io` (initialized, not actively used yet) |
| API docs | `swagger-ui-express` + `swagger-jsdoc` (minimal spec at `/docs`) |

## 2) Project structure

```
backend/
├── src/
│   ├── index.js                   # App bootstrap, middleware stack, route mounting, server start
│   ├── db.js                      # Supabase client singleton
│   ├── validators.js              # Zod schemas for request validation
│   ├── controllers/
│   │   ├── analytics.controller.js
│   │   ├── auth.controller.js
│   │   ├── customer.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── health.controller.js
│   │   ├── item.controller.js
│   │   ├── order.controller.js
│   │   ├── support.controller.js
│   │   └── user.controller.js
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification + role guard
│   │   ├── error.middleware.js     # Centralized error handler
│   │   ├── language.middleware.js  # Accept-Language → req.lang
│   │   └── sanitize.middleware.js  # HTML-encodes angle brackets, strips null bytes
│   ├── routes/
│   │   ├── analytics.routes.js
│   │   ├── auth.routes.js
│   │   ├── customer.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── health.routes.js
│   │   ├── item.routes.js
│   │   ├── order.routes.js
│   │   ├── support.routes.js
│   │   └── user.routes.js
│   ├── services/
│   │   ├── analytics.service.js
│   │   ├── auth.service.js
│   │   ├── customer.service.js
│   │   ├── item.service.js
│   │   ├── order.service.js
│   │   └── user.service.js
│   └── utils/
│       ├── async.util.js           # asyncWrap helper for Express 5
│       ├── constants.js
│       ├── csv.util.js             # CSV report generation
│       ├── email.template.js       # HTML email templates
│       ├── i18n.util.js            # Backend translation dictionary (en/hu)
│       ├── pdf.util.js             # PDFKit report generation
│       ├── scrub.util.js           # Response scrubbing middleware
│       ├── supabase.util.js        # Supabase query wrapper
│       └── token.util.js           # HMAC-SHA256 token hashing, JTI generation
├── uploads/
│   └── avatars/                    # User avatar images (per-user file naming)
├── scripts/                        # Utility/dev scripts (migrations, JWT generation, etc.)
├── test.http                       # Manual HTTP request collection (VS Code REST Client)
└── package.json
```

## 3) Middleware pipeline

Global middleware is applied in this order:

1. **CORS** — Allows `https://pc-store-manager-frontend.onrender.com` and `http://localhost:4200`, credentials enabled
2. **JSON body parser** — `express.json()`
3. **Cookie parser** — `cookie-parser`
4. **Helmet** — Security headers (cross-origin resource/opener policies relaxed for API use)
5. **Global rate limiter** — `200` requests / `15 min` / IP
6. **Sanitization** — HTML-encodes `<` and `>` in request body strings, strips null bytes. Does **not** strip `$` or `;` (legitimate in product specs, prices, etc.)
7. **Language resolver** — Reads `Accept-Language` header → sets `req.lang` (`en` fallback)
8. **Response scrubbing** — Removes sensitive fields from outgoing JSON
9. **Route handlers**
10. **Centralized error handler** — Catches unhandled errors and returns consistent JSON error responses

`trust proxy` is configurable via the `TRUST_PROXY` env var; defaults to `1` in production, `false` otherwise.

## 4) Environment variables

### Required

| Variable | Purpose |
|----------|---------|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service-role key |
| `JWT_SECRET` | Secret for signing JWTs. **Must not be the default** in production (server exits on startup if detected) |

### Optional

| Variable | Default | Purpose |
|----------|---------|---------|
| `PORT` | `3000` | Server listen port |
| `NODE_ENV` | `development` | Controls trust proxy default, cookie security, and secret enforcement |
| `FRONTEND_URL` | — | Used in email links and redirects |
| `BACKEND_URL` | — | Used in one-click admin action email links |
| `TRUST_PROXY` | `1` in prod, `false` in dev | Express trust proxy setting (numeric, boolean, and string values accepted) |

### SMTP / Email

| Variable | Default | Purpose |
|----------|---------|---------|
| `SMTP_HOST` | — | Mail server host |
| `SMTP_PORT` | `587` | Mail server port |
| `SMTP_SECURE` | `false` | Use TLS |
| `SMTP_USER` | — | SMTP auth username |
| `SMTP_PASS` | — | SMTP auth password |
| `SMTP_FROM` | — | Sender address |
| `SUPPORT_EMAIL` | — | Fallback inbox for support form submissions |

If SMTP is not fully configured, email flows fall back to logging the message content to the server console.

## 5) Authentication and session model

### Access token

- Signed JWT with `~1 hour` expiry
- Payload includes user `id`, `role`, and unique `jti` (JWT ID)
- Sent by client as `Authorization: Bearer <token>`

### Refresh token

- Random opaque token, persisted **hashed** (HMAC-SHA256) in the `refresh_tokens` table
- Delivered to the client in an httpOnly cookie (`refresh_token`)
- Optional "remember me" cookie: `remember_session=1`
- **Rotated** on every `/auth/refresh` call (old token invalidated, new one issued)
- Device metadata (`ip`, `user_agent`) is checked on refresh for anomaly detection
- Maximum **5** refresh tokens retained per user (oldest are pruned)

### Token revocation

- Access token `jti` values can be added to `revoked_tokens` for immediate invalidation
- Logout and session-revoke operations populate revocation entries
- Expired revocation entries are cleaned up at startup and then every hour via scheduled task

## 6) Role model

Supported roles: **`admin`** and **`worker`**

Admin-specific behavior:

- New `admin` registrations are created with `admin_approved = false`
- The very first admin is auto-approved if no approved admin exists in the database
- Approved admins can approve or reject pending admin accounts
- Approval/rejection emails include one-click action links (signed JWT action tokens)

## 7) API endpoints

Base URL (local): `http://localhost:3000`

### Health & meta

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/` | — | API metadata summary |
| `GET` | `/health` | — | Liveness check + DB reachability |
| `GET` | `/health/ready` | — | Readiness probe |

### Auth

| Method | Path | Auth | Rate limit | Notes |
|--------|------|------|------------|-------|
| `POST` | `/auth/register` | — | global | Creates user; admin role requires approval |
| `POST` | `/auth/login` | — | global | Returns access token + sets refresh cookie |
| `POST` | `/auth/refresh` | — | 10/min/IP | Rotates refresh token |
| `POST` | `/auth/logout` | — | global | Revokes refresh token, clears cookie |
| `POST` | `/auth/forgot-password` | — | global | Initiates password reset email |
| `POST` | `/auth/reset-password` | — | global | Completes password reset with token |
| `GET` | `/auth/tokens` | auth | global | List current user's active sessions |
| `DELETE` | `/auth/tokens/:id` | auth | global | Revoke a specific session |

### Auth — Admin

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/auth/admin/sessions` | admin | List all sessions (paginated, filterable by query/email/date) |
| `GET` | `/auth/admin/audit` | admin | Paginated audit log entries |
| `DELETE` | `/auth/admin/revoked/cleanup` | admin | Manual cleanup of expired revoked tokens |
| `GET` | `/auth/admin/pending-admins` | admin | List pending admin registrations |
| `POST` | `/auth/admin/pending-admins/:id/approve` | admin | Approve a pending admin |
| `POST` | `/auth/admin/pending-admins/:id/reject` | admin | Reject and delete a pending admin |
| `GET` | `/auth/admin/pending-admins/:id/approve/oneclick?token=` | — | One-click approval via email link |
| `GET` | `/auth/admin/pending-admins/:id/reject/oneclick?token=` | — | One-click rejection via email link |

### Users

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/users/me` | auth | Current user profile |
| `PATCH` | `/users/me` | auth | Update profile (email, username, fullname) |
| `PATCH` | `/users/me/password` | auth | Change password |
| `GET` | `/users/workers` | admin | List all worker accounts |

### Avatars

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/users/me/avatar` | auth | Upload avatar (multipart `avatar` field, max 2 MB, images only). Old files with different extensions are automatically cleaned up |
| `GET` | `/users/me/avatar` | auth | Serve current user's avatar. Returns `Cache-Control: no-cache, no-store, must-revalidate` |
| `DELETE` | `/users/me/avatar` | auth | Delete current user's avatar |
| `GET` | `/users/:id/avatar` | auth | Serve another user's avatar (owner or admin only) |

### Items / Inventory

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/items` | auth | List all items |
| `GET` | `/items/categories` | auth | List categories |
| `GET` | `/items/brands` | auth | List brands |
| `POST` | `/items` | admin | Create item |
| `PATCH` | `/items/:id` | admin | Update item |
| `DELETE` | `/items/:id` | admin | Delete item |

### Customers

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/customers` | auth | List all customers |
| `POST` | `/customers` | admin | Create customer |

### Orders

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/orders` | auth | List orders (non-admin sees only assigned orders) |
| `POST` | `/orders` | admin | Create order |
| `PATCH` | `/orders/:id/status` | admin | Update order status |
| `PATCH` | `/orders/:id/assign` | admin | Assign order to worker |
| `DELETE` | `/orders/:id` | admin | Delete order |
| `GET` | `/orders/export` | admin | Export orders (`?status=all\|pending\|…&format=csv\|pdf`) |

### Analytics & Dashboard

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `GET` | `/analytics` | auth | Analytics data (`?period=7days\|30days\|90days`) |
| `GET` | `/analytics/export` | admin | Export analytics report (`?period=…&format=csv\|pdf`) |
| `GET` | `/dashboard` | auth | Dashboard summary (stats + recent activity) |

### Support

| Method | Path | Auth | Notes |
|--------|------|------|-------|
| `POST` | `/support/contact` | — | Contact form submission. Rate-limited: **5 req / 15 min / IP** |

### API Docs

| Method | Path | Notes |
|--------|------|-------|
| `GET` | `/docs` | Swagger UI |
| `GET` | `/docs.json` | OpenAPI JSON spec |

## 8) Validation and localization

Request payloads are validated with **Zod** schemas in controllers (register, login, createItem, createOrder, password change, etc.). Invalid payloads return `400` with structured error details.

**Localization:**

- Backend reads `Accept-Language` header (`en` fallback)
- Translation dictionary in `src/utils/i18n.util.js` provides `en` and `hu` strings
- Validation and error messages are mapped to localized user-facing text

## 9) Data model (Supabase tables)

| Table | Purpose |
|-------|---------|
| `users` | User accounts (email, username, fullname, role, password hash, approval status) |
| `items` | Product inventory |
| `categories` | Product categories (managed directly in DB, read-only via API) |
| `brands` | Product brands (managed directly in DB, read-only via API) |
| `customers` | Customer records |
| `orders_status` | Orders with status tracking |
| `logs` | Activity/event logs |
| `refresh_tokens` | Hashed refresh tokens with device metadata |
| `revoked_tokens` | Revoked JWT `jti` entries (with expiry for automatic cleanup) |
| `password_resets` | Password reset tokens |
| `audit_logs` | Admin audit trail entries |

## 10) Reporting and exports

- **Orders export:** CSV or PDF filtered by status (`all`, `pending`, `processing`, `completed`, `cancelled`)
- **Analytics export:** CSV or PDF sales report for a selected period (`7days`, `30days`, `90days`)
- PDF generation uses `pdfkit`
- CSV generation uses the shared utility in `src/utils/csv.util.js`

## 11) Security notes

- **JWT_SECRET** must be strong and kept private. The server will refuse to start if it detects the default placeholder secret in production.
- Use Supabase service-role credentials responsibly (`SUPABASE_KEY`).
- Set `TRUST_PROXY=1` when running behind a reverse proxy (Render, nginx, etc.).
- Prefer HTTPS in production for secure cookie delivery (`sameSite='none'` in prod).
- Sanitization middleware HTML-encodes `<` and `>` in request bodies. It does **not** strip `$` or `;` which are legitimate in product data.
- Monitor server logs if SMTP is intentionally disabled — reset links and support messages will be logged instead of emailed.

## 12) Run and test

```bash
cd backend
npm install
npm run dev    # starts with --watch for auto-reload
```

Production:

```bash
npm start
```

Manual API smoke tests are available in `backend/test.http` (VS Code REST Client format).

## 13) Deployment (Render)

The repository includes `render.yaml` defining:

- **Web service** for the backend (`rootDir: backend`)
- **Static site** for the frontend (`rootDir: frontend`)

Backend production environment should include at minimum:

- `NODE_ENV=production`
- `TRUST_PROXY=1`
- `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`
- SMTP variables if email flows are needed
