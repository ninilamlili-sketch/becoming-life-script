import type { BeliefInsight, ThemeNarrative } from '../lib/scoring'
import type { DimScore } from '../lib/types'
import { clueTier, clueTierLabel } from '../lib/scoring'

/** Self-contained share/export surface — hex inline styles only (no oklab). */
export default function ReportShareCard({
  scores,
  top,
  insights,
  narratives,
  questions,
  practice,
  patterns,
}: {
  scores: DimScore[]
  top: DimScore[]
  insights: BeliefInsight[]
  narratives: ThemeNarrative[]
  questions: string[]
  practice: string
  patterns: { key: string; name: string }[]
}) {
  const sorted = [...scores].sort((a, b) => b.normalized - a.normalized)

  return (
    <div
      id="report-share-card"
      style={{
        background: '#F8F7F2',
        color: '#393A35',
        padding: '28px 22px 36px',
        fontFamily:
          '"PingFang SC","Hiragino Sans GB","Microsoft YaHei",system-ui,sans-serif',
        width: '390px',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <img
          src="/becoming-logo-home.png"
          alt="becoming"
          width={168}
          height={38}
          style={{ display: 'block', margin: '0 auto 14px', width: 168, height: 'auto' }}
          crossOrigin="anonymous"
        />
        <p
          style={{
            margin: '0 0 6px',
            fontSize: 14,
            color: '#777970',
            fontFamily: 'Georgia,"Songti SC",serif',
          }}
        >
          Every moment is a chance to become.
        </p>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#A3A49B' }}>
          每一次觉察，都是成为自己的开始。
        </p>
        <div
          style={{
            width: 40,
            height: 1,
            background: '#E9E8E1',
            margin: '0 auto 16px',
          }}
        />
        <p
          style={{
            margin: '0 0 8px',
            fontSize: 11,
            letterSpacing: '0.16em',
            color: '#A3A49B',
            fontFamily: 'Georgia,serif',
          }}
        >
          A JOURNEY OF SELF-DISCOVERY
        </p>
        <h1
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.45,
            fontFamily: '"Songti SC","STSong",Georgia,serif',
          }}
        >
          你的内在探索地图
        </h1>
      </div>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          七维探索地图
        </h2>
        {sorted.map((s) => {
          const tier = clueTier(s.normalized)
          return (
            <div
              key={s.key}
              style={{
                border: '1px solid #E9E8E1',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 8,
                background: '#FCFBF8',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{s.zh}</div>
                  <div style={{ fontSize: 11, color: '#A3A49B', marginTop: 2 }}>
                    {s.core}
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                    border: '1px solid #E9E8E1',
                    borderRadius: 999,
                    padding: '4px 8px',
                    color: '#777970',
                    background: tier === 'high' ? '#F0EDE5' : '#FCFBF8',
                    height: 'fit-content',
                  }}
                >
                  {clueTierLabel(tier)}
                </span>
              </div>
              <div
                style={{
                  height: 2,
                  background: '#E9E8E1',
                  borderRadius: 99,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${s.normalized}%`,
                    height: '100%',
                    background: '#D8B66F',
                  }}
                />
              </div>
            </div>
          )
        })}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          值得关注的领域
        </h2>
        {top.map((t) => (
          <div
            key={t.key}
            style={{
              border: '1px solid #D8B66F',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 8,
              background: '#F0EDE5',
              fontSize: 13,
              lineHeight: 1.7,
              color: '#777970',
            }}
          >
            <div style={{ color: '#393A35', fontWeight: 600, marginBottom: 4 }}>
              {t.zh}
            </div>
            相对探索强度 {t.normalized}/100。这是根据你的作答整理的线索，不是诊断。
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          可能存在的内在信念
        </h2>
        {insights.length === 0 ? (
          <p style={{ fontSize: 13, color: '#777970', lineHeight: 1.7 }}>
            这一次僵化线索并不集中，也可能说明你更多在做务实评估或价值选择。
          </p>
        ) : (
          insights.map((ins) => (
            <div
              key={`${ins.questionId}-${ins.clue}`}
              style={{
                border: '1px solid #E9E8E1',
                borderRadius: 12,
                padding: '12px 14px',
                marginBottom: 8,
                background: '#FCFBF8',
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                「{ins.clue}」
              </div>
              <div style={{ fontSize: 12, color: '#A3A49B', lineHeight: 1.65 }}>
                似乎与「{ins.title}」有关（{ins.dimZh}
                ）。可能值得留意，可以进一步探索。
              </div>
            </div>
          ))
        )}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          这些信念曾经保护过你
        </h2>
        {narratives.map((n) => (
          <p
            key={`p-${n.name}`}
            style={{ fontSize: 13, color: '#777970', lineHeight: 1.7, margin: '0 0 8px' }}
          >
            · <span style={{ color: '#393A35' }}>{n.name}</span>：{n.positive}
          </p>
        ))}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          它可能带来的限制
        </h2>
        {narratives.map((n) => (
          <p
            key={`l-${n.name}`}
            style={{ fontSize: 13, color: '#777970', lineHeight: 1.7, margin: '0 0 8px' }}
          >
            · 当「{n.name}」过度固定时，可能让：{n.limit}
          </p>
        ))}
      </section>

      {patterns.length > 0 && (
        <section style={{ marginBottom: 22 }}>
          <h2
            style={{
              margin: '0 0 10px',
              fontSize: 16,
              fontWeight: 500,
              fontFamily: '"Songti SC",serif',
            }}
          >
            跨领域共同主题
          </h2>
          {patterns.map((p) => (
            <p
              key={p.key}
              style={{ fontSize: 13, color: '#777970', lineHeight: 1.7, margin: '0 0 8px' }}
            >
              · {p.name}（可能的线索，请你确认）
            </p>
          ))}
        </section>
      )}

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          留给自己的问题
        </h2>
        {questions.map((q) => (
          <div
            key={q}
            style={{
              border: '1px solid #D8B66F',
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 8,
              background: '#F0EDE5',
              fontSize: 14,
              lineHeight: 1.75,
              fontFamily: '"Songti SC",serif',
            }}
          >
            {q}
          </div>
        ))}
      </section>

      <section style={{ marginBottom: 22 }}>
        <h2
          style={{
            margin: '0 0 10px',
            fontSize: 16,
            fontWeight: 500,
            fontFamily: '"Songti SC",serif',
          }}
        >
          日常自我观察练习
        </h2>
        <div
          style={{
            border: '1px solid #E9E8E1',
            borderRadius: 12,
            padding: '12px 14px',
            background: '#FCFBF8',
            fontSize: 13,
            color: '#777970',
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
          }}
        >
          {practice}
        </div>
      </section>

      <section style={{ textAlign: 'center', paddingTop: 8 }}>
        <div
          style={{
            width: 40,
            height: 1,
            background: '#E9E8E1',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontSize: 13, color: '#777970', lineHeight: 1.8, textAlign: 'left' }}>
          这份地图呈现的是你此刻的部分内在图景，而不是对你的最终定义。看见，是改变的开始。
        </p>
        <p
          style={{
            marginTop: 18,
            fontSize: 13,
            color: '#A3A49B',
            fontFamily: 'Georgia,serif',
          }}
        >
          becoming · Every moment is a chance to become.
        </p>
        <p style={{ marginTop: 8, fontSize: 10, color: '#A3A49B' }}>
          本地生成 · 未上传答案 · 非诊断
        </p>
      </section>
    </div>
  )
}
