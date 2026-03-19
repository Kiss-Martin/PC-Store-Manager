# Frontend Documentation

Last updated: March 19, 2026

## 1) Overview

The frontend is a standalone-component Angular application (Angular 21) for PC Store Manager. It includes authentication, inventory/order/customer workflows, analytics dashboards, profile/session management, admin moderation tools, localization, theming, and toast-based UX feedback.

Key stack:
- Angular 21 standalone API
- Angular Router + functional guards
- HttpClient + functional interceptor
- `ng2-charts` + `chart.js` for analytics visuals
- `lucide-angular` icons
- Custom i18n service (`en` / `hu`)

## 2) App architecture

Root bootstrap:
- `src/main.ts` bootstraps `App` with `appConfig`

Configuration:
- `app.config.ts` provides:
  - router
  - global HTTP interceptor (`authInterceptor`)
  - Lucide icon provider

Main shell:
- `app.ts` controls navbar visibility, mobile nav, theme toggle, language toggle
- Navbar is shown only when authenticated and not on auth screens

## 3) Routing map

Primary routes:
- `/login` (guest-only)
- `/register` (guest-only)
- `/forgot` (guest-only)
- `/reset-password` (guest-only)
- `/dashboard` (auth)
- `/products` (auth)
- `/orders` (auth)
- `/analytics` (auth)
- `/profile` (auth)
- `/admin/sessions` (auth + admin)
- `/admin/audit` (auth + admin)
- `/admin/action-result` (public result page for one-click admin actions)

Default/fallback:
- `/` redirects to `/dashboard`
- unknown routes redirect to `/dashboard`

## 4) Auth/session behavior

Implemented in `auth.service.ts` + guards + interceptor.

### Token storage model
- Access token + user are stored in:
  - `localStorage` if “remember me” is enabled
  - `sessionStorage` otherwise
- Refresh token is stored in backend-issued httpOnly cookie

### Automatic refresh flow
- Interceptor attaches `Authorization` and `Accept-Language`
- On `401` (non-auth endpoints), interceptor attempts `/auth/refresh`
- If refresh succeeds, request is retried
- If refresh fails, user is logged out with “session expired” state

### Guards
- `AuthGuard`: allows route if authenticated; otherwise optionally attempts one-time refresh
- `AdminGuard`: same as above, with role check
- `GuestGuard`: blocks auth pages for already-authenticated users

## 5) API integration layer

`ApiService` centralizes URL building and request helpers:
- standard JSON calls (`get`, `post`, `patch`, `delete`)
- cookie-enabled variants (`getWithCredentials`, `postWithCredentials`, `deleteWithCredentials`)
- blob download helper (`getBlob`)

Environment-based base URL:
- `environment.apiUrl`

## 6) Feature modules/components

### Authentication
- Login (`auth/login`)
  - email/password login
  - remember-me flag
  - support contact modal (`/support/contact`)
- Register (`auth/register`)
  - 4-step workflow
  - role selection (`admin` / `worker`)
  - handles “awaiting admin approval” path
- Forgot password (`auth/forgot`)
  - generic non-disclosing reset messages
- Reset password (`auth/reset-password`)
  - token from query param

### Dashboard
- Loads backend summary from `/dashboard`
- Shows stats + activity list
- Quick actions (new order, add product)
- Business report download (`/analytics/export`) in CSV/PDF

### Products
- CRUD on inventory via `/items`
- Category/brand loading (`/items/categories`, `/items/brands`)
- Search/filter UI
- Shared confirmation modal for deletes

### Orders
- Order listing/filtering/search
- Order status updates
- Create manual order (+ optional inline customer creation)
- Worker assignment (admin)
- Export orders (`/orders/export`) CSV/PDF

### Analytics
- Pulls `/analytics?period=...`
- Revenue line chart + category doughnut chart
- Summary cards and top products
- Recent transactions section for admins
- Export analytics CSV/PDF

### Profile
- View/update own profile
- Change password
- Avatar upload/reload
- Active session listing + revoke own session

### Admin pages
- Admin sessions (`/admin/sessions`)
  - paginated session list
  - filters by search/email/date range
  - revoke sessions
  - approve/reject pending admins
- Audit logs (`/admin/audit`)
  - paginated events from backend audit stream
- Admin action result (`/admin/action-result`)
  - displays result of one-click email approve/reject action

### Shared UX
- Toast service + toast component
- Reusable confirmation modal component

## 7) Internationalization and theme

### i18n
- `i18n.service.ts` contains large in-app dictionary for `en` and `hu`
- `TranslatePipe` (`t`) renders translated keys in templates
- Interceptor sends current language in `Accept-Language`

### Theme
- `theme.service.ts` toggles dark/light mode via `body` class
- Choice persisted in `localStorage` (`pc_theme`)

## 8) Data contracts (frontend models)

`api.models.ts` defines:
- `User`
- `AuthResponse` (supports `token`, `accessToken`, `access_token` variants)

The frontend is defensive with backend token naming differences and supports all currently used response variants.

## 9) Build and run

From `frontend/`:

```bash
npm install
npm start
```

Other scripts:
- `npm run build`
- `npm run watch`
- `npm run test`

Default dev app URL: `http://localhost:4200`

## 10) Deployment notes

Render static deployment is configured to publish:
- `frontend/dist/frontend/browser`

Backend API base URL comes from Angular environment files.

Current repo state note:
- `environment.prod.ts` points to Render backend URL
- `environment.ts` also has `production: true` in current source; verify this behavior against desired dev/prod build expectations before release.

## 11) Dependencies (current major set)

- `@angular/*` 21.x
- `rxjs` 7.8
- `chart.js` 4.x
- `ng2-charts` 8.x
- `lucide-angular`
- Tailwind packages are present in dependencies, while component styling remains primarily custom CSS.

## 12) Extension guidelines

When adding features:
1. Add new standalone component under `src/app/...`
2. Add route in `app.routes.ts` with proper guard(s)
3. Add API wrapper method in `auth.service.ts` or `api.service.ts`
4. Add i18n keys in both `en` and `hu`
5. Surface user feedback via toast or existing modal patterns

---

## Installation & Running

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production
npm build
```

Visit `http://localhost:4200` to see the application.

---

## Future Enhancements

- [ ] Backend API integration
- [ ] Authentication tokens (JWT)
- [ ] Real database data
- [ ] Charts/graphs on dashboard
- [ ] User profile page
- [ ] Settings management
- [ ] Dark mode toggle
- [ ] Internationalization (i18n)
- [ ] Advanced search filters
- [ ] Export/import features

---

## Support & Troubleshooting

**CSS not loading?**
- Clear browser cache
- Restart dev server

**Forms not validating?**
- Check browser console for errors
- Verify FormsModule is imported

**Navigation not working?**
- Ensure routes are configured in `app.routes.ts`
- Check Router injection in components

---

**Version:** 1.0.0  
**Created:** February 2026  
**Framework:** Angular 20 with Pure CSS
