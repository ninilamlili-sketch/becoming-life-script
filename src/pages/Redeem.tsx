import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/Button'
import Layout from '../components/Layout'
import { activateRedeemCode, hasValidRedeemToken } from '../lib/auth'

export default function Redeem() {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  useEffect(() => {
    if (hasValidRedeemToken()) {
      navigate('/consent', { replace: true })
    }
  }, [navigate])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setHint(null)
    const trimmed = code.trim()
    if (!trimmed) {
      setError('请输入兑换码。')
      return
    }
    setBusy(true)
    const result = await activateRedeemCode(trimmed)
    setBusy(false)
    if (result.ok) {
      navigate('/consent', { replace: true })
      return
    }
    setError(result.message)
    if (result.error === 'not_configured' || result.error === 'network') {
      setHint(
        '说明：兑换 API 需 Netlify + Neon 环境变量后才可真正验证。当前代码已就绪，但服务尚未上线（NOT live）。',
      )
    }
  }

  return (
    <Layout>
      <div className="pt-6 pb-10 text-ink">
        <p className="font-display text-[13px] font-normal tracking-wide text-ink-muted mb-2">
          Redeem
        </p>
        <h1 className="font-sans text-[26px] sm:text-[28px] font-normal leading-tight text-ink mb-4">
          开启你的探索之旅
        </h1>
        <p className="text-[14px] font-sans leading-[1.85] text-ink-secondary mb-8 max-w-[22rem]">
          请输入购买后获得的专属兑换码，验证成功即可开始探索。
        </p>

        <form onSubmit={onSubmit} className="space-y-5 max-w-[22rem]">
          <div>
            <label htmlFor="redeem-code" className="sr-only">
              兑换码
            </label>
            <input
              id="redeem-code"
              type="text"
              inputMode="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="请输入兑换码"
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                if (error) setError(null)
              }}
              disabled={busy}
              className="w-full rounded-2xl border border-border bg-cream/90 px-4 py-3.5 text-[15px] tracking-[0.08em] text-ink placeholder:text-ink-muted/70 placeholder:tracking-normal focus:outline-none focus:border-gold focus:ring-2 focus:ring-gold/30 disabled:opacity-60"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-[13px] leading-relaxed text-[#8B5A4A] bg-[#F5EBE6]/70 border border-[#E8D5CC] rounded-xl px-3.5 py-2.5"
            >
              {error}
            </p>
          )}

          {hint && (
            <p className="text-[12px] leading-relaxed text-ink-muted bg-sand/60 border border-border rounded-xl px-3.5 py-2.5">
              {hint}
            </p>
          )}

          <Button type="submit" disabled={busy || !code.trim()} className="w-full">
            {busy ? '验证中…' : '验证并开始探索'}
          </Button>
        </form>

        <p className="mt-8 text-[12px] text-ink-muted leading-relaxed max-w-[22rem]">
          答案与报告仅保存在你的浏览器本地，不会随兑换上传。
        </p>
      </div>
    </Layout>
  )
}
