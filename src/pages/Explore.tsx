import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Layout from '../components/Layout'
import { Button } from '../components/Button'
import {
  deepQuestions,
  pickTopDimensions,
  scoreDimensions,
} from '../lib/scoring'
import { loadSession, saveSession } from '../lib/storage'
import type { DeepAnswer, DimKey } from '../lib/types'

export default function Explore() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const wantDeep = params.get('deep') === '1'

  const session = useMemo(() => loadSession(), [])
  const scores = useMemo(
    () => scoreDimensions(session.answers),
    [session.answers],
  )
  const top = useMemo(() => pickTopDimensions(scores), [scores])

  const items = useMemo(() => {
    const list: { dim: DimKey; zh: string; id: string; text: string }[] = []
    for (const t of top) {
      for (const dq of deepQuestions(t.key)) {
        list.push({ dim: t.key, zh: t.zh, id: dq.id, text: dq.text })
      }
    }
    return list
  }, [top])

  const mode: 'bridge' | 'deep' = wantDeep ? 'deep' : 'bridge'
  const [index, setIndex] = useState(0)
  const [texts, setTexts] = useState<Record<string, string>>({})

  useEffect(() => {
    const s = loadSession()
    if (!s.consented) {
      navigate('/consent', { replace: true })
      return
    }
    if (!s.completedQuiz || s.answers.length < 21) {
      navigate('/quiz', { replace: true })
      return
    }
    const map: Record<string, string> = {}
    for (const a of s.deepAnswers) map[a.questionId] = a.text
    setTexts(map)

    // Default path after quiz is /report; if someone lands on /explore without ?deep=1,
    // lightly forward to the analysis report so results are never "missing".
    if (!wantDeep) {
      const timer = window.setTimeout(() => {
        navigate('/report', { replace: true })
      }, 900)
      return () => window.clearTimeout(timer)
    }
  }, [navigate, wantDeep])

  const goReport = (map: Record<string, string>, completed: boolean) => {
    const deepAnswers: DeepAnswer[] = Object.entries(map)
      .filter(([, t]) => t.trim())
      .map(([questionId, text]) => ({ questionId, text }))
    const s = loadSession()
    s.deepAnswers = deepAnswers
    s.completedExplore = completed
    saveSession(s)
    navigate('/report')
  }

  if (mode === 'bridge') {
    return (
      <Layout>
        <div className="pt-10 pb-6 space-y-5 text-center px-1">
          <p className="font-display text-[12px] tracking-[0.16em] text-ink-muted">
            Almost there
          </p>
          <h1 className="font-sans text-[22px] leading-[1.5] font-medium text-ink">
            正在生成你的探索地图…
          </h1>
          <p className="text-[13px] leading-[1.7] text-ink-secondary">
            马上进入分析结果。
          </p>
          <Button className="w-full" onClick={() => goReport(texts, true)}>
            立即查看
          </Button>
        </div>
      </Layout>
    )
  }

  if (!items.length) {
    return (
      <Layout>
        <p className="text-sm text-ink-muted text-center pt-8">
          暂无深挖题目，正在进入报告…
        </p>
      </Layout>
    )
  }

  const cur = items[index]
  const value = texts[cur.id] ?? ''
  const progress = ((index + 1) / items.length) * 100

  return (
    <Layout>
      <div className="space-y-5">
        <div className="text-center px-1">
          <p className="font-display text-[12px] tracking-[0.14em] text-ink-muted mb-2">
            Optional
          </p>
          <h1 className="font-sans text-[20px] leading-[1.5] font-medium text-ink mb-2">
            轻轻展开
          </h1>
          <p className="text-[13px] text-ink-secondary leading-relaxed">
            可以写几句，也可以跳过。
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-[12px] text-ink-muted">
            <span>
              {index + 1} / {items.length}
            </span>
            <span className="truncate max-w-[65%] text-right text-ink-secondary">
              {cur.zh}
            </span>
          </div>
          <div className="h-[2px] w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-gold/80 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-cream/70 px-4 py-5 space-y-3">
          <p className="font-sans text-[15px] leading-relaxed font-medium text-ink">
            {cur.text}
          </p>
          <textarea
            className="w-full rounded-xl border border-border bg-cream px-4 py-3 text-[14px] outline-none focus:border-gold/60 resize-none min-h-[120px]"
            placeholder="可以写几句，也可以留空。"
            value={value}
            onChange={(e) =>
              setTexts((prev) => ({ ...prev, [cur.id]: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-col gap-2.5 pt-1">
          <Button
            onClick={() => {
              const nextMap = { ...texts, [cur.id]: value }
              setTexts(nextMap)
              if (index < items.length - 1) {
                setIndex(index + 1)
              } else {
                goReport(nextMap, true)
              }
            }}
            className="w-full"
          >
            {index === items.length - 1 ? '生成探索地图' : '下一题'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => goReport(texts, true)}
            className="w-full text-[13px]"
          >
            跳过，看报告
          </Button>
          <Button
            variant="ghost"
            onClick={() => setIndex(Math.max(0, index - 1))}
            disabled={index === 0}
            className="w-full text-[13px] py-2.5"
          >
            上一题
          </Button>
        </div>
      </div>
    </Layout>
  )
}
