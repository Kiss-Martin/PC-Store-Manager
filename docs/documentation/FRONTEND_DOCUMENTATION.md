# Frontend Documentation

Last updated: April 9, 2026

---

## 1. Overview

The frontend is a standalone-component **Angular 21** application providing the complete UI for PC Store Manager. It features JWT authentication with automatic token refresh, role-based route access (`admin` / `worker` / `buyer`), inventory and order management, analytics dashboards with Chart.js, profile and session management, admin moderation tools, bilingual localization (English / Hungarian), dark/light theming, real-time WebSocket notifications, and CSV/PDF export with print support.

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 21 (standalone components, signals, functional guards & interceptors) |
| Routing | Angular Router with `AuthGuard`, `AdminGuard`, `StaffGuard`, `GuestGuard` |
| HTTP | `HttpClient` + functional interceptor (`authInterceptor`) |
| State | Angular signals (`signal()`, `computed()`, `effect()`) |
| Charts | `ng2-charts` v8 + `chart.js` v4 |
| Icons | `lucide-angular` (tree-shakeable selective imports) |
| Styling | Tailwind CSS v4 + custom CSS variables (light/dark themes) |
| i18n | Custom signal-based `I18nService` with `TranslatePipe` (`en` / `hu`, 450+ keys) |
| Real-time | `socket.io-client` v4 |

---

## 2. Project Structure

```
frontend/
├── src/
│   ├── index.html
│   ├── main.ts                          # Bootstrap: App + appConfig
│   ├── styles.css                       # Global styles, theme variables, @media print rules
│   ├── app/
│   │   ├── app.config.ts                # Providers: router, HTTP interceptor, Lucide icons
│   │   ├── app.routes.ts                # Route definitions with guards
│   │   ├── app.ts                       # Root shell: navbar, theme/language toggles, WebSocket init
│   │   ├── app.html                     # Root template
│   │   ├── app.css                      # Root component styles
│   │   ├── i18n.service.ts              # Translation dictionary (en/hu, 450+ keys), signal-based
│   │   ├── theme.service.ts             # Dark/light theme toggle, localStorage persistence
│   │   ├── translate.pipe.ts            # TranslatePipe (| t) for templates
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.service.ts          # Auth state, login/register/refresh/logout, session management
│   │   │   ├── auth.interceptor.ts      # Attaches Bearer token + Accept-Language, auto-refresh on 401
│   │   │   ├── auth.guard.ts            # Requires authentication
│   │   │   ├── admin.guard.ts           # Requires admin role
│   │   │   ├── staff.guard.ts           # Blocks buyer role (allows admin + worker)
│   │   │   ├── guest.guard.ts           # Blocks authenticated users from auth pages
│   │   │   ├── login/                   # Login page component
│   │   │   ├── register/               # Multi-step registration component
│   │   │   ├── forgot/                 # Forgot password component
│   │   │   └── reset-password/         # Reset password component
│   │   │
│   │   ├── services/
│   │   │   ├── api.service.ts           # HTTP client wrapper (URL building, credentials, blob downloads)
│   │   │   ├── dashboard.service.ts     # Dashboard + analytics API calls
│   │   │   ├── item.service.ts          # Item CRUD + categories/brands
│   │   │   ├── order.service.ts         # Order CRUD + customers + workers + export
│   │   │   ├── user.service.ts          # Profile CRUD + avatar + password
│   │   │   └── socket.service.ts        # Socket.io client: connect, join room, order:assigned events
│   │   │
│   │   ├── models/
│   │   │   └── api.models.ts            # Shared TypeScript interfaces (User, Item, Order, Session, etc.)
│   │   │
│   │   ├── utils/
│   │   │   └── token.util.ts            # Token storage: localStorage / sessionStorage, remember-me
│   │   │
│   │   ├── components/
│   │   │   ├── analytics.component/     # Analytics page (charts, stats, export, print)
│   │   │   ├── orders.component/        # Orders page (list, create, status, assign, export, print)
│   │   │   ├── products.component/      # Products page (CRUD, search, category/brand dropdowns)
│   │   │   ├── profile.component/       # Profile page (edit, avatar, password, sessions)
│   │   │   └── confirmation-modal/      # Reusable confirmation modal component
│   │   │
│   │   ├── dashboard/                   # Dashboard page (stats, activity, quick actions, report)
│   │   ├── admin-sessions/              # Admin sessions page (all sessions, pending admins)
│   │   ├── admin-audit/                 # Admin audit log page
│   │   ├── admin-action-result/         # One-click email action result page
│   │   │
│   │   └── shared/
│   │       ├── toast.service.ts         # Toast notification service (BehaviorSubject)
│   │       └── toast/                   # Toast display component
│   │
│   └── environments/
│       ├── environment.ts               # Dev: apiUrl = http://localhost:3000
│       └── environment.prod.ts          # Prod: apiUrl = https://pc-store-manager.onrender.com
│
├── cypress/                             # E2E test specs
├── angular.json
├── tsconfig.json
└── package.json
```

---

## 3. App Bootstrap

1. `main.ts` bootstraps `App` with `appConfig`
2. `app.config.ts` provides:
   - Angular Router with route definitions
   - `HttpClient` with `authInterceptor`
   - Lucide icon set (60+ icons, tree-shakeable)
   - Zone.js change detection with event coalescing
3. `App` component (`app.ts`):
   - Controls navbar visibility (hidden on auth pages)
   - **PC Store logo** is clickable and navigates to `/dashboard`
   - **Active navigation highlighting** — current page link is highlighted with violet color
   - Mobile responsive hamburger menu
   - Theme toggle (dark/light) and **language toggle** (EN/HU) — styled for both light and dark mode visibility
   - Profile link and logout button
   - WebSocket connection lifecycle via `effect()` — connects on login, disconnects on logout
   - Listens for `order:assigned` WebSocket events and shows toast notifications

---

## 4. Routing

| Path | Component | Guard(s) | Notes |
|---|---|---|---|
| `/` | — | — | Redirects to `/dashboard` |
| `/login` | `LoginComponent` | `GuestGuard` | Email/password, remember-me, support contact modal |
| `/register` | `RegisterComponent` | `GuestGuard` | 4-step wizard: role → credentials → personal info → review |
| `/forgot` | `ForgotComponent` | `GuestGuard` | Password reset request (non-disclosing) |
| `/reset-password` | `ResetPasswordComponent` | `GuestGuard` | Token-based password reset (token from query param) |
| `/dashboard` | `DashboardComponent` | `AuthGuard` | Stats, activity feed, quick actions, report download |
| `/products` | `ProductsComponent` | `AuthGuard` | Product CRUD, search, category/brand selection |
| `/orders` | `OrdersComponent` | `AuthGuard` | Order list, status workflow, assignment, export |
| `/analytics` | `AnalyticsComponent` | `AuthGuard` + `StaffGuard` | Charts, summary, export (hidden from buyers) |
| `/profile` | `ProfileComponent` | `AuthGuard` | Profile edit, avatar, password, sessions |
| `/admin/sessions` | `AdminSessionsComponent` | `AuthGuard` + `AdminGuard` | All sessions + pending admin approvals |
| `/admin/audit` | `AdminAuditComponent` | `AuthGuard` + `AdminGuard` | Paginated audit log viewer |
| `/admin/action-result` | `AdminActionResultComponent` | `AuthGuard` + `AdminGuard` | One-click email action result |
| `/admin/pending-admins` | — | — | Redirects to `/admin/sessions` |
| `**` | — | — | Wildcard → `/dashboard` |

### Guards

| Guard | Behavior |
|---|---|
| `AuthGuard` | Allows if authenticated. If token expired but remember-me set, attempts one-time refresh. |
| `AdminGuard` | Same as `AuthGuard` + requires `role === 'admin'`. Redirects non-admins to `/dashboard`. |
| `StaffGuard` | Same as `AuthGuard` + blocks `buyer` role. Allows `admin` and `worker`. |
| `GuestGuard` | Blocks already-authenticated users from auth pages. Redirects to `/dashboard`. |

All guards are functional (not class-based) and support async refresh attempts before deciding.

---

## 5. Authentication & Session Management

Implemented in `auth.service.ts`, guards, and `auth.interceptor.ts`.

### Token Storage (`utils/token.util.ts`)

| Storage Key | Storage | Purpose |
|---|---|---|
| `pc_token` | localStorage (remember) or sessionStorage (session-only) | JWT access token |
| `pc_user` | Same as above | Serialized user object |
| `pc_remember` | localStorage | Remember-me flag (`"true"` / absent) |

- If "remember me" is enabled, tokens go to `localStorage` (persist across browser sessions)
- Otherwise, `sessionStorage` (cleared on tab close)
- On save, the other storage is cleared to avoid ambiguity

### Startup Flow

1. `AuthService` constructor calls `loadFromStorage()` to restore token and user
2. If token is expired, auth data is cleared but remember-me preference is preserved
3. If remember-me is set and no valid token exists, `refresh()` is called automatically
4. `authReady` promise resolves once the startup flow settles
5. Components that depend on auth (e.g., `ProfileComponent`) `await authReady` before loading

### HTTP Interceptor (`auth.interceptor.ts`)

- Attaches `Authorization: Bearer <token>` to all requests
- Attaches `Accept-Language` header from `localStorage` (`pc_language`)
- On `401` response (non-auth endpoints):
  1. Attempts transparent token refresh
  2. On success: retries original request with new token
  3. On failure: triggers `logout('expired')` with session-expired toast

### Auth API Methods

| Method | Backend Endpoint | Purpose |
|---|---|---|
| `register()` | `POST /auth/register` | Multi-role registration. Handles `requiresApproval` response. |
| `login()` | `POST /auth/login` | Email + password + rememberMe. Stores tokens on success. |
| `refresh()` | `POST /auth/refresh` | Singleton (shared via `shareReplay`). Deduplicated across concurrent 401 retries. |
| `logout()` | `POST /auth/logout` | Clears tokens, cookies, redirects to `/login`. Shows toast (success or expired). |
| `forgotPassword()` | `POST /auth/forgot-password` | Sends email. Non-disclosing response. |
| `resetPassword()` | `POST /auth/reset-password` | Token + new password. |

### Session Management

| Method | Backend Endpoint | Purpose |
|---|---|---|
| `getSessions()` | `GET /auth/tokens` | List user's own active sessions |
| `revokeSession()` | `DELETE /auth/tokens/:id` | Revoke a specific session |
| `getAllSessionsPaged()` | `GET /auth/admin/sessions` | Admin: paginated all-user sessions |
| `revokeSessionByAdmin()` | `DELETE /auth/tokens/:id` | Admin: revoke any session |
| `listPendingAdmins()` | `GET /auth/admin/pending-admins` | Admin: pending admin list |
| `approveAdmin()` | `POST .../approve` | Admin: approve pending admin |
| `rejectAdmin()` | `POST .../reject` | Admin: reject pending admin |

---

## 6. Service Layer

### `ApiService` (`services/api.service.ts`)

Centralized HTTP client wrapper. Builds URLs from `environment.apiUrl`.

| Method | HTTP | Features |
|---|---|---|
| `get<T>()` | GET | Standard request |
| `post<T>()` | POST | Standard request |
| `patch<T>()` | PATCH | Standard request |
| `delete<T>()` | DELETE | Standard request |
| `getWithCredentials<T>()` | GET | Sends cookies (`withCredentials: true`) |
| `postWithCredentials<T>()` | POST | Sends cookies |
| `deleteWithCredentials<T>()` | DELETE | Sends cookies |
| `postFormData<T>()` | POST | Multipart/form-data (avatar upload) |
| `getBlob()` | GET | Returns `Observable<Blob>` for file downloads |

### `ItemService` (`services/item.service.ts`)

| Method | Endpoint | Returns |
|---|---|---|
| `getItems()` | `GET /items` | `{ items: Item[] }` |
| `createItem()` | `POST /items` | `{ success, item }` |
| `updateItem()` | `PATCH /items/:id` | `{ item }` |
| `deleteItem()` | `DELETE /items/:id` | `{ success }` |
| `getCategories()` | `GET /items/categories` | `{ categories: Category[] }` |
| `getBrands()` | `GET /items/brands` | `{ brands: Brand[] }` |

Note: `specifications` and `specs` fields are stripped from payloads before sending.

### `OrderService` (`services/order.service.ts`)

| Method | Endpoint | Returns |
|---|---|---|
| `getOrders()` | `GET /orders` | `{ orders: Order[] }` |
| `createOrder()` | `POST /orders` | `{ success, order }` |
| `updateOrderStatus()` | `PATCH /orders/:id/status` | `{ success }` |
| `deleteOrder()` | `DELETE /orders/:id` | `{ success }` |
| `assignOrder()` | `PATCH /orders/:id/assign` | `{ success }` |
| `exportOrders()` | `GET /orders/export` | `Blob` (CSV or PDF) |
| `getCustomers()` | `GET /customers` | `{ customers: Customer[] }` |
| `createCustomer()` | `POST /customers` | `{ success, customer }` |
| `getWorkers()` | `GET /users/workers` | `{ users: User[] }` |

### `DashboardService` (`services/dashboard.service.ts`)

| Method | Endpoint | Returns |
|---|---|---|
| `getDashboard()` | `GET /dashboard` | `{ stats: DashboardStats, activities: DashboardActivity[] }` |
| `getAnalytics()` | `GET /analytics?period=` | `{ summary, revenueChart, categoryChart, topProducts, recentTransactions }` |
| `exportAnalytics()` | `GET /analytics/export` | `Blob` |
| `generateBusinessReport()` | `GET /analytics/export` | `Blob` (alias for `exportAnalytics`) |

### `UserService` (`services/user.service.ts`)

| Method | Endpoint | Returns |
|---|---|---|
| `getMe()` | `GET /users/me` | `{ user: User }` |
| `getMyAvatar()` | `GET /users/me/avatar` | `Blob` |
| `uploadAvatar()` | `POST /users/me/avatar` | `{ success, message }` |
| `updateMe()` | `PATCH /users/me` | `{ user: User }` |
| `changePassword()` | `PATCH /users/me/password` | `{ success, message }` |
| `deleteMe()` | `DELETE /users/me` | `{ success }` |

### `SocketService` (`services/socket.service.ts`)

- Connects to backend WebSocket using `socket.io-client`
- On connect: joins user-specific room via `join` event
- Exposes `orderAssigned$` Subject for `order:assigned` events
- Auto-connects on login, disconnects on logout (managed by `App` component's `effect()`)
- Transport: WebSocket with polling fallback

---

## 7. Feature Components

### Login (`auth/login/`)

- Email/password form with "Stay signed in" toggle
- **Password visibility toggle** (eye/eye-off icon button)
- Calls `AuthService.login()` on submit
- Support contact modal (name, email, message → `POST /support/contact`)
- Theme toggle available on login page
- Redirects to `/dashboard` on success
- `GuestGuard` prevents access if already logged in

### Register (`auth/register/`)

- 4-step wizard:
  1. **Role selection** — Admin, Worker (hard-hat icon), or Buyer
  2. **Credentials** — Username (3+ chars, alphanumeric + `_.-`) and password (strong)
  3. **Personal info** — Full name and email
  4. **Review & submit** — Confirmation of all details
- **Password visibility toggle** on password and confirm password fields
- Client-side validation at each step with localized error messages
- On admin registration: displays "awaiting approval" message if `requiresApproval` is true
- Auto-login for non-admin registrations

### Forgot Password (`auth/forgot/`)

- Email input → `AuthService.forgotPassword()`
- Non-disclosing: always shows success message regardless of email existence

### Reset Password (`auth/reset-password/`)

- Reads `token` from URL query parameter
- New password + confirmation with strong password validation
- **Password visibility toggle** on both password fields
- Calls `AuthService.resetPassword()` on submit

### Dashboard (`dashboard/`)

- Loads stats from `GET /dashboard`: total products, total sales, active orders, customers
- Recent activity feed from backend
- Quick action buttons: New Order, Add Product, View Orders, Reports, Settings
- Quick actions open their respective pages; cancelling returns the user back to the dashboard
- Business report download modal: period selector (7/30/90 days), format (CSV/PDF)
- Print button for browser print dialog
- **Buyer view:** "Add Product", "Analytics", report generation, and print are hidden. "New Order" shows as "Place Order".

### Products (`components/products.component/`)

- Full CRUD via `ItemService`
- Category and brand dropdowns loaded from API
- Client-side search/filter across product name, model, brand
- Modal for create/edit with validation
- **Warranty field**: numeric value (integer) with separate unit selector dropdown (days, weeks, months, years). Display combines number and localized unit (e.g., "36 months" / "36 hónap")
- Confirmation modal for deletes; returns **409** error with a user-friendly message if FK constraints prevent deletion
- **Buyer view:** Read-only. Add/edit/delete controls hidden.

### Orders (`components/orders.component/`)

- Order listing with client-side search and custom status filter dropdown
- Order creation with inline customer creation option
- Status workflow: `pending` → `processing` → `completed` / `cancelled`
- Worker assignment dropdown (admin only)
- Export as CSV/PDF with status filter
- Print button for browser print dialog
- **Buyer view:** Own orders only. Can place new orders (status: `pending`), cancel own orders. Cannot edit status, assign workers, or delete. "Assigned To" column and admin actions are hidden.
- **Worker view:** Sees only orders assigned to them. "Assigned to you" badge (green) is shown for the worker's own assigned orders. Can update the status of assigned orders that are not completed/cancelled.

### Analytics (`components/analytics.component/`)

- Revenue line chart + category doughnut chart (`ng2-charts` / `chart.js`)
- Summary stat cards: revenue, orders, average order value, top product, low stock items, revenue growth
- Top products table with trend indicators
- Recent transactions section (admin only)
- Period selector: 7 days, 30 days, 90 days
- Export as CSV/PDF
- Print button (admin only)
- Charts auto-update colors on theme change
- **Worker view:** Analytics are scoped to the worker's own assigned orders (revenue, order count, growth comparison)
- **Not accessible to buyers** (blocked by `StaffGuard`)

### Profile (`components/profile.component/`)

- View and edit profile fields: email, username, fullname
- Avatar upload with immediate preview (creates blob URL)
- Change password modal (current + new password with validation)
- **Password visibility toggle** on all three password fields in change password modal
- Role badge with per-role icon and color (admin: shield/violet, worker: hard-hat/amber, buyer: shopping-bag/blue)
- Active session listing with per-session revoke capability
- Waits for `authReady` before loading to prevent race conditions on page refresh

### Admin Sessions (`admin-sessions/`)

- Paginated session list with search, email filter, date range filter
- Session revocation with confirmation modal
- Pending admin approvals section: approve/reject with confirmation modals
- Admin-only access via `AdminGuard`

### Admin Audit (`admin-audit/`)

- Paginated audit event log viewer
- Displays event type, actor, target, details, timestamp
- Admin-only access via `AdminGuard`

### Admin Action Result (`admin-action-result/`)

- Landing page for one-click email approve/reject actions
- Reads `result` query parameter (`approved` / `rejected`) and displays outcome

---

## 8. Shared UI Components

### Toast System

- **`ToastService`** — Injectable service with `show(message, opts)` and `hide(id)` methods
- Types: `info`, `success`, `error`, `warning`
- Auto-dismiss with configurable timeout (default: 4000 ms)
- State managed via `BehaviorSubject<Toast[]>`
- **`ToastComponent`** — Renders active toasts (subscribed to `toasts$`)

### Confirmation Modal

- **`ConfirmationModalComponent`** — Reusable modal for destructive actions
- Replaces native `confirm()` dialogs for consistent UX
- Used for: delete product, delete order, revoke session, approve/reject admin

---

## 9. Internationalization (i18n)

- **`I18nService`** — Contains an in-app dictionary with **450+ keys** for `en` and `hu`
- **`TranslatePipe`** (`| t`) — Pure pipe (impure for reactivity) that renders translated keys in templates
- Supports parameterized strings: `{{ 'key' | t:{ param: value } }}`
- Current language stored in `localStorage` (`pc_language`)
- Language signal (`currentLang`) triggers reactive UI updates
- `toggleLanguage()` switches between `en` and `hu`
- Backend receives language via `Accept-Language` header (set by interceptor)

### Coverage Areas

- Navigation labels
- Dashboard stats and actions
- Product form labels and validation messages
- Order statuses, columns, and actions
- Analytics labels and export headers
- Auth forms (login, register, forgot, reset)
- Profile form fields and messages
- Admin session and audit labels
- Toast messages
- Support contact modal

---

## 10. Theming

- **`ThemeService`** — Toggles dark/light mode via `body.dark-theme` class
- Theme persisted in `localStorage` (`pc_theme`)
- CSS custom properties define color scheme (set in `styles.css`)
- Charts dynamically update their color scheme on theme change via Angular `effect()`
- Theme toggle available in navbar and on login page

---

## 11. Print Styles

Global `@media print` rules defined in `styles.css`:

- **Hidden elements:** Navbar, buttons, inputs, selects, modals, `.no-print` class, `.fixed` elements
- **Layout:** Forced landscape orientation, 1.5 cm margins
- **Tables:** Clean collapsed borders, readable styling
- **Page breaks:** `break-inside: avoid` on cards and table rows
- **Visual:** Removed box shadows and transforms; preserved chart canvases and status badge colors via `print-color-adjust: exact`

---

## 12. Real-Time Notifications

The `SocketService` connects to the backend Socket.io server:

1. On login: `App` component's `effect()` calls `socketService.connect(userId)`
2. Socket joins user-specific room: `user:{userId}`
3. On `order:assigned` event: `orderAssigned$` Subject emits, `App` shows info toast
4. On logout: `socketService.disconnect()` is called

---

## 13. Data Contracts (`api.models.ts`)

| Interface | Purpose |
|---|---|
| `User` | User profile: `id`, `email`, `username`, `fullname?`, `role` |
| `AuthResponse` | Login/register response. Supports `token`, `accessToken`, and `access_token` variants. |
| `Item` | Product: `id`, `name`, `model?`, `price`, `amount`, `warranty?` (number), `warranty_unit?` (`'days'`\|`'weeks'`\|`'months'`\|`'years'`), `category_id`, `brand_id`, `category?`, `brand?` |
| `Category` | `id`, `name` |
| `Brand` | `id`, `name` |
| `Customer` | `id`, `name`, `email?`, `phone?` |
| `OrderStatus` | Union type: `'pending' \| 'processing' \| 'completed' \| 'cancelled'` |
| `Order` | Full order: `id`, `orderNumber`, `product`, `productId`, `quantity`, `unitPrice`, `totalAmount`, `status`, `customer`, `date`, `timestamp`, `assignedTo?` |
| `Session` | Refresh token metadata: `id`, `ip?`, `user_agent?`, `created_at`, `expires_at`, `user?` |
| `AnalyticsSummary` | `totalRevenue`, `totalOrders`, `averageOrderValue`, `topSellingProduct`, `lowStockItems`, `revenueGrowth` |
| `TopProduct` | `name`, `sales`, `revenue`, `trend` |
| `Transaction` | `id`, `product`, `customer`, `amount`, `status`, `date` |
| `DashboardStats` | `totalProducts?`, `totalSales?`, `activeOrders?`, `customers?` |
| `DashboardActivity` | `id`, `description`, `timestamp`, `type` |
| `AuditLog` | `id`, `event_type`, `actor_user_id?`, `target_user_id?`, `details?`, `created_at`, `actor?`, `target?` |
| `PendingAdmin` | `id`, `email`, `username`, `fullname?` |

---

## 14. Build & Run

### Development

```bash
cd frontend
npm install
npm start        # ng serve → http://localhost:4200
```

### Production Build

```bash
npm run build    # Output: dist/frontend/browser
```

### Other Scripts

| Script | Purpose |
|---|---|
| `npm run watch` | Build in watch mode |
| `npm run test` | Unit tests (Karma + Jasmine) |
| `npm run cy:open` | Open Cypress E2E test runner |
| `npm run cy:run` | Run Cypress E2E tests headlessly |
| `npm run e2e` | Alias for `cy:run` |

---

## 15. Deployment (Render)

`render.yaml` defines a static site for the frontend (`rootDir: frontend`, `runtime: static`).

- Build command: `npm install && npm run build`
- Publish path: `dist/frontend/browser`
- `_redirects` file in `public/` handles SPA routing for Render static hosting

### Environment Configuration

| Environment | `apiUrl` |
|---|---|
| Development | `http://localhost:3000` (`environment.ts`) |
| Production | `https://pc-store-manager.onrender.com` (`environment.prod.ts`) |

---

## 16. Dependencies

### Runtime

| Package | Version | Purpose |
|---|---|---|
| `@angular/*` | 21.x | Core framework, router, forms, HTTP |
| `rxjs` | 7.8.x | Reactive programming |
| `chart.js` | 4.x | Chart rendering engine |
| `ng2-charts` | 8.x | Angular Chart.js wrapper |
| `lucide-angular` | 0.563.x | Icon library (60+ icons) |
| `socket.io-client` | 4.x | WebSocket client |
| `zone.js` | 0.15.x | Change detection |

### Dev

| Package | Version | Purpose |
|---|---|---|
| `@angular/build` | 21.x | Build tooling (esbuild-based) |
| `@angular/cli` | 21.x | CLI |
| `typescript` | 5.9.x | TypeScript compiler |
| `tailwindcss` | 4.x | Utility-first CSS framework |
| `cypress` | 15.x | E2E testing |
| `karma` + `jasmine` | — | Unit test runner + assertion library |

---

## 17. Extension Guidelines

When adding features:

1. **Component:** Create a new standalone component under `src/app/`
2. **Route:** Add route in `app.routes.ts` with appropriate guard(s)
3. **Service:** Add API wrapper in the relevant service (or create a new one) with typed return from `api.models.ts`
4. **i18n:** Add translation keys in **both** `en` and `hu` sections of `i18n.service.ts`
5. **Toast:** Surface user feedback via `ToastService` (success, error, warning, info)
6. **Confirmation:** Use `ConfirmationModalComponent` for destructive actions
7. **Types:** Use shared interfaces from `api.models.ts` — avoid `any`
8. **Print:** Add `.no-print` class to elements that should be hidden when printing. Existing `@media print` rules hide `nav`, `button`, `select`, `input`, and `.fixed` elements.
9. **Custom dropdowns:** Use the `custom-dropdown` CSS class on wrapper divs for click-outside detection via `HostListener`.
10. **Buyer gating:** Use `auth.isBuyer()` to gate UI elements. Use `StaffGuard` on routes that should block buyers.

---

## 18. Suggested Improvements

### UX / Features
- No client-side pagination for products, orders, or customers — all data loaded at once
- No optimistic UI updates — all state refreshes wait for server response
- No offline support or service worker
- No form auto-save or draft state

### Code Quality
- `AuthResponse` supports three token field variants (`token`, `accessToken`, `access_token`) — consider normalizing
- Some components may directly access `AuthService` for domain data instead of dedicated services — consider strict separation
- No shared form validation utility — each component implements its own validation logic

### Testing
- E2E tests (Cypress) exist but coverage is unclear
- Unit tests use Karma/Jasmine — consider migration to Jest for consistency with backend
