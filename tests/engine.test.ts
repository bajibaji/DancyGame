import { describe, expect, it } from 'vitest'
import { applyEffects, breakdownCause, choose, createInitialState, decideEnding, restoreSnapshot, makeSnapshot } from '../src/game/engine'
import { statCaps } from '../src/game/balance'
import { captureStatus, memoryStatus } from '../src/game/narrative'
import type { GameState, Scene } from '../src/game/types'

function stateWith(meta: Partial<GameState['meta']>, flags: Record<string, boolean> = {}): GameState {
  const base = createInitialState('x')
  return { ...base, meta: { ...base.meta, ...meta }, flags }
}

describe('engine', () => {
  it('初始状态符合设计', () => {
    const s = createInitialState('p01')
    expect(s.meta).toEqual({ world: 0, clue: 5, relation: 4, danger: 2, memory: 0 })
    expect(s.sceneId).toBe('p01')
  })

  it('效果结算并夹取上下限', () => {
    const s = createInitialState('x')
    const out = applyEffects(s, { clue: 100, danger: -100, memory: 3, flags: ['F1'], clues: ['C01'] })
    expect(out.meta.clue).toBe(105)
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
    const caps = statCaps()
    const at = (value: number, ratio: number) => Math.round(value * ratio)
    const goodMeta = {
      clue: at(caps.clue, 0.62),
      memory: at(caps.memory, 0.7),
      relation: at(caps.relation, 0.62),
      danger: at(caps.danger, 0.3),
    }
    it('满足条件为好结局', () => {
      expect(decideEnding(stateWith(goodMeta, goodFlags))).toBe('good')
    })
    it('危险过高为坏结局', () => {
      const state = stateWith({ ...goodMeta, danger: Math.ceil(caps.danger * 0.75) }, goodFlags)
      expect(decideEnding(state)).toBe('bad')
      expect(breakdownCause(state.meta)).toBe('exposure')
      expect(captureStatus(state.flags)).toBe('caught')
      expect(memoryStatus(state.meta.memory)).toBe('recovered')
    })
    it('关系过低为坏结局', () => {
      const state = stateWith({ ...goodMeta, relation: Math.floor(caps.relation * 0.1) }, goodFlags)
      expect(decideEnding(state)).toBe('bad')
      expect(breakdownCause(state.meta)).toBe('isolation')
    })
    it('叶小满拒绝私下合作不单独判坏', () => {
      expect(decideEnding(stateWith(goodMeta, { ...goodFlags, F78_YIN_HOSTILE: true }))).toBe('good')
    })
    it('到案但材料、记忆或合作未达好结局边界时为中立', () => {
      for (const meta of [
        { clue: at(caps.clue, 0.42) },
        { memory: at(caps.memory, 0.4) },
        { relation: at(caps.relation, 0.42) },
        { danger: at(caps.danger, 0.55) },
      ]) {
        expect(decideEnding(stateWith({ ...goodMeta, ...meta }, goodFlags))).toBe('neutral')
      }
      expect(decideEnding(stateWith(goodMeta, { ...goodFlags, F62_MEMORY_TRUTH: false }))).toBe('neutral')
      expect(memoryStatus(at(caps.memory, 0.4))).toBe('partial')
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
