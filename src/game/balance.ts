import { RELEASED_CHAPTERS } from '../content/release'
import type { Chapter } from './types'

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

function computeCaps(chapters: readonly Chapter[]): StatCaps {
  const scenes = new Map(chapters.flatMap((chapter) => chapter.scenes).map((scene) => [scene.id, scene]))
  const cache = new Map<string, StatCaps>()
  const empty = (): StatCaps => ({ clue: 0, relation: 0, danger: 0, memory: 0, beats: 0 })
  const visit = (id: string): StatCaps => {
    const scene = scenes.get(id)
    if (!scene) return empty()
    const known = cache.get(id)
    if (known) return known
    const paths = scene.options?.map((option) => {
      const next = visit(option.next)
      return {
        clue: next.clue + Math.max(0, option.effects.clue ?? 0),
        relation: next.relation + Math.max(0, option.effects.relation ?? 0),
        danger: next.danger + Math.max(0, option.effects.danger ?? 0),
        memory: next.memory + Math.max(0, option.effects.memory ?? 0),
        beats: next.beats + 1,
      }
    }) ?? [scene.next ? visit(scene.next) : empty()]
    const effects = scene.effects ?? {}
    const result = {
      clue: Math.max(0, effects.clue ?? 0) + Math.max(0, ...paths.map((path) => path.clue)),
      relation: Math.max(0, effects.relation ?? 0) + Math.max(0, ...paths.map((path) => path.relation)),
      danger: Math.max(0, effects.danger ?? 0) + Math.max(0, ...paths.map((path) => path.danger)),
      memory: Math.max(0, effects.memory ?? 0) + (effects.memories?.length ?? 0) + Math.max(0, ...paths.map((path) => path.memory)),
      beats: Math.max(0, ...paths.map((path) => path.beats)),
    }
    cache.set(id, result)
    return result
  }
  const result = chapters[0] ? visit(chapters[0].scenes[0].id) : empty()
  return { ...result, clue: Math.max(1, result.clue), relation: Math.max(1, result.relation), danger: Math.max(1, result.danger), memory: Math.max(1, result.memory) }
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
