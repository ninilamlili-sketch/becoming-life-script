/** Client-side redeem credential helpers.
 *  Stores HMAC JWT issued by the server — never a bare boolean flag.
 *  Signature verification is server-side (/api/redeem/session); locally we
 *  only decode exp for UX gating.
 */

const TOKEN_KEY = 'becoming-redeem-jwt'

export type StoredRedeemAuth = {
  token: string
  expiresAt?: string
}

function b64urlToJson(part: string): Record<string, unknown> | null {
  try {
    const pad = '='.repeat((4 - (part.length % 4)) % 4)
    const b64 = (part + pad).replace(/-/g, '+').replace(/_/g, '/')
    const json = atob(b64)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

/** Soft decode of JWT payload (no signature check). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  return b64urlToJson(parts[1]!)
}

export function saveRedeemToken(token: string, expiresAt?: string) {
  const payload: StoredRedeemAuth = { token, expiresAt }
  localStorage.setItem(TOKEN_KEY, JSON.stringify(payload))
}

export function clearRedeemToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export function loadRedeemAuth(): StoredRedeemAuth | null {
  try {
    const raw = localStorage.getItem(TOKEN_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredRedeemAuth
    if (!parsed?.token || typeof parsed.token !== 'string') return null
    return parsed
  } catch {
    return null
  }
}

export function getRedeemToken(): string | null {
  return loadRedeemAuth()?.token ?? null
}

/** True when a JWT is present and its exp (if any) is still in the future. */
export function hasValidRedeemToken(): boolean {
  const auth = loadRedeemAuth()
  if (!auth?.token) return false
  const payload = decodeJwtPayload(auth.token)
  if (!payload) return false
  if (payload.typ !== 'redeem') return false
  const exp = typeof payload.exp === 'number' ? payload.exp : null
  if (exp !== null && exp * 1000 <= Date.now()) {
    clearRedeemToken()
    return false
  }
  if (auth.expiresAt) {
    const t = Date.parse(auth.expiresAt)
    if (!Number.isNaN(t) && t <= Date.now()) {
      clearRedeemToken()
      return false
    }
  }
  return true
}

export async function activateRedeemCode(code: string): Promise<{
  ok: boolean
  token?: string
  expiresAt?: string
  message: string
  error?: string
}> {
  try {
    const res = await fetch('/api/redeem/activate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
    const data = (await res.json().catch(() => null)) as {
      ok?: boolean
      token?: string
      expiresAt?: string
      message?: string
      error?: string
    } | null

    if (!data) {
      return {
        ok: false,
        error: 'bad_response',
        message: '服务器响应异常，请稍后再试。',
      }
    }

    if (!res.ok || !data.ok || !data.token) {
      return {
        ok: false,
        error: data.error || `http_${res.status}`,
        message:
          data.message ||
          (res.status === 503
            ? '兑换服务尚未配置完成（需要 Neon / Netlify 环境变量）。'
            : '验证失败，请稍后再试。'),
      }
    }

    saveRedeemToken(data.token, data.expiresAt)
    return {
      ok: true,
      token: data.token,
      expiresAt: data.expiresAt,
      message: data.message || '验证成功',
    }
  } catch {
    return {
      ok: false,
      error: 'network',
      message:
        '无法连接兑换服务。若在本地预览且未启动 Netlify Functions，这是预期行为（NOT live）。',
    }
  }
}

/** Optional online session check when backend is configured. */
export async function checkRedeemSession(): Promise<boolean> {
  const token = getRedeemToken()
  if (!token) return false
  try {
    const res = await fetch('/api/redeem/session', {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (res.status === 503) {
      // Backend not configured — fall back to local soft check
      return hasValidRedeemToken()
    }
    if (!res.ok) {
      clearRedeemToken()
      return false
    }
    const data = (await res.json()) as { ok?: boolean }
    return Boolean(data.ok)
  } catch {
    return hasValidRedeemToken()
  }
}
