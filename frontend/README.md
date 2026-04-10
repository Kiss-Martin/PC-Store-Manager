# Frontend

The frontend is a standalone-component **Angular 21** application for PC Store Manager. It provides JWT authentication, role-based access control (`admin` / `worker` / `buyer`), inventory and order management, analytics dashboards with Chart.js, profile management, bilingual localization (EN/HU), and dark/light theming.

## Tech Stack

- **Angular 21** (standalone components, signals, functional guards & interceptors)
- **Tailwind CSS 4** + custom CSS variables
- **ng2-charts** v8 + **Chart.js** v4
- **Lucide Angular** icons
- **Socket.io-client** v4 (real-time notifications)

## Development Server

```bash
npm install
npm start        # ng serve → http://localhost:4200
```

The application expects the backend API at `http://localhost:3000` (configurable in `src/environments/`).

## Building

```bash
npm run build    # Output: dist/frontend/browser
```

## Testing

### Unit Tests (Karma + Jasmine)

```bash
npm run test
```

### E2E Tests (Cypress)

```bash
npm run cy:open   # Interactive mode
npm run cy:run    # Headless mode
```

Cypress tests are located in `cypress/e2e/` and cover authentication, navigation guards, dashboard, products, orders, analytics, profile, and theme/language switching.

## Project Structure

- `src/app/auth/` — Login, register, forgot/reset password, guards, interceptor
- `src/app/components/` — Feature pages (products, orders, analytics, profile)
- `src/app/dashboard/` — Dashboard page
- `src/app/services/` — API service layer
- `src/app/models/` — TypeScript interfaces
- `src/app/shared/` — Toast notifications
- `src/app/admin-*/` — Admin pages (sessions, audit, action result)
- `cypress/e2e/` — Cypress E2E tests

See [Frontend Documentation](../docs/documentation/FRONTEND_DOCUMENTATION.md) for full architecture details.
