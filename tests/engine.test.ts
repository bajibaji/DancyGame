import { describe, expect, it } from 'vitest'
import { applyEffects, choose, createInitialState, makeSnapshot, restoreSnapshot } from '../src/game/engine'
import type { Scene } from '../src/game/types'

const scene: Scene = {
  id: 'ch01-a',
  chapter: 'ch01',
  title: '第一幕',
  body: '正文',
  options: [
    {
      key: 'A',
      label: '走过去',
      next: 'ch01-b',
      consequence: '门开了。',
      effects: { stats: { trust: 2, danger: -1 }, flags: ['opened'] },
    },
  ],
}

describe('applyEffects', () => {
  it('累加数值并记录标记', () => {
    const base = createInitialState('ch01-a')
    const next = applyEffects(base, { stats: { trust: 2, danger: -1 }, flags: ['opened'] })
    expect(next.stats).toEqual({ trust: 2, danger: -1 })
    expect(next.flags.opened).toBe(true)
    expect(base.stats).toEqual({})
  })

  it('没有效果时原样返回', () => {
    const base = createInitialState('ch01-a')
    expect(applyEffects(base)).toBe(base)
  })
})

describe('choose', () => {
  it('应用选项效果并进入下一幕', () => {
    const base = createInitialState('ch01-a')
    const next = choose(base, scene, scene.options![0])
    expect(next.sceneId).toBe('ch01-b')
    expect(next.stats.trust).toBe(2)
    expect(next.history).toHaveLength(1)
    expect(next.history[0]).toMatchObject({ sceneId: 'ch01-a', choice: 'A', next: 'ch01-b', consequence: '门开了。' })
  })
})

describe('快照', () => {
  it('恢复后回到选择前的状态', () => {
    const base = createInitialState('ch01-a')
    const snapshot = makeSnapshot(base)
    const next = choose(base, scene, scene.options![0])
    expect(next.sceneId).toBe('ch01-b')
    const restored = restoreSnapshot(snapshot)
    expect(restored.sceneId).toBe('ch01-a')
    expect(restored.stats).toEqual({})
    expect(restored.history).toEqual([])
  })
})

describe('createInitialState', () => {
  it('没有起始场景时保持空状态', () => {
    const state = createInitialState('')
    expect(state.sceneId).toBe('')
    expect(state.visited).toEqual([])
  })
})
