#!/usr/bin/env node
/** Local unit checks — no Neon/Netlify required. */
import assert from 'node:assert/strict'
import { formatCode, generateCode, hashCode, normalizeCode, CROCKFORD } from './lib/codes.mjs'

const pepper = 'test-pepper-do-not-use-in-prod'

// normalize
assert.equal(normalizeCode(' ab-cd '), 'ABCD')
assert.equal(normalizeCode('OIL1'), '0111') // O→0, I→1, L→1
assert.equal(normalizeCode('abcd-efgh'), 'ABCDEFGH')

// format
assert.equal(formatCode('ABCDEFGH'), 'ABCD-EFGH')

// generate charset
for (let i = 0; i < 50; i++) {
  const c = generateCode(8)
  assert.match(c, /^[0-9A-HJKMNP-TV-Z]{4}(-[0-9A-HJKMNP-TV-Z]{4})+$/)
  for (const ch of normalizeCode(c)) assert.ok(CROCKFORD.includes(ch))
}

// hash stable + pepper-sensitive
const h1 = hashCode('ABCD-EFGH', pepper)
const h2 = hashCode('abcdefgh', pepper)
assert.equal(h1, h2)
assert.equal(h1.length, 64)
assert.notEqual(hashCode('ABCD-EFGH', pepper), hashCode('ABCD-EFGH', pepper + 'x'))

console.log('scripts/test-codes.mjs — all passed')
