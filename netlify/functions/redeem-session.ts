import type { Handler } from '@netlify/functions'
import { getSql } from './_shared/db'
import { isConfigured, loadRedeemEnv } from './_shared/env'
import { json, noContent } from './_shared/http'
import { verifyRedeemJwt } from './_shared/jwt'

/**
 * GET /api/redeem/session
 * Authorization: Bearer <jwt>
 * Optional session check — verifies HMAC JWT + DB jti still matches activated code.
 *
 * NOT live until env + Neon are configured.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return noContent()
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed', message: '请使用 GET 请求。' })
  }

  if (!isConfigured()) {
    return json(503, {
      ok: false,
      error: 'not_configured',
      message: '会话校验服务尚未配置。（NOT live）',
    })
  }

  let env
  try {
    env = loadRedeemEnv()
  } catch {
    return json(503, {
      ok: false,
      error: 'not_configured',
      message: '会话校验服务尚未配置。',
    })
  }

  const auth = event.headers.authorization || event.headers.Authorization || ''
  const m = /^Bearer\s+(.+)$/i.exec(auth)
  const token = m?.[1]?.trim()
  if (!token) {
    return json(401, {
      ok: false,
      error: 'missing_token',
      message: '请先完成兑换码验证。',
    })
  }

  try {
    const claims = await verifyRedeemJwt(token, env.jwtSecret)
    const sql = getSql(env.databaseUrl)
    const rows = (await sql`
      SELECT id, status, activation_jti, expires_at
      FROM redeem_codes
      WHERE id = ${claims.cid}
      LIMIT 1
    `) as { id: string; status: string; activation_jti: string | null; expires_at: string | null }[]

    const row = rows[0]
    if (!row || row.status !== 'activated' || row.activation_jti !== claims.jti) {
      return json(401, {
        ok: false,
        error: 'invalid_session',
        message: '凭证无效或已失效，请重新兑换。',
      })
    }

    return json(200, {
      ok: true,
      cid: row.id,
      exp: claims.exp ?? null,
    })
  } catch {
    return json(401, {
      ok: false,
      error: 'invalid_token',
      message: '凭证无效或已过期，请重新兑换。',
    })
  }
}
