export type Tendency = 'intuition' | 'evidence' | 'empathy'
export type Risk = 'low' | 'medium' | 'high'
export type EndingId = 'good' | 'bad' | 'neutral'
export type Epilogue = 'stay' | 'leave'

export interface Effects {
  clue?: number
  relation?: number
  danger?: number
  memory?: number
  flags?: string[]
  clues?: string[]
  memories?: string[]
}

export interface Option {
  key: 'A' | 'B' | 'C'
  label: string
  tendency: Tendency
  risk: Risk
  effects: Effects
  next: string
}

export interface Scene {
  id: string
  chapter: string
  title: string
  locationId: string
  timeOfDay: string
  body: string
  variants?: { flag: string; body: string }[]
  options?: Option[]
  next?: string
  ending?: 'auto'
  puzzle?: boolean
  effects?: Effects
}

export interface Chapter {
  chapter: string
  title: string
  scenes: Scene[]
}

export interface GameMeta {
  clue: number
  relation: number
  danger: number
  memory: number
}

export interface HistoryEntry {
  sceneId: string
  chapter: string
  choice: 'A' | 'B' | 'C'
  label: string
  at: number
}

export interface GameState {
  sceneId: string
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
