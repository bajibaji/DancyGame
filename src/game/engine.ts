import type { Effects, EndingId, GameMeta, GameState, Option, Scene, Snapshot } from './types'

export const INITIAL_META: GameMeta = { clue: 5, relation: 4, danger: 2, memory: 0 }

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
  clue: [0, 30],
  relation: [0, 10],
  danger: [0, 10],
  memory: [0, 10],
} as const

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createInitialState(sceneId: string): GameState {
  return {
    sceneId,
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
    clue: clamp(state.meta.clue + (effects.clue ?? 0), LIMITS.clue[0], LIMITS.clue[1]),
    relation: clamp(state.meta.relation + (effects.relation ?? 0), LIMITS.relation[0], LIMITS.relation[1]),
    danger: clamp(state.meta.danger + (effects.danger ?? 0), LIMITS.danger[0], LIMITS.danger[1]),
    memory: clamp(state.meta.memory + (effects.memory ?? 0) + gainedMemories, LIMITS.memory[0], LIMITS.memory[1]),
  }
  const flags = { ...state.flags }
  for (const flag of effects.flags ?? []) flags[flag] = true
  return { ...state, meta, flags, clues, memories }
}

export function makeSnapshot(state: GameState): Snapshot {
  return {
    sceneId: state.sceneId,
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

export function choose(state: GameState, scene: Scene, option: Option): GameState {
  const next = applyEffects(state, option.effects)
  return {
    ...next,
    sceneId: option.next,
    history: [
      ...state.history,
      {
        sceneId: scene.id,
        chapter: scene.chapter,
        choice: option.key,
        label: option.label,
        at: Date.now(),
      },
    ],
  }
}

export function decideEnding(state: GameState): EndingId {
  const { clue, relation, danger, memory } = state.meta
  const bad = danger >= 9 || relation <= 3 || Boolean(state.flags.F78_YIN_HOSTILE)
  if (bad) return 'bad'
  const good =
    clue >= 20 &&
    memory >= 6 &&
    relation >= 6 &&
    danger <= 7 &&
    Boolean(state.flags.F76_SANCHEZ_CAUGHT) &&
    Boolean(state.flags.F61_XIE_XIAOLONG_TRUTH) &&
    Boolean(state.flags.F62_MEMORY_TRUTH)
  return good ? 'good' : 'neutral'
}

export function chapterOf(sceneId: string): string {
  const idx = sceneId.indexOf('-')
  return idx === -1 ? sceneId : sceneId.slice(0, idx)
}
