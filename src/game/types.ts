export type Tendency = 'intuition' | 'evidence' | 'empathy'
export type Risk = 'low' | 'medium' | 'high'
export type EndingId = 'good' | 'bad' | 'neutral'
export type Epilogue = 'stay' | 'leave'

export type WorldLine = 'order' | 'loss' | 'neutral'
export type ChoiceKey = 'A' | 'B' | 'C'

export interface Effects {
  world?: number
  clue?: number
  relation?: number
  danger?: number
  memory?: number
  flags?: string[]
  clues?: string[]
  memories?: string[]
}

export interface Option {
  key: ChoiceKey
  label: string
  tendency: Tendency
  risk: Risk
  effects: Effects
  consequence: string
  progress?: string
  next: string
}

export interface Scene {
  id: string
  inherits?: string
  chapter: string
  title: string
  locationId: string
  timeOfDay: string
  body: string
  guide?: { title: string; body: string }
  variants?: { flag: string; body: string }[]
  worldVariants?: { line: WorldLine; body: string }[]
  recalls?: { flag: string; text: string }[]
  followUps?: { recipe: string; label: string; text: string }[]
  progress?: string
  options?: Option[]
  next?: string
  ending?: 'auto' | EndingId
  puzzle?: boolean
  effects?: Effects
}

export interface Chapter {
  chapter: string
  title: string
  scenes: Scene[]
}

export interface GameMeta {
  world: number
  clue: number
  relation: number
  danger: number
  memory: number
}

export interface HistoryEntry {
  sceneId: string
  chapter: string
  choice: ChoiceKey
  label: string
  at: number
  next?: string
  consequence?: string
  progress?: string
  pressed?: boolean
}

export interface GameState {
  sceneId: string
  runSeed: number
  meta: GameMeta
  relationship: Record<string, number>
  flags: Record<string, boolean>
  clues: string[]
  memories: string[]
  solved: string[]
  appliedScenes: string[]
  visited: string[]
  history: HistoryEntry[]
  ending?: EndingId
  epilogue?: Epilogue
}

export interface Snapshot {
  sceneId: string
  runSeed: number
  meta: GameMeta
  relationship: Record<string, number>
  flags: Record<string, boolean>
  clues: string[]
  memories: string[]
  solved: string[]
  appliedScenes: string[]
  visited: string[]
  history: HistoryEntry[]
  at: number
}
