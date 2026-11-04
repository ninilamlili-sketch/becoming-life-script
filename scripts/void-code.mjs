#!/usr/bin/env node
/**
 * Void a redeem code by plaintext or hash.
 *
 *   CODE_PEPPER=... DATABASE_URL=... node scripts/void-code.mjs --code 'XXXX-XXXX'
 *   DATABASE_URL=... node scripts/void-code.mjs --hash <64hex>
 *
 * Or call the ADMIN_SECRET-protected function once Netlify is live.
 */
import { hashCode, normalizeCode } from './lib/codes.mjs'

function arg(name) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return undefined
  return process.argv[i + 1]
}

const code = arg('code')
const hashArg = arg('hash')
const databaseUrl = process.env.DATABASE_URL?.trim()
const pepper = process.env.CODE_PEPPER?.trim()

if (!databaseUrl) {
  console.error('DATABASE_URL required')
  process.exit(1)
}

let codeHash = hashArg?.toLowerCase()
if (!codeHash && code) {
  if (!pepper) {
    console.error('CODE_PEPPER required when using --code')
    process.exit(1)
  }
  codeHash = hashCode(normalizeCode(code), pepper)
}
if (!codeHash || !/^[0-9a-f]{64}$/.test(codeHash)) {
  console.error('Provide --code or --hash (64 hex)')
  process.exit(1)
}

const { default: pg } = await import('pg').catch(() => ({ default: null }))
if (!pg) {
  console.error('Install pg: npm i -D pg')
  process.exit(1)
}

const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
await client.connect()
try {
  const res = await client.query(
    `UPDATE redeem_codes
     SET status = 'void'
     WHERE code_hash = $1 AND status IN ('unused', 'activated')
     RETURNING id, status`,
    [codeHash],
  )
  if (!res.rowCount) {
    console.error('No matching unused/activated code')
    process.exit(2)
  }
  console.log('Voided:', res.rows[0])
} finally {
  await client.end()
}
