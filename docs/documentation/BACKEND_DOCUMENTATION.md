# Backend Documentation

Last updated: March 31, 2026

---

## 1. Overview

The backend is an **Express 5** REST API (ES modules) backed by **Supabase (PostgreSQL)**. It provides JWT-based authentication with refresh-token session management, role-based access control (`admin` / `worker` / `buyer`), bilingual localization (`en` / `hu`), CSV/PDF exports, avatar file uploads, SMTP email flows, real-time WebSocket notifications, and a centralized audit trail.

### Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js + Express 5 (ES modules) |
| Database | Supabase (PostgreSQL) via `@supabase/supabase-js` v2 |
| Auth | JWT access tokens (1 h) + DB-backed refresh tokens (httpOnly cookie) |
| Password hashing | `bcryptjs` (cost factor 12) |
| Validation | `zod` schemas |
| Security | `helmet`, `express-rate-limit`, custom HTML-encode sanitization, response scrubbing |
| Email | `nodemailer` — password reset, registration confirmation, admin approval, order notifications, support forms |
| File uploads | `multer` — avatar images stored on disk (`uploads/avatars/`) |
| PDF generation | `pdfkit` (A4 landscape, styled tables) |
| CSV generation | Custom utility with BOM and proper escaping |
| Real-time | `socket.io` — worker order assignment notifications |
| API docs | `swagger-ui-express` + `swagger-jsdoc` (minimal spec at `/docs`) |

---

## 2. Project Structure

```
backend/
├── src/
│   ├── index.js                    # App bootstrap, middleware stack, route mounting, Socket.io, server start
│   ├── db.js                       # Supabase client singleton
│   ├── validators.js               # Zod schemas for request validation
│   ├── controllers/
│   │   ├── analytics.controller.js # getAnalytics, exportAnalytics
│   │   ├── auth.controller.js      # register, login, refresh, logout, forgotPassword, resetPassword,
│   │   │                           #   listTokens, revokeToken, listAllSessions, listPendingAdmins,
│   │   │                           #   approveAdmin, rejectAdmin, approveAdminOneClick, rejectAdminOneClick,
│   │   │                           #   listAuditLogs, cleanupRevoked
│   │   ├── customer.controller.js  # getCustomers, createCustomer
│   │   ├── dashboard.controller.js # getDashboard
│   │   ├── health.controller.js    # healthCheck, healthReady
│   │   ├── item.controller.js      # getItems, createItem, updateItem, deleteItem, getCategories, getBrands
│   │   ├── order.controller.js     # getOrders, createOrder, updateOrderStatus, assignOrder, deleteOrder, exportOrders
│   │   ├── support.controller.js   # sendSupportEmail
│   │   └── user.controller.js      # getWorkers, getProfile, updateProfile, changePassword, deleteProfile,
│   │                               #   uploadAvatar, getMyAvatar, getAvatarById, deleteAvatar
│   ├── middlewares/
│   │   ├── auth.middleware.js      # JWT verification + jti revocation check + requireRole()
│   │   ├── error.middleware.js     # Centralized error handler (JSON responses)
│   │   ├── language.middleware.js  # Accept-Language → req.lang
│   │   └── sanitize.middleware.js  # HTML-encodes dangerous characters, strips null bytes
│   ├── routes/
│   │   ├── analytics.routes.js
│   │   ├── auth.routes.js          # Includes per-endpoint rate limiters
│   │   ├── customer.routes.js
│   │   ├── dashboard.routes.js
│   │   ├── health.routes.js
│   │   ├── item.routes.js
│   │   ├── order.routes.js
│   │   ├── support.routes.js       # Includes strict per-endpoint rate limiter (5 req/15 min)
│   │   └── user.routes.js          # Includes multer upload middleware
│   ├── services/
│   │   ├── analytics.service.js    # Revenue calculation, chart data, period comparison, CSV/PDF export
│   │   ├── auth.service.js         # Register, login, refresh, revoke, forgot/reset password, admin email flows
│   │   ├── customer.service.js     # Customer CRUD
│   │   ├── item.service.js         # Item CRUD, category/brand listing, stock logging
│   │   ├── order.service.js        # Order CRUD, status management, stock restoration, worker notification, Socket.io
│   │   └── user.service.js         # Profile CRUD, password change, account deletion with cascade cleanup
│   └── utils/
│       ├── async.util.js           # asyncWrap — wraps async handlers for Express error forwarding
│       ├── audit.util.js           # writeAuditLog — centralized audit log insertion (fire-and-forget)
│       ├── config.js               # Centralized env config: JWT_SECRET, FRONTEND_URL, BACKEND_URL, PORT, CORS_ORIGINS
│       ├── constants.js            # ORDER_STATUSES: ['pending', 'processing', 'completed', 'cancelled']
│       ├── csv.util.js             # escapeCsvValue, generateCsvFromObjects (BOM-prefixed)
│       ├── email.template.js       # HTML/text email renderers: admin notification, registration, approval,
│       │                           #   password reset, support contact, new order notification
│       ├── i18n.util.js            # Translation dictionary (en/hu), t(), localizeValidationErrors()
│       ├── mail.util.js            # Shared nodemailer transporter singleton, SMTP config, SUPPORT_INBOX
│       ├── pdf.util.js             # generatePdfReport — pdfkit A4 landscape with styled tables
│       ├── scrub.util.js           # scrubSensitive + scrubResponseMiddleware — strips password_hash, password, supabaseKey
│       ├── socket.util.js          # setIO / getIO — shared Socket.io instance holder
│       ├── supabase.util.js        # run() — Supabase query wrapper with error extraction (preserves Postgres error codes)
│       └── token.util.js           # hashToken — HMAC-SHA256 token hashing
├── uploads/
│   └── avatars/                    # User avatar images ({userId}.{ext})
├── scripts/                        # Dev utility scripts (migrations, JWT generation, password reset testing)
├── tests/                          # Jest test files
├── test.http                       # Manual HTTP request collection (VS Code REST Client)
└── package.json
```

---

## 3. Middleware Pipeline

Global middleware is applied in the following order in `index.js`:

| Order | Middleware | Purpose |
|---|---|---|
| 1 | **CORS** | Origins: `CORS_ORIGINS` env var (comma-separated) or defaults to `pc-store-manager-frontend.onrender.com` + `localhost:4200`. Credentials enabled. Methods: `GET, POST, PUT, PATCH, DELETE, OPTIONS`. |
| 2 | **JSON body parser** | `express.json({ limit: '100kb' })` |
| 3 | **Cookie parser** | `cookie-parser` — parses httpOnly refresh token cookie |
| 4 | **Helmet** | Security headers. `crossOriginResourcePolicy: 'cross-origin'`, `crossOriginOpenerPolicy: 'unsafe-none'` |
| 5 | **Global rate limiter** | 200 requests / 15 min / IP. Standard headers, no legacy headers. |
| 6 | **Sanitization** | HTML-encodes `& < > " '` in all request body string values. Strips null bytes. Does **not** strip `$` or `;` (legitimate in product data). |
| 7 | **Language resolver** | Reads `Accept-Language` header → sets `req.lang` (defaults to `en`) |
| 8 | **Response scrubbing** | Intercepts `res.json()` to remove `password_hash`, `password`, and `supabaseKey` from all outgoing responses |
| 9 | **Route handlers** | See §7 |
| 10 | **Centralized error handler** | Catches unhandled errors; returns `{ error, field? }` with appropriate HTTP status. Logs stack traces for 5xx only. |

### Trust Proxy

Configurable via `TRUST_PROXY` env var. Accepts `false`, `true`, or a numeric hop count. Defaults to `1` in production, `false` in development.

---

## 4. Environment Variables

### Required

| Variable | Purpose |
|---|---|
| `SUPABASE_URL` | Supabase project URL |
| `SUPABASE_KEY` | Supabase service-role key |
| `JWT_SECRET` | Secret for signing JWTs. **Must not be the default** in production — server exits on startup if detected. |

### Optional

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `3000` | Server listen port |
| `NODE_ENV` | `development` | Controls trust proxy default, cookie security (`secure`, `sameSite`), and secret enforcement |
| `FRONTEND_URL` | `http://localhost:4200` | Used in email links (reset password, registration, approval) and admin action redirects |
| `BACKEND_URL` | `http://localhost:{PORT}` | Used in one-click admin approval/rejection email links |
| `CORS_ORIGINS` | `pc-store-manager-frontend.onrender.com, localhost:4200` | Comma-separated allowed origins |
| `TRUST_PROXY` | `1` (prod) / `false` (dev) | Express trust proxy setting |
| `REFRESH_TOKEN_SECRET` | Falls back to `JWT_SECRET` | Separate secret for HMAC-hashing refresh tokens |

### SMTP / Email

| Variable | Default | Purpose |
|---|---|---|
| `SMTP_HOST` | — | Mail server host |
| `SMTP_PORT` | `587` | Mail server port |
| `SMTP_SECURE` | `false` | Use TLS (`true` for port 465) |
| `SMTP_USER` | — | SMTP auth username |
| `SMTP_PASS` | — | SMTP auth password |
| `SMTP_FROM` | `noreply@pcstore.local` | Sender address for all outgoing emails |
| `SUPPORT_EMAIL` | Falls back to `SMTP_FROM` or `pcstorenoreply4@gmail.com` | Inbox for support form submissions |

If SMTP is not fully configured (missing `host`, `user`, or `pass`), all email flows gracefully fall back to logging message content to the server console. Startup banner displays SMTP status.

---

## 5. Authentication & Session Model

### Access Token

- **Type:** Signed JWT
- **Expiry:** 1 hour
- **Payload:** `{ id, role, jti }` — user ID, role, and unique JWT ID
- **Delivery:** Client sends as `Authorization: Bearer <token>`
- **Revocation:** The `jti` can be inserted into the `revoked_tokens` table for immediate invalidation; the `authMiddleware` checks this on every request

### Refresh Token

- **Type:** Random opaque string (48 bytes hex)
- **Storage:** Hashed (HMAC-SHA256) in the `refresh_tokens` table
- **Delivery:** httpOnly cookie named `refresh_token`
- **"Remember me":** Additional cookie `remember_session=1` with matching expiry
- **Cookie settings:** `httpOnly: true`, `secure: true` (production), `sameSite: none` (production) / `lax` (development)
- **Rotation:** On every `/auth/refresh` call, the old token is deleted and a new one is issued
- **Metadata binding:** IP address and user-agent are recorded; mismatches on refresh cause token invalidation
- **Per-user cap:** Maximum 5 refresh tokens per user; oldest are pruned on new token creation

### Revocation Flow

1. On logout: refresh token deleted, associated access token `jti` added to `revoked_tokens`
2. On session revoke (user or admin): same behavior
3. `revoked_tokens` entries include an `expires_at` timestamp
4. Cleanup runs once at startup, then every hour via `setInterval`
5. Admin can trigger manual cleanup via `DELETE /auth/admin/revoked/cleanup`

---

## 6. Role Model

Three roles: **`admin`**, **`worker`**, **`buyer`**

### Admin

- New admin registrations are created with `admin_approved = false`
- The very first admin is auto-approved if no approved admin exists
- Existing approved admins are notified by email with one-click approve/reject links (signed JWT action tokens with `jti`, 7-day expiry, single-use)
- Approved admin users receive email notification
- Full access to all API endpoints

### Worker

- Auto-approved on registration
- Can view items, orders (filtered by `assigned_to`), and analytics
- Cannot create/update/delete items or manage admin features
- Receives real-time WebSocket notifications when assigned an order
- Receives email notifications when a new order is placed

### Buyer

- Auto-approved on registration
- Can view products (read-only)
- Can create orders (auto-creates customer record from user profile if needed)
- Can view own orders only (`user_id` filter)
- Can cancel own pending/processing orders (`cancelled` status only)
- Can export own orders (CSV/PDF)
- Cannot access analytics export, worker assignment, or admin features

### `requireRole()` Middleware

Accepts one or more role strings via rest parameters. Example: `requireRole('admin', 'buyer')` allows both roles. Returns `403` with localized error message if role check fails.

---

## 7. API Endpoints

Base URL (local): `http://localhost:3000`

### Health & Meta

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | API metadata and available endpoints |
| `GET` | `/health` | — | Liveness check — verifies Supabase reachability |
| `GET` | `/health/ready` | — | Readiness probe — fails fast if Supabase is unreachable |
| `GET` | `/docs` | — | Swagger UI |
| `GET` | `/docs.json` | — | OpenAPI JSON spec |

### Auth

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/auth/register` | — | 15/15 min/IP | Create user. Admin role requires approval. |
| `POST` | `/auth/login` | — | 15/15 min/IP | Login with email or username + password. |
| `POST` | `/auth/refresh` | — | 10/1 min/IP | Rotate refresh token. |
| `POST` | `/auth/logout` | — | global | Revoke refresh token, clear cookies. |
| `POST` | `/auth/forgot-password` | — | 15/15 min/IP | Initiate password reset email. |
| `POST` | `/auth/reset-password` | — | global | Complete password reset with token. |
| `GET` | `/auth/tokens` | auth | global | List current user's active sessions. |
| `DELETE` | `/auth/tokens/:id` | auth | global | Revoke a specific session. |

### Auth — Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/auth/admin/sessions` | admin | Paginated session list. Query: `?page=&limit=&q=&email=&start=&end=` |
| `GET` | `/auth/admin/audit` | admin | Paginated audit logs. Query: `?page=&limit=` |
| `DELETE` | `/auth/admin/revoked/cleanup` | admin | Manual cleanup of expired revoked tokens. |
| `GET` | `/auth/admin/pending-admins` | admin | List pending (unapproved) admin registrations. |
| `POST` | `/auth/admin/pending-admins/:id/approve` | admin | Approve a pending admin. |
| `POST` | `/auth/admin/pending-admins/:id/reject` | admin | Reject and delete a pending admin. |
| `GET` | `/auth/admin/pending-admins/:id/approve/oneclick` | — | One-click approval via email link (`?token=`). Redirects to frontend. |
| `GET` | `/auth/admin/pending-admins/:id/reject/oneclick` | — | One-click rejection via email link (`?token=`). Redirects to frontend. |

### Users & Avatars

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/users/workers` | admin | List all admin and worker accounts. |
| `GET` | `/users/me` | auth | Get current user profile. |
| `PATCH` | `/users/me` | auth | Update profile (`email`, `username`, `fullname`). |
| `PATCH` | `/users/me/password` | auth | Change password (`currentPassword`, `newPassword`). |
| `DELETE` | `/users/me` | auth | Delete own account (cascades tokens, logs, avatar). |
| `POST` | `/users/me/avatar` | auth | Upload avatar. Multipart `avatar` field. Max 2 MB. jpeg/png/webp/gif. |
| `GET` | `/users/me/avatar` | auth | Serve own avatar binary. `Cache-Control: no-cache` |
| `DELETE` | `/users/me/avatar` | auth | Delete own avatar file(s). |
| `GET` | `/users/:id/avatar` | auth | Serve another user's avatar (owner or admin only). |

### Items / Inventory

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/items` | auth | List all items (with joined category and brand names). |
| `GET` | `/items/categories` | auth | List all categories. |
| `GET` | `/items/brands` | auth | List all brands. |
| `POST` | `/items` | admin | Create item. Logs `stock_in` action. |
| `PATCH` | `/items/:id` | admin | Update item fields. |
| `DELETE` | `/items/:id` | admin | Delete item. Nullifies referencing log entries. |

### Customers

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/customers` | auth | List all customers. |
| `POST` | `/customers` | admin, buyer | Create customer. |

### Orders

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/orders` | auth | List orders. Admin: all. Worker: assigned. Buyer: own. |
| `POST` | `/orders` | admin, buyer | Create order. Validates stock. Emails all workers. |
| `PATCH` | `/orders/:id/status` | admin, buyer | Update status. Buyer: `cancelled` only for own orders. |
| `PATCH` | `/orders/:id/assign` | admin | Assign order to worker. Emits `order:assigned` WebSocket event. |
| `DELETE` | `/orders/:id` | admin | Delete order. Restores stock if completed/processing. |
| `GET` | `/orders/export` | admin, buyer | Export orders. Query: `?status=all\|pending\|…&format=csv\|pdf` |

### Analytics & Dashboard

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/analytics` | auth | Analytics summary. Query: `?period=7days\|30days\|90days` |
| `GET` | `/analytics/export` | admin | Export analytics report. Query: `?period=&format=csv\|pdf` |
| `GET` | `/dashboard` | auth | Dashboard: stats + recent activity (7-day period). |

### Support

| Method | Path | Auth | Rate Limit | Description |
|---|---|---|---|---|
| `POST` | `/support/contact` | — | 5/15 min/IP | Contact form. Body: `{ name?, email?, message }` |

---

## 8. Request / Response Examples

### Register

```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "SecureP@ss1",
  "fullname": "John Doe",
  "role": "worker"
}
```

**Success (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "fullname": "John Doe",
    "role": "worker",
    "admin_approved": true
  },
  "accessToken": "eyJhbGci...",
  "requiresApproval": false,
  "message": null
}
```

**Admin requiring approval (200):**
```json
{
  "user": { "id": "uuid", "role": "admin", "admin_approved": false },
  "accessToken": null,
  "requiresApproval": true,
  "message": "Admin account created and waiting for approval."
}
```

**Validation error (400):**
```json
{
  "error": [
    "Password must contain at least one uppercase letter",
    "Password must contain at least one special character"
  ]
}
```

**Duplicate (409):**
```json
{
  "error": "An account with this email address already exists.",
  "field": "email"
}
```

### Login

```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecureP@ss1",
  "rememberMe": true
}
```

**Success (200):**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "fullname": "John Doe",
    "role": "worker"
  },
  "accessToken": "eyJhbGci..."
}
```

Response also sets httpOnly cookies: `refresh_token` and `remember_session`.

### Create Order

```http
POST /orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "item_id": "uuid",
  "customer_id": "uuid",
  "quantity": 2,
  "status": "pending"
}
```

**Success (200):**
```json
{
  "success": true,
  "order": {
    "id": "uuid",
    "orderNumber": "#123456",
    "product": "Intel Core i7-12700K",
    "quantity": 2,
    "totalAmount": 799.98,
    "status": "pending"
  }
}
```

### Standard Error Format

```json
{
  "error": "Human-readable localized error message",
  "field": "fieldName"
}
```

The `field` property is present only for field-level validation/conflict errors (e.g., duplicate email).

---

## 9. Validation Schemas

Request payloads are validated using **Zod** schemas defined in `validators.js`. Validation runs in controllers before service calls.

| Schema | Fields | Notes |
|---|---|---|
| `registerSchema` | `email` (valid email), `username` (3–32, `[a-zA-Z0-9_.-]`), `password` (strong), `fullname?` (max 128), `role?` (`admin`\|`worker`) | Strong password: ≥8 chars, uppercase, lowercase, digit, special char |
| `loginSchema` | `email?`, `username?`, `password` (min 1), `rememberMe?` | Requires either `email` or `username` (Zod refine) |
| `changePasswordSchema` | `currentPassword` (min 1), `newPassword` (strong) | |
| `createItemSchema` | `name` (min 1), `price` (≥0), `category_id`, `brand_id`, `amount?` (int ≥0), `model?`, `warranty?` | |
| `updateItemSchema` | Same as create but all optional; `category_id` and `brand_id` nullable | |
| `createOrderSchema` | `item_id`, `customer_id?`, `quantity` (int, positive), `status?` | |
| `forgotPasswordSchema` | `email` (valid email) | |
| `resetPasswordSchema` | `token` (min 1), `newPassword` (strong) | |
| `createCustomerSchema` | `name` (min 1), `email?` (email or empty string), `phone?` (max 30 or empty string) | |

Validation errors are localized via `localizeValidationErrors()` which maps Zod issue codes to `en`/`hu` translation keys.

---

## 10. Data Model (Supabase Tables)

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id`, `email`, `username`, `fullname`, `password_hash`, `role`, `admin_approved`, `admin_approved_by`, `admin_approved_at` | User accounts |
| `items` | `id`, `name`, `model`, `price`, `amount`, `warranty`, `category_id` (FK → categories), `brand_id` (FK → brands), `date_added` | Product inventory |
| `categories` | `id`, `name` | Product categories (read-only via API) |
| `brands` | `id`, `name` | Product brands (read-only via API) |
| `customers` | `id`, `name`, `email`, `phone` | Customer records |
| `logs` | `id`, `item_id` (FK → items), `customer_id` (FK → customers), `user_id` (FK → users), `assigned_to` (FK → users), `action`, `details`, `timestamp` | Activity logs. Orders = `action: 'stock_out'` |
| `orders_status` | `id`, `log_id` (FK → logs), `status`, `updated_by` (FK → users), `updated_at` | Order status tracking |
| `refresh_tokens` | `id`, `user_id` (FK → users), `token_hash`, `expires_at`, `ip`, `user_agent`, `access_jti`, `created_at` | Active refresh tokens |
| `revoked_tokens` | `id`, `jti`, `reason`, `expires_at` | Revoked JWT IDs for immediate invalidation |
| `password_resets` | `id`, `user_id` (FK → users), `token_hash`, `expires_at` | Password reset tokens (1 hour expiry) |
| `audit_logs` | `id`, `event_type`, `actor_user_id`, `target_user_id`, `details` (JSONB), `created_at` | Admin audit trail |

> **Note:** Orders are stored as `logs` entries with `action='stock_out'`. Quantity and order number are embedded in the `details` string (e.g., `"Sold 2 units - Order #123456"`) and parsed via regex at read time.

---

## 11. Email Flows

All emails use bilingual HTML + plain text templates from `email.template.js`. If SMTP is not configured, content is logged to the server console.

| Trigger | Recipients | Template |
|---|---|---|
| User registration (non-admin) | New user | `renderRegistrationConfirmation` — welcome + dashboard link |
| Admin registration (awaiting approval) | New admin | `renderRegistrationConfirmation` — awaiting approval notice |
| Admin registration (notify reviewers) | All approved admins | `renderAdminNotification` — one-click approve/reject links |
| Admin approved | Approved user | `renderApprovalNotification` — login link |
| Password reset request | User | `renderPasswordReset` — reset link (1 hour expiry) |
| Support contact form | `SUPPORT_INBOX` | `renderSupportContact` — name, email, message |
| New order placed | All workers | `renderNewOrderNotification` — order number, product, quantity, total, customer, status |

---

## 12. Real-Time (Socket.io)

The server creates a Socket.io instance attached to the HTTP server, sharing the same CORS configuration.

| Event | Direction | Description |
|---|---|---|
| `join` | Client → Server | Client sends `userId` to join room `user:{userId}` |
| `order:assigned` | Server → Client | Emitted to assigned worker's room. Payload: `{ orderId, product, details }` |

---

## 13. Reporting & Exports

### Orders Export (`GET /orders/export`)

- **Formats:** CSV (UTF-8 with BOM) or PDF (A4 landscape)
- **Filter:** `?status=all|pending|processing|completed|cancelled`
- **Columns:** Order ID, Order Number, Product, Quantity, Unit Price, Total Amount, Status, Customer, Date
- **PDF summary:** Status filter, order count, total revenue
- **Localization:** Column headers and status values translated via `Accept-Language`

### Analytics Export (`GET /analytics/export`)

- **Formats:** CSV or PDF
- **Period:** `?period=7days|30days|90days`
- **Columns:** Date, Product, Brand, Category, Quantity, Unit Price, Total, Order ID
- **PDF summary:** Transaction count, total revenue, average order value, top product

---

## 14. Audit Trail

Events logged to `audit_logs` via `writeAuditLog()` (fire-and-forget — failures never break business logic):

| Event Type | Actor | Target | Trigger |
|---|---|---|---|
| `logout` | Logged-in user | Session owner | `/auth/logout` |
| `revoke_session` | Logged-in user | Token owner | `DELETE /auth/tokens/:id` |
| `view_sessions` | Admin | — | `GET /auth/admin/sessions` |
| `approve_admin` | Admin | Pending admin | `POST .../approve` |
| `reject_admin` | Admin | Pending admin | `POST .../reject` |
| `approve_admin_oneclick` | Approver (from JWT) | Pending admin | Email one-click link |
| `reject_admin_oneclick` | Approver (from JWT) | Pending admin | Email one-click link |

---

## 15. Security

| Concern | Implementation |
|---|---|
| **Secret enforcement** | Server exits in production if `JWT_SECRET` is the default placeholder |
| **Password hashing** | bcrypt cost factor 12 |
| **Token storage** | Refresh tokens stored as HMAC-SHA256 hashes, never in plaintext |
| **Cookie security** | `httpOnly`, `secure` (prod), `sameSite: none` (prod) / `lax` (dev) |
| **Rate limiting** | Global 200/15 min, auth endpoints 15/15 min, support form 5/15 min |
| **Input sanitization** | HTML-encodes `& < > " '`, strips null bytes. Does **not** strip `$` or `;`. |
| **Response scrubbing** | Removes `password_hash`, `password`, `supabaseKey` from JSON output |
| **Refresh token rotation** | New token on every refresh; old one deleted; device metadata checked |
| **JTI revocation** | Access tokens checked against `revoked_tokens` on every authenticated request |
| **Trust proxy** | Configurable; required behind reverse proxies for accurate IP-based rate limiting |

---

## 16. Localization

- **Languages:** English (`en`), Hungarian (`hu`)
- **Detection:** `Accept-Language` header (first segment before `,` / `-`)
- **Dictionary:** `i18n.util.js` — covers auth, validation, orders, users, exports, roles, errors, support
- **Functions:** `t(lang, key, params)` — template interpolation; `localizeValidationErrors()` — maps Zod issues to messages; `localizedStatus()`, `localizedPeriod()` — translate enums

---

## 17. Run & Test

### Development

```bash
cd backend
npm install
npm run dev    # Starts with --watch for auto-reload
```

### Production

```bash
cd backend
npm install
npm start      # node src/index.js
```

### Tests

```bash
npm test                # Jest (ESM mode)
npm run test:coverage   # Jest with coverage
```

Manual API tests: `backend/test.http` (VS Code REST Client).

---

## 18. Deployment (Render)

`render.yaml` defines a web service for the backend (`rootDir: backend`, `runtime: node`).

**Minimum production env vars:**

| Variable | Example Value |
|---|---|
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `SUPABASE_URL` | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | `eyJ...` |
| `JWT_SECRET` | Strong random secret |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` |
| `BACKEND_URL` | `https://your-backend.onrender.com` |
| `CORS_ORIGINS` | `https://your-frontend.onrender.com` |

---

## 19. Suggested Improvements

### Missing Validations
- Order status transitions are not enforced (e.g., `completed` → `pending` is allowed)
- No validation on `assigned_to` — any UUID string is accepted
- No pagination on `GET /items`, `GET /customers`, `GET /orders`
- Customer phone/email uniqueness is not enforced at the API level
- `DELETE /users/me` has no re-authentication step

### Security Considerations
- Categories and brands have no admin CRUD endpoints — must be managed directly in Supabase
- Avatar files are served from disk via `res.sendFile()` — consider CDN or object storage for production
- Swagger spec is minimal (no route definitions) — consider adding JSDoc annotations
- `REFRESH_TOKEN_SECRET` defaults to `JWT_SECRET` — consider using a separate secret

### Architecture
- Order quantity and number are embedded in `logs.details` text and parsed via regex — consider adding explicit columns
- Analytics are calculated on every request — consider caching or materialized views for scale
- `scrubResponseMiddleware` overrides `res.json` globally — may impact performance on large payloads
