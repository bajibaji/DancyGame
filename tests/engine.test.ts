import { describe, expect, it } from 'vitest'
import { applyEffects, breakdownCause, choose, createInitialState, decideEnding, restoreSnapshot, makeSnapshot } from '../src/game/engine'
import { captureStatus, memoryStatus } from '../src/game/narrative'
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
    const out = choose(s, scene, { key: 'A', label: '答应住下', tendency: 'empathy', risk: 'medium', effects: { clue: 1, relation: 1 }, next: 'p04', consequence: '叶小满把椅子搬回来。' })
    expect(out.sceneId).toBe('p04')
    expect(out.history).toHaveLength(1)
    expect(out.history[0]).toMatchObject({ choice: 'A', sceneId: 'p03', next: 'p04', consequence: '叶小满把椅子搬回来。' })
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
    const goodMeta = { clue: 20, memory: 8, relation: 18, danger: 12 }
    it('满足条件为好结局', () => {
      expect(decideEnding(stateWith(goodMeta, goodFlags))).toBe('good')
    })
    it('危险过高为坏结局', () => {
      const state = stateWith({ ...goodMeta, danger: 16 }, goodFlags)
      expect(decideEnding(state)).toBe('bad')
      expect(breakdownCause(state.meta)).toBe('exposure')
      expect(captureStatus(state.flags)).toBe('caught')
      expect(memoryStatus(state.meta.memory)).toBe('recovered')
    })
    it('关系过低为坏结局', () => {
      const state = stateWith({ ...goodMeta, relation: 9 }, goodFlags)
      expect(decideEnding(state)).toBe('bad')
      expect(breakdownCause(state.meta)).toBe('isolation')
    })
    it('叶小满拒绝私下合作不单独判坏', () => {
      expect(decideEnding(stateWith(goodMeta, { ...goodFlags, F78_YIN_HOSTILE: true }))).toBe('good')
    })
    it('到案但材料、记忆或合作未达好结局边界时为中立', () => {
      for (const meta of [{ clue: 17 }, { memory: 7 }, { relation: 17 }, { danger: 15 }]) {
        expect(decideEnding(stateWith({ ...goodMeta, ...meta }, goodFlags))).toBe('neutral')
      }
      expect(decideEnding(stateWith(goodMeta, { ...goodFlags, F62_MEMORY_TRUTH: false }))).toBe('neutral')
      expect(memoryStatus(7)).toBe('partial')
    })
    it('旧档缺回执或同时有两种回执时，不误判为到案', () => {
      const unknown = { ...goodFlags, F76_SANCHEZ_CAUGHT: false }
      const conflicting = { ...goodFlags, F76_ESCAPED: true }
      expect(captureStatus(unknown)).toBe('unknown')
      expect(captureStatus(conflicting)).toBe('escaped')
      expect(decideEnding(stateWith(goodMeta, unknown))).toBe('neutral')
      expect(decideEnding(stateWith(goodMeta, conflicting))).toBe('neutral')
    })
  })
})
