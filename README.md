# PC Store Manager

A full-stack inventory and order management platform for PC component stores. Built with **Angular 21** and **Express 5** on **Supabase/PostgreSQL**, featuring role-based access control, real-time notifications, bilingual support, and analytics dashboards.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 21 (standalone components, signals), Tailwind CSS 4, ng2-charts + Chart.js 4, Lucide icons, socket.io-client |
| Backend | Express 5 (ES modules), Node.js, Supabase/PostgreSQL, JWT + refresh tokens, Socket.io, Nodemailer, PDFKit |
| Auth | JWT access tokens (15 min) + httpOnly-cookie refresh tokens (7/30 days), bcryptjs, role-based guards |
| Deployment | Render (static site + web service), render.yaml |

---

## Architecture

```
┌─────────────────────┐       HTTP / WebSocket        ┌─────────────────────────┐
│   Angular 21 SPA    │ ◄──────────────────────────►  │   Express 5 API Server  │
│                     │   Bearer JWT + Accept-Lang    │                         │
│  standalone comps   │                               │  Controller → Service   │
│  signal-based state │                               │  → Supabase/PostgreSQL  │
│  functional guards  │                               │                         │
│  Tailwind CSS 4     │                               │  Socket.io server       │
│  Chart.js 4         │                               │  Nodemailer (SMTP)      │
└─────────────────────┘                               └─────────────────────────┘
```

### Role Model

| Role | Access |
|---|---|
| `admin` | Full access: all CRUD, analytics, session management, audit log, admin approvals |
| `worker` | Product & order CRUD, analytics, dashboard |
| `buyer` | Place orders, view own orders, profile management |

---

## Features

- **Authentication** — Register (multi-step), login (remember-me), forgot/reset password, JWT with silent refresh, session management
- **Products** — Full CRUD for items with categories and brands (admin/worker only)
- **Orders** — Create, assign, status workflow (pending → processing → completed/cancelled), customer management
- **Analytics** — Revenue charts, category breakdowns, top products, summary stats (staff only)
- **Dashboard** — Overview stats, activity feed, quick actions, business report export
- **Profile** — Edit personal info, avatar upload, password change, session viewer
- **Admin Tools** — Session management, pending admin approvals, audit log
- **Real-time** — WebSocket notifications for order assignments
- **i18n** — English / Hungarian with in-app toggle (450+ translation keys)
- **Theming** — Dark / light mode with persistent preference
- **Export** — CSV and PDF export for orders and analytics
- **Print** — Browser print with custom `@media print` styles

---

## Project Structure

```
PC-Store-Manager/
├── backend/                  # Express 5 API server
│   ├── src/
│   │   ├── controllers/      # Route handlers (9 controllers)
│   │   ├── services/         # Business logic (6 services)
│   │   ├── routes/           # Express Router definitions (9 route files)
│   │   ├── middlewares/      # Auth, error, i18n, sanitize
│   │   └── utils/            # Config, email, PDF, CSV, Supabase client, etc.
│   ├── tests/                # Jest unit tests
│   └── scripts/              # Migration and utility scripts
│
├── frontend/                 # Angular 21 SPA
│   ├── src/app/
│   │   ├── auth/             # Login, register, forgot, reset + guards & interceptor
│   │   ├── services/         # API service layer (item, order, dashboard, user, socket)
│   │   ├── models/           # TypeScript interfaces
│   │   ├── components/       # Feature pages (products, orders, analytics, profile)
│   │   ├── dashboard/        # Dashboard page
│   │   ├── admin-*/          # Admin pages (sessions, audit, action-result)
│   │   └── shared/           # Toast service & component
│   └── cypress/              # E2E tests
│
├── docs/documentation/       # Project documentation
├── render.yaml               # Render deployment config
├── start.js                  # Cross-platform launcher
└── package.json              # Monorepo scripts
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- A **Supabase** project (or compatible PostgreSQL database)
- SMTP credentials for email features (e.g., Gmail App Password)

---

## Environment Variables

Create a `.env` file in `backend/`:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `3000` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_KEY` | Supabase service-role key | `eyJ...` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `REFRESH_TOKEN_SECRET` | Refresh token signing secret | `your-refresh-secret` |
| `CORS_ORIGINS` | Allowed CORS origins (comma-separated) | `http://localhost:4200` |
| `SMTP_HOST` | SMTP host | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USER` | SMTP username | `user@gmail.com` |
| `SMTP_PASS` | SMTP password / app password | `xxxx xxxx xxxx xxxx` |
| `SMTP_FROM` | Sender address | `"PC Store" <noreply@example.com>` |
| `FRONTEND_URL` | Frontend base URL (for email links) | `http://localhost:4200` |

---

## Setup & Run

### Quick Start (Monorepo)

```bash
# Install all dependencies (root + backend + frontend)
npm run install:all

# Start both servers in development mode
npm run dev
```

This runs:
- **Backend** on `http://localhost:3000` (Express + Swagger at `/api-docs`)
- **Frontend** on `http://localhost:4200` (Angular dev server with proxy)

### Alternative Start Methods

| Method | Command | Notes |
|---|---|---|
| Auto-open browser | `npm run dev:open` | Waits for backend, then opens `localhost:4200` |
| Auto-launch | `npm run dev:launch` | Uses `start.js` cross-platform launcher |
| Windows batch | `start.bat` | Double-click to start |
| VS Code task | `Run Dev` task | Defined in `.vscode/tasks.json` |

### Run Individually

```bash
# Backend only
cd backend
npm install
npm run dev          # nodemon with --experimental-vm-modules

# Frontend only
cd frontend
npm install
npm start            # ng serve → http://localhost:4200
```

---

## API Documentation

Interactive Swagger UI is available at:

```
http://localhost:3000/api-docs
```

### Key Endpoints

| Group | Base Path | Auth | Description |
|---|---|---|---|
| Auth | `/auth` | Mixed | Register, login, refresh, logout, forgot/reset password, sessions |
| Items | `/items` | Required | Product CRUD, categories, brands |
| Orders | `/orders` | Required | Order CRUD, status, assignment, export |
| Customers | `/customers` | Required | Customer CRUD |
| Users | `/users` | Required | Profile, avatar, password, workers list |
| Analytics | `/analytics` | Staff+ | Charts data, summary, export |
| Dashboard | `/dashboard` | Required | Stats and activity feed |
| Health | `/health` | None | Server health check |

See [Backend Documentation](docs/documentation/BACKEND_DOCUMENTATION.md) for full endpoint details.

---

## Testing

### Backend (Jest)

```bash
cd backend
npm test
```

### Frontend (Karma + Jasmine)

```bash
cd frontend
npm run test
```

### E2E (Cypress)

```bash
cd frontend
npm run cy:open      # Interactive mode
npm run cy:run       # Headless mode
```

---

## Deployment

The project is configured for **Render** via `render.yaml`:

| Service | Type | Root | Build |
|---|---|---|---|
| Backend | Web Service | `backend/` | `npm install` → `node src/index.js` |
| Frontend | Static Site | `frontend/` | `npm install && npm run build` → `dist/frontend/browser` |

The frontend's `public/_redirects` file handles SPA routing in Render's static hosting.

### Environment-Specific API URLs

| Environment | URL |
|---|---|
| Development | `http://localhost:3000` |
| Production | `https://pc-store-manager.onrender.com` |

---

## Documentation

| Document | Description |
|---|---|
| [Backend Documentation](docs/documentation/BACKEND_DOCUMENTATION.md) | Complete backend API reference, middleware pipeline, data model, security |
| [Frontend Documentation](docs/documentation/FRONTEND_DOCUMENTATION.md) | Angular architecture, routing, services, components, theming, i18n |
