import type { GameState, HistoryEntry, Scene } from './types'

export type CaptureStatus = 'caught' | 'escaped' | 'unknown'
export type MemoryStatus = 'recovered' | 'partial'

export function resolveSceneBody(scene: Scene, flags: GameState['flags'], arrival?: HistoryEntry): string {
  const consequence = arrival?.next === scene.id ? arrival.consequence : undefined
  const recalls = scene.recalls?.filter(({ flag }) => flags[flag]).map(({ text }) => text) ?? []
  const body = scene.variants?.find(({ flag }) => flags[flag])?.body ?? scene.body
  return [consequence, ...recalls, body].filter(Boolean).join('\n\n')
}

export function resolveSceneProgress(scene: Scene, arrival?: HistoryEntry): string[] {
  const choice = arrival?.next === scene.id ? arrival.progress : undefined
  return [choice, scene.progress].filter((text): text is string => Boolean(text))
}

export function resolveSceneFollowUps(scene: Scene, solved: GameState['solved']) {
  return scene.followUps?.filter(({ recipe }) => solved.includes(recipe)) ?? []
}

export function captureStatus(flags: GameState['flags']): CaptureStatus {
  if (flags.F76_ESCAPED) return 'escaped'
  if (flags.F76_SANCHEZ_CAUGHT) return 'caught'
  return 'unknown'
}

export function memoryStatus(memory: number): MemoryStatus {
  return memory >= 8 ? 'recovered' : 'partial'
}
