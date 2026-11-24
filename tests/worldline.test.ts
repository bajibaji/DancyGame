import { describe, expect, it } from 'vitest'
import { SCENES, START_SCENE, getScene } from '../src/content/index'
import { applyEffects, choose, createInitialState, worldLine } from '../src/game/engine'
import type { GameState } from '../src/game/types'
import { resolveSceneBody } from '../src/game/narrative'

function play(sign: 1 | -1): GameState {
  let state = createInitialState(START_SCENE)
  let scene = getScene(START_SCENE)
  let steps = 0
  while (scene && steps < 400) {
    steps++
    if (scene.effects) state = applyEffects(state, scene.effects)
    if (scene.options) {
      const sorted = [...scene.options].sort(
        (a, b) => sign * ((b.effects.world ?? 0) - (a.effects.world ?? 0)),
      )
      const option = sorted[0]
      state = choose(state, scene, option)
      scene = getScene(option.next)
      continue
    }
    scene = scene.next ? getScene(scene.next) : undefined
  }
  return state
}

describe('双世界线', () => {
  it('连续顺向选择能把局值推到顺线', () => {
    const state = play(1)
    expect(state.meta.world).toBeGreaterThanOrEqual(2)
    expect(worldLine(state.meta)).toBe('order')
  })

  it('连续逆向选择能把局值推到逆线', () => {
    const state = play(-1)
    expect(state.meta.world).toBeLessThanOrEqual(-2)
    expect(worldLine(state.meta)).toBe('loss')
  })

  it('局值夹在 −6 到 +6 之间', () => {
    let state = createInitialState('x')
    for (let i = 0; i < 30; i++) state = applyEffects(state, { world: 3 })
    expect(state.meta.world).toBe(6)
    for (let i = 0; i < 30; i++) state = applyEffects(state, { world: -3 })
    expect(state.meta.world).toBe(-6)
  })

  it('每条双版本正文都同时有顺线和逆线，且与主版本不同', () => {
    let count = 0
    for (const scene of SCENES.values()) {
      if (!scene.worldVariants) continue
      count++
      const lines = scene.worldVariants.map((entry) => entry.line).sort()
      expect(lines, scene.id).toEqual(['loss', 'order'])
      for (const entry of scene.worldVariants) {
        expect(entry.body.length, scene.id).toBeGreaterThan(80)
        expect(entry.body, scene.id).not.toBe(scene.body)
      }
    }
    expect(count).toBeGreaterThanOrEqual(5)
  })

  it('同一幕按当前局值取对应版本', () => {
    const scene = getScene('c0106a')!
    const order = resolveSceneBody(scene, {}, undefined, 'order')
    const loss = resolveSceneBody(scene, {}, undefined, 'loss')
    expect(order).not.toBe(loss)
    expect(order).toBe(scene.worldVariants!.find((entry) => entry.line === 'order')!.body)
    expect(loss).toBe(scene.worldVariants!.find((entry) => entry.line === 'loss')!.body)
    expect(resolveSceneBody(scene, {}, undefined, 'neutral')).toBe(scene.body)
  })
})
