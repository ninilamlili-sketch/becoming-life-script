import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'

/** Crockford Base32 alphabet (no I, L, O, U). */
export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/**
 * Normalize user input: strip dashes/spaces, uppercase,
 * map visually ambiguous chars (O→0, I/L→1) then drop invalid.
 */
export function normalizeCode(raw: string): string {
  return raw
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-HJKMNP-TV-Z]/g, '')
}

/** Format as XXXX-XXXX-XXXX for display. */
export function formatCode(normalized: string): string {
  const s = normalizeCode(normalized)
  const parts: string[] = []
  for (let i = 0; i < s.length; i += 4) {
    parts.push(s.slice(i, i + 4))
  }
  return parts.join('-')
}

export function generateCode(byteLen = 8): string {
  const bytes = randomBytes(byteLen)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += CROCKFORD[bytes[i]! % 32]
  }
  return formatCode(out)
}

export function hashCode(code: string, pepper: string): string {
  const normalized = normalizeCode(code)
  return createHmac('sha256', pepper).update(normalized, 'utf8').digest('hex')
}

export function safeEqualHex(a: string, b: string): boolean {
  try {
    const ba = Buffer.from(a, 'hex')
    const bb = Buffer.from(b, 'hex')
    if (ba.length !== bb.length) return false
    return timingSafeEqual(ba, bb)
  } catch {
    return false
  }
}
