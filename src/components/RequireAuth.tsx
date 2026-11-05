import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { hasValidRedeemToken } from '../lib/auth'

/** Guard consent / quiz / explore / report — requires a stored redeem JWT. */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const location = useLocation()
  const ok = hasValidRedeemToken()

  if (!ok) {
    return <Navigate to="/redeem" replace state={{ from: location.pathname }} />
  }

  return <>{children}</>
}
