-- =====================================================================
-- Esquema de la base de datos para Seguridad Ciudadana Táchira
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id                BIGSERIAL PRIMARY KEY,
  nombre            TEXT        NOT NULL,
  correo            TEXT        NOT NULL UNIQUE,
  telefono          TEXT        NOT NULL DEFAULT '',
  cedula            TEXT        NOT NULL DEFAULT '',
  municipio         TEXT        NOT NULL DEFAULT '',
  password_hash     TEXT        NOT NULL,
  avatar_url        TEXT,
  reset_code        TEXT,
  reset_code_expiry TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS users_correo_idx ON public.users (correo);

-- Habilita Row Level Security. Las rutas /api del backend usan la
-- SERVICE_ROLE_KEY y la saltan; cualquier otro acceso queda bloqueado.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.password_reset_attempts (
  id BIGSERIAL PRIMARY KEY,
  correo TEXT NOT NULL,
  ip_address TEXT NOT NULL DEFAULT 'unknown',
  attempt_time TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS password_reset_attempts_correo_idx ON public.password_reset_attempts (correo);

ALTER TABLE public.password_reset_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Select own profile" ON public.users
  FOR SELECT
  USING (correo = auth.email());

CREATE POLICY "Update own profile" ON public.users
  FOR UPDATE
  USING (correo = auth.email());

CREATE POLICY "Insert own profile" ON public.users
  FOR INSERT
  WITH CHECK (correo = auth.email());

CREATE POLICY "Insert reset attempt" ON public.password_reset_attempts
  FOR INSERT
  WITH CHECK (correo = auth.email());
