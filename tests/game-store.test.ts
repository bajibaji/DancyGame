import { afterEach, describe, expect, it, vi } from 'vitest'
import { getScene } from '../src/content/index'
import { CHOICE_UNDO_MS, createInitialState } from '../src/game/engine'
import { resolveSceneBody, resolveSceneProgress } from '../src/game/narrative'

const SAVE_KEY = 'jiangjia.save.v1'

async function loadStore(saved?: unknown, version = 2) {
  const entries = new Map<string, string>()
  if (saved) entries.set(SAVE_KEY, JSON.stringify({ version, state: saved }))
  const storage = {
    getItem: (key: string) => entries.get(key) ?? null,
    setItem: (key: string, value: string) => entries.set(key, value),
    removeItem: (key: string) => entries.delete(key),
  }
  vi.stubGlobal('window', { localStorage: storage })
  vi.resetModules()
  const { useGameStore } = await import('../src/stores/gameStore')
  expect(useGameStore.persist.hasHydrated()).toBe(true)
  return { store: useGameStore, storage }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('游玩进度', () => {
  it('序章档从上一幕继续，不补做已结算的选择', async () => {
    const { store } = await loadStore({
      ...createInitialState('p01b'),
      started: true,
      visited: ['p01a', 'p01b'],
    })
    store.getState().advance(getScene('p01b')!)
    expect(store.getState()).toMatchObject({ sceneId: 'p01c', flags: {}, history: [], visited: ['p01a', 'p01b', 'p01c'] })

    const priorChoice = { sceneId: 'p01c', chapter: 'prologue', choice: 'A', label: '坐到她身边。', at: 100, next: 'p02a', consequence: '快门响过，叶小满才松开勾着椅腿的脚。' }
    const { store: resolved } = await loadStore({ ...createInitialState('p02a'), started: true, history: [priorChoice] })
    const { flags, history } = resolved.getState()
    expect(history).toEqual([priorChoice])
    expect(resolveSceneBody(getScene('p02a')!, flags, history[0])).toContain(priorChoice.consequence)
  })

  it('撤销恢复档案、旗帜、抵达记录与人物解锁，可重新选另一项', async () => {
    const { store } = await loadStore({ ...createInitialState('p04c'), started: true })
    const scene = getScene('p04c')!
    store.getState().choose(scene.options![1], scene)
    store.getState().meet('柳湘')
    expect(store.getState().clues).toEqual(['C03'])
    expect(store.getState().metCharacters).toContain('liuxiang')
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'p04c', clues: [], flags: {}, visited: ['p04c'], history: [], metCharacters: ['jiangjia'] })
    store.getState().choose(scene.options![2], scene)
    expect(store.getState().clues).toEqual([])
    expect(store.getState().history.map(({ choice }) => choice)).toEqual(['C'])
  })

  it('撤销时限结束后不允许回退', async () => {
    vi.useFakeTimers()
    const { store } = await loadStore({ ...createInitialState('c0302c'), started: true })
    const scene = getScene('c0302c')!
    store.getState().choose(scene.options![0], scene)
    vi.advanceTimersByTime(CHOICE_UNDO_MS)
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'c0303a', snapshot: null })
    expect(store.getState().history).toHaveLength(1)
  })

  it('刷新保留实际后果且不重复结算，临时撤销不跨刷新', async () => {
    const { store, storage } = await loadStore({ ...createInitialState('c0302c'), started: true })
    const scene = getScene('c0302c')!
    const option = scene.options![2]
    store.getState().choose(option, scene)
    const raw = JSON.parse(storage.getItem(SAVE_KEY)!)
    const { store: reopened } = await loadStore(raw.state)
    const state = reopened.getState()
    expect(state).toMatchObject({ sceneId: option.next, snapshot: null, clues: [], flags: {}, history: raw.state.history })
    expect(state.meta).toEqual(raw.state.meta)
    expect(resolveSceneBody(getScene(option.next)!, state.flags, state.history[0])).toContain(option.consequence)
    expect(resolveSceneProgress(getScene(option.next)!, state.history[0])).toContain(option.progress)
  })

  it('旧版本关系值翻倍到新刻度，其他数值不动', async () => {
    const saved = {
      ...createInitialState('c0205'),
      started: true,
      meta: { clue: 8, relation: 10, danger: 2, memory: 3 },
    }
    const { store } = await loadStore(saved, 1)
    expect(store.getState().meta).toEqual({ world: 0, clue: 8, relation: 20, danger: 2, memory: 3 })
  })

  it('未做终局决定的旧留港档回到港区，保留旧选项，已做决定的档不改路', async () => {
    const portChoice = { sceneId: 'c0704', chapter: 'ch07', choice: 'A', label: '服从指挥部，留在舟山港。', at: 100 }
    const { store } = await loadStore({
      ...createInitialState('c0706'),
      started: true,
      visited: ['c0704', 'c0705', 'c0706'],
      appliedScenes: ['c0704', 'c0705', 'c0706'],
      history: [portChoice],
    })
    expect(store.getState()).toMatchObject({
      sceneId: 'c0706p',
      visited: ['c0704', 'c0705p', 'c0706p'],
      appliedScenes: ['c0704', 'c0705p', 'c0706p'],
      history: [portChoice],
    })
    const borderChoice = { sceneId: 'c0706', chapter: 'ch07', choice: 'B', label: '先救人质。', at: 200 }
    const { store: resolved } = await loadStore({
      ...createInitialState('c0707'),
      started: true,
      history: [portChoice, borderChoice],
      flags: { F76_ESCAPED: true },
    })
    expect(resolved.getState()).toMatchObject({ sceneId: 'c0707', history: [portChoice, borderChoice], flags: { F76_ESCAPED: true } })
  })
})
