import type { ChoiceKey, Effects, EndingId, GameMeta, GameState, Option, Scene, Snapshot, WorldLine } from './types'
import { captureStatus, memoryStatus } from './narrative'
import { RATIO, ratio, statCaps } from './balance'
import { choiceEffects } from './choices'

export const CHOICE_UNDO_MS = 5000

export const INITIAL_META: GameMeta = { world: 0, clue: 5, relation: 4, danger: 2, memory: 0 }

export const INITIAL_RELATIONSHIP: Record<string, number> = {
  zhan: 3,
  xue: 5,
  fu: 5,
  gu: 4,
  lu: 4,
  he: 3,
  ye: 2,
}

export const LIMITS = {
  world: [-6, 6],
  clue: [0, 200],
  relation: [0, 200],
  danger: [0, 100],
  memory: [0, 50],
} as const

export const GOOD_CLUE = 18
export const GOOD_RELATION = 18
export const GOOD_DANGER = 14
export const BAD_EXPOSURE = 16
export const BAD_ISOLATION = 9

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createInitialState(sceneId: string, runSeed = 0): GameState {
  return {
    sceneId,
    runSeed,
    meta: { ...INITIAL_META },
    relationship: { ...INITIAL_RELATIONSHIP },
    flags: {},
    clues: [],
    memories: [],
    solved: [],
    appliedScenes: [],
    visited: [sceneId],
    history: [],
  }
}

export function applyEffects(state: GameState, effects?: Effects): GameState {
  if (!effects) return state
  const clues = effects.clues ? Array.from(new Set([...state.clues, ...effects.clues])) : state.clues
  const memories = effects.memories ? Array.from(new Set([...state.memories, ...effects.memories])) : state.memories
  const gainedMemories = memories.length - state.memories.length
  const meta: GameMeta = {
    world: clamp(state.meta.world + (effects.world ?? 0), LIMITS.world[0], LIMITS.world[1]),
    clue: clamp(state.meta.clue + (effects.clue ?? 0), LIMITS.clue[0], LIMITS.clue[1]),
    relation: clamp(state.meta.relation + (effects.relation ?? 0), LIMITS.relation[0], LIMITS.relation[1]),
    danger: clamp(state.meta.danger + (effects.danger ?? 0), LIMITS.danger[0], LIMITS.danger[1]),
    memory: clamp(state.meta.memory + (effects.memory ?? 0) + gainedMemories, LIMITS.memory[0], LIMITS.memory[1]),
  }
  const flags = { ...state.flags }
  for (const flag of effects.flags ?? []) flags[flag] = true
  return { ...state, meta, flags, clues, memories }
}

export function choiceImpact(state: Pick<GameState, 'meta' | 'history'>, option: Option) {
  const effects = choiceEffects(state.history, option)
  const delta = (key: 'clue' | 'relation' | 'danger', points = effects[key] ?? 0) => {
    const value = state.meta[key]
    const [min, max] = LIMITS[key]
    return clamp(value + points, min, max) - value
  }
  return {
    clue: delta('clue'),
    relation: delta('relation'),
    danger: delta('danger'),
    pressured: delta('danger') > delta('danger', option.effects.danger ?? 0),
  }
}

export function worldLine(meta: GameMeta): WorldLine {
  if (meta.world >= 2) return 'order'
  if (meta.world <= -2) return 'loss'
  return 'neutral'
}

export function makeSnapshot(state: GameState): Snapshot {
  return {
    sceneId: state.sceneId,
    runSeed: state.runSeed,
    meta: { ...state.meta },
    relationship: { ...state.relationship },
    flags: { ...state.flags },
    clues: [...state.clues],
    memories: [...state.memories],
    solved: [...state.solved],
    appliedScenes: [...state.appliedScenes],
    visited: [...state.visited],
    history: [...state.history],
    at: Date.now(),
  }
}

export function restoreSnapshot(snapshot: Snapshot): GameState {
  return {
    sceneId: snapshot.sceneId,
    runSeed: snapshot.runSeed,
    meta: { ...snapshot.meta },
    relationship: { ...snapshot.relationship },
    flags: { ...snapshot.flags },
    clues: [...snapshot.clues],
    memories: [...snapshot.memories],
    solved: [...snapshot.solved],
    appliedScenes: [...snapshot.appliedScenes],
    visited: [...snapshot.visited],
    history: [...snapshot.history],
  }
}

export function choose(state: GameState, scene: Scene, option: Option, key: ChoiceKey = option.key): GameState {
  const next = applyEffects(state, choiceEffects(state.history, option))
  return {
    ...next,
    sceneId: option.next,
    history: [
      ...state.history,
      {
        sceneId: scene.id,
        chapter: scene.chapter,
        choice: key,
        label: option.label,
        at: Date.now(),
        next: option.next,
        consequence: option.consequence,
        progress: option.progress,
        pressed: (option.effects.danger ?? 0) > 0,
      },
    ],
  }
}

export function breakdownCause(meta: GameMeta): 'exposure' | 'isolation' | undefined {
  const caps = statCaps()
  if (ratio(meta.danger, caps.danger) >= RATIO.bad.danger) return 'exposure'
  if (ratio(meta.relation, caps.relation) <= RATIO.bad.relation) return 'isolation'
}

export function decideEnding(state: GameState): EndingId {
  const caps = statCaps()
  const { clue, relation, danger, memory } = state.meta
  if (breakdownCause(state.meta)) return 'bad'
  const good =
    ratio(clue, caps.clue) >= RATIO.good.clue &&
    ratio(relation, caps.relation) >= RATIO.good.relation &&
    ratio(danger, caps.danger) <= RATIO.good.danger &&
    memoryStatus(memory) === 'recovered' &&
    captureStatus(state.flags) === 'caught' &&
    Boolean(state.flags.F61_XIE_XIAOLONG_TRUTH) &&
    Boolean(state.flags.F62_MEMORY_TRUTH)
  return good ? 'good' : 'neutral'
}

export function chapterOf(sceneId: string): string {
  const idx = sceneId.indexOf('-')
  return idx === -1 ? sceneId : sceneId.slice(0, idx)
}
