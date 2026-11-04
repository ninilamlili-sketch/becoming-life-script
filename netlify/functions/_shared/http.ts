import type { HandlerResponse } from '@netlify/functions'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Admin-Secret',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

export function json(
  statusCode: number,
  body: Record<string, unknown>,
  extraHeaders: Record<string, string> = {},
): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS,
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  }
}

export function noContent(): HandlerResponse {
  return { statusCode: 204, headers: { ...CORS }, body: '' }
}

export function clientIp(headers: Record<string, string | undefined> | undefined): string {
  const h = headers || {}
  const xf = h['x-forwarded-for'] || h['X-Forwarded-For']
  if (xf) return xf.split(',')[0]!.trim()
  return h['client-ip'] || h['x-nf-client-connection-ip'] || 'unknown'
}

export async function readJsonBody<T>(event: { body?: string | null; isBase64Encoded?: boolean }): Promise<T | null> {
  if (!event.body) return null
  try {
    const raw = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64').toString('utf8')
      : event.body
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}
