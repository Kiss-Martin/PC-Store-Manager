# Backend (Supabase + Express)

This backend implements a small REST API using Supabase as the data store.

Quick start

1. Copy `.env.example` to `.env` and set `SUPABASE_KEY` (service role or anon depending on your setup) and `JWT_SECRET`.
2. Install dependencies:

```bash
cd backend
npm install
```

3. Run in development:

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
