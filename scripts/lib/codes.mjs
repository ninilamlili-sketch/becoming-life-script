import { createHmac, randomBytes } from 'node:crypto'

export const CROCKFORD = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

export function normalizeCode(raw) {
  return String(raw)
    .trim()
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/[^0-9A-HJKMNP-TV-Z]/g, '')
}

export function formatCode(normalized) {
  const s = normalizeCode(normalized)
  const parts = []
  for (let i = 0; i < s.length; i += 4) parts.push(s.slice(i, i + 4))
  return parts.join('-')
}

export function generateCode(byteLen = 8) {
  const bytes = randomBytes(byteLen)
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += CROCKFORD[bytes[i] % 32]
  return formatCode(out)
}

export function hashCode(code, pepper) {
  return createHmac('sha256', pepper).update(normalizeCode(code), 'utf8').digest('hex')
}
