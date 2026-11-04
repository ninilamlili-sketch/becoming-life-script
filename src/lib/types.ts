export type DimKey =
  | 'money_wealth'
  | 'career_achievement'
  | 'self_worth_identity'
  | 'intimacy_love'
  | 'social_belonging'
  | 'choice_agency'
  | 'meaning_fulfillment'

export interface Option {
  id: string
  text: string
  score: number
  belief_clue: string | null
}

export interface Question {
  id: string
  title: string
  scenario: string
  options: Option[]
  scoring_note: string
  dimension: DimKey
  theme: string
}

export interface Answer {
  questionId: string
  optionId: string
  otherText?: string
}

export interface DeepAnswer {
  questionId: string
  text: string
}

export interface SessionState {
  consented: boolean
  answers: Answer[]
  deepAnswers: DeepAnswer[]
  clueFeedback: Record<string, 'confirm' | 'partial' | 'reject'>
  completedQuiz: boolean
  completedExplore: boolean
}

export interface DimScore {
  key: DimKey
  zh: string
  core: string
  raw: number
  normalized: number
  clues: string[]
}

