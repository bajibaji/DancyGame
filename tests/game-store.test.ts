import { afterEach, describe, expect, it, vi } from 'vitest'
import { getScene } from '../src/content/index'
import { CHOICE_UNDO_MS, createInitialState } from '../src/game/engine'
import { choiceOffers } from '../src/game/choices'
import { resolveSceneBody, resolveSceneFollowUps, resolveSceneProgress } from '../src/game/narrative'
import { PUZZLES, assistFor, judgePuzzle, puzzleStatus } from '../src/game/puzzles'
import type { ChoiceKey } from '../src/game/types'

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

describe('序章两次查证与跨章交接', () => {
  const puzzle = PUZZLES.find(({ id }) => id === 'pz11')!
  const directions = ['A', 'B', 'C'] as const
  const routes = directions.flatMap((search) => directions.map((handoff) => ({ search, handoff })))

  it.each(routes)('搜寻 $search、交接 $handoff：两张材料按时开放，解题或跳过均可进第一章', async ({ search, handoff }) => {
    const { store, storage } = await loadStore({ ...createInitialState('p01a', 11), started: true }, 3)
    const pick = (id: string): ChoiceKey => id === 'p03f' || id === 'p04f' ? search : id === 'p08f' ? handoff : 'A'
    const seen = new Set<string>()
    const answer = handoff !== 'B'

    while (store.getState().sceneId !== 'c0101c') {
      const state = store.getState()
      const scene = getScene(state.sceneId)!
      expect(seen.has(scene.id), scene.id).toBe(false)
      seen.add(scene.id)

      if (scene.id === 'p04d') expect(state.clues).not.toContain('C27')
      if (scene.id === 'p04e') expect(state.clues).toContain('C27')
      if (scene.id === 'p09a') expect(puzzleStatus(puzzle, scene.chapter, state.clues, state.solved)).toBe('locked-clues')
      if (scene.id === 'p09b') {
        expect(state.clues).toEqual(expect.arrayContaining(['C27', 'C28']))
        expect(puzzleStatus(puzzle, scene.chapter, state.clues, state.solved)).toBe('ready')
        expect(judgePuzzle(puzzle, ['A'])).toBe(false)
        expect(assistFor(puzzle, 2).excluded).toEqual(['A', 'B'])
        expect(assistFor(puzzle, 3).excluded).not.toContain('C')
        expect(judgePuzzle(puzzle, ['C'])).toBe(true)
        if (answer) expect(state.solvePuzzle('C27', 'C28')?.id).toBe('D11')
      }
      if (scene.id === 'c0101a') {
        expect(resolveSceneFollowUps(scene, state.solved)).toHaveLength(answer ? 1 : 0)
        for (const id of ['C27', 'C28']) expect(state.clues.filter((card) => card === id)).toHaveLength(1)
      }

      if (scene.options) {
        const offers = choiceOffers(scene, state.runSeed, state.flags)
        if (scene.id === 'p04c') expect(offers.some(({ opportunity }) => opportunity?.includes('乘客'))).toBe(search === 'C')
        const offer = offers.find(({ option }) => option.key === pick(scene.id))!
        state.choose(offer.key, scene.id)
      } else {
        expect(scene.next, scene.id).toBeDefined()
        state.advance(scene)
      }
    }

    expect(seen.size).toBe(62)
    expect(store.getState().history).toHaveLength(20)
    const saved = JSON.parse(storage.getItem(SAVE_KEY)!)
    const { store: reloaded } = await loadStore(saved.state, saved.version)
    expect(reloaded.getState()).toMatchObject({ sceneId: 'c0101c', runSeed: 11, clues: saved.state.clues, solved: answer ? ['D11'] : [], history: saved.state.history })
  })

  it.each([
    ['p04c', 'p05a', '沿马宏图离席的方向找人。'],
    ['p08c', 'p09a', '先跟叶小满说，现在不能认人。'],
    ['p16c', 'c0101a', '去老厂，找竖井。'],
  ])('旧档已选 %s 后从 %s 原地续读', async (before, current, label) => {
    const choice = { sceneId: before, chapter: 'prologue', choice: 'A', label, at: 100, next: current }
    const saved = { ...createInitialState(current, 11), started: true, visited: [before, current], appliedScenes: [before, current], history: [choice] }
    const { store } = await loadStore(saved, 3)
    expect(store.getState()).toMatchObject({ sceneId: current, history: [choice], runSeed: 11, meta: saved.meta })
    store.getState().advance(getScene(current)!)
    expect(store.getState().sceneId).toBe(getScene(current)!.next)
    expect(store.getState().history).toEqual([choice])
  })

  it.each(['c0101a', 'c0101b', 'c0205a'])('已过交接的旧档 %s 只补材料，不补分、不重新结算', async (current) => {
    const saved = {
      ...createInitialState(current, 11), started: true, clues: ['C03', 'C27'], memories: ['M01'],
      visited: ['p16c', 'c0101a', current], appliedScenes: ['p16c', 'c0101a'], flags: { F_TO_OLDFACTORY: true },
    }
    const { store } = await loadStore(saved, 3)
    expect(store.getState()).toMatchObject({ ...saved, clues: ['C03', 'C27', 'C28'], history: [], solved: [] })
  })

  it('尚未交接的旧档不提前解锁推理，已结案档不补材料', async () => {
    const { store: pending } = await loadStore({ ...createInitialState('p16c', 11), started: true }, 3)
    expect(pending.getState().clues).toEqual([])
    pending.getState().choose('A', 'p16c')
    expect(pending.getState()).toMatchObject({ sceneId: 'c0101a', clues: ['C27', 'C28'] })

    const { store: ended } = await loadStore({ ...createInitialState('c0716a'), started: true, screen: 'ending', ending: 'bad', visited: ['c0101a', 'c0716a'] }, 3)
    expect(ended.getState()).toMatchObject({ sceneId: 'c0716a', screen: 'ending', ending: 'bad', clues: [] })
  })
})

describe('游玩进度', () => {
  it('修复动作会把失效场景换回最近一个有效场景', async () => {
    const { store } = await loadStore({ ...createInitialState('p01a'), started: true }, 3)
    store.setState({ sceneId: 'c9999', visited: ['p01a', 'c9999'] })
    store.getState().repairScene()
    expect(store.getState()).toMatchObject({ sceneId: 'p01a', visited: ['p01a'] })
  })

  it('存档指向已删除的场景时回到最近一个有效场景', async () => {
    const { store } = await loadStore(
      { ...createInitialState('c9999'), started: true, visited: ['p01a', 'c9999'], appliedScenes: ['p01a'] },
      3,
    )
    expect(store.getState()).toMatchObject({ sceneId: 'p01a', started: true })
  })


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
    const offers = choiceOffers(scene, store.getState().runSeed, {})
    const collect = offers.find(({ option }) => option.key === 'B')!
    const alternate = offers.find(({ option }) => option.key === 'C')!
    store.getState().choose(collect.key, scene.id)
    store.getState().meet('柳湘')
    expect(store.getState().clues).toEqual(['C03'])
    expect(store.getState().metCharacters).toContain('liuxiang')
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'p04c', clues: [], flags: {}, visited: ['p04c'], history: [], metCharacters: ['jiangjia'] })
    store.getState().choose(alternate.key, scene.id)
    expect(store.getState().clues).toEqual([])
    expect(store.getState().history.map(({ choice }) => choice)).toEqual([alternate.key])
  })

  it('撤销时限结束后不允许回退', async () => {
    vi.useFakeTimers()
    const { store } = await loadStore({ ...createInitialState('c0302c'), started: true })
    const scene = getScene('c0302c')!
    store.getState().choose('A', scene.id)
    vi.advanceTimersByTime(CHOICE_UNDO_MS)
    store.getState().undo()
    expect(store.getState()).toMatchObject({ sceneId: 'c0303a', snapshot: null })
    expect(store.getState().history).toHaveLength(1)
  })

  it('刷新保留实际后果且不重复结算，临时撤销不跨刷新', async () => {
    const { store, storage } = await loadStore({ ...createInitialState('c0302c'), started: true })
    const scene = getScene('c0302c')!
    const { option, key } = choiceOffers(scene, store.getState().runSeed, {})[2]
    store.getState().choose(key, scene.id)
    const raw = JSON.parse(storage.getItem(SAVE_KEY)!)
    const { store: reopened } = await loadStore(raw.state)
    const state = reopened.getState()
    expect(state).toMatchObject({ sceneId: option.next, snapshot: null, clues: [], flags: {}, history: raw.state.history })
    expect(state.meta).toEqual(raw.state.meta)
    expect(resolveSceneBody(getScene(option.next)!, state.flags, state.history[0])).toContain(option.consequence)
    expect(resolveSceneProgress(getScene(option.next)!, state.history[0])).toContain(option.progress)
  })

  it('同幕刷新和撤销不换牌，结算记录保存所按字母和实际行动', async () => {
    const scene = getScene('p01c')!
    const seed = Array.from({ length: 128 }, (_, i) => i).find((i) => choiceOffers(scene, i, {}).some(({ opportunity }) => opportunity))!
    const initial = { ...createInitialState(scene.id, seed), started: true }
    const { store, storage } = await loadStore(initial, 3)
    const offers = choiceOffers(scene, seed, {})
    const offer = offers.find(({ opportunity }) => opportunity)!
    store.getState().choose(offer.key, 'p03c')
    expect(store.getState().history).toEqual([])
    store.getState().choose(offer.key, scene.id)
    expect(store.getState().history[0]).toMatchObject({ choice: offer.key, label: offer.option.label, consequence: offer.option.consequence })
    store.getState().undo()
    const saved = JSON.parse(storage.getItem(SAVE_KEY)!)
    const { store: reopened } = await loadStore(saved.state, saved.version)
    expect(reopened.getState()).toMatchObject({ sceneId: scene.id, runSeed: seed, history: [], flags: {} })
    expect(choiceOffers(scene, reopened.getState().runSeed, reopened.getState().flags)).toEqual(offers)
  })

  it('终幕能进入结案，带回证据的路线仍受调查数值影响', async () => {
    const { store } = await loadStore({ ...createInitialState('c0715c'), started: true })
    store.getState().choose('A', 'c0715c')
    store.getState().advance(getScene('c0716a')!)
    expect(store.getState()).toMatchObject({ ending: 'bad', screen: 'ending' })
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

})
