import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import RadarChart from '../components/RadarChart'
import { Button, ButtonLink } from '../components/Button'
import {
  clueTier,
  clueTierLabel,
  collectBeliefInsights,
  detectCrossPatterns,
  focusReason,
  narrativesForReport,
  observationPractice,
  personalizedQuestions,
  pickTopDimensions,
  scoreDimensions,
} from '../lib/scoring'
import { exportElementPdf, exportElementPng } from '../lib/reportExport'
import ReportShareCard from '../components/ReportShareCard'
import {
  bumpReportView,
  clearSession,
  loadSession,
  saveSession,
} from '../lib/storage'

export default function Report() {
  const navigate = useNavigate()
  const exportRef = useRef<HTMLDivElement>(null)
  const [feedback, setFeedback] = useState<
    Record<string, 'confirm' | 'partial' | 'reject'>
  >({})
  const [ready, setReady] = useState(false)
  const [exporting, setExporting] = useState<'png' | 'pdf' | null>(null)
  const [exportMsg, setExportMsg] = useState('')

  const session = useMemo(() => loadSession(), [])
  /** Fixed WeChat CTA — admin panel removed; swap asset in /public if needed. */
  const admin = {
    wechatId: '',
    sectionTitle: '继续探索（可选）',
    guideCopy:
      '不添加微信也可以完整查看并导出本报告。若你愿意，可以自愿与我进一步交流——这不是获得报告的条件。',
    bookingCopy:
      '如果这份探索地图让你看见了一些过去没有留意的东西，也许你愿意给自己一点时间，继续往下探索。你可以选择与我进一步交流，看看这些发现如何与你真实的生活连接。',
    qrPlaceholder: '二维码尚未配置',
    qrImageDataUrl: '/wechat-qr.png',
  }

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
    setFeedback(s.clueFeedback || {})
    setReady(true)
    bumpReportView()
  }, [navigate])

  const scores = useMemo(
    () => scoreDimensions(session.answers),
    [session.answers],
  )
  const top = useMemo(() => pickTopDimensions(scores), [scores])
  const patterns = useMemo(
    () => detectCrossPatterns(scores, session.answers),
    [scores, session.answers],
  )
  const insights = useMemo(
    () => collectBeliefInsights(session.answers, top, 5),
    [session.answers, top],
  )
  const questions = useMemo(
    () => personalizedQuestions(top, session.answers, patterns),
    [top, session.answers, patterns],
  )
  const narratives = useMemo(
    () => narrativesForReport(top, insights),
    [top, insights],
  )
  const practice = useMemo(
    () => observationPractice(top[0]?.key),
    [top],
  )

  const setClueFb = (clue: string, v: 'confirm' | 'partial' | 'reject') => {
    const next = { ...feedback, [clue]: v }
    setFeedback(next)
    const s = loadSession()
    s.clueFeedback = next
    saveSession(s)
  }

  const deProtect = session.deepAnswers.filter((a) => /-03$/.test(a.questionId))
  const deLimit = session.deepAnswers.filter((a) => /-04$/.test(a.questionId))

  const runExport = async (kind: 'png' | 'pdf') => {
    if (!exportRef.current || exporting) return
    setExporting(kind)
    setExportMsg('')
    try {
      if (kind === 'png') {
        await exportElementPng(exportRef.current)
        setExportMsg('图片已开始下载（仅保存在你的设备）。')
      } else {
        await exportElementPdf(exportRef.current)
        setExportMsg('PDF 已开始下载（仅保存在你的设备）。')
      }
    } catch (e) {
      console.error(e)
      setExportMsg('导出失败，请稍后重试或改用系统打印。')
    } finally {
      setExporting(null)
    }
  }

  if (!ready) {
    return (
      <Layout>
        <p className="text-center text-[13px] text-ink-muted pt-16">
          正在整理你的探索地图…
        </p>
      </Layout>
    )
  }

  return (
    <Layout showLegalFooter>
      <div className="pb-4">
        {/* Actions — outside export canvas */}
        <div className="mb-6 space-y-2.5 no-print">
          <p className="text-[12px] text-ink-muted leading-relaxed">
            完整报告如下，可导出图片或 PDF 自行保存。
          </p>
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              disabled={!!exporting}
              onClick={() => runExport('png')}
            >
              {exporting === 'png' ? '正在生成图片…' : '保存报告图片'}
            </Button>
            <Button
              variant="secondary"
              className="w-full"
              disabled={!!exporting}
              onClick={() => runExport('pdf')}
            >
              {exporting === 'pdf' ? '正在生成 PDF…' : '导出 PDF'}
            </Button>
          </div>
          {exportMsg && (
            <p className="text-[12px] text-ink-secondary">{exportMsg}</p>
          )}
        </div>

        {/* Offscreen share card for PNG/PDF — hex-only styles */}
        <div
          aria-hidden
          style={{
            position: 'fixed',
            left: -10000,
            top: 0,
            pointerEvents: 'none',
          }}
        >
          <div ref={exportRef}>
            <ReportShareCard
              scores={scores}
              top={top}
              insights={insights}
              narratives={narratives}
              questions={questions}
              practice={practice}
              patterns={patterns}
            />
          </div>
        </div>

        <div className="report-page space-y-10 rounded-2xl bg-[#F8F7F2] px-1 pb-2">
          {/* Brand share header */}
          <section className="space-y-4 text-center px-2 pt-2">
            <img
              src="/becoming-logo-home.webp"
              alt="becoming"
              className="mx-auto block w-[168px] h-auto"
              width={168}
              height={38}
              decoding="async"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = '/becoming-logo-home.png'
              }}
            />
            <p className="font-display text-[14px] text-ink-secondary tracking-[0.02em]">
              Every moment is a chance to become.
            </p>
            <p className="text-[12.5px] text-ink-muted">
              每一次觉察，都是成为自己的开始。
            </p>
            <div className="mx-auto h-px w-10 bg-border" />
            <p className="font-display text-[11px] tracking-[0.16em] text-ink-muted">
              A JOURNEY OF SELF-DISCOVERY
            </p>
            <h1 className="font-sans text-[24px] leading-[1.45] font-medium text-ink">
              你的内在探索地图
            </h1>
            <p className="text-[13px] text-ink-secondary leading-relaxed">
              谢谢你认真走完这 21 个生活情境。
              <br />
              下面不是评判，也不是诊断——只是根据你的选择，整理出的可能线索。
            </p>
          </section>

          {/* 1. Seven-dim map */}
          <section className="space-y-4 px-1">
            <div className="space-y-1">
              <h2 className="font-sans text-[18px] font-medium text-ink">
                你的七维探索地图
              </h2>
              <p className="text-[12px] text-ink-muted leading-relaxed">
                细线表示各领域里自动化想法被启动的相对强度——不是好坏分。
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-cream/60 px-2 pt-3 pb-2">
              <RadarChart scores={scores} />
            </div>

            <div className="space-y-2.5">
              {scores
                .slice()
                .sort((a, b) => b.normalized - a.normalized)
                .map((s) => {
                  const tier = clueTier(s.normalized)
                  return (
                    <div
                      key={s.key}
                      className="rounded-xl border border-border bg-cream/50 px-4 py-3.5"
                    >
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="font-medium text-[14px] text-ink">
                            {s.zh}
                          </p>
                          <p className="text-[11px] text-ink-muted mt-0.5 leading-relaxed">
                            {s.core}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] tracking-wide ${
                            tier === 'high'
                              ? 'bg-sand text-ink border border-gold/40'
                              : tier === 'mid'
                                ? 'bg-sage/70 text-ink-secondary border border-border'
                                : 'bg-cream text-ink-muted border border-border'
                          }`}
                        >
                          {clueTierLabel(tier)}
                        </span>
                      </div>
                      <div className="h-[2px] rounded-full bg-border overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full bg-gold/75"
                          style={{ width: `${s.normalized}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-ink-muted leading-relaxed">
                        {tier === 'low'
                          ? '这一领域里，你的反应相对柔和，或更偏务实评估与价值选择。'
                          : s.clues.length
                            ? `可能线索：${s.clues.slice(0, 2).join('；')}`
                            : '值得轻轻留意这里反复出现的反应习惯。'}
                      </p>
                    </div>
                  )
                })}
            </div>
          </section>

          {/* 2. Focus */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              值得关注的领域
            </h2>
            {top.map((t) => (
              <div
                key={t.key}
                className="rounded-xl border border-gold/35 bg-sand/40 px-4 py-4 space-y-2"
              >
                <p className="font-medium text-[15px] text-ink">{t.zh}</p>
                <p className="text-[13.5px] leading-[1.75] text-ink-secondary">
                  {focusReason(t, insights)}
                </p>
              </div>
            ))}
          </section>

          {/* 3. Beliefs */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              可能存在的内在信念
            </h2>
            <p className="text-[12px] text-ink-muted leading-relaxed">
              以下表述基于你的具体选择，使用「可能 / 似乎」——请你来确认是否贴合。
            </p>
            {insights.length === 0 ? (
              <p className="text-[14px] text-ink-secondary leading-relaxed">
                这一次，高分选项里的僵化线索并不集中——也可能说明你更多在做务实评估或价值选择。这也很好。
              </p>
            ) : (
              <ul className="space-y-3">
                {insights.map((ins) => (
                  <li
                    key={`${ins.questionId}-${ins.clue}`}
                    className="rounded-xl border border-border bg-cream/70 px-4 py-4"
                  >
                    <p className="text-[14.5px] font-medium text-ink mb-1.5">
                      「{ins.clue}」
                    </p>
                    <p className="text-[12px] text-ink-muted leading-relaxed mb-3">
                      似乎与你在「{ins.title}」中的反应有关（{ins.dimZh}
                      ）。这可能是一条值得留意、可以进一步探索的内在规则。
                    </p>
                    <div className="flex flex-wrap gap-2 no-print">
                      {(
                        [
                          ['confirm', '确认符合'],
                          ['partial', '部分符合'],
                          ['reject', '不符合'],
                        ] as const
                      ).map(([k, label]) => (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setClueFb(ins.clue, k)}
                          className={`rounded-full px-3 py-1.5 text-[11px] border transition-colors ${
                            feedback[ins.clue] === k
                              ? 'border-gold bg-gold/20 text-ink'
                              : 'border-border text-ink-muted hover:border-gold/50'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 4. Protect */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              这些信念曾经保护过你
            </h2>
            <p className="text-[13.5px] leading-[1.75] text-ink-secondary">
              不要把它们简单看成「坏东西」。一条曾经形成的规则，可能帮你获得过安全感、减少风险、维持关系，或适应环境。
            </p>
            <ul className="space-y-2.5">
              {narratives.map((n) => (
                <li
                  key={`p-${n.name}`}
                  className="text-[13.5px] leading-relaxed text-ink-secondary flex gap-2"
                >
                  <span className="text-gold mt-1.5 shrink-0">·</span>
                  <span>
                    <span className="text-ink">{n.name}</span>
                    ：{n.positive}
                    {n.perspective ? ` —— ${n.perspective}` : ''}
                  </span>
                </li>
              ))}
              {deProtect.map((a) => (
                <li
                  key={a.questionId}
                  className="text-[13.5px] leading-relaxed text-ink-secondary flex gap-2"
                >
                  <span className="text-gold mt-1.5 shrink-0">·</span>
                  <span>
                    你提到：{a.text.slice(0, 140)}
                    {a.text.length > 140 ? '…' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 5. Limits */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              它可能带来的限制
            </h2>
            <ul className="space-y-2.5">
              {narratives.map((n) => (
                <li
                  key={`l-${n.name}`}
                  className="text-[13.5px] leading-relaxed text-ink-secondary flex gap-2"
                >
                  <span className="text-ink-muted mt-1.5 shrink-0">·</span>
                  <span>
                    当「{n.name}」变得过度固定时，可能让：{n.limit}
                  </span>
                </li>
              ))}
              {deLimit.map((a) => (
                <li
                  key={a.questionId}
                  className="text-[13.5px] leading-relaxed text-ink-secondary flex gap-2"
                >
                  <span className="text-ink-muted mt-1.5 shrink-0">·</span>
                  <span>
                    你提到：{a.text.slice(0, 140)}
                    {a.text.length > 140 ? '…' : ''}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {/* 6. Cross */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              跨领域共同主题
            </h2>
            {patterns.length === 0 ? (
              <p className="text-[13.5px] text-ink-secondary leading-relaxed">
                这一次，跨领域的共同主题还不那么集中。证据不足时，我们不强行总结。
              </p>
            ) : (
              <ul className="space-y-2.5">
                {patterns.map((p) => (
                  <li
                    key={p.key}
                    className="rounded-xl border border-border bg-mist/40 px-4 py-3.5"
                  >
                    <p className="text-[14px] font-medium text-ink mb-1">
                      {p.name}
                    </p>
                    <p className="text-[12.5px] text-ink-muted leading-relaxed">
                      从你在不同领域的回答来看，似乎出现了一条相似的线索。这可能意味着，有一个共同主题值得进一步探索——仍请你来确认。
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* 7. Questions */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              留给自己的问题
            </h2>
            <div className="space-y-2.5">
              {questions.map((q) => (
                <p
                  key={q}
                  className="rounded-xl border border-gold/30 bg-sand/35 px-4 py-4 text-[14.5px] leading-[1.75] text-ink font-sans"
                >
                  {q}
                </p>
              ))}
            </div>
          </section>

          {/* 8. Practice */}
          <section className="space-y-3 px-1">
            <h2 className="font-sans text-[18px] font-medium text-ink">
              一个日常自我观察练习
            </h2>
            <div className="rounded-xl border border-border bg-cream/70 px-4 py-4 text-[13.5px] leading-[1.8] text-ink-secondary whitespace-pre-line">
              {practice}
            </div>
          </section>

          {/* 9. Ending */}
          <section className="space-y-4 text-center px-2">
            <div className="mx-auto h-px w-10 bg-border" />
            <div className="text-[13.5px] leading-[1.85] text-ink-secondary space-y-3 text-left">
              <p>
                这份地图呈现的是你此刻的部分内在图景，而不是对你的最终定义。
              </p>
              <p className="font-sans text-[15px] text-ink leading-relaxed">
                当你不再被这些想法限制时，你希望自己如何选择？
              </p>
              <p>看见，是改变的开始。</p>
            </div>
            <p className="font-display text-[13px] text-ink-muted pt-2">
              becoming · Every moment is a chance to become.
            </p>
          </section>
        </div>

        {/* Optional WeChat — fixed bundled QR */}
        <section className="mt-10 rounded-2xl border border-border bg-cream/60 px-5 py-6 space-y-3 no-print">
          <h2 className="font-sans text-[17px] font-medium text-ink text-center">
            {admin.sectionTitle || '继续探索（可选）'}
          </h2>
          <p className="text-[13px] leading-[1.75] text-ink-secondary text-center">
            {admin.bookingCopy}
          </p>
          <p className="text-[12px] text-ink-muted text-center leading-relaxed">
            {admin.guideCopy ||
              '不添加微信也可以完整查看并导出本报告。我们不会自动收集微信号、手机号或姓名。'}
          </p>
          <div className="flex flex-col items-center gap-2 pt-1">
            {admin.qrImageDataUrl ? (
              <picture>
                {admin.qrImageDataUrl.startsWith('/') &&
                admin.qrImageDataUrl.endsWith('.png') ? (
                  <source
                    srcSet={admin.qrImageDataUrl.replace(/\.png$/, '.webp')}
                    type="image/webp"
                  />
                ) : null}
                <img
                  src={admin.qrImageDataUrl}
                  alt="微信二维码"
                  className="h-28 w-28 object-contain rounded-xl border border-border bg-cream p-1.5"
                  width={112}
                  height={112}
                />
              </picture>
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-xl border border-dashed border-border bg-sand/30 text-[10px] text-ink-muted text-center px-2 leading-snug">
                {admin.qrPlaceholder || '二维码尚未配置'}
                <br />
                暂不可扫码
              </div>
            )}
            {admin.wechatId ? (
              <p className="text-[12px] text-ink-secondary">{admin.wechatId}</p>
            ) : (
              <p className="text-[11px] text-ink-muted">
                {admin.qrImageDataUrl
                  ? '可通过上方二维码自愿联系'
                  : '二维码暂未配置'}
              </p>
            )}
          </div>
          <ButtonLink to="/explore?deep=1" variant="secondary" className="w-full text-[13px]">
            愿意的话，可再深挖几问
          </ButtonLink>
        </section>

        <div className="mt-6 flex flex-col gap-2.5 no-print">
          <ButtonLink to="/" variant="primary" className="w-full">
            回到首页
          </ButtonLink>
          <Button
            variant="ghost"
            className="w-full text-[13px]"
            onClick={() => {
              clearSession()
              navigate('/')
            }}
          >
            重新开始（清除本机作答）
          </Button>
        </div>
      </div>
    </Layout>
  )
}
