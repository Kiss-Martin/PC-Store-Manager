-- Only works if you have permission to create DBs
CREATE DATABASE PC-Store-Adatbázis;

-- =========================
-- Extensions (required)
-- =========================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =========================
-- Users
-- =========================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  role text NOT NULL,
  email text NOT NULL UNIQUE,
  fullname text NOT NULL UNIQUE,
  admin_approved boolean DEFAULT false,
  admin_approved_by uuid,
  admin_approved_at timestamp with time zone,
  created_at date,
  worker_approved_by uuid,
  worker_approved_at timestamp with time zone,
  metadata text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT fk_users_admin_approved_by
    FOREIGN KEY (admin_approved_by)
    REFERENCES public.users (id)
);

-- =========================
-- Brands
-- =========================
CREATE TABLE IF NOT EXISTS public.brands (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT brands_pkey PRIMARY KEY (id)
);

-- =========================
-- Categories
-- =========================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);

-- =========================
-- Customers
-- =========================
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text UNIQUE,
  phone text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id)
);

-- =========================
-- Items
-- =========================
CREATE TABLE IF NOT EXISTS public.items (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  amount integer NOT NULL,
  category_id uuid NOT NULL,
  model text,
  specifications text,
  warranty bigint,
  brand_id uuid NOT NULL,
  price numeric DEFAULT 0,
  date_added text,
  CONSTRAINT items_pkey PRIMARY KEY (id),
  CONSTRAINT fk_items_category
    FOREIGN KEY (category_id)
    REFERENCES public.categories (id),
  CONSTRAINT fk_items_brand
    FOREIGN KEY (brand_id)
    REFERENCES public.brands (id)
);

-- =========================
-- Audit Logs
-- =========================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  actor_user_id uuid,
  target_user_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_audit_actor
    FOREIGN KEY (actor_user_id)
    REFERENCES public.users (id),
  CONSTRAINT fk_audit_target
    FOREIGN KEY (target_user_id)
    REFERENCES public.users (id)
);

-- =========================
-- Logs
-- =========================
CREATE TABLE IF NOT EXISTS public.logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  item_id uuid NOT NULL,
  action text NOT NULL,
  timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  details text,
  user_id uuid,
  customer_id uuid,
  assigned_to uuid,
  CONSTRAINT logs_pkey PRIMARY KEY (id),
  CONSTRAINT fk_logs_item
    FOREIGN KEY (item_id)
    REFERENCES public.items (id),
  CONSTRAINT fk_logs_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id),
  CONSTRAINT logs_customer_id_fkey
    FOREIGN KEY (customer_id)
    REFERENCES public.customers (id),
  CONSTRAINT logs_assigned_to_fkey
    FOREIGN KEY (assigned_to)
    REFERENCES public.users (id)
);

-- =========================
-- Orders Status
-- =========================
CREATE TABLE IF NOT EXISTS public.orders_status (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  log_id uuid NOT NULL,
  status text NOT NULL
    CHECK (status = ANY (ARRAY[
      'pending'::text,
      'processing'::text,
      'completed'::text,
      'cancelled'::text
    ])),
  updated_at timestamp without time zone DEFAULT now(),
  updated_by uuid,
  CONSTRAINT orders_status_pkey PRIMARY KEY (id),
  CONSTRAINT orders_status_log_id_fkey
    FOREIGN KEY (log_id)
    REFERENCES public.logs (id),
  CONSTRAINT orders_status_updated_by_fkey
    FOREIGN KEY (updated_by)
    REFERENCES public.users (id)
);

-- =========================
-- Tasks
-- =========================
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  description text NOT NULL,
  assigned_worker_id uuid NOT NULL,
  status text,
  deadline date,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT fk_tasks_user
    FOREIGN KEY (assigned_worker_id)
    REFERENCES public.users (id)
);

-- =========================
-- Password Resets
-- =========================
CREATE TABLE IF NOT EXISTS public.password_resets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL,
  CONSTRAINT password_resets_pkey PRIMARY KEY (id),
  CONSTRAINT fk_password_resets_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
);

-- =========================
-- Refresh Tokens
-- =========================
CREATE TABLE IF NOT EXISTS public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  token_hash text NOT NULL,
  access_jti uuid,
  ip text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_used_at timestamp with time zone,
  expires_at timestamp with time zone,
  revoked boolean NOT NULL DEFAULT false,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES public.users (id)
);

-- =========================
-- Revoked Tokens
-- =========================
CREATE TABLE IF NOT EXISTS public.revoked_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  jti uuid NOT NULL,
  reason text,
  revoked_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone,
  CONSTRAINT revoked_tokens_pkey PRIMARY KEY (id),
  CONSTRAINT fk_revoked_by_user
    FOREIGN KEY (revoked_by)
    REFERENCES public.users (id)
);
