import bank from '../data/bank.json'
import type { Answer, DimKey, DimScore, Question } from './types'

const questions = bank.questions as Question[]
const dims = bank.dimensions as { key: DimKey; zh: string; core: string }[]
const tieBreak = bank.tie_break_order as DimKey[]

export function getQuestions(): Question[] {
  return questions
}

export function getDimMeta(key: DimKey) {
  return dims.find((d) => d.key === key)!
}

export function scoreDimensions(answers: Answer[]): DimScore[] {
  const byQ = new Map(answers.map((a) => [a.questionId, a]))
  return dims.map((d) => {
    const qs = questions.filter((q) => q.dimension === d.key)
    let raw = 0
    let answered = 0
    const clues: string[] = []
    for (const q of qs) {
      const a = byQ.get(q.id)
      if (!a) continue
      const opt = q.options.find((o) => o.id === a.optionId)
      if (!opt) continue
      answered += 1
      raw += opt.score
      if (opt.score >= 2 && opt.belief_clue) clues.push(opt.belief_clue)
    }
    const denom = Math.max(answered, 1) * 3
    // product default: all 21 answered → raw/9*100; missing adjusts denom
    const normalized =
      answered === 0
        ? 0
        : Math.round((raw / (answered === 3 ? 9 : denom)) * 100)
    return {
      key: d.key,
      zh: d.zh,
      core: d.core,
      raw,
      normalized,
      clues: [...new Set(clues)],
    }
  })
}

export function pickTopDimensions(scores: DimScore[]): DimScore[] {
  const ranked = [...scores].sort((a, b) => {
    if (b.normalized !== a.normalized) return b.normalized - a.normalized
    return tieBreak.indexOf(a.key) - tieBreak.indexOf(b.key)
  })
  const top1 = ranked[0]
  const result = [top1]
  if (ranked[1] && top1.normalized - ranked[1].normalized <= 8) {
    result.push(ranked[1])
  }
  return result
}

export function detectCrossPatterns(
  scores: DimScore[],
  answers: Answer[],
): { key: string; name: string; avgN: number }[] {
  const N = Object.fromEntries(scores.map((s) => [s.key, s.normalized])) as Record<
    DimKey,
    number
  >
  const byQ = new Map(answers.map((a) => [a.questionId, a]))
  const scoreOf = (qid: string) => {
    const a = byQ.get(qid)
    if (!a) return 0
    const q = questions.find((x) => x.id === qid)
    return q?.options.find((o) => o.id === a.optionId)?.score ?? 0
  }
  const high = (k: DimKey) => N[k] >= 60
  const mid = (k: DimKey) => N[k] >= 50

  const hits: { key: string; name: string; avgN: number; dims: DimKey[] }[] = []

  const push = (key: string, name: string, related: DimKey[], ok: boolean) => {
    if (!ok) return
    const avgN = related.reduce((s, k) => s + N[k], 0) / related.length
    hits.push({ key, name, avgN, dims: related })
  }

  push(
    'scarcity_insecurity',
    '匮乏与不安全感',
    ['money_wealth', 'career_achievement', 'intimacy_love'],
    high('money_wealth') &&
      (high('career_achievement') || high('intimacy_love') ||
        (mid('money_wealth') && mid('career_achievement') && mid('intimacy_love'))),
  )
  push(
    'fear_of_failure',
    '害怕失败',
    ['career_achievement', 'choice_agency'],
    (high('career_achievement') && mid('choice_agency')) ||
      ['Q04', 'Q06', 'Q16', 'Q18'].filter((id) => scoreOf(id) >= 2).length >= 2,
  )
  push(
    'perfectionism',
    '完美主义倾向',
    ['choice_agency', 'career_achievement', 'self_worth_identity'],
    high('choice_agency') &&
      (mid('career_achievement') || mid('self_worth_identity')),
  )
  push(
    'people_pleasing',
    '讨好与过度迎合',
    ['social_belonging', 'intimacy_love', 'self_worth_identity'],
    (high('social_belonging') &&
      (mid('intimacy_love') || mid('self_worth_identity'))) ||
      ['Q09', 'Q13', 'Q14'].filter((id) => scoreOf(id) >= 2).length >= 2,
  )
  push(
    'control_certainty',
    '控制与过度确定性需求',
    ['choice_agency', 'money_wealth', 'career_achievement'],
    high('choice_agency') && (mid('money_wealth') || mid('career_achievement')),
  )
  push(
    'over_responsibility',
    '过度责任感',
    ['social_belonging', 'meaning_fulfillment', 'intimacy_love'],
    high('social_belonging') && mid('meaning_fulfillment'),
  )
  push(
    'external_validation',
    '外部评价依赖',
    ['self_worth_identity', 'social_belonging', 'career_achievement'],
    high('self_worth_identity') &&
      (mid('social_belonging') || mid('career_achievement')),
  )
  push(
    'self_negation',
    '自我否定',
    ['self_worth_identity', 'meaning_fulfillment', 'money_wealth'],
    high('self_worth_identity') && mid('meaning_fulfillment'),
  )

  return hits
    .sort((a, b) => b.avgN - a.avgN)
    .slice(0, 3)
    .map(({ key, name, avgN }) => ({ key, name, avgN }))
}

export function collectTopClues(scores: DimScore[], top: DimScore[]): string[] {
  const topKeys = new Set(top.map((t) => t.key))
  const clues: string[] = []
  for (const s of scores) {
    if (!topKeys.has(s.key)) continue
    for (const c of s.clues) {
      if (!clues.includes(c)) clues.push(c)
    }
  }
  return clues.slice(0, 7)
}

export function personalizedQuestion(
  top: DimScore[],
  answers: Answer[],
  patterns: { key: string }[],
): string {
  if (!top.length) {
    return '在你走过的情景里，哪一个自动化反应你最想在下一周只是多注意 10 秒，而不急着改掉？'
  }
  const topKey = top[0].key
  const byQ = new Map(answers.map((a) => [a.questionId, a]))
  const opt = (qid: string) => byQ.get(qid)?.optionId
  const isCD = (qid: string) => {
    const id = opt(qid)
    return id === 'C' || id === 'D'
  }

  const table: [boolean, string][] = [
    [
      topKey === 'money_wealth' && (isCD('Q01') || isCD('Q02')),
      '你是真的想要更稳的财务安排，还是害怕「钱一松动，连自己都会站不稳」？',
    ],
    [
      topKey === 'money_wealth' && isCD('Q03'),
      '当你犹豫着谈报酬时，你是在保护关系，还是在悄悄问自己「我配不配被看见这份价值」？',
    ],
    [
      topKey === 'career_achievement' && isCD('Q04'),
      '你迟迟不开始，是还缺一块关键准备，还是害怕「一开始就被定义成不行」？',
    ],
    [
      topKey === 'career_achievement' && isCD('Q05'),
      '你抓住的是稳定本身，还是害怕失去稳定之后，不知道自己还是谁？',
    ],
    [
      topKey === 'career_achievement' && isCD('Q06'),
      '当结果不如预期，你是在复盘这件事，还是在判决「我有没有资格谈成就」？',
    ],
    [
      topKey === 'self_worth_identity' && (isCD('Q07') || isCD('Q08')),
      '当你不断要求自己更好时，你是在追求成长，还是在努力证明自己值得被认可？',
    ],
    [
      topKey === 'self_worth_identity' && isCD('Q09'),
      '你一直把别人的期待放得很前——那么，你自己的感受，通常放在哪里？',
    ],
    [
      topKey === 'intimacy_love' && isCD('Q10'),
      '你迟迟不提需求，是体贴，还是害怕「一开口，爱就变条件」？',
    ],
    [
      topKey === 'intimacy_love' && (isCD('Q11') || isCD('Q12')),
      '你拼命维持关系平稳，是因为珍惜对方，还是不能想象「被留下的自己」？',
    ],
    [
      topKey === 'social_belonging' && (isCD('Q13') || isCD('Q15')),
      '你很难让别人失望——若有一次温和的「不」，你担心失去的是关系，还是「我是好人」的位置？',
    ],
    [
      topKey === 'social_belonging' && isCD('Q14'),
      '你躲开冲突时，是在保护关系，还是在保护「我不犯错」的自己？',
    ],
    [
      topKey === 'choice_agency' && (isCD('Q16') || isCD('Q17')),
      '你等待更多确定，是为了走得更稳，还是无法忍受「带着未知也要迈步」的感觉？',
    ],
    [
      topKey === 'choice_agency' && isCD('Q18'),
      '你寻找最好的选项时，是在对生活负责，还是不能接受「不完美的自己也配选择」？',
    ],
    [
      topKey === 'meaning_fulfillment' && (isCD('Q19') || isCD('Q20')),
      '你把喜欢往后排，是阶段性策略，还是「我的需求不重要」这条旧规则在值班？',
    ],
    [
      topKey === 'meaning_fulfillment' && isCD('Q21'),
      '你掂量自由的代价时，是在务实地估价，还是已经默认「像样的人生必须先像别人要的那样」？',
    ],
    [
      patterns.some((p) => p.key === 'people_pleasing'),
      '你一直在照顾别人的感受，那么，你自己的感受通常放在哪里？',
    ],
    [
      patterns.some((p) => p.key === 'scarcity_insecurity'),
      '在钱、成就或亲密里反复出现的「怕失去」——它现在保护的是安全，还是也锁住了你想靠近的生活？',
    ],
    [
      patterns.some((p) => p.key === 'external_validation'),
      '若今天没有新的夸奖或成绩，你是否仍允许自己觉得「我可以」？',
    ],
  ]

  for (const [cond, q] of table) {
    if (cond) return q
  }
  return `在「${top[0].zh}」里，哪一个自动化反应你最想在下一周只是多注意 10 秒，而不急着改掉？`
}

export function microAction(topKey: DimKey): string {
  const map = bank.micro_actions as Record<string, string>
  return map[topKey] ?? '今天给自己留出 10 分钟，只是观察某个熟悉的自动化反应，不急着改掉它。'
}

export function themesFor(dim: DimKey) {
  return (bank.belief_themes as Record<string, {
    key: string
    name: string
    positive: string
    limit: string
    perspective: string
    explore: string
  }[]>)[dim] ?? []
}

export function deepQuestions(dim: DimKey) {
  return (bank.deep_explore as Record<string, { id: string; text: string }[]>)[dim] ?? []
}

export type ClueTier = 'low' | 'mid' | 'high'

export function clueTier(normalized: number): ClueTier {
  if (normalized >= 67) return 'high'
  if (normalized >= 40) return 'mid'
  return 'low'
}

export function clueTierLabel(tier: ClueTier): string {
  if (tier === 'high') return '较值得进一步探索'
  if (tier === 'mid') return '值得留意'
  return '相对较少显现'
}

export interface BeliefInsight {
  clue: string
  dimension: DimKey
  dimZh: string
  questionId: string
  title: string
  optionText: string
  score: number
}

/** Collect belief clues with answer evidence, prioritized by top dims then score. */
export function collectBeliefInsights(
  answers: Answer[],
  top: DimScore[],
  limit = 5,
): BeliefInsight[] {
  const byQ = new Map(answers.map((a) => [a.questionId, a]))
  const topKeys = top.map((t) => t.key)
  const items: BeliefInsight[] = []

  for (const q of questions) {
    const a = byQ.get(q.id)
    if (!a) continue
    const opt = q.options.find((o) => o.id === a.optionId)
    if (!opt || opt.score < 2 || !opt.belief_clue) continue
    items.push({
      clue: opt.belief_clue,
      dimension: q.dimension,
      dimZh: getDimMeta(q.dimension).zh,
      questionId: q.id,
      title: q.title,
      optionText: opt.text,
      score: opt.score,
    })
  }

  items.sort((a, b) => {
    const ai = topKeys.indexOf(a.dimension)
    const bi = topKeys.indexOf(b.dimension)
    const aw = ai === -1 ? 99 : ai
    const bw = bi === -1 ? 99 : bi
    if (aw !== bw) return aw - bw
    return b.score - a.score
  })

  const seen = new Set<string>()
  const out: BeliefInsight[] = []
  for (const it of items) {
    if (seen.has(it.clue)) continue
    seen.add(it.clue)
    out.push(it)
    if (out.length >= limit) break
  }
  return out
}

export function personalizedQuestions(
  top: DimScore[],
  answers: Answer[],
  patterns: { key: string }[],
): string[] {
  const first = personalizedQuestion(top, answers, patterns)
  const qs: string[] = [first]
  const byQ = new Map(answers.map((a) => [a.questionId, a]))
  const isCD = (qid: string) => {
    const id = byQ.get(qid)?.optionId
    return id === 'C' || id === 'D'
  }

  const candidates: [boolean, string][] = [
    [
      !!top[1],
      `在「${top[1]?.zh ?? ''}」里，若少一点自动化反应，你最想多出的一点空间是什么？`,
    ],
    [
      patterns.some((p) => p.key === 'control_certainty') || isCD('Q16'),
      '你一直在等待一个更好的时机，还是在等待一个不会让自己感到害怕的时机？',
    ],
    [
      patterns.some((p) => p.key === 'perfectionism') || isCD('Q18'),
      '如果不再需要通过结果证明自己，你会怎样重新选择？',
    ],
    [
      patterns.some((p) => p.key === 'self_negation') || isCD('Q08'),
      '当你「什么都没产出」的一天结束时，你如何对自己说话？',
    ],
    [
      isCD('Q19') || isCD('Q20'),
      '若责任清单可以暂时短一点，你真正想留给自己的那一小段时间会用来做什么？',
    ],
  ]

  for (const [cond, q] of candidates) {
    if (!cond) continue
    if (qs.includes(q)) continue
    qs.push(q)
    if (qs.length >= 2) break
  }

  if (qs.length < 2 && top[0]) {
    const fallback = `看见「${top[0].zh}」里那条熟悉的想法时，你身体里最先出现的是紧，还是松？`
    if (!qs.includes(fallback)) qs.push(fallback)
  }
  return qs.slice(0, 2)
}

export interface ThemeNarrative {
  name: string
  positive: string
  limit: string
  perspective: string
  dimZh: string
}

/** Pick belief themes for top dims, preferring ones that match insight clues. */
export function narrativesForReport(
  top: DimScore[],
  insights: BeliefInsight[],
): ThemeNarrative[] {
  const clueText = insights.map((i) => i.clue).join(' ')
  const out: ThemeNarrative[] = []
  for (const t of top) {
    const themes = themesFor(t.key)
    const scored = themes.map((th) => {
      let hit = 0
      for (const part of th.name.split(/[\/\s]+/)) {
        if (part.length >= 2 && clueText.includes(part)) hit += 2
      }
      for (const part of (th.limit + th.positive).split(/[，。；、\s]+/)) {
        if (part.length >= 2 && clueText.includes(part)) hit += 1
      }
      return { th, hit }
    })
    scored.sort((a, b) => b.hit - a.hit)
    const pick = scored.slice(0, 2).map((s) => s.th)
    for (const th of pick) {
      out.push({
        name: th.name,
        positive: th.positive,
        limit: th.limit,
        perspective: th.perspective,
        dimZh: t.zh,
      })
    }
  }
  // de-dupe by name
  const seen = new Set<string>()
  return out.filter((n) => {
    if (seen.has(n.name)) return false
    seen.add(n.name)
    return true
  }).slice(0, 4)
}

export function focusReason(top: DimScore, insights: BeliefInsight[]): string {
  const related = insights.filter((i) => i.dimension === top.key)
  if (related.length === 0) {
    return `在「${top.zh}」相关情景里，你的自动化反应相对更集中，因此值得轻轻展开——不是评判，而是因为这里可能连着你在乎的东西。`
  }
  const titles = related.slice(0, 2).map((i) => i.title).join('、')
  return `你在「${titles}」等情境中的选择，似乎更常启动某些熟悉的想法；这些反应在「${top.zh}」里相对更集中，因此值得留意。`
}

export function observationPractice(topKey?: DimKey): string {
  const base =
    '当你下一次犹豫、退缩或感到纠结时，可以用一分钟轻轻记下：\n1. 当时发生了什么？\n2. 我第一时间出现了什么想法？\n3. 我当时最担心的是什么？\n4. 如果不受这个想法限制，我还会考虑什么可能性？'
  if (!topKey) return base
  const tip = microAction(topKey)
  return `${base}\n\n也可以从这一件小事开始：${tip}`
}
