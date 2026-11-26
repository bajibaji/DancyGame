import type { GameState, HistoryEntry, Scene } from './types'

export function resolveSceneBody(scene: Scene, flags: GameState['flags'], arrival?: HistoryEntry): string {
  const consequence = arrival?.next === scene.id ? arrival.consequence : undefined
  const body = scene.variants?.find(({ flag }) => flags[flag])?.body ?? scene.body
  return [consequence, body].filter(Boolean).join('\n\n')
}
