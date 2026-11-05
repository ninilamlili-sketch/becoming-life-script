import { createHash } from 'node:crypto'

type Bucket = { count: number; resetAt: number }

/** Process-local rate limit (best-effort on serverless; pair with DB audit). */
const buckets = new Map<string, Bucket>()

export function hashIp(ip: string, pepper: string): string {
  return createHash('sha256').update(`${pepper}:${ip}`).digest('hex').slice(0, 32)
}

export function checkRateLimit(
  key: string,
  max: number,
  windowSec: number,
): { ok: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const windowMs = windowSec * 1000
  let b = buckets.get(key)
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + windowMs }
    buckets.set(key, b)
  }
  if (b.count >= max) {
    return { ok: false, remaining: 0, resetAt: b.resetAt }
  }
  b.count += 1
  return { ok: true, remaining: Math.max(0, max - b.count), resetAt: b.resetAt }
}
