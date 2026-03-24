# Frontend Documentation

Last updated: March 24, 2026

## 1) Overview

The frontend is a standalone-component Angular 21 application for PC Store Manager. It provides authentication, inventory/order/customer workflows, analytics dashboards with Chart.js, profile and session management, admin moderation tools, bilingual localization (English / Hungarian), dark/light theming, and toast/modal-based UX feedback.

Core stack:

| Layer | Technology |
|-------|-----------|
| Framework | Angular 21 (standalone components, signals) |
| Routing | Angular Router + functional guards (`AuthGuard`, `AdminGuard`, `GuestGuard`) |
| HTTP | `HttpClient` + functional interceptor (`authInterceptor`) |
| Charts | `ng2-charts` + `chart.js` 4.x |
| Icons | `lucide-angular` |
| Styling | Tailwind CSS 4 utility classes + custom CSS (light/dark themes via CSS custom properties) |
| i18n | Custom signal-based service with `TranslatePipe` (`en` / `hu`) |

## 2) App architecture

### Bootstrap

- `src/main.ts` bootstraps `App` with `appConfig`
- `app.config.ts` provides: router, global HTTP interceptor, Lucide icon set

### Root shell (`app.ts` / `app.html`)

- Controls navbar visibility (hidden on auth screens)
- Mobile hamburger menu with responsive navigation
- Theme toggle (dark/light) and language toggle (EN/HU)
- Profile link and logout button
- Navbar visibility is determined by authentication state and current route

### Environment configuration

- `environment.ts` — Development: `production: false`, `apiUrl: http://localhost:3000`
- `environment.prod.ts` — Production: `production: true`, `apiUrl` pointing to Render backend

## 3) Routing map

| Path | Component | Guard | Notes |
|------|-----------|-------|-------|
| `/` | — | — | Redirects to `/dashboard` |
| `/login` | `LoginComponent` | `GuestGuard` | Email/password login with remember-me and support modal |
| `/register` | `RegisterComponent` | `GuestGuard` | 4-step workflow with role selection |
| `/forgot` | `ForgotComponent` | `GuestGuard` | Password reset request (non-disclosing) |
| `/reset-password` | `ResetPasswordComponent` | `GuestGuard` | Token-based password reset |
| `/dashboard` | `DashboardComponent` | `AuthGuard` | Stats, activity feed, quick actions, report download |
| `/products` | `ProductsComponent` | `AuthGuard` | Product CRUD, search/filter, category/brand selection |
| `/orders` | `OrdersComponent` | `AuthGuard` | Order list, status workflow, assignment, export |
| `/analytics` | `AnalyticsComponent` | `AuthGuard` | Charts, summary cards, export |
| `/profile` | `ProfileComponent` | `AuthGuard` | Profile edit, avatar, password change, sessions |
| `/admin/sessions` | `AdminSessionsComponent` | `AuthGuard` + `AdminGuard` | All sessions, pending admin approvals |
| `/admin/audit` | `AdminAuditComponent` | `AuthGuard` + `AdminGuard` | Paginated audit log |
| `/admin/action-result` | `AdminActionResultComponent` | — | One-click email action result page |
| `/admin/pending-admins` | — | — | Redirects to `/admin/sessions` |
| `**` | — | — | Wildcard redirects to `/dashboard` |

## 4) Authentication and session management

Implemented in `auth.service.ts`, route guards, and `auth.interceptor.ts`.

### Token storage

- **Access token** + **user object** stored in:
  - `localStorage` if "remember me" is enabled (persists across browser sessions)
  - `sessionStorage` otherwise (cleared on tab close)
- **Refresh token** stored in a backend-issued httpOnly cookie (not accessible to JS)

### Startup / page refresh flow

1. `AuthService` constructor calls `loadFromStorage()` to restore token and user
2. If token is expired, auth data is cleared but the "remember me" preference is **preserved**
3. If remember-me is set and no valid token exists, `refresh()` is called automatically
4. `authReady` promise resolves once the startup flow (restore or refresh) has settled
5. Components that need auth data (e.g. `ProfileComponent`) await `authReady` before loading

### Interceptor behavior

- Attaches `Authorization: Bearer <token>` and `Accept-Language` headers to all outgoing requests
- On `401` responses (non-auth endpoints), attempts a transparent token refresh
- If refresh succeeds, the original request is retried with the new token
- If refresh fails, the user is logged out with a "session expired" toast

### Guards

| Guard | Behavior |
|-------|----------|
| `AuthGuard` | Allows route if authenticated; may attempt one-time refresh |
| `AdminGuard` | Same as `AuthGuard` + requires `admin` role |
| `GuestGuard` | Blocks auth pages for already-authenticated users |

## 5) API integration layer

### `ApiService` (`services/api.service.ts`)

Centralizes URL building and HTTP request helpers:

| Method | Purpose |
|--------|---------|
| `get<T>()` | Standard GET |
| `post<T>()` | Standard POST |
| `patch<T>()` | Standard PATCH |
| `delete<T>()` | Standard DELETE |
| `getWithCredentials<T>()` | GET with `withCredentials: true` (sends cookies) |
| `postWithCredentials<T>()` | POST with cookies |
| `deleteWithCredentials<T>()` | DELETE with cookies |
| `postFormData<T>()` | POST multipart/form-data (avatar upload) |
| `getBlob()` | GET that returns a `Blob` (file downloads, avatar fetch), sends cookies |

Base URL is read from `environment.apiUrl`.

### `AuthService` (`auth/auth.service.ts`)

Acts as the primary API client for all feature endpoints. All methods return typed `Observable<T>` using interfaces from `api.models.ts`. Key method groups:

- **Auth:** `login()`, `register()`, `refresh()`, `logout()`, `forgotPassword()`, `resetPassword()`
- **Profile:** `getMe()`, `updateProfile()`, `changePassword()`
- **Avatar:** `getMyAvatar()`, `uploadAvatar()`, `deleteAvatar()`
- **Sessions:** `getSessions()`, `revokeSession()`
- **Items:** `getItems()`, `createItem()`, `updateItem()`, `deleteItem()`, `getCategories()`, `getBrands()`
- **Orders:** `getOrders()`, `createOrder()`, `updateOrderStatus()`, `assignOrder()`, `deleteOrder()`, `exportOrders()`
- **Customers:** `getCustomers()`, `createCustomer()`
- **Analytics:** `getAnalytics()`, `exportAnalytics()`
- **Dashboard:** `getDashboard()`, `generateBusinessReport()`
- **Admin:** `getAllSessionsPaged()`, `listPendingAdmins()`, `approveAdmin()`, `rejectAdmin()`, `revokeSessionByAdmin()`
- **Workers:** `getWorkers()`

## 6) Feature components

### Authentication

- **Login** — Email/password, remember-me toggle, support contact modal
- **Register** — 4-step form (role selection → credentials → personal info → confirmation), handles admin approval workflow
- **Forgot password** — Generic non-disclosing success message
- **Reset password** — Token-based, from query parameter

### Dashboard

- Loads summary stats from `/dashboard` (total products, sales, active orders, customers)
- Recent activity feed
- Quick action buttons (new order, add product)
- Business report download modal (period selector, CSV/PDF format)
- **Print** button — opens the browser print dialog to print the current dashboard view
- Stats rebuild on language change via Angular `effect()`

### Products

- Full CRUD on inventory via `/items`
- Category and brand dropdowns (loaded from API)
- Search and filter UI
- Confirmation modal for deletes

### Orders

- Order listing with search, custom status filter dropdown (uses `custom-dropdown` class with `HostListener` click-outside detection)
- Order status updates (pending → processing → completed / cancelled)
- Manual order creation with inline customer creation option
- Worker assignment (admin only)
- Export orders as CSV/PDF
- **Print** button (admin only) — prints the current orders view via the browser print dialog

### Analytics

- Revenue line chart and category doughnut chart (`ng2-charts` / `chart.js`)
- Summary stat cards (revenue, orders, average order value, top product, low stock, growth)
- Top products table with trend indicators
- Recent transactions section (admin only)
- Period selector (`7days` / `30days` / `90days`)
- Export analytics as CSV/PDF
- **Print** button (admin only) — prints the current analytics view via the browser print dialog
- Charts auto-update colors on theme change

### Profile

- View and edit profile (email, username, fullname)
- Avatar upload with immediate preview (blob URL)
- Change password modal
- Active session listing with revoke capability
- Waits for `authReady` before loading data to prevent race conditions on page refresh

### Admin pages

- **Admin Sessions** (`/admin/sessions`)
  - Paginated session list with search, email filter, date range filter
  - Session revocation with confirmation modal
  - Pending admin approvals section with approve/reject confirmation modals
- **Audit Logs** (`/admin/audit`)
  - Paginated audit event stream
- **Admin Action Result** (`/admin/action-result`)
  - Displays result of one-click email approve/reject actions

### Shared UX components

- **ToastService** + **ToastComponent** — Non-blocking notifications (`info`, `success`, `error`, `warning`) with auto-dismiss
- **ConfirmationModalComponent** — Reusable modal for destructive actions (replaces native `confirm()` dialogs)

## 7) Internationalization and theming

### i18n

- `I18nService` contains an in-app dictionary with **450+ keys** for `en` and `hu`
- `TranslatePipe` (`| t`) renders translated keys in templates
- Current language stored in `localStorage` (`pc_language`)
- Interceptor sends language via `Accept-Language` header
- Language signal triggers reactive UI updates

### Theme

- `ThemeService` toggles dark/light mode via `body` class (`dark-theme`)
- Theme persisted in `localStorage` (`pc_theme`)
- Charts dynamically update their color scheme on theme change

### Print styles

- Global `@media print` rules defined in `src/styles.css`
- Hides navbar, buttons, inputs, selects, modals, and elements with the `.no-print` class
- Forces landscape orientation with `1.5cm` margins
- Styles tables with clean collapsed borders for readability
- Prevents page breaks inside cards and table rows (`break-inside: avoid`)
- Removes box shadows and transforms for clean paper output
- Preserves chart canvases and status badge colors via `print-color-adjust: exact`

## 8) Data contracts (`api.models.ts`)

The frontend defines shared TypeScript interfaces used across all services and components:

| Interface | Purpose |
|-----------|---------|
| `User` | User profile (id, email, username, fullname, role) |
| `AuthResponse` | Login/register response (supports `token`, `accessToken`, `access_token` variants) |
| `Item` | Product/inventory item |
| `Category` | Product category |
| `Brand` | Product brand |
| `Customer` | Customer record |
| `OrderStatus` | Type alias: `'pending' \| 'processing' \| 'completed' \| 'cancelled'` |
| `Order` | Order with product, customer, status, assignment |
| `Session` | Active session / refresh token metadata |
| `AnalyticsSummary` | Summary stats for analytics page |
| `TopProduct` | Top-selling product entry |
| `Transaction` | Recent transaction entry |
| `DashboardStats` | Dashboard summary statistics |
| `DashboardActivity` | Dashboard activity feed entry |
| `AuditLog` | Admin audit log entry |
| `PendingAdmin` | Pending admin registration |

## 9) Build and run

```bash
cd frontend
npm install
npm start        # Development server at http://localhost:4200
```

Other scripts:

| Script | Purpose |
|--------|---------|
| `npm run build` | Production build (output: `dist/frontend/browser`) |
| `npm run watch` | Build in watch mode |
| `npm run test` | Run unit tests (Karma + Jasmine) |

## 10) Deployment (Render)

Render static site deployment publishes `frontend/dist/frontend/browser`.

Backend API base URL is configured via Angular environment files:

- **Dev:** `http://localhost:3000` (in `environment.ts`)
- **Prod:** Render backend URL (in `environment.prod.ts`)

## 11) Dependencies

### Runtime

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/*` | 21.x | Core framework |
| `rxjs` | 7.8.x | Reactive programming |
| `chart.js` | 4.x | Chart rendering |
| `ng2-charts` | 8.x | Angular Chart.js wrapper |
| `lucide-angular` | 0.563.x | Icon library |
| `zone.js` | 0.15.x | Change detection |

### Dev

| Package | Version | Purpose |
|---------|---------|---------|
| `@angular/build` | 21.x | Build tooling |
| `@angular/cli` | 21.x | CLI |
| `typescript` | 5.9.x | TypeScript compiler |
| `tailwindcss` | 4.x | Utility-first CSS framework (used extensively in templates) |
| `karma` / `jasmine` | — | Test runner / assertion library |

## 12) Extension guidelines

When adding features:

1. Create a new standalone component under `src/app/…`
2. Add route in `app.routes.ts` with the appropriate guard(s)
3. Add API wrapper method in `auth.service.ts` with proper return type from `api.models.ts`
4. Add i18n keys in **both** `en` and `hu` sections of `i18n.service.ts`
5. Surface user feedback via `ToastService` or `ConfirmationModalComponent`
6. Use shared interfaces from `api.models.ts` — avoid `any` types in component properties
7. For printable views, add the `.no-print` class to elements that should be hidden when printing (buttons, controls, etc.).
   The existing `@media print` rules in `src/styles.css` automatically hide `nav`, `button`, `select`, `input`, and `.fixed` elements.
8. Custom dropdowns must include the `custom-dropdown` CSS class on their wrapper div so the `HostListener`-based click-outside logic can distinguish internal clicks from document clicks.
