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
