import { afterEach, describe, expect, it, vi } from 'vitest'
import { getScene } from '../src/content/index'
import { CHOICE_UNDO_MS, createInitialState } from '../src/game/engine'
import { resolveSceneBody, resolveSceneProgress } from '../src/game/narrative'

const SAVE_KEY = 'jiangjia.save.v1'

async function loadStore(saved?: unknown) {
  const entries = new Map<string, string>()
  if (saved) entries.set(SAVE_KEY, JSON.stringify({ version: 1, state: saved }))
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
  it('旧序章档继续沿原有场景走，不补做或推断首幕的合照决定', async () => {
    const { store } = await loadStore({
      ...createInitialState('p03'),
      started: true,
      visited: ['p01', 'p02', 'p03'],
    })
    store.getState().advance(getScene('p03')!)
    expect(store.getState()).toMatchObject({ sceneId: 'p04', flags: {}, history: [], visited: ['p01', 'p02', 'p03', 'p04'] })

    const priorChoice = { sceneId: 'p03', chapter: 'prologue', choice: 'A', label: '答应住下，替她守着女方那桌。', at: 100, next: 'p04', consequence: '你把椅子拉回来。' }
    const { store: resolved } = await loadStore({ ...createInitialState('p04'), started: true, history: [priorChoice] })
    const { flags, history } = resolved.getState()
    expect(history).toEqual([priorChoice])
    expect(resolveSceneBody(getScene('p04')!, flags, history[0])).toContain(priorChoice.consequence)
    for (const id of ['p07', 'c0107']) {
      const scene = getScene(id)!
      expect(resolveSceneBody(scene, flags, history[0])).toBe(scene.body)
    }
  })

  it('撤销恢复档案、旗帜、抵达记录与人物解锁，可重新选另一项', async () => {
    const { store } = await loadStore({ ...createInitialState('c0205'), started: true })
    const scene = getScene('c0205')!
    store.getState().choose(scene.options![1], scene)
    store.getState().meet('柳湘')
    expect(store.getState().clues).toEqual(['C10', 'C11'])
    expect(store.getState().flags.F_VILLA_LIST).toBe(true)
    expect(store.getState().metCharacters).toContain('liuxiang')
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'c0205', clues: [], flags: {}, visited: ['c0205'], history: [], metCharacters: ['jiangjia'] })
    store.getState().choose(scene.options![2], scene)
    expect(store.getState().clues).toEqual(['C11'])
    expect(store.getState().flags).toEqual({ F_VILLA_WITNESS: true })
    expect(store.getState().history.map(({ choice }) => choice)).toEqual(['C'])
  })

  it('撤销时限结束后不允许回退', async () => {
    vi.useFakeTimers()
    const { store } = await loadStore({ ...createInitialState('c0304'), started: true })
    const scene = getScene('c0304')!
    store.getState().choose(scene.options![0], scene)
    vi.advanceTimersByTime(CHOICE_UNDO_MS)
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'c0305', snapshot: null })
    expect(store.getState().history).toHaveLength(1)
  })

  it('刷新保留实际后果且不重复结算，临时撤销不跨刷新', async () => {
    const { store, storage } = await loadStore({ ...createInitialState('c0304'), started: true })
    const scene = getScene('c0304')!
    const option = scene.options![2]
    store.getState().choose(option, scene)
    const raw = JSON.parse(storage.getItem(SAVE_KEY)!)
    const { store: reopened } = await loadStore(raw.state)
    const state = reopened.getState()
    expect(state).toMatchObject({ sceneId: option.next, snapshot: null, clues: ['C13'], flags: { F_STAGE_LIST: true }, history: raw.state.history })
    expect(state.meta).toEqual(raw.state.meta)
    expect(resolveSceneBody(getScene(option.next)!, state.flags, state.history[0])).toContain(option.consequence)
    expect(resolveSceneProgress(getScene(option.next)!, state.history[0])).toContain(option.progress)
  })

  it('撤销对质后换证据，覆盖上一次选择的进展', async () => {
    const scene = getScene('c0206a')!
    const result = getScene('c0206b')!
    const { store } = await loadStore({ ...createInitialState(scene.id), started: true })
    const [first, second] = scene.options!
    store.getState().choose(first, scene)
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: scene.id, history: [], flags: {} })
    store.getState().choose(second, scene)
    const { flags, history } = store.getState()
    expect(flags).toEqual({ F_DU_KEY: true })
    expect(resolveSceneProgress(result, history[0])).toEqual([second.progress, result.progress])
  })

  it('旧档保留进度，移去过早入档的旧卡和真相标记，到点后重新授予', async () => {
    const { store } = await loadStore({
      ...createInitialState('c0608'),
      started: true,
      clues: ['C01', 'C22', 'C24'],
      solved: ['D08'],
      flags: { F62_MEMORY_TRUTH: true },
      history: [{ sceneId: 'c0406', chapter: 'ch04', choice: 'B', label: '在远处等。', at: 100 }],
    })
    expect(store.getState()).toMatchObject({ sceneId: 'c0608', clues: ['C01', 'C24'], flags: {}, solved: ['D08'] })
    expect(store.getState().history[0].consequence).toBeUndefined()
    const scene = getScene('c0608')!
    store.getState().choose(scene.options![1], scene)
    expect(store.getState().clues).toEqual(['C01', 'C24', 'C22', 'C25'])
    expect(store.getState().flags).toMatchObject({ F61_XIE_XIAOLONG_TRUTH: true, F62_MEMORY_TRUTH: true })
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
