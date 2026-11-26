export type ChoiceKey = 'A' | 'B' | 'C'

export interface Effects {
  stats?: Record<string, number>
  flags?: string[]
}

export interface Option {
  key: ChoiceKey
  label: string
  effects?: Effects
  consequence?: string
  next: string
}

export interface Scene {
  id: string
  chapter: string
  title: string
  body: string
  variants?: { flag: string; body: string }[]
  options?: Option[]
  next?: string
  ending?: boolean | 'auto'
  effects?: Effects
}

export interface Chapter {
  chapter: string
  title: string
  scenes: Scene[]
}

export interface HistoryEntry {
  sceneId: string
  chapter: string
  choice: ChoiceKey
  label: string
  at: number
  next?: string
  consequence?: string
}

export interface GameState {
  sceneId: string
  stats: Record<string, number>
  flags: Record<string, boolean>
  history: HistoryEntry[]
  visited: string[]
  ending?: string
}

export interface Snapshot {
  sceneId: string
  stats: Record<string, number>
  flags: Record<string, boolean>
  history: HistoryEntry[]
  visited: string[]
  at: number
}
