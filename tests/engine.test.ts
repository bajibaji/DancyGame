import { describe, expect, it } from 'vitest'
import { applyEffects, choose, createInitialState, decideEnding, restoreSnapshot, makeSnapshot } from '../src/game/engine'
import type { GameState, Scene } from '../src/game/types'

function stateWith(meta: Partial<GameState['meta']>, flags: Record<string, boolean> = {}): GameState {
  const base = createInitialState('x')
  return { ...base, meta: { ...base.meta, ...meta }, flags }
}

describe('engine', () => {
  it('初始状态符合设计', () => {
    const s = createInitialState('p01')
    expect(s.meta).toEqual({ clue: 5, relation: 4, danger: 2, memory: 0 })
    expect(s.sceneId).toBe('p01')
  })

  it('效果结算并夹取上下限', () => {
    const s = createInitialState('x')
    const out = applyEffects(s, { clue: 100, danger: -100, memory: 3, flags: ['F1'], clues: ['C01'] })
    expect(out.meta.clue).toBe(30)
    expect(out.meta.danger).toBe(0)
    expect(out.meta.memory).toBe(3)
    expect(out.flags.F1).toBe(true)
    expect(out.clues).toEqual(['C01'])
  })

  it('选择推进场景并记录历史', () => {
    const s = createInitialState('p03')
    const scene: Scene = { id: 'p03', chapter: 'prologue', title: 't', locationId: 'hz-police', timeOfDay: '夜', body: '', options: [] }
    const out = choose(s, scene, { key: 'A', label: '住进叶家', tendency: 'intuition', risk: 'medium', effects: { clue: 1, relation: 1 }, next: 'p04' })
    expect(out.sceneId).toBe('p04')
    expect(out.history).toHaveLength(1)
    expect(out.history[0].choice).toBe('A')
  })

  it('快照可恢复', () => {
    const s = createInitialState('p01')
    const snap = makeSnapshot(s)
    const changed = applyEffects(s, { clue: 5 })
    const restored = restoreSnapshot(snap)
    expect(changed.meta.clue).toBe(10)
    expect(restored.meta.clue).toBe(5)
  })

  describe('结局判定', () => {
    const goodFlags = { F76_SANCHEZ_CAUGHT: true, F61_XIE_XIAOLONG_TRUTH: true, F62_MEMORY_TRUTH: true }
    it('满足条件为好结局', () => {
      expect(decideEnding(stateWith({ clue: 20, memory: 6, relation: 6, danger: 7 }, goodFlags))).toBe('good')
    })
    it('危险过高为坏结局', () => {
      expect(decideEnding(stateWith({ clue: 25, memory: 8, relation: 8, danger: 9 }, goodFlags))).toBe('bad')
    })
    it('关系过低为坏结局', () => {
      expect(decideEnding(stateWith({ clue: 25, memory: 8, relation: 3, danger: 2 }, goodFlags))).toBe('bad')
    })
    it('叶小满敌对为坏结局', () => {
      expect(decideEnding(stateWith({ clue: 25, memory: 8, relation: 8, danger: 2 }, { ...goodFlags, F78_YIN_HOSTILE: true }))).toBe('bad')
    })
    it('其余为中立', () => {
      expect(decideEnding(stateWith({ clue: 18, memory: 6, relation: 6, danger: 5 }, goodFlags))).toBe('neutral')
      expect(decideEnding(stateWith({ clue: 25, memory: 6, relation: 6, danger: 5 }, { F61_XIE_XIAOLONG_TRUTH: true, F62_MEMORY_TRUTH: true }))).toBe('neutral')
    })
  })
})
