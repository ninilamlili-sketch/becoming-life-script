import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

export type RedeemClaims = JWTPayload & {
  typ: 'redeem'
  cid: string
  jti: string
}

function secretKey(secret: string) {
  return new TextEncoder().encode(secret)
}

export async function issueRedeemJwt(opts: {
  secret: string
  codeId: string
  jti: string
  ttlDays: number
}): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const exp = now + opts.ttlDays * 24 * 60 * 60
  return new SignJWT({ typ: 'redeem', cid: opts.codeId })
    .setProtectedHeader({ alg: 'HS256' })
    .setJti(opts.jti)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(secretKey(opts.secret))
}

export async function verifyRedeemJwt(
  token: string,
  secret: string,
): Promise<RedeemClaims> {
  const { payload } = await jwtVerify(token, secretKey(secret), {
    algorithms: ['HS256'],
  })
  if (payload.typ !== 'redeem' || typeof payload.cid !== 'string' || !payload.jti) {
    throw new Error('invalid_token_claims')
  }
  return payload as RedeemClaims
}
