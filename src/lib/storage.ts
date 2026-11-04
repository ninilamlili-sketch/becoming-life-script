import type { SessionState } from './types'

const SESSION_KEY = 'becoming-life-script-session'
/** Anonymous aggregate counters only — never stores answers. */
const STATS_KEY = 'becoming-life-script-stats-v1'

export const defaultSession = (): SessionState => ({
  consented: false,
  answers: [],
  deepAnswers: [],
  clueFeedback: {},
  completedQuiz: false,
  completedExplore: false,
})

export function loadSession(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return defaultSession()
    return { ...defaultSession(), ...JSON.parse(raw) }
  } catch {
    return defaultSession()
  }
}

export function saveSession(state: SessionState) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(state))
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export type AnonStats = {
  visits: number
  quizCompletions: number
  reportViews: number
  lastAt?: string
}

export function loadAnonStats(): AnonStats {
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (!raw) return { visits: 0, quizCompletions: 0, reportViews: 0 }
    return { visits: 0, quizCompletions: 0, reportViews: 0, ...JSON.parse(raw) }
  } catch {
    return { visits: 0, quizCompletions: 0, reportViews: 0 }
  }
}

function saveAnonStats(s: AnonStats) {
  localStorage.setItem(
    STATS_KEY,
    JSON.stringify({ ...s, lastAt: new Date().toISOString() }),
  )
}

export function bumpVisit() {
  try {
    if (sessionStorage.getItem('becoming-visit-bumped')) return
    sessionStorage.setItem('becoming-visit-bumped', '1')
    const s = loadAnonStats()
    s.visits += 1
    saveAnonStats(s)
  } catch {
    /* private mode */
  }
}

export function bumpQuizCompletion() {
  try {
    const s = loadAnonStats()
    s.quizCompletions += 1
    saveAnonStats(s)
  } catch {
    /* ignore */
  }
}

export function bumpReportView() {
  try {
    if (sessionStorage.getItem('becoming-report-bumped')) return
    sessionStorage.setItem('becoming-report-bumped', '1')
    const s = loadAnonStats()
    s.reportViews += 1
    saveAnonStats(s)
  } catch {
    /* ignore */
  }
}
