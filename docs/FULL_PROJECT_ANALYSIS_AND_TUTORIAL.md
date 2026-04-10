# PC Store Manager — Complete Codebase Analysis & Tutorial

> **Last updated:** April 10, 2026  
> **Codebase version:** 1.0.0  
> **Tech Stack:** Angular 21 + Express 5 + Supabase/PostgreSQL

---

# PART 1: CODEBASE SUMMARY

---

## 1.1 Project Purpose

**PC Store Manager** is a full-stack web application for managing a PC component retail store. It handles:

- **Product inventory** — CRUD operations for PC components (items), organized by categories and brands
- **Order management** — Creating, tracking, assigning, and completing sales orders with status workflow
- **Customer management** — Maintaining a customer database linked to orders
- **Analytics** — Revenue charts, category breakdowns, top products, growth metrics
- **User management** — Multi-role system with admin, worker, and buyer accounts
- **Admin tools** — Session management, audit logs, pending admin approvals

The target users are:
- **Store administrators** who manage everything (inventory, orders, users, analytics)
- **Store workers** who handle assigned orders and view products/analytics
- **Buyers** (customers with accounts) who place orders and manage their profile

---

## 1.2 Architecture

The project follows a **monorepo architecture** with two distinct applications:

```
┌─────────────────────────┐        HTTP / WebSocket       ┌──────────────────────────┐
│   Angular 21 SPA        │ ◄──────────────────────────►  │   Express 5 REST API     │
│   (frontend/)           │   Bearer JWT + Accept-Lang    │   (backend/)             │
│                         │   httpOnly Cookie (refresh)   │                          │
│  Standalone components  │                               │  Controller → Service    │
│  Signal-based state     │                               │  → Supabase/PostgreSQL   │
│  Functional guards      │                               │                          │
│  Tailwind CSS 4         │                               │  Socket.io (real-time)   │
│  Chart.js 4 + ng2-charts│                               │  Nodemailer (SMTP)       │
│  Lucide icons           │                               │  PDFKit + CSV export     │
└─────────────────────────┘                               └──────────────────────────┘
```

**Backend Architecture:** Controller → Service → Database (layered/MVC-like)
- **Controllers** parse/validate requests and send responses
- **Services** contain business logic and interact with Supabase
- **Middlewares** handle cross-cutting concerns (auth, error handling, i18n, sanitization)
- **Utils** provide shared helpers (email, PDF, CSV, audit, tokens)

**Frontend Architecture:** Component-based SPA with service layer
- **Standalone components** (Angular 21 pattern — no NgModules)
- **Signal-based reactivity** for state management (no NgRx or other state library)
- **Service layer** wraps all HTTP calls through a centralized `ApiService`
- **Functional route guards** for authentication and role-based access

---

## 1.3 Main Components & Modules

### Backend Components

| Component | Path | Purpose |
|---|---|---|
| **Auth Controller/Service** | `controllers/auth.controller.js`, `services/auth.service.js` | Registration, login, JWT token refresh, logout, password reset, session management, admin approvals |
| **Item Controller/Service** | `controllers/item.controller.js`, `services/item.service.js` | Product CRUD, category/brand management |
| **Order Controller/Service** | `controllers/order.controller.js`, `services/order.service.js` | Order creation, status updates, assignment, deletion, CSV/PDF export |
| **Analytics Controller/Service** | `controllers/analytics.controller.js`, `services/analytics.service.js` | Revenue calculation, charts data, top products, growth metrics, export |
| **Customer Controller/Service** | `controllers/customer.controller.js`, `services/customer.service.js` | Customer CRUD |
| **User Controller/Service** | `controllers/user.controller.js`, `services/user.service.js` | Profile management, avatar upload, password change, account deletion |
| **Dashboard Controller** | `controllers/dashboard.controller.js` | Aggregated dashboard stats (delegates to AnalyticsService) |
| **Health Controller** | `controllers/health.controller.js` | Health check and readiness probe for deployment |
| **Support Controller** | `controllers/support.controller.js` | Contact support form → email to admins |
| **Auth Middleware** | `middlewares/auth.middleware.js` | JWT verification with JTI-based revocation, role-based access |
| **Error Middleware** | `middlewares/error.middleware.js` | Centralized error handler with localized messages |
| **Language Middleware** | `middlewares/language.middleware.js` | Parses `Accept-Language` header for i18n |
| **Sanitize Middleware** | `middlewares/sanitize.middleware.js` | XSS protection via HTML encoding of input |

### Frontend Components

| Component | Path | Purpose |
|---|---|---|
| **App Shell** | `app.ts`, `app.html` | Root component with navbar, routing, theme/language toggles |
| **Login** | `auth/login/` | Email/password login with remember-me, contact support modal |
| **Register** | `auth/register/` | Multi-step registration wizard (4 steps: role → credentials → details → confirm) |
| **Forgot / Reset Password** | `auth/forgot/`, `auth/reset-password/` | Password recovery flow |
| **Dashboard** | `dashboard/` | Overview stats, activity feed, quick actions |
| **Products** | `components/products.component/` | CRUD table for items, filters, create/edit modals |
| **Orders** | `components/orders.component/` | Order management with status workflow, assignment, export |
| **Analytics** | `components/analytics.component/` | Charts (revenue, categories), top products, export |
| **Profile** | `components/profile.component/` | Edit profile, avatar upload, password change, session viewer |
| **Admin Sessions** | `admin-sessions/` | View/revoke all user sessions, pending admin approvals |
| **Admin Audit** | `admin-audit/` | Audit log viewer |
| **Admin Action Result** | `admin-action-result/` | One-click approve/reject landing page |

### Frontend Services

| Service | Purpose |
|---|---|
| `ApiService` | Centralized HTTP client wrapping `HttpClient` with base URL management |
| `AuthService` | Login, register, logout, token refresh, session management |
| `ItemService` | Product CRUD API calls |
| `OrderService` | Order CRUD, customer/worker fetching API calls |
| `DashboardService` | Dashboard stats and analytics API calls |
| `UserService` | Profile, avatar, password API calls |
| `SocketService` | WebSocket connection for real-time notifications |
| `I18nService` | Bilingual translation service (EN/HU, 900+ keys) |
| `ThemeService` | Dark/light mode toggle with localStorage persistence |
| `ToastService` | Toast notification system |

---

## 1.4 Key Technologies, Frameworks & Libraries

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | ≥ 18 | Runtime |
| **Express** | 5.x | HTTP framework |
| **Supabase (@supabase/supabase-js)** | ^2.34.0 | PostgreSQL database client |
| **jsonwebtoken** | ^9.0.0 | JWT access token generation/verification |
| **bcryptjs** | ^2.4.3 | Password hashing |
| **Zod** | ^3.23.2 | Request validation schemas |
| **Socket.io** | ^4.7.2 | WebSocket server for real-time events |
| **Nodemailer** | ^8.0.2 | Email sending (SMTP) |
| **PDFKit** | ^0.17.2 | PDF report generation |
| **Multer** | ^2.1.1 | File upload handling (avatars) |
| **Helmet** | ^7.0.0 | HTTP security headers |
| **express-rate-limit** | ^7.0.0 | Rate limiting |
| **cookie-parser** | ^1.4.7 | httpOnly cookie parsing for refresh tokens |
| **cors** | ^2.8.6 | CORS configuration |
| **swagger-jsdoc / swagger-ui-express** | ^6.2.8 / ^4.6.3 | API documentation |
| **Jest** | ^30.3.0 | Unit testing |

### Frontend
| Technology  | Version | Purpose |
|---|---|---|
| **Angular** | 21.x | SPA framework (standalone components, signals) |
| **TypeScript** | ~5.9.2 | Type safety |
| **Tailwind CSS** | 4.x | Utility-first CSS framework |
| **Chart.js** | ^4.5.1 | Charting library |
| **ng2-charts** | ^8.0.0 | Angular Chart.js wrapper |
| **Lucide Angular** | ^0.563.0 | Icon library |
| **socket.io-client** | ^4.8.3 | WebSocket client |
| **RxJS** | ~7.8.0 | Reactive programming |
| **Cypress** | ^15.12.0 | E2E testing |
| **Karma + Jasmine** | ~6.4.0 / ~5.9.0 | Unit testing |

---

## 1.5 Data Flow & Component Interaction

### Authentication Flow

```
User                    Frontend                  Backend                   Database
 │                        │                         │                         │
 │── login form ──────────►                         │                         │
 │                        │── POST /auth/login ─────►                         │
 │                        │                         │── query users table ────►
 │                        │                         │◄── user row ────────────│
 │                        │                         │── bcrypt.compare() ─────│
 │                        │                         │── generate JWT (1h) ────│
 │                        │                         │── generate refresh token─│
 │                        │                         │── store refresh_tokens──►
 │                        │◄── { accessToken, user }│                         │
 │                        │   + httpOnly cookie      │                         │
 │                        │── store token (storage) ─│                         │
 │◄── redirect dashboard──│                         │                         │
```

### Request Pipeline

```
HTTP Request
  → CORS middleware
  → express.json() (100kb limit)
  → cookie-parser
  → Helmet (security headers)
  → Rate limiter (200 req/15min)
  → Sanitize middleware (XSS prevention)
  → Language middleware (Accept-Language → req.lang)
  → Scrub response middleware (strips password_hash from JSON)
  → Route handler
    → Auth middleware (JWT verify + JTI revocation check)
    → Role middleware (requireRole)
    → Controller → Service → Supabase → Response
  → Error handler (catch-all with localized messages)
```

### Token Refresh Flow

```
Frontend (authInterceptor)          Backend
   │                                   │
   │── API call with expired JWT ──────►
   │◄── 401 Unauthorized ─────────────│
   │                                   │
   │── POST /auth/refresh ─────────────►
   │   (sends httpOnly cookie)         │── lookup refresh_token by hash
   │                                   │── verify not expired
   │                                   │── verify metadata match (IP/UA)
   │                                   │── rotate: delete old, create new
   │                                   │── generate new access JWT
   │◄── { accessToken, user } ────────│
   │   + new httpOnly cookie           │
   │                                   │
   │── retry original request ─────────►
```

### Order Lifecycle

```
pending → processing → completed
                    ↘ cancelled
```

- **Buyers** can create orders and cancel their own
- **Workers** can update status on orders assigned to them
- **Admins** can do everything: create, assign, update status, delete
- When an order is assigned, a **WebSocket event** notifies the worker in real-time
- When a buyer creates an order, **worker notification emails** are sent

---

## 1.6 Important Design Patterns

1. **Controller-Service Pattern** — Controllers handle HTTP concerns (validation, response formatting); Services contain all business logic and database interaction. This ensures clean separation and testability.

2. **Async Wrapper Pattern** (`asyncWrap`) — All async route handlers are wrapped with a utility that catches rejected promises and passes errors to Express's centralized error handler, eliminating try/catch boilerplate.

3. **Centralized Error Handling** — A single `errorHandler` middleware catches all errors, formats them consistently as JSON, includes localized messages, and logs stack traces only for 5xx errors.

4. **Token Rotation** — Refresh tokens are rotated on every use: the old token is deleted and a new one is created. Each refresh token is stored as a SHA-256 hash (never plaintext). Each access token has a JTI that can be immediately revoked.

5. **Response Scrubbing** — A middleware intercepts `res.json()` to strip sensitive fields (`password_hash`, `password`, `supabaseKey`) from all outgoing responses, preventing accidental data leaks.

6. **Functional Guards** — Angular route guards are plain functions (not classes), using `inject()` for DI. This follows Angular 21's recommended pattern and reduces boilerplate.

7. **Signal-Based State** — The frontend uses Angular signals (`signal()`, `computed()`) for reactive state management instead of BehaviorSubjects or NgRx, keeping things simple and performant.

8. **Interceptor-Based Token Refresh** — The HTTP interceptor automatically catches 401 responses, attempts a silent token refresh, replays the failed request, and only logs out if refresh also fails.

9. **Bilingual i18n** — Both frontend and backend support English and Hungarian. The frontend uses a `TranslatePipe` (`{{ 'key' | t }}`) backed by a signal-based dictionary. The backend resolves `req.lang` from the `Accept-Language` header.

10. **Audit Trail** — Critical actions (login, logout, session revocation, admin approvals) are logged to an `audit_logs` table with actor/target user IDs and details.

---

## 1.7 Database Schema (Inferred from Code)

The application uses **Supabase (PostgreSQL)**. The tables are not defined in migration files in the repo, but can be inferred from the service layer:

| Table | Key Columns | Purpose |
|---|---|---|
| `users` | `id`, `email`, `username`, `fullname`, `password_hash`, `role`, `admin_approved`, `admin_approved_by`, `admin_approved_at` | User accounts |
| `items` | `id`, `name`, `model`, `price`, `amount`, `warranty`, `category_id`, `brand_id`, `date_added` | Product inventory |
| `categories` | `id`, `name` | Product categories |
| `brands` | `id`, `name` | Product brands |
| `customers` | `id`, `name`, `email`, `phone` | Customer records |
| `logs` | `id`, `item_id`, `customer_id`, `user_id`, `assigned_to`, `action`, `details`, `timestamp` | Activity/order logs (`stock_out` = order, `stock_in` = item added) |
| `orders_status` | `id`, `log_id`, `status`, `updated_by`, `updated_at` | Order status tracking linked to logs |
| `refresh_tokens` | `id`, `user_id`, `token_hash`, `expires_at`, `ip`, `user_agent`, `access_jti`, `created_at` | Session tokens |
| `revoked_tokens` | `id`, `jti`, `reason`, `expires_at`, `user_id` | Revoked JWTs (immediate invalidation) |
| `password_resets` | `id`, `user_id`, `token_hash`, `expires_at` | Password reset tokens |
| `audit_logs` | `id`, `event_type`, `actor_user_id`, `target_user_id`, `details`, `created_at` | Audit trail |

---

## 1.8 Potential Issues, Inconsistencies & Technical Debt

### Architecture & Design
1. **No database migration files** — The Supabase schema is managed outside the codebase. There's a `scripts/migrate.js` file but no versioned migration system. This makes it hard for new developers to set up the database.

2. **Orders stored in `logs` table** — Orders are stored as `stock_out` action entries in a generic `logs` table rather than a dedicated `orders` table. This is a design compromise that makes querying and maintaining orders more complex (relies on regex parsing of `details` field for order numbers and quantities).

3. **Regex-based data extraction** — Order quantities and numbers are parsed from string fields using regex (`/Sold (\d+) unit/`, `/Order #(\d+)/`). This is fragile and would break if the format changes.

4. **Swagger is minimal** — The Swagger/OpenAPI setup has an empty `apis` array, meaning no actual endpoint documentation is generated. It serves an empty spec at `/docs`.

### Security
5. **Default JWT secret in development** — The `JWT_SECRET` defaults to `'change-this-secret'` in development. While it blocks this in production with `process.exit(1)`, the default is still a risk if `.env` is forgotten.

6. **Sanitize middleware HTML-encodes all input** — The sanitize middleware encodes `&`, `<`, `>`, `"`, `'` in all request body strings. This means data stored in the database is HTML-encoded, which could lead to double-encoding issues when outputting or cause unexpected behavior when searching/comparing strings.

### Code Quality
7. **Inconsistent error handling in services** — Some services throw errors with `statusCode` and `field` properties; others throw plain `Error` objects. The error middleware handles both, but the inconsistency makes the code harder to maintain.

8. **No TypeScript on backend** — The backend is JavaScript with ES modules. Using TypeScript would provide better type safety, IDE support, and catch errors at compile time.

9. **Test coverage is limited** — Backend tests cover validators, middleware, and some routes, but many service functions (analytics, orders, items) lack unit tests. Frontend has Karma config but no test files were found.

10. **Buyer role not in register schema** — The `registerSchema` Zod validator only accepts `admin` or `worker` as explicit roles. The `buyer` role is presumably set as default server-side, but this is implicit and could be confusing.

### Frontend
11. **Impure translation pipe** — The `TranslatePipe` is marked `pure: false`, meaning it runs on every change detection cycle. For a large application, this could impact performance. A signal-based approach or `OnPush` components would be better.

12. **No lazy loading** — All routes are eagerly loaded. For a production application with many components, implementing lazy-loaded routes would reduce initial bundle size.

---

# PART 1.5: DETAILED FUNCTION REFERENCE

This section documents **every exported function, method, class, and type** in the project — organized by layer.

---

## 2.1 Backend Controllers

Controllers parse/validate HTTP requests, delegate to services, and format HTTP responses. Every controller function is an `async (req, res)` handler wrapped in `asyncWrap()`.

### 2.1.1 Auth Controller (`auth.controller.js`)

| Function | Route | Validation | Request Input | Response | Delegates To |
|---|---|---|---|---|---|
| `register` | POST `/auth/register` | `registerSchema` | `req.body` (email, password, username, fullname?, role?) | `{ user, accessToken, requiresApproval?, message? }` + sets `refresh_token` httpOnly cookie | `AuthService.register()` |
| `login` | POST `/auth/login` | `loginSchema` | `req.body` (email/username, password, rememberMe?) | `{ user, accessToken }` + sets `refresh_token` cookie; `remember_session` cookie if rememberMe | `AuthService.login()` |
| `refresh` | POST `/auth/refresh` | — | `req.cookies.refresh_token` or `req.body.refreshToken` | `{ user, accessToken }` + rotates refresh cookie | `AuthService.refreshAccessToken()` |
| `logout` | POST `/auth/logout` | — | `req.cookies.refresh_token` or `req.body` | `{ success: true }` + clears cookies; writes audit log | `AuthService.revokeRefreshToken()` |
| `listTokens` | GET `/auth/tokens` | — | `req.user.id` (JWT) | `{ tokens: [{id, ip, user_agent, created_at, expires_at}] }` | `AuthService.listTokensForUser()` |
| `revokeToken` | DELETE `/auth/tokens/:id` | — | `req.params.id`, `req.user` | `{ success: true }` — admins can revoke any; users own only; writes audit log | `AuthService.revokeTokenById()` |
| `listAllSessions` | GET `/auth/sessions` | — | Query: `page`, `limit`, `q`, `email`, `start`, `end` | `{ tokens, total, page, limit }` — paginated (default 25/page); writes audit log | `AuthService.listAllTokens()` |
| `listPendingAdmins` | GET `/auth/pending-admins` | — | `req.user.id` | `{ users: [{id, email, username, fullname}] }` — excludes requesting admin | Direct Supabase query |
| `approveAdmin` | POST `/auth/pending-admins/:id/approve` | — | `req.params.id` | `{ success: true }` — sets admin_approved=true, sends approval email, writes audit log | Direct Supabase + `AuthService.sendApprovalEmail()` |
| `rejectAdmin` | POST `/auth/pending-admins/:id/reject` | — | `req.params.id` | `{ success: true }` — deletes unapproved admin user; writes audit log | Direct Supabase delete |
| `approveAdminOneClick` | GET `/auth/admin-action/:id/approve` | JWT token in query | `req.query.token`, `req.params.id` | HTML redirect to `/admin/action-result?result=approved` — verifies signed JWT with type=admin_action; prevents replay via JTI tracking in revoked_tokens | Direct Supabase + JWT verify |
| `rejectAdminOneClick` | GET `/auth/admin-action/:id/reject` | JWT token in query | `req.query.token`, `req.params.id` | HTML redirect to `/admin/action-result?result=rejected` — same replay protection as approve | Direct Supabase + JWT verify |
| `listAuditLogs` | GET `/auth/audit-logs` | — | Query: `page`, `limit` | `{ logs, total, page, limit }` — paginated audit_logs ordered by created_at DESC | Direct Supabase query |
| `cleanupRevoked` | POST `/auth/cleanup-revoked` | — | — | `{ success: true }` — deletes all revoked_tokens where expires_at < now | Direct Supabase delete |
| `forgotPassword` | POST `/auth/forgot-password` | `forgotPasswordSchema` | `req.body.email` | `{ success: true, sent?, message? }` — always returns success (doesn't reveal if email exists) | `AuthService.forgotPassword()` |
| `resetPassword` | POST `/auth/reset-password` | `resetPasswordSchema` | `req.body` (token, newPassword) | `{ success: true }` | `AuthService.resetPassword()` |

### 2.1.2 Item Controller (`item.controller.js`)

| Function | Route | Validation | Request Input | Response | Delegates To |
|---|---|---|---|---|---|
| `getItems` | GET `/items` | — | — | `{ items: [...] }` | `ItemService.getItems()` |
| `createItem` | POST `/items` | `createItemSchema` | `req.body` (name, price, category_id, brand_id, amount?, model?, warranty?) | `{ success: true, item }` — passes `req.user.id` for audit logging | `ItemService.createItem()` |
| `updateItem` | PATCH `/items/:id` | `updateItemSchema` | `req.params.id`, `req.body` (partial fields) | `{ item }` | `ItemService.updateItem()` |
| `deleteItem` | DELETE `/items/:id` | — | `req.params.id` | `{ success: true }` — returns 409 if active orders exist (code `ACTIVE_ORDERS`) or FK violations; localizes error | `ItemService.deleteItem()` |
| `getCategories` | GET `/items/categories` | — | — | `{ categories: [...] }` | `ItemService.getCategories()` |
| `getBrands` | GET `/items/brands` | — | — | `{ brands: [...] }` | `ItemService.getBrands()` |
| `createBrand` | POST `/items/brands` | `createBrandSchema` | `req.body.name` | `{ success: true, brand }` — returns 409 if duplicate (code `BRAND_DUPLICATE`) | `ItemService.createBrand()` |

### 2.1.3 Order Controller (`order.controller.js`)

| Function | Route | Validation | Request Input | Response | Delegates To |
|---|---|---|---|---|---|
| `getOrders` | GET `/orders` | — | `req.user`, `req.lang` | `{ orders: [...] }` — filtered by role (buyer=own, worker=assigned, admin=all) | `OrderService.getOrders()` |
| `createOrder` | POST `/orders` | `createOrderSchema` | `req.body` (item_id, customer_id?, quantity, status?), `req.user`, `req.lang` | `{ success: true, order }` | `OrderService.createOrder()` |
| `updateOrderStatus` | PATCH `/orders/:id/status` | — | `req.params.id`, `req.body.status`, `req.user` | `{ success: true, status }` — workers can only update assigned orders; buyers can only cancel own; admins unrestricted | `OrderService.updateOrderStatus()` |
| `assignOrder` | PATCH `/orders/:id/assign` | — | `req.params.id`, `req.body.assigned_to` | `{ success: true }` | `OrderService.assignOrder()` |
| `deleteOrder` | DELETE `/orders/:id` | — | `req.params.id`, `req.lang` | `{ success: true }` | `OrderService.deleteOrder()` |
| `exportOrders` | GET `/orders/export` | — | Query: `status` (default='all'), `format` ('csv'\|'pdf') | Binary file download — sets Content-Type and Content-Disposition; filename: `orders-{status}-{date}.{ext}` | `OrderService.getOrders()` + CSV/PDF generation |

### 2.1.4 Analytics Controller (`analytics.controller.js`)

| Function | Route | Request Input | Response | Delegates To |
|---|---|---|---|---|
| `getAnalytics` | GET `/analytics` | `req.user`, `req.query` (period, etc.) | `{ summary, revenueChart, categoryChart, topProducts, recentTransactions? }` | `AnalyticsService.getAnalytics()` |
| `exportAnalytics` | GET `/analytics/export` | `req.query`, `req.lang` | Binary file — Content-Type and filename set dynamically from service response | `AnalyticsService.exportAnalytics()` |

### 2.1.5 Customer Controller (`customer.controller.js`)

| Function | Route | Validation | Request Input | Response | Delegates To |
|---|---|---|---|---|---|
| `getCustomers` | GET `/customers` | — | — | `{ customers: [...] }` | `CustomerService.getCustomers()` |
| `createCustomer` | POST `/customers` | `createCustomerSchema` | `req.body` (name, email, phone), `req.lang` | `{ success: true, customer }` | `CustomerService.createCustomer()` |

### 2.1.6 Dashboard Controller (`dashboard.controller.js`)

| Function | Route | Request Input | Response | Delegates To |
|---|---|---|---|---|
| `getDashboard` | GET `/dashboard` | `req.user` | `{ stats: {totalProducts, totalSales, activeOrders, customers}, activities: [{id, description, timestamp, type}] }` — calls analytics with hardcoded period='7days' and transforms to dashboard format | `AnalyticsService.getAnalytics()` |

### 2.1.7 User Controller (`user.controller.js`)

| Function | Route | Request Input | Response | Special Behavior |
|---|---|---|---|---|
| `getWorkers` | GET `/users/workers` | — | `{ users: [...] }` | `UserService.getWorkers()` |
| `getProfile` | GET `/users/me` | `req.user.id` | `{ user: {...} }` | `UserService.getProfile()` |
| `updateProfile` | PATCH `/users/me` | `req.body`, `req.user.id`, `req.lang` | `{ user: {...} }` | `UserService.updateProfile()` |
| `changePassword` | PATCH `/users/me/password` | `req.body` (currentPassword, newPassword), `req.user.id`, `req.lang` | `{ success: true, message }` | `UserService.changePassword()` |
| `deleteProfile` | DELETE `/users/me` | `req.user.id`, `req.lang` | `{ success: true }` — also deletes avatar files from disk | `UserService.deleteProfile()` |
| `uploadAvatar` | POST `/users/me/avatar` | `req.file` (Multer multipart), `req.user.id` | `{ success: true, message }` — saves as `{userId}.{ext}`, removes old avatar files with different extensions | Direct file handling |
| `getMyAvatar` | GET `/users/me/avatar` | `req.user.id` | Binary file stream — `Cache-Control: no-cache, no-store, must-revalidate`; 404 if not found | Direct file serving |
| `getAvatarById` | GET `/users/:id/avatar` | `req.params.id`, `req.user` | Binary file — only owner or admin can access (403 otherwise); 404 if not found | Direct file serving |
| `deleteAvatar` | DELETE `/users/me/avatar` | `req.user.id` | `{ success: true }` — removes all matching avatar files from disk | Direct file handling |

### 2.1.8 Health Controller (`health.controller.js`)

| Function | Route | Response | Behavior |
|---|---|---|---|
| `healthCheck` | GET `/health` | `{ status: 'ok'\|'error', supabase: 'reachable'?, note?: 'table users missing' }` | Returns 502 only on critical errors; detects missing users table gracefully |
| `healthReady` | GET `/health/ready` | `{ status: 'ready'\|'error', supabase: 'reachable'\|'unreachable' }` | Readiness probe — fails 502 if Supabase unreachable (stricter) |

### 2.1.9 Support Controller (`support.controller.js`)

| Function | Route | Request Input | Response | Behavior |
|---|---|---|---|---|
| `sendSupportEmail` | POST `/support/contact` | `req.body` (name, email, message), `req.lang` | `{ success: true, message }` | Validates message (required, max 4000 chars); sends to all admin emails + SUPPORT_INBOX; deduplicates recipients; sets replyTo if sender email provided; falls back to console if no SMTP |

---

## 2.2 Backend Services

Services contain all business logic and database interaction. They throw errors with `statusCode` and optional `field` properties for the error middleware.

### 2.2.1 Auth Service (`auth.service.js`)

**Internal Helpers:**

| Function | Signature | Purpose |
|---|---|---|
| `generateAccessToken` | `(payload, expiresIn='1h') → {token, jti}` | Signs JWT with unique 16-byte hex JTI for immediate revocation capability |
| `generateRefreshTokenStr` | `() → string` | Generates 96-char hex string (48 random bytes) |
| `normalizeMetadata` | `(metadata={}) → {ip, userAgent}` | Trims and lowercases IP and User-Agent for consistent comparison |
| `isMetadataMismatch` | `(refreshTokenRow, metadata={}) → boolean` | Returns true if current session IP or User-Agent differs from stored token metadata |

**Exported Methods:**

#### `register({email, username, password, fullname, role}, metadata={}, lang='en')`
1. Normalize metadata (IP, User-Agent)
2. Hash password with bcrypt (cost 12)
3. Insert user with role and admin_approved status
4. Handle duplicate email/username → 409
5. Auto-approve first admin if no approved admins exist
6. Send registration confirmation email
7. If unapproved admin → notify all approved admins with approve/reject one-click tokens (valid 7 days) → return null tokens + requiresApproval flag
8. Generate access token (1h) + refresh token → store hash with metadata → cleanup old tokens (max 5/user)
- **Returns:** `{user, accessToken, refreshToken, refreshExpires, requiresApproval?}`

#### `login({email, username, password, rememberMe}, lang='en', metadata={})`
1. Query user by email or username → 401 if not found
2. bcrypt.compare password → 401 if mismatch
3. Block unapproved admins → 403
4. Generate tokens → store refresh hash → cleanup old tokens
- **Returns:** `{user, accessToken, refreshToken, refreshExpires}`

#### `refreshAccessToken(token, metadata={})`
1. Hash token → lookup refresh_tokens
2. Return null if not found / expired
3. Validate metadata (IP/User-Agent) — delete and return null on mismatch
4. Fetch user record
5. Generate new access token with new JTI, new refresh token
6. Delete old refresh token, insert new one → cleanup
- **Returns:** `null` or `{accessToken, refreshToken, refreshExpires, user}`

#### `revokeRefreshToken(token)`
1. Hash token → lookup → if found with access_jti, insert into revoked_tokens (1h expiry)
2. Delete refresh token by ID or hash

#### `listTokensForUser(userId)` → `Array<{id, expires_at, ip, user_agent, created_at}>`

#### `listAllTokens({page, limit, q, email, start, end})` → `{tokens, total}` — Paginated with user search, date filters

#### `revokeTokenById(id, userIdProvided=null, isAdmin=false)` → `boolean` — Authorization check: admin bypasses ownership

#### `forgotPassword(email, lang='en')`
1. Quietly lookup user (don't reveal if exists)
2. Generate 48-byte random token → hash → set 1h expiry
3. Delete existing resets for user → insert new
4. If SMTP → send email; else log token to console
- **Returns:** `{sent: boolean, message?}`

#### `resetPassword({token, newPassword}, lang='en')`
1. Hash token → lookup password_resets → throw if not found or expired
2. Hash new password (bcrypt cost 12) → update user → delete reset record

#### `sendApprovalEmail(userId, lang='en')` — Fire-and-forget approval notification to newly approved admin

---

### 2.2.2 Item Service (`item.service.js`)

| Method | Parameters | Returns | Key Logic |
|---|---|---|---|
| `getItems()` | — | `Item[]` with category/brand names | Left joins items → categories → brands; ordered by name |
| `createItem(data, userId)` | `{name, model, price, amount, warranty, category_id, brand_id}, userId` | Inserted record | Inserts with current date; logs stock-in action in logs table |
| `updateItem(id, updates)` | `id, partial fields` | Updated record | Whitelists: name, model, price, amount, warranty, brand_id, category_id; converts empty FK strings to null |
| `deleteItem(id)` | `id` | — | Checks for active orders (pending/processing) → throws ACTIVE_ORDERS; cascades: delete orders_status → nullify/delete logs → delete item |
| `getCategories()` | — | `{id, name}[]` | All categories ordered by name |
| `getBrands()` | — | `{id, name}[]` | All brands ordered by name |
| `createBrand(name)` | `name` | `{id, name}` | Trims; checks case-insensitive duplicate (ilike) → throws BRAND_DUPLICATE |

---

### 2.2.3 Order Service (`order.service.js`)

**Internal Helpers:**
- `_resolveCustomerIdForOrder(user, customerId, lang)` — If buyer: auto-creates customer from user profile if needed. If staff: requires customerId parameter.
- `_notifyWorkersOfNewOrder(order, customerId, lang)` — Fetches all workers, renders email template, sends via Promise.allSettled (fire-and-forget).

**Exported Methods:**

#### `getOrders(user, lang='en')`
1. Query logs where action='stock_out' with item/customer joins
2. Role filter: buyer=own (user_id), worker=assigned_to, admin=all
3. Fetch orders_status per log (newest per log_id)
4. Transform: extract order number + quantity from details via regex, format date by language
- **Returns:** `Order[]` with orderNumber, product, quantity, unitPrice, totalAmount, status, customer, date, assignedTo

#### `createOrder(user, {item_id, customer_id, quantity, status='pending'}, lang='en')`
1. Validate status ∈ ORDER_STATUSES
2. Resolve customer ID (auto-create for buyers)
3. Fetch item → validate stock ≥ quantity
4. Generate random 6-digit order number
5. If status is completed/processing → deduct stock from item.amount
6. Insert log (stock_out) → insert orders_status → fire worker email notifications
- **Returns:** `{id, orderNumber, product, quantity, totalAmount, status}`

#### `updateOrderStatus(id, status, userId, lang='en')`
- Validate status → upsert orders_status (update if exists, insert if new)

#### `assignOrder(id, assigned_to)`
- If assigned_to provided: emit Socket.io `order:assigned` event to `user:{assigned_to}` room with product info
- Update log's assigned_to field (empty string → null)

#### `deleteOrder(id, lang='en')`
- Fetch log → get latest status → extract quantity
- If status was completed/processing → restore stock
- Delete orders_status rows → delete log

---

### 2.2.4 Analytics Service (`analytics.service.js`)

**Internal Helper:** `getDaysFromPeriod(period)` → 7\|30\|90 (defaults to 7)

#### `getAnalytics(user, {period='7days'})`
1. Calculate date range (period days ago → now)
2. Fetch all items and customers
3. Query sales logs (stock_out) for period — workers see only assigned orders
4. Calculate: total revenue, total orders, sales by product, sales by day
5. Revenue chart breakdown:
   - 7 days → by day of week
   - 30 days → by week
   - 90 days → by month
6. Category distribution chart (% of items per category)
7. Top 5 products by revenue
8. Low stock count (items with stock < 10)
9. Admin-only: 5 most recent transactions
10. Average order value + revenue growth vs previous period
- **Returns:** `{summary, revenueChart, categoryChart, topProducts, recentTransactions}`

#### `exportAnalytics({period='7days', format='csv', lang='en'})`
- Fetches sales logs with item/brand/category data
- Maps to rows: date, product, brand, category, quantity, unit price, total, order ID
- CSV: generates with BOM for Excel → `text/csv`
- PDF: calculates summary stats + top product → generates PDF report with summary boxes + table → `application/pdf`
- **Returns:** `{content, contentType, filename}`

---

### 2.2.5 Customer Service (`customer.service.js`)

| Method | Parameters | Returns | Logic |
|---|---|---|---|
| `getCustomers()` | — | `{id, name, email, phone}[]` | All customers ordered by name |
| `createCustomer({name, email, phone}, lang='en')` | data, lang | Inserted record | Validates name required; inserts into customers |

---

### 2.2.6 User Service (`user.service.js`)

| Method | Parameters | Returns | Key Logic |
|---|---|---|---|
| `getWorkers()` | — | `{id, username, email, fullname}[]` | Users with role in ('admin', 'worker') ordered by username |
| `getProfile(userId)` | userId | `{id, email, username, fullname, role}` | Single user by ID |
| `updateProfile(userId, updates, lang)` | userId, partial, lang | Updated record | Whitelists: email, username, fullname; throws if no valid fields |
| `changePassword(userId, {currentPassword, newPassword}, lang)` | userId, passwords, lang | `{success, message}` | Validates length ≥ 8 + uppercase + lowercase + digit + special; verifies current password via bcrypt; re-hashes with cost 12 |
| `deleteProfile(userId, lang)` | userId, lang | `{success, message}` | **Complex cascade:** delete refresh_tokens, password_resets, revoked_tokens → nullify/delete orders_status → nullify/delete logs → nullify admin_approved_by → nullify/delete audit_logs → hard delete user → if fails: anonymize (deleted_{id8}@deleted.local, role=worker, password=DELETED) → retry delete |

---

## 2.3 Backend Middlewares

### 2.3.1 Auth Middleware (`auth.middleware.js`)

#### `authMiddleware(req, res, next)`
1. Extract Bearer token from `Authorization` header → 401 if missing/malformed
2. Verify JWT using `JWT_SECRET` → 401 if invalid
3. If token has `jti`: query `revoked_tokens` for matching JTI with `expires_at > now` → 401 if found
4. Attach decoded JWT payload to `req.user` → call `next()`
- Silently continues if revoked_tokens table doesn't exist (logs warning, doesn't block)

#### `requireRole(...roles)` → middleware function
- Factory that returns middleware checking `req.user.role ∈ roles`
- Returns 403 with localized error listing allowed roles if unauthorized

---

### 2.3.2 Error Middleware (`error.middleware.js`)

#### `errorHandler(err, req, res, _next)`
- Logs full stack trace only for 5xx errors (or missing statusCode)
- Uses `err.statusCode` or defaults to 500
- Response: `{error: message, field?: err.field}` — field property enables frontend to highlight specific form fields
- All error messages support i18n via `req.lang`

---

### 2.3.3 Language Middleware (`language.middleware.js`)

#### `languageMiddleware(req, res, next)`
- Parses `Accept-Language` header: splits by comma → splits by hyphen → takes first segment
- Sets `req.lang` (e.g., "en-US,fr" → "en"); defaults to `'en'`

---

### 2.3.4 Sanitize Middleware (`sanitize.middleware.js`)

#### `sanitizeMiddleware(req, res, next)`
- Recursively processes all `req.body` strings
- Removes null bytes (`\0`)
- HTML-encodes: `&` → `&amp;`, `<` → `&lt;`, `>` → `&gt;`, `"` → `&quot;`, `'` → `&#39;`
- Processes nested objects recursively

---

## 2.4 Backend Utilities

### 2.4.1 `async.util.js`

#### `asyncWrap(fn)` → Express middleware
Wraps `async (req, res, next)` handlers with `Promise.resolve().catch(next)`, routing all rejected promises to the error middleware. Eliminates try/catch boilerplate.

### 2.4.2 `audit.util.js`

#### `writeAuditLog(eventType, actorUserId?, targetUserId?, details?)` → `Promise<void>`
Inserts into `audit_logs` table. **Never throws** — catches all errors and logs a warning. Used for compliance-critical actions (login, logout, session revocation, admin approvals).

### 2.4.3 `config.js`

| Export | Type | Default | Notes |
|---|---|---|---|
| `JWT_SECRET` | string | `'change-this-secret'` | **FATAL** in production if unchanged — calls `process.exit(1)` |
| `FRONTEND_URL` | string | `'http://localhost:4200'` | Used in email links |
| `BACKEND_URL` | string | `'http://localhost:{PORT}'` | Used for callback URLs |
| `PORT` | number | `3000` | Server port |
| `CORS_ORIGINS` | string[] | `['https://pc-store-manager-frontend.onrender.com', 'http://localhost:4200']` | Parsed from comma-separated env var |

### 2.4.4 `constants.js`

```javascript
ORDER_STATUSES = ['pending', 'processing', 'completed', 'cancelled']
```

### 2.4.5 `csv.util.js`

| Function | Signature | Logic |
|---|---|---|
| `escapeCsvValue(value)` | `(any) → string` | Returns empty for null/undefined; wraps in quotes and escapes internal `"` if value contains quotes, newlines, or commas |
| `generateCsvFromObjects(columns, rows)` | `(Column[], object[]) → string` | Generates header row from column labels + data rows from column keys; prepends UTF-8 BOM (`\uFEFF`) for Excel compatibility |

### 2.4.6 `email.template.js`

Six render functions that return `{subject: string, text: string, html: string}` for Nodemailer. All escape user-supplied values for HTML safety.

| Function | Purpose | Key Parameters |
|---|---|---|
| `renderAdminNotification` | New admin pending approval → sent to existing admins | email, username, fullname, approveUrl, rejectUrl, reviewLink |
| `renderRegistrationConfirmation` | Welcome email after registration | username, fullname, link, awaitingApproval? |
| `renderPasswordReset` | Password reset link email | resetLink |
| `renderSupportContact` | Forward support ticket to admin inbox | senderName, senderEmail, message |
| `renderApprovalNotification` | Admin account approved → sent to new admin | username, loginLink |
| `renderNewOrderNotification` | New order placed → sent to workers | orderNumber, product, quantity, totalAmount, customer, status |

### 2.4.7 `i18n.util.js`

| Function | Signature | Logic |
|---|---|---|
| `normalizeLanguage(lang)` | `(string) → 'hu'\|'en'` | Returns 'hu' if lang==='hu', else 'en' |
| `t(lang, key, params?)` | `(string, string, object?) → string` | Looks up key in language dictionary → falls back to English → falls back to key itself; replaces `{paramKey}` placeholders |
| `localizedStatus(lang, status)` | `(string, string) → string` | Returns `t(lang, 'status.{status}')` |
| `localizedPeriod(lang, period)` | `(string, string) → string` | Returns `t(lang, 'export.period.{period}')` |
| `localizeValidationErrors(lang, issues?)` | `(string, ZodIssue[]) → string[]` | Converts Zod issues to localized messages: field-specific handlers for email, username, password complexity, role enum, quantity, etc. |

### 2.4.8 `mail.util.js`

| Export | Type | Description |
|---|---|---|
| `smtpConfig` | object | `{host, port, secure, user, pass, from}` from SMTP_* env vars |
| `mailTransporter` | Transport\|null | Nodemailer transporter — created if all required SMTP fields present; null otherwise; verified at startup |
| `SUPPORT_INBOX` | string | Priority: SUPPORT_EMAIL env → SMTP_FROM env → `'pcstorenoreply4@gmail.com'` |
| `getSmtpRuntimeStatus()` | function | Returns `{configured, partiallyConfigured, missingFields, host, port, secure, from}` for diagnostics |

### 2.4.9 `pdf.util.js`

#### `generatePdfReport({title, subtitle?, summary?, columns?, rows?, summaryTitle?})` → `Promise<Buffer>`
Creates A4 landscape PDF using PDFKit:
- Title in 20pt bold, subtitle in 10pt gray
- Summary section as label-value property list
- Data table with purple header, alternating row colors, automatic page breaks, header re-drawn on new pages
- Displays "N/A" for null/undefined values

### 2.4.10 `scrub.util.js`

| Function | Signature | Logic |
|---|---|---|
| `scrubSensitive(obj)` | `(any) → any` | Deep-copies object, removing: `password_hash`, `password`, `supabaseKey`. Handles nested objects and arrays. Never modifies original. |
| `scrubResponseMiddleware` | Express middleware | Wraps `res.json()` to auto-scrub all outgoing JSON payloads before sending |

### 2.4.11 `socket.util.js`

| Function | Signature | Logic |
|---|---|---|
| `setIO(io)` | `(Server) → void` | Stores Socket.io instance in module-level variable |
| `getIO()` | `() → Server\|null` | Returns stored Socket.io instance |

### 2.4.12 `supabase.util.js`

#### `run(query)` → `Promise<data>`
Awaits Supabase query → extracts `{data, error}` → throws Error with `code` and `details` if error → returns data. Standardizes the Supabase error pattern into throw/catch.

### 2.4.13 `token.util.js`

#### `hashToken(token)` → `string|null`
Creates HMAC-SHA256 hash using `REFRESH_SECRET` (env) or `JWT_SECRET` fallback. Returns hex-encoded hash for secure database storage. Returns null for falsy input.

---

## 2.5 Validation Schemas (`validators.js`)

All schemas use **Zod** with `.safeParse()` in controllers. Failed validation returns localized errors via `localizeValidationErrors()`.

### Reusable Base: `strongPassword`
```
z.string().min(8)
  .regex(/[A-Z]/)    // uppercase required
  .regex(/[a-z]/)    // lowercase required
  .regex(/[0-9]/)    // digit required
  .regex(/[^A-Za-z0-9]/) // special char required
```

| Schema | Fields | Constraints |
|---|---|---|
| **registerSchema** | `email` (string, email format), `username` (string, 3-32 chars, alphanumeric+_.-), `password` (strongPassword), `fullname` (string?, max 128), `role` (enum?: 'admin'\|'worker') | — |
| **loginSchema** | `email` (string?, email), `username` (string?, min 3), `password` (string, min 1), `rememberMe` (boolean?) | Refine: requires email OR username |
| **changePasswordSchema** | `currentPassword` (string, min 1), `newPassword` (strongPassword) | — |
| **createItemSchema** | `name` (string, min 1), `price` (number, ≥0), `category_id` (string, min 1), `brand_id` (string, min 1), `amount` (int?, ≥0), `model` (string?), `warranty` (int?, ≥0) | — |
| **updateItemSchema** | Same as createItem but all fields optional/nullable | — |
| **createOrderSchema** | `item_id` (string, min 1), `customer_id` (string?, min 1), `quantity` (int, ≥1), `status` (string?) | — |
| **forgotPasswordSchema** | `email` (string, email format) | — |
| **resetPasswordSchema** | `token` (string, min 1), `newPassword` (strongPassword) | — |
| **createCustomerSchema** | `name` (string, min 1), `email` (string, email), `phone` (string, 1-30 chars) | — |
| **createBrandSchema** | `name` (string, 1-100 chars, must start with letter incl. accented À-ÿ) | Refine: cannot match `^\d+[xX]\s` pattern |

---

## 2.6 Server Initialization (`index.js`)

### Middleware Chain (in execution order)
1. **CORS** — `cors({origin: CORS_ORIGINS, credentials: true})`
2. **JSON Parser** — `express.json({limit: '100kb'})`
3. **Cookie Parser** — `cookieParser()`
4. **Helmet** — Security headers (CSP, HSTS, X-Frame-Options, etc.)
5. **Rate Limiter** — 200 requests / 15 minutes per IP
6. **Sanitize** — XSS protection on req.body
7. **Language** — Accept-Language → req.lang
8. **Response Scrubber** — Strips sensitive fields from res.json()
9. **Routes** (registered in order): health → users → customers → analytics → orders → items → auth → dashboard → support → root (/) → swagger (/docs)
10. **Error Handler** — Catch-all with localized messages

### Socket.io Setup
- HTTP server created from Express app
- Socket.io attached with CORS matching frontend origins
- On `'connection'`: logs socket ID
- On `'join'`: client joins room `user:{userId}` for targeted notifications
- Stored globally via `setIO(io)` for access from services

### Startup Tasks
- `resolveTrustProxySetting(value)` — Parses TRUST_PROXY env to boolean\|number for Express
- `cleanupExpiredRevoked()` — Deletes expired revoked_tokens; runs at startup + every 60 minutes
- ASCII-art startup banner with: PORT, NODE_ENV, SMTP status, trust proxy config

---

## 2.7 Database Client (`db.js`)

Initializes Supabase client from `SUPABASE_URL` + `SUPABASE_KEY` env vars. If either is missing, exports a mock object whose `from()` throws an error — preventing silent failures without a database connection.

---

## 2.8 Frontend Services & Guards

### 2.8.1 AuthService (`auth.service.ts`)

**Signals:**
- `user: Signal<User | null>` — Current authenticated user (null if logged out)
- `token: Signal<string | null>` — Current access JWT

**Key Properties:**
- `authReady: Promise<void>` — Resolves when initial auth state is settled (token loaded from storage)
- `refreshing$: Observable<AuthResponse>` — Shared refresh request (deduplicates concurrent refreshes)

| Method | Signature | Return | Logic |
|---|---|---|---|
| `isAuthenticated()` | `() → boolean` | boolean | Checks if token exists and not expired (decodes JWT exp claim) |
| `isLoggedIn()` | `() → boolean` | boolean | Alias for isAuthenticated() |
| `isAdmin()` | `() → boolean` | boolean | `user()?.role === 'admin'` |
| `isBuyer()` | `() → boolean` | boolean | `user()?.role === 'buyer'` |
| `isWorker()` | `() → boolean` | boolean | `user()?.role === 'worker'` |
| `shouldRestoreSession()` | `() → boolean` | boolean | Checks if "remember me" flag is in localStorage |
| `register(data)` | `({email, username, password, fullname?, role?}) → Observable<AuthResponse>` | Observable | POST /auth/register; handles success |
| `login(email, password, remember?)` | `(string, string, boolean?) → Observable<AuthResponse>` | Observable | POST /auth/login; stores token; sets remember cookie |
| `logout(reason?)` | `('manual'\|'expired'?) → void` | void | POST /auth/logout; clears storage; redirects to /login; shows toast |
| `refresh()` | `() → Observable<AuthResponse>` | Observable | POST /auth/refresh; uses `shareReplay(1)` to deduplicate concurrent calls |
| `forgotPassword(email)` | `(string) → Observable` | Observable | POST /auth/forgot-password |
| `resetPassword(token, newPassword)` | `(string, string) → Observable` | Observable | POST /auth/reset-password |
| `getSessions()` | `() → Observable<{tokens: Session[]}>` | Observable | GET /auth/tokens |
| `getAllSessionsPaged(...)` | `(page?, limit?, q?, email?, start?, end?)` | Observable | GET /auth/admin/sessions with pagination/filters |
| `listPendingAdmins()` | `() → Observable<{users: PendingAdmin[]}>` | Observable | GET /auth/admin/pending-admins |
| `approveAdmin(id)` | `(string) → Observable` | Observable | POST /auth/admin/pending-admins/{id}/approve |
| `rejectAdmin(id)` | `(string) → Observable` | Observable | POST /auth/admin/pending-admins/{id}/reject |
| `revokeSession(id)` | `(string) → Observable` | Observable | DELETE /auth/tokens/{id} |
| `revokeSessionByAdmin(id)` | `(string) → Observable` | Observable | DELETE /auth/tokens/{id} (admin endpoint) |
| `setUser(user)` | `(User) → void` | void | Updates user signal and persists to storage |

**Private Flow:**
- `loadFromStorage()` — On init, loads token/user from localStorage or sessionStorage
- `handleAuthSuccess(res, remember?)` — Updates signals; stores to localStorage (if remember) or sessionStorage
- `finishLogout(reason)` — Clears all stored auth; redirects to `/login`; shows toast with reason
- `clearStoredAuth(preserveRemember?)` — Removes auth keys from both storage types

---

### 2.8.2 Auth Interceptor (`auth.interceptor.ts`)

**Type:** `HttpInterceptorFn` (functional interceptor)

**Pipeline:**
1. Get stored token + language preference
2. Clone request with headers: `Authorization: Bearer {token}`, `Accept-Language: {lang}`
3. Pass to `next(outgoing)`
4. On 401 error (if not auth endpoint and logout not in progress):
   - Call `authService.refresh()` → get new token
   - Retry original request with new Authorization header
   - If refresh fails → `authService.logout('expired')` → rethrow error
5. All other errors pass through unchanged

---

### 2.8.3 Route Guards

| Guard | Allows | Blocks → Redirects To |
|---|---|---|
| **AuthGuard** | Authenticated users; attempts cookie refresh if remember-me set | Unauthenticated → `/login` |
| **AdminGuard** | Authenticated admins; attempts refresh if needed | Non-admin → `/dashboard`; unauthenticated → `/login` |
| **StaffGuard** | Authenticated admin + worker; blocks buyer; attempts refresh | Buyer → `/dashboard`; unauthenticated → `/login` |
| **GuestGuard** | Unauthenticated users only | Authenticated → `/dashboard` |

All guards follow the same pattern:
1. Check if already authenticated → immediate decision
2. If `shouldRestoreSession()` → attempt `refresh()` → re-check
3. On refresh failure → fallback redirect

---

### 2.8.4 ApiService (`api.service.ts`)

Base HTTP client wrapping Angular's `HttpClient`. Constructs full URLs from environment `apiUrl`.

| Method | Signature | Credentials | Notes |
|---|---|---|---|
| `get<T>(path, params?)` | `→ Observable<T>` | No | Standard GET |
| `post<T>(path, body?)` | `→ Observable<T>` | No | Standard POST |
| `patch<T>(path, body?)` | `→ Observable<T>` | No | Standard PATCH |
| `delete<T>(path)` | `→ Observable<T>` | No | Standard DELETE |
| `postWithCredentials<T>(path, body?)` | `→ Observable<T>` | Yes | For auth endpoints (sends cookies) |
| `getWithCredentials<T>(path, params?)` | `→ Observable<T>` | Yes | For auth endpoints |
| `deleteWithCredentials<T>(path)` | `→ Observable<T>` | Yes | For auth endpoints |
| `postFormData<T>(path, form, withCredentials?)` | `→ Observable<T>` | Optional | For file uploads (avatar) |
| `getBlob(path, params?)` | `→ Observable<Blob>` | Yes | For file downloads (exports, avatars) |

**Private:** `build(path)` — Handles absolute URLs, empty paths, and relative path concatenation.

---

### 2.8.5 Feature Services

#### ItemService (`item.service.ts`)

| Method | Endpoint | Return |
|---|---|---|
| `getItems()` | GET `/items` | `Observable<{items: Item[]}>` |
| `createItem(item)` | POST `/items` | `Observable<{success, item}>` — strips specs/specifications fields |
| `updateItem(id, item)` | PATCH `/items/{id}` | `Observable<{item}>` — strips specs/specifications fields |
| `deleteItem(id)` | DELETE `/items/{id}` | `Observable<{success}>` |
| `getCategories()` | GET `/items/categories` | `Observable<{categories: Category[]}>` |
| `getBrands()` | GET `/items/brands` | `Observable<{brands: Brand[]}>` |
| `createBrand(name)` | POST `/items/brands` | `Observable<{success, brand}>` |

#### OrderService (`order.service.ts`)

| Method | Endpoint | Return |
|---|---|---|
| `getOrders()` | GET `/orders` | `Observable<{orders: Order[]}>` |
| `createOrder(order)` | POST `/orders` | `Observable<{success, order}>` |
| `updateOrderStatus(id, status)` | PATCH `/orders/{id}/status` | `Observable<{success}>` |
| `deleteOrder(id)` | DELETE `/orders/{id}` | `Observable<{success}>` |
| `assignOrder(orderId, userId)` | PATCH `/orders/{orderId}/assign` | `Observable<{success}>` |
| `exportOrders(status?, format?)` | GET `/orders/export` | `Observable<Blob>` |
| `getCustomers()` | GET `/customers` | `Observable<{customers: Customer[]}>` |
| `createCustomer(customer)` | POST `/customers` | `Observable<{success, customer}>` |
| `getWorkers()` | GET `/users/workers` | `Observable<{users: User[]}>` |

#### DashboardService (`dashboard.service.ts`)

| Method | Endpoint | Return |
|---|---|---|
| `getDashboard()` | GET `/dashboard` | `Observable<{stats: DashboardStats, activities: DashboardActivity[]}>` |
| `getAnalytics(period?)` | GET `/analytics?period={period}` | `Observable<{summary, revenueChart?, categoryChart?, topProducts, ...}>` |
| `exportAnalytics(period?, format?)` | GET `/analytics/export` | `Observable<Blob>` |
| `generateBusinessReport(period?, format?)` | GET `/analytics/export` | `Observable<Blob>` (same as exportAnalytics) |

#### UserService (`user.service.ts`)

| Method | Endpoint | Return |
|---|---|---|
| `getMe()` | GET `/users/me` | `Observable<{user: User}>` |
| `getMyAvatar()` | GET `/users/me/avatar` | `Observable<Blob>` |
| `uploadAvatar(file)` | POST `/users/me/avatar` | `Observable<{success, message}>` — FormData with credentials |
| `updateMe(data)` | PATCH `/users/me` | `Observable<{user: User}>` |
| `changePassword(current, new)` | PATCH `/users/me/password` | `Observable<{success, message}>` |
| `deleteMe()` | DELETE `/users/me` | `Observable<{success}>` |

---

### 2.8.6 SocketService (`socket.service.ts`)

**Observable:** `orderAssigned$: Subject<OrderAssignedEvent>` — Emits when worker receives an order assignment

| Method | Signature | Logic |
|---|---|---|
| `connect(userId)` | `(string) → void` | Creates socket.io connection to apiUrl; emits `'join'` with userId; listens for `'order:assigned'` events → pushes to `orderAssigned$` |
| `disconnect()` | `() → void` | Disconnects socket and sets to null |
| `ngOnDestroy()` | `() → void` | Calls disconnect() |

**Interface:** `OrderAssignedEvent = {orderId: string, product: string|null, details: string|null}`

---

### 2.8.7 I18nService (`i18n.service.ts`)

**Type:** `AppLanguage = 'en' | 'hu'`

**Signals:**
- `language: Signal<AppLanguage>` — Current language (persisted to localStorage key `'pc_language'`)
- `dictionary: Signal<Record<string, string>>` — Computed from `translations[language()]`

| Method | Signature | Logic |
|---|---|---|
| `setLanguage(lang)` | `(AppLanguage) → void` | Updates signal + persists to localStorage |
| `toggleLanguage()` | `() → void` | Toggles between 'en' and 'hu' |
| `locale()` | `() → string` | Returns `'hu-HU'` or `'en-US'` |
| `t(key, params?)` | `(string, Record<string, string\|number\|null>?) → string` | Looks up key in dictionary; substitutes `{paramKey}` placeholders; returns key if not found |

Contains **900+ translation keys** covering: navigation, auth, dashboard, products, orders, analytics, profile, admin, toasts, validation, etc.

---

### 2.8.8 ThemeService (`theme.service.ts`)

**Signal:** `isDark: Signal<boolean>` — Persisted to localStorage key `'pc_theme'`

| Method | Logic |
|---|---|
| `toggle()` | Flips isDark; persists; calls apply() |
| `apply()` | Adds/removes `'dark-theme'` class on `document.body` |

---

### 2.8.9 TranslatePipe (`translate.pipe.ts`)

**Pipe name:** `t` (standalone, **impure** — runs every change detection cycle)

```
{{ 'key.name' | t }}
{{ 'key.name' | t : { param: value } }}
```

Delegates to `I18nService.t(key, params)`.

---

### 2.8.10 ToastService (`toast.service.ts`)

**Interface:** `Toast = {id: number, message: string, type?: 'info'|'success'|'error'|'warning', timeout?: number}`

| Method | Signature | Logic |
|---|---|---|
| `show(message, opts?)` | `(string, Partial<Toast>?) → number` | Creates toast, auto-hides after timeout (default 4000ms), returns toast ID |
| `hide(id)` | `(number) → void` | Removes toast by ID |
| `clear()` | `() → void` | Removes all toasts |

**Observable:** `toasts$: Observable<Toast[]>` — Stream of current active toasts for the toast component to subscribe to.

---

### 2.8.11 Token Utilities (`token.util.ts`)

**Constants:** `TOKEN_KEY = 'pc_token'`, `USER_KEY = 'pc_user'`, `REMEMBER_KEY = 'pc_remember'`

| Function | Signature | Logic |
|---|---|---|
| `getStoredToken()` | `() → string\|null` | Returns token from localStorage or sessionStorage |
| `getStoredUser()` | `() → string\|null` | Returns user JSON from localStorage or sessionStorage |
| `storeAuth(token, userJson, remember)` | `(string, string, boolean) → void` | Stores to localStorage if remember=true, else sessionStorage; removes from other |
| `clearStoredAuth(preserveRemember?)` | `(boolean?) → void` | Removes auth keys from both storages; optionally preserves REMEMBER_KEY |
| `shouldRestoreSession()` | `() → boolean` | Returns `localStorage.getItem(REMEMBER_KEY) === 'true'` |

---

## 2.9 Frontend Models (`api.models.ts`)

### Core Interfaces

```typescript
interface User {
  id: string; email: string; username: string; fullname?: string; role: string;
}

interface AuthResponse {
  user: User; token: string; accessToken?: string; access_token?: string;
  requiresApproval?: boolean; message?: string | null;
}

interface Item {
  id: string; name: string; model?: string; price: number; amount: number;
  warranty?: number; category_id: string; brand_id: string; date_added?: string;
  category?: string; brand?: string;
}

interface Category { id: string; name: string; }
interface Brand    { id: string; name: string; }
interface Customer { id: string; name: string; email?: string; phone?: string; }

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string; orderNumber: string; product: string; productId: string;
  quantity: number; unitPrice: number; totalAmount: number; status: OrderStatus;
  customer: string; date: string; timestamp: string; assignedTo?: string | null;
}

interface Session {
  id: string; ip?: string; user_agent?: string; created_at: string; expires_at: string;
  user?: { email: string; username: string; };
}

interface AnalyticsSummary {
  totalRevenue: number; totalOrders: number; averageOrderValue: number;
  topSellingProduct: string; lowStockItems: number; revenueGrowth: number;
}

interface TopProduct { name: string; sales: number; revenue: number; trend: string; }
interface Transaction { id: string; product: string; customer: string; amount: number; status: string; date: string; }
interface DashboardStats { totalProducts?: number; totalSales?: string|number; activeOrders?: number; customers?: number; }
interface DashboardActivity { id: number; description: string; timestamp: string; type: string; }
interface AuditLog {
  id: string; event_type: string; actor_user_id?: string; target_user_id?: string;
  details?: Record<string, unknown>; created_at: string;
  actor?: { email: string; username: string; }; target?: { email: string; username: string; };
}
interface PendingAdmin { id: string; email: string; username: string; fullname?: string; }
```

---

## 2.10 Frontend Routes (`app.routes.ts`)

| Path | Component | Guards | Access |
|---|---|---|---|
| `''` | → redirect to `'dashboard'` | — | — |
| `'login'` | LoginComponent | GuestGuard | Guests only |
| `'register'` | RegisterComponent | GuestGuard | Guests only |
| `'forgot'` | ForgotComponent | GuestGuard | Guests only |
| `'reset-password'` | ResetPasswordComponent | GuestGuard | Guests only |
| `'dashboard'` | DashboardComponent | AuthGuard | All authenticated |
| `'products'` | ProductsComponent | AuthGuard | All authenticated |
| `'orders'` | OrdersComponent | AuthGuard | All authenticated |
| `'analytics'` | AnalyticsComponent | AuthGuard + StaffGuard | Admin + Worker only |
| `'profile'` | ProfileComponent | AuthGuard | All authenticated |
| `'admin/sessions'` | AdminSessionsComponent | AuthGuard + AdminGuard | Admin only |
| `'admin/audit'` | AdminAuditComponent | AuthGuard + AdminGuard | Admin only |
| `'admin/action-result'` | AdminActionResultComponent | AuthGuard + AdminGuard | Admin only |
| `'admin/pending-admins'` | → redirect to `'admin/sessions'` | — | — |
| `'**'` | → redirect to `'dashboard'` | — | Wildcard catch-all |

---

## 2.11 Root Component (`app.ts`)

**Selector:** `app-root` — Standalone component with RouterOutlet, LucideAngularModule, ToastComponent, TranslatePipe

**Signals/Properties:**
- `title = 'PC Store Manager'`
- `showNavbar: boolean` — Hidden on auth routes
- `isNavOpen: boolean` — Mobile nav toggle
- `isMobile: Signal<boolean>` — Responsive breakpoint

**Constructor Effect:**
```typescript
effect(() => {
  const user = this.auth.user();
  if (user?.id) this.socketService.connect(user.id);
  else this.socketService.disconnect();
});
```

| Method | Logic |
|---|---|
| `ngOnInit()` | Subscribes to router NavigationEnd; updates navbar visibility; listens to `socketService.orderAssigned$` → shows info toast with product name |
| `toggleTheme()` | Delegates to `theme.toggle()` |
| `toggleLanguage()` | Delegates to `i18n.toggleLanguage()` |
| `openProfile()` | Navigates to `/profile`, closes nav |
| `toggleNav()` | Toggles `isNavOpen` |
| `navigate(path)` | Navigates + closes nav |
| `isActive(path)` | Checks current URL match |
| `onResize()` | `@HostListener('window:resize')` — Updates isMobile; closes nav when switching to desktop |

---

# PART 2: FULL TUTORIAL

---

## Chapter 1: Introduction

### What This Project Does

PC Store Manager is a complete web application for managing a PC component store. It provides:

- A staff-facing dashboard with inventory management, order processing, and analytics
- A buyer portal for placing and tracking orders
- An admin panel for user management, session control, and audit trails
- Real-time notifications when orders are assigned to workers
- Bilingual support (English and Hungarian) with dark/light themes
- Export capabilities (CSV and PDF) for orders and analytics data

### Who This Tutorial Is For

This tutorial is for developers who want to:
- Understand how a full-stack Angular + Express application works
- Learn about JWT authentication with refresh token rotation
- See role-based access control in practice
- Build a production-ready web application with real-world features

### What You'll Learn

By the end of this tutorial, you'll understand:
- How to set up a monorepo with separate frontend and backend projects
- Express 5 REST API design with controllers, services, and middleware
- Angular 21 standalone components with signal-based state management
- JWT authentication with httpOnly cookie refresh tokens
- Supabase as a PostgreSQL-as-a-service backend
- Real-time features with Socket.io
- Internationalization (i18n) for multi-language support
- PDF and CSV export generation
- Role-based access control on both frontend and backend
- Deployment to Render

---

## Chapter 2: Prerequisites

### Required Tools

| Tool | Minimum Version | Purpose |
|---|---|---|
| **Node.js** | 18+ | JavaScript runtime for backend and build tools |
| **npm** | 9+ | Package manager (comes with Node.js) |
| **Git** | Any recent | Version control |
| **Code editor** | VS Code recommended | Development |

### Required Accounts & Services

| Service | Purpose | Cost |
|---|---|---|
| **Supabase** | PostgreSQL database hosting | Free tier available |
| **Gmail** (optional) | SMTP for email notifications | Free with App Password |
| **Render** (optional) | Production deployment | Free tier available |

### Recommended Knowledge

- Basic JavaScript/TypeScript
- Basic understanding of REST APIs
- Familiarity with HTML/CSS
- Command line basics

---

## Chapter 3: Setup

### 3.1 Clone the Repository

```bash
git clone https://github.com/Kiss-Martin/PC-Store-Manager.git
cd PC-Store-Manager
```

### 3.2 Install Dependencies

The monorepo root has a convenience script:

```bash
npm run install:all
```

This runs `npm install` in both `backend/` and `frontend/`. Alternatively, install them individually:

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3.3 Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **service_role key** (from Settings → API)
3. Create the required database tables using the SQL editor in Supabase:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  fullname TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'worker',
  admin_approved BOOLEAN DEFAULT TRUE,
  admin_approved_by UUID REFERENCES users(id),
  admin_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Brands
CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE
);

-- Items (Products)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  model TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  amount INTEGER NOT NULL DEFAULT 0,
  warranty INTEGER,
  category_id UUID REFERENCES categories(id),
  brand_id UUID REFERENCES brands(id),
  date_added DATE DEFAULT CURRENT_DATE
);

-- Customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT
);

-- Logs (order records and activity)
CREATE TABLE logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID REFERENCES items(id),
  customer_id UUID REFERENCES customers(id),
  user_id UUID REFERENCES users(id),
  assigned_to UUID REFERENCES users(id),
  action TEXT NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT now()
);

-- Order status tracking
CREATE TABLE orders_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id UUID REFERENCES logs(id),
  status TEXT NOT NULL DEFAULT 'pending',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Refresh tokens for session management
CREATE TABLE refresh_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip TEXT,
  user_agent TEXT,
  access_jti TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Revoked tokens for immediate JWT invalidation
CREATE TABLE revoked_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jti TEXT NOT NULL,
  reason TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  user_id UUID
);

-- Password reset tokens
CREATE TABLE password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);

-- Audit log
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  actor_user_id UUID REFERENCES users(id),
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed some categories
INSERT INTO categories (name) VALUES
  ('Processors'), ('Graphics Cards'), ('Memory'), ('Storage'),
  ('Motherboards'), ('Power Supplies'), ('Cases'), ('Cooling'),
  ('Peripherals'), ('Monitors');
```

> **Note:** The database schema is not included as migration files in the repository. The SQL above is inferred from the codebase and should match the expected structure.

### 3.4 Configure Environment Variables

Create `backend/.env`:

```env
# Server
PORT=3000

# Supabase
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-service-role-key-here

# JWT
JWT_SECRET=your-strong-secret-key-at-least-32-chars
REFRESH_TOKEN_SECRET=another-strong-secret-key

# CORS
CORS_ORIGINS=http://localhost:4200

# Frontend URL (used in email links)
FRONTEND_URL=http://localhost:4200

# SMTP (optional — emails will be logged to console if not configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM="PC Store Manager" <your-email@gmail.com>
```

**Important notes:**
- Generate strong secrets for `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (use `openssl rand -hex 32`)
- For Gmail SMTP, you need to create an [App Password](https://myaccount.google.com/apppasswords)
- If you skip SMTP configuration, the app still works — reset links and notifications are printed to the console instead

### 3.5 Start the Application

From the project root:

```bash
npm run dev
```

This starts both servers concurrently:
- **Backend** → `http://localhost:3000`
- **Frontend** → `http://localhost:4200`

You should see output like:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   BACKEND SERVER STARTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Port:        3000
   Environment: development
   SMTP:        configured (smtp.gmail.com:587, secure=false)
   Trust proxy: false
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Open `http://localhost:4200` in your browser.

---

## Chapter 4: Project Structure Explained

```
PC-Store-Manager/
│
├── package.json              # Monorepo root — scripts to run both projects
├── render.yaml               # Render deployment configuration
├── start.js                  # Cross-platform launcher (Node.js)
├── start.bat                 # Windows launcher
├── start.sh                  # Unix/Mac launcher
│
├── backend/                  # Express 5 API server
│   ├── package.json          # Backend dependencies and scripts
│   ├── jest.config.js        # Jest test configuration
│   │
│   ├── src/
│   │   ├── index.js          # ★ App entry point — Express setup, middleware, routes, Socket.io
│   │   ├── db.js             # Supabase client initialization
│   │   ├── validators.js     # Zod validation schemas for all endpoints
│   │   │
│   │   ├── controllers/      # HTTP request handlers (one per domain)
│   │   │   ├── auth.controller.js        # Auth: register, login, refresh, logout, sessions, approvals
│   │   │   ├── item.controller.js        # Items: CRUD + categories + brands
│   │   │   ├── order.controller.js       # Orders: CRUD + status + export
│   │   │   ├── analytics.controller.js   # Analytics: charts + export
│   │   │   ├── customer.controller.js    # Customers: list + create
│   │   │   ├── dashboard.controller.js   # Dashboard: aggregated stats
│   │   │   ├── user.controller.js        # Users: profile, avatar, password
│   │   │   ├── health.controller.js      # Health check endpoints
│   │   │   └── support.controller.js     # Contact support email
│   │   │
│   │   ├── services/         # Business logic layer
│   │   │   ├── auth.service.js           # Auth business logic (bcrypt, JWT, email)
│   │   │   ├── item.service.js           # Item CRUD logic
│   │   │   ├── order.service.js          # Order logic (stock, assignments, notifications)
│   │   │   ├── analytics.service.js      # Analytics calculation and export
│   │   │   ├── customer.service.js       # Customer CRUD logic
│   │   │   └── user.service.js           # User profile logic
│   │   │
│   │   ├── routes/           # Express Router definitions
│   │   │   ├── auth.routes.js            # /auth/* routes with rate limiting
│   │   │   ├── item.routes.js            # /items/* routes (admin-only writes)
│   │   │   ├── order.routes.js           # /orders/* routes (role-based)
│   │   │   ├── analytics.routes.js       # /analytics/* routes (staff-only)
│   │   │   ├── customer.routes.js        # /customers/* routes
│   │   │   ├── dashboard.routes.js       # /dashboard route
│   │   │   ├── user.routes.js            # /users/* routes with avatar upload
│   │   │   ├── health.routes.js          # /health/* routes (no auth)
│   │   │   └── support.routes.js         # /support/* routes (no auth, rate limited)
│   │   │
│   │   ├── middlewares/      # Express middleware
│   │   │   ├── auth.middleware.js        # JWT verification + role checks
│   │   │   ├── error.middleware.js       # Centralized error handler
│   │   │   ├── language.middleware.js    # Accept-Language parsing
│   │   │   └── sanitize.middleware.js    # XSS input sanitization
│   │   │
│   │   └── utils/            # Shared utilities
│   │       ├── config.js                 # Environment variable loader
│   │       ├── constants.js              # Order status constants
│   │       ├── async.util.js             # Async route wrapper
│   │       ├── audit.util.js             # Audit log writer
│   │       ├── csv.util.js              # CSV generation
│   │       ├── email.template.js         # HTML email templates (EN/HU)
│   │       ├── i18n.util.js              # Backend translation function
│   │       ├── mail.util.js              # Nodemailer transporter setup
│   │       ├── pdf.util.js              # PDFKit report generation
│   │       ├── scrub.util.js             # Sensitive field scrubbing
│   │       ├── socket.util.js            # Socket.io instance holder
│   │       ├── supabase.util.js          # Supabase query error handler
│   │       └── token.util.js             # Token hashing utility
│   │
│   ├── tests/               # Jest unit tests
│   │   ├── auth.middleware.test.js
│   │   ├── routes.test.js
│   │   ├── utils.test.js
│   │   └── validators.test.js
│   │
│   ├── scripts/             # Utility scripts (migration, JWT gen, etc.)
│   └── uploads/avatars/     # User avatar storage
│
├── frontend/                # Angular 21 SPA
│   ├── package.json         # Frontend dependencies and scripts
│   ├── angular.json         # Angular CLI configuration
│   ├── tsconfig.json        # TypeScript base config
│   ├── cypress.config.ts    # Cypress E2E test config
│   │
│   ├── src/
│   │   ├── main.ts          # Angular bootstrap entry point
│   │   ├── index.html       # Root HTML file
│   │   ├── styles.css       # Global styles (Tailwind CSS 4, themes, print styles)
│   │   │
│   │   ├── app/
│   │   │   ├── app.ts               # ★ Root component (navbar, WebSocket, routing)
│   │   │   ├── app.html             # Root template
│   │   │   ├── app.routes.ts        # Route definitions with guards
│   │   │   ├── app.config.ts        # Angular providers (router, HTTP, icons)
│   │   │   ├── i18n.service.ts      # Translation service (900+ keys, EN/HU)
│   │   │   ├── theme.service.ts     # Dark/light mode service
│   │   │   ├── translate.pipe.ts    # {{ 'key' | t }} pipe
│   │   │   │
│   │   │   ├── auth/                # Authentication module
│   │   │   │   ├── auth.service.ts      # Auth state, login, register, refresh, logout
│   │   │   │   ├── auth.interceptor.ts  # HTTP interceptor (token attach, 401 refresh)
│   │   │   │   ├── auth.guard.ts        # Redirect to login if unauthenticated
│   │   │   │   ├── admin.guard.ts       # Redirect if not admin
│   │   │   │   ├── staff.guard.ts       # Block buyer role from staff pages
│   │   │   │   ├── guest.guard.ts       # Redirect to dashboard if already logged in
│   │   │   │   ├── login/              # Login page component
│   │   │   │   ├── register/           # Multi-step registration wizard
│   │   │   │   ├── forgot/             # Forgot password page
│   │   │   │   └── reset-password/     # Reset password page
│   │   │   │
│   │   │   ├── services/            # API service layer
│   │   │   │   ├── api.service.ts       # Base HTTP client wrapper
│   │   │   │   ├── item.service.ts      # Product API calls
│   │   │   │   ├── order.service.ts     # Order + customer + worker API calls
│   │   │   │   ├── dashboard.service.ts # Dashboard + analytics API calls
│   │   │   │   ├── user.service.ts      # Profile/avatar API calls
│   │   │   │   └── socket.service.ts    # WebSocket client
│   │   │   │
│   │   │   ├── models/              # TypeScript interfaces
│   │   │   │   └── api.models.ts        # All shared types
│   │   │   │
│   │   │   ├── utils/               # Frontend utilities
│   │   │   │   └── token.util.ts        # Token storage helpers
│   │   │   │
│   │   │   ├── shared/              # Shared components
│   │   │   │   ├── toast.service.ts     # Toast notification service
│   │   │   │   └── toast/              # Toast UI component
│   │   │   │
│   │   │   ├── dashboard/           # Dashboard page
│   │   │   ├── components/          # Feature page components
│   │   │   │   ├── products.component/  # Products CRUD page
│   │   │   │   ├── orders.component/    # Orders management page
│   │   │   │   ├── analytics.component/ # Analytics charts page
│   │   │   │   └── profile.component/   # User profile page
│   │   │   │
│   │   │   ├── admin-sessions/      # Admin session management page
│   │   │   ├── admin-audit/         # Admin audit log viewer
│   │   │   └── admin-action-result/ # Admin one-click action result page
│   │   │
│   │   └── environments/            # Environment configs
│   │       ├── environment.ts           # Dev: http://localhost:3000
│   │       └── environment.prod.ts      # Prod: https://pc-store-manager.onrender.com
│   │
│   ├── cypress/             # E2E test suite
│   │   ├── e2e/
│   │   │   ├── analytics/analytics.cy.ts
│   │   │   ├── auth/login.cy.ts, register.cy.ts, forgot.cy.ts
│   │   │   ├── dashboard/dashboard.cy.ts
│   │   │   ├── navigation/guards.cy.ts, theme-language.cy.ts
│   │   │   ├── orders/orders.cy.ts
│   │   │   ├── products/products.cy.ts
│   │   │   └── profile/profile.cy.ts
│   │   └── support/e2e.ts
│   │
│   └── public/
│       └── _redirects        # SPA routing for Render static hosting
│
└── docs/
    └── documentation/
        ├── BACKEND_DOCUMENTATION.md
        └── FRONTEND_DOCUMENTATION.md
```

---

## Chapter 5: Step-by-Step Build Guide

This chapter walks through how the project was built conceptually, explaining **why** each piece exists.

### Step 1: Monorepo Setup

**Why:** Having frontend and backend in one repository simplifies development, deployment, and version management.

The root `package.json` uses `concurrently` to run both projects simultaneously:

```json
{
  "scripts": {
    "backend": "cd backend && npm run dev",
    "frontend": "cd frontend && npm start",
    "dev": "concurrently \"npm:backend\" \"npm:frontend\""
  }
}
```

### Step 2: Backend Foundation (Express 5 + Supabase)

**Why Express 5?** Express 5 has native async error handling — no more wrapping every handler in try/catch. Combined with the `asyncWrap` utility, the code is clean and errors always reach the centralized handler.

**Why Supabase?** Supabase provides a hosted PostgreSQL database with a JavaScript client library. It eliminates the need to manage database servers, run migrations manually, or write raw SQL for most operations.

**Entry point (`src/index.js`):**

```javascript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server as IO } from 'socket.io';

const app = express();

// Security & parsing middleware
app.use(cors({ origin: CORS_ORIGINS, credentials: true }));
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Custom middleware
app.use(sanitizeMiddleware);    // XSS protection
app.use(languageMiddleware);    // i18n support
app.use(scrubResponseMiddleware); // Strip sensitive fields

// Routes
app.use('/auth', authRoutes);
app.use('/items', itemRoutes);
app.use('/orders', orderRoutes);
// ... more routes

// Error handler (must be last)
app.use(errorHandler);

// WebSocket setup
const server = createServer(app);
const io = new IO(server, { cors: { origin: CORS_ORIGINS } });
server.listen(PORT);
```

**Key design decisions:**
- **100kb JSON limit** prevents large payload attacks
- **Rate limiting** (200 req/15 min global, 15 req/15 min for auth) protects against brute force
- **Helmet** sets security headers (CSP, HSTS, X-Frame-Options, etc.)
- **httpOnly cookies** for refresh tokens prevent XSS from stealing session tokens

### Step 3: Database Client (`db.js` + `supabase.util.js`)

**Why wrap Supabase queries?** Supabase doesn't throw errors — it returns `{ data, error }`. The `run()` utility converts this to throw/catch pattern:

```javascript
// supabase.util.js
export async function run(query) {
  const { data, error } = await query;
  if (error) {
    const err = new Error(error.message);
    err.code = error.code;  // Preserve Postgres error codes (e.g., 23505 for unique violations)
    throw err;
  }
  return data;
}
```

This means service code can be written as:
```javascript
const user = await run(supabase.from('users').select('*').eq('id', userId).single());
```

Instead of manually checking `{ data, error }` every time.

### Step 4: Validation with Zod

**Why Zod?** Zod provides type-safe runtime validation with excellent error messages. Every endpoint validates its input before processing:

```javascript
// validators.js
export const createItemSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
  category_id: z.string().min(1),
  brand_id: z.string().min(1),
  amount: z.number().int().nonnegative().optional(),
});

// In the controller:
export const createItem = async (req, res) => {
  const parse = createItemSchema.safeParse(req.body);
  if (!parse.success)
    return res.status(400).json({ error: localizeValidationErrors(req.lang, parse.error.errors) });
  const item = await ItemService.createItem(parse.data, req.user?.id);
  res.json({ success: true, item });
};
```

**Why localized validation errors?** The `localizeValidationErrors()` function converts Zod's error codes to human-readable messages in the user's language.

### Step 5: JWT Authentication System

**Why JWT with refresh tokens?** Short-lived access tokens (1 hour) limit the damage if a token is stolen. Refresh tokens (stored as httpOnly cookies) enable "remember me" without exposing credentials.

The authentication flow:

1. **Login/Register:** Server returns an access JWT + sets a refresh token as an httpOnly cookie
2. **API calls:** Frontend attaches access JWT in `Authorization: Bearer <token>` header
3. **Token expiry:** When a 401 is received, the interceptor automatically calls `/auth/refresh`
4. **Refresh:** Server validates the cookie, rotates the refresh token, returns a new access JWT
5. **Logout:** Server revokes the refresh token and adds the access token's JTI to revoked list

**Token rotation** (in `auth.service.js`):
```javascript
async refreshAccessToken(token, metadata) {
  const tokenHash = hashToken(token);
  const rt = await run(supabase.from('refresh_tokens')
    .select('id,user_id,expires_at,ip,user_agent')
    .eq('token_hash', tokenHash).single());
  
  // Verify not expired + metadata matches
  if (new Date(rt.expires_at) < new Date()) return null;
  if (isMetadataMismatch(rt, metadata)) return null;
  
  // Rotate: delete old, create new
  await run(supabase.from('refresh_tokens').delete().eq('id', rt.id));
  const newRefresh = generateRefreshTokenStr();
  const newHash = hashToken(newRefresh);
  await run(supabase.from('refresh_tokens').insert({
    user_id: user.id, token_hash: newHash, expires_at: rt.expires_at
  }));
  
  return { accessToken, refreshToken: newRefresh };
}
```

### Step 6: Role-Based Access Control

**Three roles, three levels of access:**

| Role | Can Access |
|---|---|
| `admin` | Everything — all CRUD, analytics, session management, audit, admin approvals |
| `worker` | Products (read), assigned orders (status updates), analytics, dashboard |
| `buyer` | Place orders, view own orders, profile management |

**Backend enforcement** uses `requireRole()` middleware:
```javascript
// Only admin can delete items
router.delete('/:id', authMiddleware, requireRole('admin'), asyncWrap(ItemController.deleteItem));

// Admin and buyer can create orders
router.post('/', authMiddleware, requireRole('admin', 'buyer'), asyncWrap(OrderController.createOrder));
```

**Frontend enforcement** uses route guards:
```typescript
{ path: 'analytics', component: AnalyticsComponent, canActivate: [AuthGuard, StaffGuard] }
{ path: 'admin/sessions', component: AdminSessionsComponent, canActivate: [AuthGuard, AdminGuard] }
```

### Step 7: Frontend Angular Application

**Why Angular 21 standalone components?** Standalone components eliminate NgModules, making each component self-contained. Combined with signals, this creates a modern, performant architecture.

**Root component (`app.ts`):**
```typescript
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, LucideAngularModule, ToastComponent, TranslatePipe],
})
export class App implements OnInit {
  constructor(
    public router: Router,
    public auth: AuthService,
    public theme: ThemeService,
    public i18n: I18nService,
    private socketService: SocketService,
  ) {
    // Auto-connect WebSocket when user is authenticated
    effect(() => {
      const user = this.auth.user();
      if (user?.id) this.socketService.connect(user.id);
      else this.socketService.disconnect();
    });
  }
}
```

**Why signals?** Angular signals (`signal()`, `computed()`, `effect()`) provide fine-grained reactivity. The `auth.user()` signal automatically triggers the WebSocket connection when a user logs in.

### Step 8: HTTP Interceptor

**Why an interceptor?** Instead of adding auth headers in every service call, the interceptor:
1. Attaches the JWT to every outgoing request
2. Sets the `Accept-Language` header for i18n
3. Catches 401 errors and attempts a silent refresh
4. Retries the failed request if refresh succeeds
5. Logs out the user if refresh fails

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = getStoredToken();
  let outgoing = req.clone({
    setHeaders: {
      Authorization: token ? `Bearer ${token}` : '',
      'Accept-Language': localStorage.getItem('pc_language') || 'en',
    }
  });

  return next(outgoing).pipe(
    catchError((err) => {
      if (err?.status === 401 && !isAuthEndpoint) {
        return authService.refresh().pipe(
          switchMap(() => next(req.clone({ /* new token */ }))),
          catchError(() => { authService.logout('expired'); return throwError(() => err); })
        );
      }
      return throwError(() => err);
    })
  );
};
```

### Step 9: Internationalization (i18n)

**Why custom i18n?** Angular's built-in i18n requires separate builds per locale. This project uses a runtime solution with a signal-based dictionary service that supports instant language switching.

**Backend:** The `i18n.util.js` provides a `t(lang, key, params)` function used in error messages, validation, and exports:
```javascript
const err = new Error(t(lang, 'auth.invalidCredentials'));
err.statusCode = 401;
throw err;
```

**Frontend:** The `I18nService` holds 900+ translation keys and exposes a `t()` method:
```typescript
// In templates:
{{ 'app.nav.dashboard' | t }}

// In code:
this.i18n.t('orders.assignedToYou', { product: productName })
```

### Step 10: Real-Time Notifications

**Why Socket.io?** When an admin assigns an order to a worker, the worker should see it immediately without refreshing. Socket.io provides bidirectional communication:

**Backend (order assignment):**
```javascript
async assignOrder(id, assigned_to) {
  const io = getIO();
  if (io) {
    io.to(`user:${assigned_to}`).emit('order:assigned', {
      orderId: id,
      product: log?.items?.name,
    });
  }
  // Update database...
}
```

**Frontend (listening):**
```typescript
this.socketService.orderAssigned$.subscribe((event) => {
  this.toast.show(this.i18n.t('orders.assignedToYou', { product: event.product }), { type: 'info' });
});
```

### Step 11: Export System (CSV + PDF)

**CSV generation** uses a simple utility:
```javascript
export function generateCsvFromObjects(columns, rows) {
  const header = columns.map(c => escapeCsvValue(c.label)).join(',') + '\n';
  const lines = rows.map(row => columns.map(c => escapeCsvValue(row[c.key])).join(','));
  return '\uFEFF' + header + lines.join('\n'); // BOM for Excel compatibility
}
```

**PDF generation** uses PDFKit with custom table rendering:
```javascript
export function generatePdfReport({ title, subtitle, summary, columns, rows }) {
  const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
  doc.font('Helvetica-Bold').fontSize(20).text(title);
  drawTable(doc, columns, rows, doc.y);
  doc.end();
}
```

Both formats support localized column headers and status values.

---

## Chapter 6: Running the Project

### Development Mode

```bash
# From project root
npm run dev
```

| Service | URL | Notes |
|---|---|---|
| Frontend | http://localhost:4200 | Angular dev server with hot reload |
| Backend API | http://localhost:3000 | Express server with file watching |
| Swagger UI | http://localhost:3000/docs | API documentation (minimal) |
| Health Check | http://localhost:3000/health | Verify database connectivity |

### What to Expect

1. **First visit** — You'll see the login page
2. **Register** — Create an account using the multi-step form (choose admin/worker/buyer role)
3. **First admin** — The first admin account is auto-approved; subsequent admins need approval from an existing admin
4. **Dashboard** — After login, you'll see the dashboard with stats
5. **Products** — Admins can add/edit/delete products; workers and buyers can view
6. **Orders** — Buyers can place orders; admins can assign orders to workers; workers can update status
7. **Analytics** — Staff (admin/worker) can view revenue charts and trends

### Alternative Launch Methods

```bash
# Windows: double-click start.bat
# Mac/Linux: ./start.sh
# Cross-platform Node launcher: npm run dev:launch
# Auto-open browser: npm run dev:open
```

---

## Chapter 7: Testing

### 7.1 Backend Tests (Jest)

```bash
cd backend
npm test
```

The backend has four test files:

| Test File | What It Tests |
|---|---|
| `validators.test.js` | All Zod validation schemas (register, login, items, orders, customers, brands, passwords) |
| `auth.middleware.test.js` | JWT verification, missing/invalid tokens, expired tokens, role-based access |
| `utils.test.js` | Sanitize middleware, language middleware, error handler, async wrapper, CSV generation, token hashing, response scrubbing |
| `routes.test.js` | HTTP endpoint integration tests (root, auth, health) with mocked Supabase |

**To run with coverage:**
```bash
npm run test:coverage
```

### 7.2 Frontend Tests

**Unit tests (Karma + Jasmine):**
```bash
cd frontend
npm test
```

> **Note:** The frontend project has Karma configured but no spec files were found in the codebase. This is an area that needs improvement.

**E2E tests (Cypress):**
```bash
cd frontend
npm run cy:open     # Interactive mode (opens Cypress UI)
npm run cy:run      # Headless mode (CI-friendly)
```

The Cypress suite covers:
| Test Area | File |
|---|---|
| Login flow | `e2e/auth/login.cy.ts` |
| Registration | `e2e/auth/register.cy.ts` |
| Forgot password | `e2e/auth/forgot.cy.ts` |
| Dashboard | `e2e/dashboard/dashboard.cy.ts` |
| Products | `e2e/products/products.cy.ts` |
| Orders | `e2e/orders/orders.cy.ts` |
| Analytics | `e2e/analytics/analytics.cy.ts` |
| Profile | `e2e/profile/profile.cy.ts` |
| Route guards | `e2e/navigation/guards.cy.ts` |
| Theme & language | `e2e/navigation/theme-language.cy.ts` |

### 7.3 Test Assessment

**Strengths:**
- Backend validation schemas are thoroughly tested
- Middleware tests are well-structured with proper mocking
- E2E tests cover all major user flows
- Route integration tests mock Supabase realistically

**Areas for improvement:**
- **No frontend unit tests** — Services and components lack spec files
- **No backend service tests** — Business logic in services (auth, orders, analytics) is untested at the unit level
- **No controller tests** — Controllers are only tested through route integration tests
- **Missing edge cases** — Token refresh rotation, concurrent requests, race conditions are not tested

---

## Chapter 8: Common Issues & Fixes

### Issue 1: "SUPABASE_URL or SUPABASE_KEY is not set"

**Cause:** Missing or incorrectly named `.env` file.

**Fix:** Ensure `backend/.env` exists with the correct variables. The file must be in the `backend/` directory, not the project root.

### Issue 2: "FATAL: JWT_SECRET must be set in production"

**Cause:** Running with `NODE_ENV=production` without setting a custom `JWT_SECRET`.

**Fix:** Set a strong `JWT_SECRET` in your environment variables. Never use the default in production.

### Issue 3: CORS Errors in Browser

**Cause:** Frontend URL isn't in the `CORS_ORIGINS` list.

**Fix:** Add your frontend URL to `CORS_ORIGINS` in `backend/.env`:
```env
CORS_ORIGINS=http://localhost:4200,http://localhost:4201
```

### Issue 4: Emails Not Sending

**Cause:** SMTP not configured or Gmail blocking less-secure apps.

**Fix:** 
- For Gmail, create an App Password at https://myaccount.google.com/apppasswords
- Check SMTP configuration in `.env` — all of `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` are required
- If you don't need email, the app works fine — reset links are logged to the console

### Issue 5: "relation 'users' does not exist"

**Cause:** Database tables haven't been created in Supabase.

**Fix:** Run the SQL schema from Chapter 3.3 in your Supabase SQL editor.

### Issue 6: "Cannot use import statement outside a module"

**Cause:** Running backend tests or scripts without the `--experimental-vm-modules` flag.

**Fix:** Use the npm script (`npm test`) which includes the flag, or run:
```bash
node --experimental-vm-modules node_modules/jest/bin/jest.js
```

### Issue 7: Avatar Upload Fails

**Cause:** Missing `uploads/avatars/` directory.

**Fix:** The directory should be auto-created by the multer setup, but if it isn't:
```bash
mkdir -p backend/uploads/avatars
```

### Issue 8: Admin Registration Hangs

**Cause:** First admin account needs to be auto-approved. If the admins-approval logic fails, the account may be stuck.

**Fix:** The first admin account is auto-approved when no other approved admins exist. If something goes wrong, manually update the database:
```sql
UPDATE users SET admin_approved = true WHERE role = 'admin';
```

---

## Chapter 9: Improvements & Best Practices

### 9.1 Code Quality Improvements

1. **Add TypeScript to the backend** — The backend is currently plain JavaScript. TypeScript would catch type errors at compile time, improve IDE support, and make the codebase more maintainable.

2. **Add frontend unit tests** — The Angular project has no spec files. Each service and component should have corresponding test files. Use Angular's `TestBed` and `HttpClientTestingModule` for isolated testing.

3. **Create a dedicated `orders` table** — The current design stores orders in the `logs` table and extracts data via regex. A dedicated `orders` table with proper columns (order_number, quantity, total_amount) would be more robust and performant.

4. **Add database migrations** — Use a migration system (like `supabase db push` with local migrations or a tool like `dbmate`) to version-control the database schema.

5. **Populate Swagger documentation** — The Swagger setup exists but generates an empty spec. Annotate routes with JSDoc comments or use a separate OpenAPI spec file.

### 9.2 Architecture Improvements

6. **Implement lazy loading** — Frontend routes currently eager-load all components. Use Angular's lazy loading with `loadComponent`:
   ```typescript
   { path: 'analytics', loadComponent: () => import('./components/analytics.component/analytics.component').then(m => m.AnalyticsComponent) }
   ```

7. **Add request logging** — Use a logging library (like `pino` or `winston`) instead of `console.log/warn` for structured logging, log levels, and log rotation.

8. **Implement proper rate limiting per user** — Current rate limiting is per IP only. Combine IP and user-based rate limiting for authenticated endpoints.

9. **Add input validation on frontend** — While the backend validates all inputs, the frontend should also validate before sending requests to provide immediate feedback and reduce unnecessary API calls.

### 9.3 Scalability

10. **Add caching** — Analytics queries hit the database on every request. Redis or in-memory caching with TTL would significantly reduce load.

11. **Implement pagination everywhere** — Some endpoints (e.g., items, orders for non-admin users) return all records. Add cursor or offset pagination.

12. **Use a job queue for emails** — Currently, emails are sent synchronously during request handling. A job queue (like BullMQ) would prevent email failures from affecting user experience.

13. **Add health check for external dependencies** — The `/health/ready` endpoint checks Supabase but not SMTP or Socket.io. Comprehensive health checks help with monitoring.

### 9.4 Security Enhancements

14. **Store refresh tokens with expiry index** — Add a PostgreSQL index on `refresh_tokens.expires_at` for efficient cleanup and lookup.

15. **Implement CSRF protection** — While httpOnly cookies help, adding CSRF tokens for state-changing operations would add an extra layer of security.

16. **Add account lockout** — After N failed login attempts, temporarily lock the account or add CAPTCHA.

---

## Chapter 10: Deployment

### Render Deployment

The project includes a `render.yaml` for one-click deployment to Render:

**Backend** deploys as a Node.js web service:
- Build command: `npm install`
- Start command: `npm start` (which runs `node src/index.js`)
- Environment variables must be set in Render dashboard

**Frontend** deploys as a static site:
- Build command: `npm install && npm run build`
- Publish directory: `dist/frontend/browser`
- The `public/_redirects` file ensures SPA routing works (all paths → index.html)

**Environment variables for production:**
```
NODE_ENV=production
TRUST_PROXY=1
SUPABASE_URL=<your-supabase-url>
SUPABASE_KEY=<your-service-role-key>
JWT_SECRET=<strong-random-secret>
FRONTEND_URL=https://your-frontend.onrender.com
CORS_ORIGINS=https://your-frontend.onrender.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your-email>
SMTP_PASS=<your-app-password>
```

---

## Chapter 11: Conclusion

### Recap

In this tutorial, you've learned:

- **Project architecture:** A monorepo with Angular 21 frontend and Express 5 backend, using Supabase/PostgreSQL as the database layer
- **Authentication:** JWT access tokens with httpOnly cookie refresh token rotation, including JTI-based immediate revocation
- **Role-based access:** Three-tier role system (admin/worker/buyer) enforced on both frontend (guards) and backend (middleware)
- **Real-time features:** Socket.io for order assignment notifications
- **Internationalization:** Bilingual support (EN/HU) with 900+ translation keys
- **Export system:** CSV and PDF report generation with localized content
- **Testing:** Jest for backend unit tests, Cypress for E2E tests
- **Deployment:** Render configuration for both frontend and backend

### Next Steps

1. **Run the project locally** and explore each feature
2. **Read the existing documentation** in `docs/documentation/` for deeper API reference
3. **Write frontend unit tests** to close the testing gap
4. **Add database migrations** to make the schema reproducible
5. **Implement lazy loading** for better production performance
6. **Extend the Swagger documentation** for API consumers
7. **Add more roles or permissions** as the business needs grow

### Key Takeaways

- **Separation of concerns** is the most important architectural principle — controllers handle HTTP, services handle logic, middleware handles cross-cutting concerns
- **Security is layered** — CORS, Helmet, rate limiting, input sanitization, JWT verification, role checks, and response scrubbing all work together
- **Always validate on the backend** — Frontend validation is for UX; backend validation is for security
- **Plan for internationalization early** — Adding i18n support later is much harder than building it in from the start
- **Use httpOnly cookies for sensitive tokens** — This prevents XSS attacks from stealing session tokens
