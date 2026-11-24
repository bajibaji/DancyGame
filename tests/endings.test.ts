import { describe, expect, it } from 'vitest'
import { START_SCENE, getScene } from '../src/content/index'
import { applyEffects, choose, createInitialState } from '../src/game/engine'
import { captureStatus } from '../src/game/narrative'
import type { Option } from '../src/game/types'

type Policy = (options: Option[], sceneId: string) => 'A' | 'B' | 'C'

function play(policy: Policy) {
  let state = createInitialState(START_SCENE)
  let scene = getScene(START_SCENE)
  const visited: string[] = []
  while (scene) {
    visited.push(scene.id)
    if (scene.effects) state = applyEffects(state, scene.effects)
    if (scene.ending) return { state, visited, ending: scene.ending }
    if (scene.options) {
      const key = policy(scene.options, scene.id)
      const option = scene.options.find((o) => o.key === key) ?? scene.options[0]
      state = choose(state, scene, option)
      scene = getScene(option.next)
      continue
    }
    scene = scene.next ? getScene(scene.next) : undefined
  }
  throw new Error('模拟未到达结局')
}

const safe: Policy = (options) => {
  const sorted = [...options].sort((a, b) => (a.effects.danger ?? 0) - (b.effects.danger ?? 0))
  const min = sorted[0].effects.danger ?? 0
  const tied = options.filter((o) => (o.effects.danger ?? 0) === min)
  return (tied.find((o) => o.key === 'B') ?? tied[0]).key as 'A' | 'B' | 'C'
}
const ending = (key: 'A' | 'B' | 'C'): Policy => (options, id) => (id === 'c0715c' ? key : safe(options, id))

describe('三结局', () => {
  it.each([
    ['A', 'c0716a', 'good'],
    ['B', 'c0716b', 'neutral'],
    ['C', 'c0716c', 'bad'],
  ] as const)('终局选择 %s 到达 %s', (key, sceneId, tag) => {
    const result = play(ending(key))
    expect(result.visited).toContain('c0715c')
    expect(result.visited.at(-1)).toBe(sceneId)
    expect(result.ending).toBe(tag)
  })

  it('好结局路线拿到到案回执与两条真相', () => {
    const result = play(ending('A'))
    expect(captureStatus(result.state.flags)).toBe('caught')
    expect(result.state.flags.F61_XIE_XIAOLONG_TRUTH).toBe(true)
    expect(result.state.flags.F62_MEMORY_TRUTH).toBe(true)
  })

  it('三个终幕都没有后继，也没有选项', () => {
    for (const id of ['c0716a', 'c0716b', 'c0716c']) {
      const scene = getScene(id)!
      expect(scene.ending).toBeTruthy()
      expect(scene.next).toBeUndefined()
      expect(scene.options).toBeUndefined()
    }
  })
})
