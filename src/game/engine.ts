import type { ChoiceKey, Effects, GameState, Option, Scene, Snapshot } from './types'

export const CHOICE_UNDO_MS = 5000

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

export function createInitialState(sceneId: string): GameState {
  return {
    sceneId,
    stats: {},
    flags: {},
    history: [],
    visited: sceneId ? [sceneId] : [],
  }
}

export function applyEffects(state: GameState, effects?: Effects): GameState {
  if (!effects) return state
  const stats = { ...state.stats }
  for (const [key, delta] of Object.entries(effects.stats ?? {})) {
    stats[key] = (stats[key] ?? 0) + delta
  }
  const flags = { ...state.flags }
  for (const flag of effects.flags ?? []) flags[flag] = true
  return { ...state, stats, flags }
}

export function makeSnapshot(state: GameState): Snapshot {
  return {
    sceneId: state.sceneId,
    stats: { ...state.stats },
    flags: { ...state.flags },
    history: [...state.history],
    visited: [...state.visited],
    at: Date.now(),
  }
}

export function restoreSnapshot(snapshot: Snapshot): GameState {
  return {
    sceneId: snapshot.sceneId,
    stats: { ...snapshot.stats },
    flags: { ...snapshot.flags },
    history: [...snapshot.history],
    visited: [...snapshot.visited],
  }
}

export function choose(state: GameState, scene: Scene, option: Option, key: ChoiceKey = option.key): GameState {
  const next = applyEffects(state, option.effects)
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
      },
    ],
  }
}

export function chapterOf(sceneId: string): string {
  const idx = sceneId.indexOf('-')
  return idx === -1 ? sceneId : sceneId.slice(0, idx)
}
