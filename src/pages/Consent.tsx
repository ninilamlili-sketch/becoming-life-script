import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Button } from '../components/Button'
import { loadSession, saveSession } from '../lib/storage'

export default function Consent() {
  const navigate = useNavigate()
  const [agreed, setAgreed] = useState(false)

  const onContinue = () => {
    if (!agreed) return
    const s = loadSession()
    s.consented = true
    saveSession(s)
    navigate('/quiz')
  }

  return (
    <Layout>
      <div className="pt-4 pb-8 text-ink">
        <p className="font-display text-[13px] font-normal tracking-wide text-ink-muted mb-2">
          Before we begin
        </p>
        <h1 className="font-sans text-[28px] font-normal leading-tight text-ink mb-6">
          开始之前
        </h1>

        <div className="space-y-4 text-[14px] font-sans font-normal leading-[1.85] text-ink-secondary mb-8 max-w-[22rem]">
          <p>·你的答案仅用于生成这份探索地图。原型阶段,数据只保存在你自己的浏览器里。</p>
          <p>·这不是心理测评或诊断，结果只是「可能的线索」，你可以随时不同意。</p>
          <p>·若你正在经历强烈痛苦或有自伤风险,请优先联系当地专业与紧急资源。</p>
          <p>·你可以随时停下，也可以回到上一题修改。</p>
        </div>

        <label className="flex items-start gap-3 mb-8 cursor-pointer select-none">
          <span className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="peer sr-only"
            />
            <span
              className={`flex h-5 w-5 items-center justify-center rounded-full border transition-colors ${
                agreed
                  ? 'border-gold bg-gold/20 text-ink'
                  : 'border-border bg-cream'
              }`}
              aria-hidden
            >
              {agreed && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    d="M5 12l5 5L20 7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </span>
          <span className="text-[13px] font-sans font-normal leading-relaxed text-ink-secondary">
            我了解这不是心理测评或诊断，愿意开始探索。
          </span>
        </label>

        <Button
          onClick={onContinue}
          disabled={!agreed}
          variant="primary"
          className="w-full font-sans font-normal tracking-[0.12em]"
        >
          进入情境
        </Button>
      </div>
    </Layout>
  )
}
