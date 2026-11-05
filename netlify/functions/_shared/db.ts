import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

let sql: NeonQueryFunction<false, false> | null = null

export function getSql(databaseUrl: string) {
  if (!sql) {
    sql = neon(databaseUrl)
  }
  return sql
}

export type RedeemRow = {
  id: string
  code_hash: string
  status: 'unused' | 'activated' | 'void'
  created_at: string
  activated_at: string | null
  expires_at: string | null
  activation_jti: string | null
  note: string | null
}
