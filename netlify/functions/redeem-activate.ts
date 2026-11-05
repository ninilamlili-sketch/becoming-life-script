import type { Handler } from '@netlify/functions'
import { randomUUID } from 'node:crypto'
import { hashCode, normalizeCode } from './_shared/codes'
import { getSql, type RedeemRow } from './_shared/db'
import { isConfigured, loadRedeemEnv } from './_shared/env'
import { clientIp, json, noContent, readJsonBody } from './_shared/http'
import { issueRedeemJwt } from './_shared/jwt'
import { checkRateLimit, hashIp } from './_shared/rateLimit'

/**
 * POST /api/redeem/activate
 * Body: { code: string }
 * Success: { ok: true, token: string, expiresAt: string }
 *
 * NOT live until DATABASE_URL + CODE_PEPPER + REDEEM_JWT_SECRET are set on Netlify.
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return noContent()
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, error: 'method_not_allowed', message: '请使用 POST 请求。' })
  }

  if (!isConfigured()) {
    return json(503, {
      ok: false,
      error: 'not_configured',
      message: '兑换服务尚未配置完成，请稍后再试。（NOT live — 缺少环境变量）',
    })
  }

  let env
  try {
    env = loadRedeemEnv()
  } catch {
    return json(503, {
      ok: false,
      error: 'not_configured',
      message: '兑换服务尚未配置完成，请稍后再试。',
    })
  }

  const ip = clientIp(event.headers)
  const rlKey = `activate:${hashIp(ip, env.codePepper)}`
  const rl = checkRateLimit(rlKey, env.rateLimitMax, env.rateLimitWindowSec)
  if (!rl.ok) {
    const retrySec = Math.max(1, Math.ceil((rl.resetAt - Date.now()) / 1000))
    return json(
      429,
      {
        ok: false,
        error: 'rate_limited',
        message: '尝试过于频繁，请稍后再试。',
        retryAfterSec: retrySec,
      },
      { 'Retry-After': String(retrySec) },
    )
  }

  const body = await readJsonBody<{ code?: string }>(event)
  const raw = body?.code ?? ''
  const normalized = normalizeCode(raw)

  if (normalized.length < 8) {
    return json(400, {
      ok: false,
      error: 'invalid_format',
      message: '兑换码格式不正确，请检查后重试。',
    })
  }

  const codeHash = hashCode(normalized, env.codePepper)
  const sql = getSql(env.databaseUrl)
  const jti = randomUUID()
  const ipHash = hashIp(ip, env.codePepper)

  try {
    // Best-effort audit (ignore failure)
    try {
      await sql`
        INSERT INTO redeem_activate_attempts (ip_hash, outcome)
        VALUES (${ipHash}, ${'attempt'})
      `
    } catch {
      /* table may not exist yet during first deploy */
    }

    const rows = (await sql`
      UPDATE redeem_codes
      SET
        status = 'activated',
        activated_at = now(),
        activation_jti = ${jti}
      WHERE code_hash = ${codeHash}
        AND status = 'unused'
        AND (expires_at IS NULL OR expires_at > now())
      RETURNING
        id, code_hash, status, created_at, activated_at, expires_at, activation_jti, note
    `) as RedeemRow[]

    if (!rows.length) {
      const existing = (await sql`
        SELECT status, expires_at
        FROM redeem_codes
        WHERE code_hash = ${codeHash}
        LIMIT 1
      `) as { status: string; expires_at: string | null }[]

      if (!existing.length) {
        await sql`
          INSERT INTO redeem_activate_attempts (ip_hash, outcome)
          VALUES (${ipHash}, ${'not_found'})
        `.catch(() => undefined)
        return json(404, {
          ok: false,
          error: 'not_found',
          message: '未找到该兑换码，请确认后重试。',
        })
      }

      const st = existing[0]!
      if (st.status === 'activated') {
        return json(409, {
          ok: false,
          error: 'already_used',
          message: '该兑换码已被使用。',
        })
      }
      if (st.status === 'void') {
        return json(410, {
          ok: false,
          error: 'void',
          message: '该兑换码已失效。',
        })
      }
      if (st.expires_at && new Date(st.expires_at).getTime() <= Date.now()) {
        return json(410, {
          ok: false,
          error: 'expired',
          message: '该兑换码已过期。',
        })
      }
      return json(400, {
        ok: false,
        error: 'unavailable',
        message: '暂时无法兑换，请稍后再试。',
      })
    }

    const row = rows[0]!
    const token = await issueRedeemJwt({
      secret: env.jwtSecret,
      codeId: row.id,
      jti,
      ttlDays: env.jwtTtlDays,
    })
    const expiresAt = new Date(
      Date.now() + env.jwtTtlDays * 24 * 60 * 60 * 1000,
    ).toISOString()

    await sql`
      INSERT INTO redeem_activate_attempts (ip_hash, outcome)
      VALUES (${ipHash}, ${'ok'})
    `.catch(() => undefined)

    return json(200, {
      ok: true,
      token,
      expiresAt,
      message: '验证成功，即将开始探索。',
    })
  } catch (err) {
    console.error('redeem-activate error', err)
    return json(500, {
      ok: false,
      error: 'server_error',
      message: '服务暂时不可用，请稍后再试。',
    })
  }
}
