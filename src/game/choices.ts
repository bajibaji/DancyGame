import { OPPORTUNITIES } from '../content/opportunities'
import type { ChoiceKey, Effects, GameState, Option, Scene } from './types'

const KEYS: readonly ChoiceKey[] = ['A', 'B', 'C']

export interface ChoiceOffer {
  key: ChoiceKey
  option: Option
  opportunity?: string
}

function draw(seed: number, salt: string): number {
  let hash = seed ^ 0x811c9dc5
  for (let i = 0; i < salt.length; i++) hash = Math.imul(hash ^ salt.charCodeAt(i), 0x01000193)
  hash = Math.imul(hash ^ (hash >>> 16), 0x85ebca6b)
  hash = Math.imul(hash ^ (hash >>> 13), 0xc2b2ae35)
  return ((hash ^ (hash >>> 16)) >>> 0) / 0x100000000
}

export function choiceOffers(scene: Scene, seed: number, flags: GameState['flags']): ChoiceOffer[] {
  const opportunities = OPPORTUNITIES[scene.id] ?? []
  const earned = opportunities.filter(({ requires }) => requires && flags[requires])
  const available = opportunities.filter(({ requires }) => !requires)
  const roll = draw(seed, `${scene.id}:opportunity`)
  const selected = earned.length ? earned[Math.floor(roll * earned.length)] :
    available.length && roll < 0.65 ? available[Math.floor(roll / 0.65 * available.length)] : undefined
  const offers = (scene.options ?? []).map((option) => {
    if (selected?.insteadOf !== option.key) return { option }
    return {
      option: { ...selected.action, key: option.key, next: option.next },
      opportunity: selected.context,
    }
  })

  if (scene.id !== 'c0715c') {
    for (let i = offers.length - 1; i > 0; i--) {
      const j = Math.floor(draw(seed, `${scene.id}:slot:${i}`) * (i + 1))
      const current = offers[i]
      offers[i] = offers[j]
      offers[j] = current
    }
  }
  return offers.map((offer, index) => ({ ...offer, key: KEYS[index] }))
}

export function choiceEffects(history: GameState['history'], option: Option): Effects {
  const recent = history.slice(-2)
  if ((option.effects.danger ?? 0) <= 0 || recent.length < 2 || !recent.every((entry) => entry.pressed)) {
    return option.effects
  }
  return { ...option.effects, danger: (option.effects.danger ?? 0) + 1 }
}
