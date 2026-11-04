export type RedeemEnv = {
  databaseUrl: string
  codePepper: string
  jwtSecret: string
  adminSecret: string | null
  jwtTtlDays: number
  rateLimitMax: number
  rateLimitWindowSec: number
}

export function requireEnv(name: string): string {
  const v = process.env[name]?.trim()
  if (!v) {
    throw new Error(`Missing required env: ${name}`)
  }
  return v
}

export function loadRedeemEnv(): RedeemEnv {
  return {
    databaseUrl: requireEnv('DATABASE_URL'),
    codePepper: requireEnv('CODE_PEPPER'),
    jwtSecret: requireEnv('REDEEM_JWT_SECRET'),
    adminSecret: process.env.ADMIN_SECRET?.trim() || null,
    jwtTtlDays: Number(process.env.REDEEM_JWT_TTL_DAYS || '90') || 90,
    rateLimitMax: Number(process.env.REDEEM_RATE_LIMIT_MAX || '10') || 10,
    rateLimitWindowSec: Number(process.env.REDEEM_RATE_LIMIT_WINDOW_SEC || '900') || 900,
  }
}

export function isConfigured(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() &&
      process.env.CODE_PEPPER?.trim() &&
      process.env.REDEEM_JWT_SECRET?.trim(),
  )
}
