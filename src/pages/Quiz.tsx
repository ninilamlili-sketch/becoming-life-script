import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { Button } from '../components/Button'
import { getDimMeta, getQuestions } from '../lib/scoring'
import { bumpQuizCompletion, loadSession, saveSession } from '../lib/storage'
import type { Answer } from '../lib/types'

export default function Quiz() {
  const navigate = useNavigate()
  const questions = useMemo(() => getQuestions(), [])
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [otherText, setOtherText] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const s = loadSession()
    if (!s.consented) {
      navigate('/consent', { replace: true })
      return
    }
    if (s.answers.length) {
      setAnswers(s.answers)
      const answeredIds = new Set(s.answers.map((a) => a.questionId))
      const firstOpen = questions.findIndex((q) => !answeredIds.has(q.id))
      const start = firstOpen === -1 ? questions.length - 1 : firstOpen
      setIndex(start)
      const existing = s.answers.find((a) => a.questionId === questions[start]?.id)
      setOtherText(existing?.otherText ?? '')
    }
    setReady(true)
  }, [navigate, questions])

  const q = questions[index]
  const current = answers.find((a) => a.questionId === q?.id)
  const progress = ((index + 1) / questions.length) * 100
  const dimZh = q ? getDimMeta(q.dimension).zh : ''

  useEffect(() => {
    if (!q) return
    const existing = answers.find((a) => a.questionId === q.id)
    setOtherText(existing?.otherText ?? '')
  }, [index, q, answers])

  const persist = (list: Answer[], completed: boolean) => {
    const s = loadSession()
    s.answers = list
    s.completedQuiz = completed
    saveSession(s)
  }

  const select = (optionId: string) => {
    const next: Answer = {
      questionId: q.id,
      optionId,
      otherText: optionId === 'E' ? otherText : undefined,
    }
    setAnswers((prev) => {
      const list = [...prev.filter((a) => a.questionId !== q.id), next]
      persist(list, false)
      return list
    })
  }

  const goNext = () => {
    if (!current) return
    const withOther =
      current.optionId === 'E'
        ? answers.map((a) =>
            a.questionId === q.id ? { ...a, otherText } : a,
          )
        : answers
    if (current.optionId === 'E') setAnswers(withOther)

    if (index < questions.length - 1) {
      persist(withOther, false)
      setIndex(index + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Prefer freshly persisted session so completion is never lost to a stale state race.
      const fromStore = loadSession().answers
      const byId = new Map(fromStore.map((a) => [a.questionId, a]))
      for (const a of withOther) byId.set(a.questionId, a)
      byId.set(q.id, {
        questionId: q.id,
        optionId: current.optionId,
        otherText: current.optionId === 'E' ? otherText : undefined,
      })
      const finalList = Array.from(byId.values())
      persist(finalList, true)
      bumpQuizCompletion()
      navigate('/report')
    }
  }

  const goPrev = () => {
    if (index === 0) return
    if (current?.optionId === 'E') {
      const updated = answers.map((a) =>
        a.questionId === q.id ? { ...a, otherText } : a,
      )
      setAnswers(updated)
      persist(updated, false)
    }
    setIndex(index - 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!ready || !q) {
    return (
      <Layout>
        <p className="text-center text-[13px] text-ink-muted pt-16">准备情境…</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="quiz-page space-y-6">
        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between gap-3 text-[12px] text-ink-muted">
            <span className="tracking-[0.04em]">
              {index + 1} / {questions.length}
            </span>
            <span className="text-ink-secondary/90 truncate">{dimZh}</span>
          </div>
          <div
            className="h-[2px] w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={index + 1}
            aria-valuemin={1}
            aria-valuemax={questions.length}
            aria-label="答题进度"
          >
            <div
              className="h-full rounded-full bg-gold/80 transition-[width] duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="pt-1">
          <p className="font-sans text-[12px] tracking-[0.08em] text-ink-muted mb-3">
            {q.title}
          </p>
          <h2 className="font-sans text-[17px] leading-[1.7] font-medium text-ink">
            {q.scenario}
          </h2>
          <p className="mt-3 text-[12px] leading-relaxed text-ink-muted">
            没有标准答案。请选择此刻更接近你的第一反应。
          </p>
        </div>

        <div className="space-y-2.5" role="radiogroup" aria-label="情境选项">
          {q.options.map((opt) => {
            const selected = current?.optionId === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => select(opt.id)}
                className={`quiz-option w-full text-left rounded-xl border px-3.5 py-3.5 text-[14px] leading-[1.65] transition-all duration-150 ${
                  selected
                    ? 'border-gold bg-sand/80 text-ink shadow-[0_1px_0_rgba(216,182,111,0.18)]'
                    : 'border-border bg-cream/55 text-ink hover:border-gold/50 hover:bg-sand/40'
                }`}
              >
                <span className="flex gap-3 items-start">
                  <span
                    className={`mt-0.5 inline-flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[11px] tracking-wide ${
                      selected
                        ? 'border-gold bg-gold/15 text-ink'
                        : 'border-border bg-cream text-ink-muted'
                    }`}
                  >
                    {opt.id}
                  </span>
                  <span className="flex-1 pt-px">{opt.text}</span>
                </span>
              </button>
            )
          })}
        </div>

        {current?.optionId === 'E' && (
          <textarea
            className="w-full rounded-xl border border-border bg-cream/70 px-4 py-3 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-muted/80 focus:border-gold/60 resize-none min-h-[88px]"
            placeholder="可选：用一句话写下更贴近你的反应…"
            value={otherText}
            onChange={(e) => {
              const v = e.target.value
              setOtherText(v)
              setAnswers((prev) => {
                const list = prev.map((a) =>
                  a.questionId === q.id ? { ...a, otherText: v } : a,
                )
                persist(list, false)
                return list
              })
            }}
          />
        )}

        <div className="flex flex-col gap-2.5 pt-2 pb-4">
          <Button onClick={goNext} disabled={!current} className="w-full">
            {index === questions.length - 1 ? '完成探索' : '下一题'}
          </Button>
          <Button
            variant="ghost"
            onClick={goPrev}
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
