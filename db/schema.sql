-- 《改写人生剧本》兑换码 — Neon PostgreSQL schema
-- NOT live until Jay runs this against Neon and configures DATABASE_URL.
-- Apply once:  psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS redeem_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_hash       TEXT NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'unused'
                    CHECK (status IN ('unused', 'activated', 'void')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  activated_at    TIMESTAMPTZ,
  expires_at      TIMESTAMPTZ,
  activation_jti  TEXT UNIQUE,
  note            TEXT
);

CREATE INDEX IF NOT EXISTS idx_redeem_codes_status ON redeem_codes (status);
CREATE INDEX IF NOT EXISTS idx_redeem_codes_expires_at ON redeem_codes (expires_at);

-- Optional: soft rate-limit audit (activate endpoint also uses in-memory window)
CREATE TABLE IF NOT EXISTS redeem_activate_attempts (
  id           BIGSERIAL PRIMARY KEY,
  ip_hash      TEXT NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  outcome      TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_redeem_attempts_ip_time
  ON redeem_activate_attempts (ip_hash, created_at DESC);

COMMENT ON TABLE redeem_codes IS 'Hashed redeem codes only — never store plaintext codes.';
COMMENT ON COLUMN redeem_codes.code_hash IS 'HMAC-SHA256 hex of normalized code with CODE_PEPPER';
COMMENT ON COLUMN redeem_codes.activation_jti IS 'JWT jti issued on successful activate';
