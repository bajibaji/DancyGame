import { describe, expect, it } from 'vitest'
import { CHAPTERS, SCENES, START_SCENE, CLUE_MAP, LOCATION_MAP, getScene } from '../src/content/index'
import type { GameState, Option } from '../src/game/types'
import { applyEffects, choose, createInitialState, decideEnding } from '../src/game/engine'
import { availableRecipes, solvePuzzle } from '../src/game/puzzle'

type Policy = (options: Option[], sceneId: string) => 'A' | 'B' | 'C'

function play(policy: Policy, solveAll: boolean): GameState {
  let state = createInitialState(START_SCENE)
  let scene = getScene(START_SCENE)
  let guard = 0
  while (scene && guard < 400) {
    guard += 1
    if (scene.effects) state = applyEffects(state, scene.effects)
    if (scene.ending === 'auto') {
      return { ...state, ending: decideEnding(state) }
    }
    if (scene.puzzle) {
      if (solveAll) {
        for (const recipe of availableRecipes(state.clues)) {
          const result = solvePuzzle(state, recipe.cards[0], recipe.cards[1])
          state = result.state
        }
      }
      scene = scene.next ? getScene(scene.next) : undefined
      continue
    }
    if (scene.options && scene.options.length > 0) {
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

const safePolicy: Policy = (options, sceneId) => {
  if (sceneId === 'c0706') return 'A'
  const sorted = [...options].sort((a, b) => (a.effects.danger ?? 0) - (b.effects.danger ?? 0))
  const minDanger = sorted[0].effects.danger ?? 0
  const tied = options.filter((o) => (o.effects.danger ?? 0) === minDanger)
  return (tied.find((o) => o.key === 'B') ?? tied[0]).key
}

const neutralPolicy: Policy = (options, sceneId) => {
  if (sceneId === 'c0706') return 'B'
  return safePolicy(options, sceneId)
}

const recklessPolicy: Policy = (options) => {
  const sorted = [...options].sort((a, b) => (b.effects.danger ?? 0) - (a.effects.danger ?? 0))
  return sorted[0].key
}

describe('三结局可达性模拟', () => {
  it('安全路线在终局选择与薛岚配合时达到好结局', () => {
    const result = play(safePolicy, true)
    expect(result.ending).toBe('good')
  })

  it('安全路线在终局放过密道时进入中立结局', () => {
    const result = play(neutralPolicy, true)
    expect(result.ending).toBe('neutral')
  })

  it('冒进路线可以到达坏结局', () => {
    const result = play(recklessPolicy, false)
    expect(result.ending).toBe('bad')
  })

  it('三种结局在策略扫描中均出现', () => {
    const policies: Policy[] = [
      safePolicy,
      neutralPolicy,
      recklessPolicy,
      () => 'A',
      () => 'B',
      () => 'C',
      (options) => {
        const order = ['B', 'C', 'A'] as const
        return order.find((k) => options.some((o) => o.key === k)) ?? 'A'
      },
    ]
    const endings = new Set<string>()
    for (const policy of policies) {
      for (const solveAll of [true, false]) {
        endings.add(play(policy, solveAll).ending!)
      }
    }
    expect(endings.has('good')).toBe(true)
    expect(endings.has('neutral')).toBe(true)
    expect(endings.has('bad')).toBe(true)
  })
})

describe('剧情图完整性', () => {
  it('场景唯一且全部可达', () => {
    const ids = new Set<string>()
    for (const chapter of CHAPTERS) {
      for (const scene of chapter.scenes) {
        expect(ids.has(scene.id), `重复场景 ${scene.id}`).toBe(false)
        ids.add(scene.id)
      }
    }
    const reachable = new Set<string>()
    const queue = [START_SCENE]
    while (queue.length > 0) {
      const id = queue.pop()!
      if (reachable.has(id)) continue
      reachable.add(id)
      const scene = SCENES.get(id)
      if (!scene) continue
      if (scene.next) queue.push(scene.next)
      for (const option of scene.options ?? []) queue.push(option.next)
    }
    for (const id of ids) {
      expect(reachable.has(id), `不可达场景 ${id}`).toBe(true)
    }
  })

  it('选择场景恰好 3 个选项且键为 ABC', () => {
    for (const scene of SCENES.values()) {
      if (!scene.options || scene.options.length === 0) continue
      expect(scene.options.map((o) => o.key).join(''), scene.id).toBe('ABC')
    }
  })

  it('跳转、线索与地点引用合法', () => {
    for (const scene of SCENES.values()) {
      if (scene.next) expect(SCENES.has(scene.next), `${scene.id} next`).toBe(true)
      expect(LOCATION_MAP.has(scene.locationId), `${scene.id} location`).toBe(true)
      for (const option of scene.options ?? []) {
        expect(SCENES.has(option.next), `${scene.id} option next`).toBe(true)
        for (const clue of option.effects.clues ?? []) {
          expect(CLUE_MAP.has(clue), `${scene.id} clue ${clue}`).toBe(true)
        }
      }
      for (const clue of scene.effects?.clues ?? []) {
        expect(CLUE_MAP.has(clue), `${scene.id} scene clue ${clue}`).toBe(true)
      }
    }
  })

  it('正文长度与禁用词', () => {
    const forbidden = ['TODO', 'FIXME', 'undefined', '抖音', '共享单车', '健康码', '5G']
    for (const scene of SCENES.values()) {
      expect(scene.body.length, `${scene.id} body 过短`).toBeGreaterThan(60)
      for (const term of forbidden) {
        expect(scene.body.includes(term), `${scene.id} 含禁用词 ${term}`).toBe(false)
      }
    }
  })
})
