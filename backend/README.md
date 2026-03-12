# Backend (Supabase + Express)

This backend implements a small REST API using Supabase as the data store.

Quick start

1. Copy `.env.example` to `.env` and set `SUPABASE_URL`, `SUPABASE_KEY`, `JWT_SECRET`, and `FRONTEND_URL`.
2. If you want password reset emails to be delivered instead of logged, also set `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`, `SMTP_PORT`, `SMTP_SECURE`, and `SMTP_FROM`.
3. Install dependencies:

```bash
cd backend
npm install
```

4. Run in development:

```bash
npm run dev
```

API endpoints

- `GET /health` — service health and Supabase reachability
- `POST /auth/register` — register user (body: `email`, `password`, `username`, `fullName`, `role`)
- `POST /auth/login` — login (body: `email` or `username`, and `password`)
- `GET /me` — current user profile (requires `Authorization: Bearer <token>`)
- `GET /products` — list products
- `POST /products` — create product (requires auth)
- `POST /orders` — create order (requires auth)
- `GET /orders` — list orders (requires auth; non-admins see their own orders)

Notes

- This server expects Supabase tables `users`, `products`, and `orders` to exist. Each row's shape is flexible; the code inserts whatever JSON is given for products/orders.
- Passwords are stored as hashed values in `users.password_hash`.
- Adjust role checks and permissions as needed for your application.
- Password reset links use `FRONTEND_URL`. In production this must point at the deployed frontend, otherwise reset emails will contain a localhost link.
- SMTP is only enabled when `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` are all present. If the config is incomplete, the backend logs reset tokens instead of sending mail.

Render production environment variables

- `SUPABASE_URL=<your-supabase-project-url>`
- `SUPABASE_KEY=<your-supabase-service-key>`
- `JWT_SECRET=<strong-random-secret>`
- `FRONTEND_URL=https://pc-store-manager-frontend.onrender.com`
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=465`
- `SMTP_SECURE=true`
- `SMTP_USER=<your-sender-email>`
- `SMTP_PASS=<your-app-password>`
- `SMTP_FROM=PC Store Manager <your-sender-email>`
