import type { DimScore } from '../lib/types'

/** Soft editorial 7-axis radar — not a SaaS dashboard. */
export default function RadarChart({ scores }: { scores: DimScore[] }) {
  const size = 320
  const cx = size / 2
  const cy = size / 2
  const maxR = 108
  const levels = [0.33, 0.66, 1]

  const points = scores.map((s, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length
    const r = (Math.min(100, Math.max(0, s.normalized)) / 100) * maxR
    return {
      x: cx + r * Math.cos(angle),
      y: cy + r * Math.sin(angle),
      lx: cx + (maxR + 28) * Math.cos(angle),
      ly: cy + (maxR + 28) * Math.sin(angle),
      angle,
      s,
    }
  })

  const poly = points.map((p) => `${p.x},${p.y}`).join(' ')

  return (
    <div className="w-full flex justify-center py-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-full max-w-[300px] h-auto"
        role="img"
        aria-label="七维探索地图"
      >
        {levels.map((lv) => {
          const ring = scores
            .map((_, i) => {
              const angle = -Math.PI / 2 + (i * 2 * Math.PI) / scores.length
              const r = maxR * lv
              return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
            })
            .join(' ')
          return (
            <polygon
              key={lv}
              points={ring}
              fill="none"
              stroke="#E9E8E1"
              strokeWidth={1}
            />
          )
        })}
        {points.map((p, i) => (
          <line
            key={i}
            x1={cx}
            y1={cy}
            x2={cx + maxR * Math.cos(p.angle)}
            y2={cy + maxR * Math.sin(p.angle)}
            stroke="#E9E8E1"
            strokeWidth={1}
          />
        ))}
        <polygon
          points={poly}
          fill="rgba(216,182,111,0.18)"
          stroke="#D8B66F"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.4} fill="#C9A65F" />
        ))}
        {points.map((p, i) => {
          const shortMap: Record<string, string> = {
            money_wealth: '金钱',
            career_achievement: '职业',
            self_worth_identity: '自我',
            intimacy_love: '亲密',
            social_belonging: '人际',
            choice_agency: '选择',
            meaning_fulfillment: '意义',
          }
          const short = shortMap[p.s.key] ?? p.s.zh.slice(0, 2)
          const anchor =
            Math.abs(p.lx - cx) < 8 ? 'middle' : p.lx >= cx ? 'start' : 'end'
          return (
            <text
              key={`l-${i}`}
              x={p.lx}
              y={p.ly}
              textAnchor={anchor}
              dominantBaseline="middle"
              fill="#777970"
              fontSize={11}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {short}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
