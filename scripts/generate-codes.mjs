#!/usr/bin/env node
/**
 * Generate Crockford-style redeem codes.
 * Outputs:
 *   - plaintext list for Jay (keep offline / password manager)
 *   - SQL INSERT with hashes only (safe to apply to Neon)
 *
 * Usage:
 *   CODE_PEPPER=... node scripts/generate-codes.mjs --count 20
 *   CODE_PEPPER=... node scripts/generate-codes.mjs --count 5 --expires 2027-01-01 --note batch1
 *
 * NOT live: does not talk to Neon unless --apply is passed with DATABASE_URL.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateCode, hashCode } from './lib/codes.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function arg(name, fallback = undefined) {
  const i = process.argv.indexOf(`--${name}`)
  if (i === -1) return fallback
  return process.argv[i + 1] ?? fallback
}
function hasFlag(name) {
  return process.argv.includes(`--${name}`)
}

const count = Number(arg('count', '10')) || 10
const expires = arg('expires', null) // YYYY-MM-DD or ISO
const note = arg('note', null)
const apply = hasFlag('apply')
const pepper = process.env.CODE_PEPPER?.trim()

if (!pepper) {
  console.error('CODE_PEPPER env is required (same value as Netlify).')
  process.exit(1)
}
if (count < 1 || count > 5000) {
  console.error('--count must be 1..5000')
  process.exit(1)
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const outDir = join(root, 'scripts', 'out')
mkdirSync(outDir, { recursive: true })

const rows = []
for (let i = 0; i < count; i++) {
  const code = generateCode(8)
  const code_hash = hashCode(code, pepper)
  rows.push({ code, code_hash })
}

const plainPath = join(outDir, `codes-plaintext-${stamp}.txt`)
const sqlPath = join(outDir, `codes-insert-${stamp}.sql`)
const jsonPath = join(outDir, `codes-meta-${stamp}.json`)

const plainLines = [
  `# 《改写人生剧本》兑换码明文 — ${stamp}`,
  `# KEEP SECRET. Do not commit. Do not put in Neon.`,
  `# count=${count}` + (expires ? ` expires=${expires}` : '') + (note ? ` note=${note}` : ''),
  '',
  ...rows.map((r, i) => `${String(i + 1).padStart(3, '0')}\t${r.code}`),
  '',
]
writeFileSync(plainPath, plainLines.join('\n'), 'utf8')

const expSql = expires ? `'${expires.replace(/'/g, "''")}'::timestamptz` : 'NULL'
const noteSql = note ? `'${note.replace(/'/g, "''")}'` : 'NULL'
const sqlLines = [
  '-- Hashes only — safe for Neon. Generated ' + stamp,
  'BEGIN;',
  ...rows.map(
    (r) =>
      `INSERT INTO redeem_codes (code_hash, status, expires_at, note) VALUES ('${r.code_hash}', 'unused', ${expSql}, ${noteSql}) ON CONFLICT (code_hash) DO NOTHING;`,
  ),
  'COMMIT;',
  '',
]
writeFileSync(sqlPath, sqlLines.join('\n'), 'utf8')

writeFileSync(
  jsonPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count,
      expires,
      note,
      hashes: rows.map((r) => r.code_hash),
      // plaintext intentionally omitted from json meta
    },
    null,
    2,
  ) + '\n',
  'utf8',
)

console.log(`Generated ${count} codes`)
console.log(`  plaintext (Jay only): ${plainPath}`)
console.log(`  SQL inserts (Neon):   ${sqlPath}`)
console.log(`  meta (hashes):        ${jsonPath}`)

if (apply) {
  const databaseUrl = process.env.DATABASE_URL?.trim()
  if (!databaseUrl) {
    console.error('--apply requires DATABASE_URL')
    process.exit(1)
  }
  const { default: pg } = await import('pg').catch(() => ({ default: null }))
  if (!pg) {
    console.error('Optional apply needs `pg`. Install: npm i -D pg')
    console.error(`Or run manually: psql "$DATABASE_URL" -f ${sqlPath}`)
    process.exit(1)
  }
  const client = new pg.Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  await client.connect()
  try {
    await client.query('BEGIN')
    for (const r of rows) {
      await client.query(
        `INSERT INTO redeem_codes (code_hash, status, expires_at, note)
         VALUES ($1, 'unused', $2, $3)
         ON CONFLICT (code_hash) DO NOTHING`,
        [r.code_hash, expires, note],
      )
    }
    await client.query('COMMIT')
    console.log('Applied inserts to Neon via DATABASE_URL')
  } catch (e) {
    await client.query('ROLLBACK')
    console.error('Apply failed:', e)
    process.exit(1)
  } finally {
    await client.end()
  }
} else {
  console.log('Tip: apply SQL with  psql "$DATABASE_URL" -f ' + sqlPath)
  console.log('Or:  CODE_PEPPER=... DATABASE_URL=... node scripts/generate-codes.mjs --count N --apply')
}

console.log('\nRemember: add scripts/out/ to secrets handling — plaintext must not be committed.')
