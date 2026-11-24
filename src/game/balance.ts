import { RELEASED_CHAPTERS } from '../content/release'
import type { Chapter, Effects } from './types'

export interface StatCaps {
  clue: number
  relation: number
  danger: number
  memory: number
  beats: number
}

export const RATIO = {
  good: { clue: 0.5, relation: 0.5, danger: 0.45, memory: 0.55 },
  bad: { danger: 0.7, relation: 0.2 },
} as const

let cached: StatCaps | null = null
const scoped = new Map<string, StatCaps>()

function top(effects: Effects[], key: 'clue' | 'relation' | 'danger' | 'memory'): number {
  return Math.max(0, ...effects.map((entry) => entry[key] ?? 0))
}

function computeCaps(chapters: readonly Chapter[]): StatCaps {
  let clue = 0
  let relation = 0
  let danger = 0
  let memory = 0
  let beats = 0
  for (const chapter of chapters) {
    for (const scene of chapter.scenes) {
      if (scene.effects) {
        clue += Math.max(0, scene.effects.clue ?? 0)
        relation += Math.max(0, scene.effects.relation ?? 0)
        danger += Math.max(0, scene.effects.danger ?? 0)
        memory += Math.max(0, scene.effects.memory ?? 0) + (scene.effects.memories?.length ?? 0)
      }
      if (!scene.options) continue
      beats += 1
      const effects = scene.options.map((option) => option.effects)
      clue += top(effects, 'clue')
      relation += top(effects, 'relation')
      danger += top(effects, 'danger')
      memory += top(effects, 'memory')
    }
  }
  return {
    clue: Math.max(1, clue),
    relation: Math.max(1, relation),
    danger: Math.max(1, danger),
    memory: Math.max(1, memory),
    beats,
  }
}

export function statCaps(): StatCaps {
  if (!cached) cached = computeCaps(RELEASED_CHAPTERS)
  return cached
}

export function statCapsThrough(chapterId?: string): StatCaps {
  if (!chapterId) return statCaps()
  const index = RELEASED_CHAPTERS.findIndex(({ chapter }) => chapter === chapterId)
  if (index < 0) return statCaps()
  const hit = scoped.get(chapterId)
  if (hit) return hit
  const value = computeCaps(RELEASED_CHAPTERS.slice(0, index + 1))
  scoped.set(chapterId, value)
  return value
}

export function ratio(value: number, cap: number): number {
  if (cap <= 0) return 0
  return value / cap
}
