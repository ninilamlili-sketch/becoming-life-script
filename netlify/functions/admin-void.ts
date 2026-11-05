import type { Handler } from '@netlify/functions'
import { timingSafeEqual } from 'node:crypto'
import { hashCode, normalizeCode } from './_shared/codes'
import { getSql } from './_shared/db'
import { isConfigured, loadRedeemEnv } from './_shared/env'
import { json, noContent, readJsonBody } from './_shared/http'

function safeEqualStr(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return timingSafeEqual(ba, bb)
}

/**
 * POST /api/admin/void
 * Headers: X-Admin-Secret: <ADMIN_SECRET>
 * Body: { code?: string, codeHash?: string }
 * Ops-only — no public /admin UI.
 *
 * NOT live until ADMIN_SECRET + DB env configured.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return noContent()
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed' })
  }

  if (!isConfigured()) {
    return json(503, { ok: false, error: 'not_configured', message: 'NOT live' })
  }

  let env
  try {
    env = loadRedeemEnv()
  } catch {
    return json(503, { ok: false, error: 'not_configured' })
  }

  if (!env.adminSecret) {
    return json(503, { ok: false, error: 'admin_not_configured', message: 'ADMIN_SECRET 未配置' })
  }

  const provided =
    event.headers['x-admin-secret'] ||
    event.headers['X-Admin-Secret'] ||
    ''
  if (!provided || !safeEqualStr(provided, env.adminSecret)) {
    return json(401, { ok: false, error: 'unauthorized' })
  }

  const body = await readJsonBody<{ code?: string; codeHash?: string }>(event)
  let codeHash = body?.codeHash?.trim() || ''
  if (!codeHash && body?.code) {
    codeHash = hashCode(normalizeCode(body.code), env.codePepper)
  }
  if (!/^[0-9a-f]{64}$/i.test(codeHash)) {
    return json(400, { ok: false, error: 'invalid_input', message: '需要 code 或 codeHash' })
  }

  try {
    const sql = getSql(env.databaseUrl)
    const rows = (await sql`
      UPDATE redeem_codes
      SET status = 'void'
      WHERE code_hash = ${codeHash.toLowerCase()}
        AND status IN ('unused', 'activated')
      RETURNING id, status
    `) as { id: string; status: string }[]

    if (!rows.length) {
      return json(404, { ok: false, error: 'not_found' })
    }
    return json(200, { ok: true, id: rows[0]!.id, status: 'void' })
  } catch (err) {
    console.error('admin-void error', err)
    return json(500, { ok: false, error: 'server_error' })
  }
}

