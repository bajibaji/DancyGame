import { SCENES } from '../content/index'
import type { Effects } from './types'

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

function top(effects: Effects[], key: 'clue' | 'relation' | 'danger' | 'memory'): number {
  return Math.max(0, ...effects.map((entry) => entry[key] ?? 0))
}

export function statCaps(): StatCaps {
  if (cached) return cached
  let clue = 0
  let relation = 0
  let danger = 0
  let memory = 0
  let beats = 0
  for (const scene of SCENES.values()) {
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
  cached = {
    clue: Math.max(1, clue),
    relation: Math.max(1, relation),
    danger: Math.max(1, danger),
    memory: Math.max(1, memory),
    beats,
  }
  return cached
}

export function ratio(value: number, cap: number): number {
  if (cap <= 0) return 0
  return value / cap
}
