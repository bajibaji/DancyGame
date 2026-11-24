import { describe, expect, it } from 'vitest'
import { CHAPTERS, SCENES, START_SCENE, CLUE_MAP, MEMORY_MAP, LOCATION_MAP, ENDINGS, getScene } from '../src/content/index'
import { OPPORTUNITIES } from '../src/content/opportunities'
import type { GameState, Option } from '../src/game/types'
import { applyEffects, choose, createInitialState, decideEnding } from '../src/game/engine'
import { RECIPES, availableRecipes, solvePuzzle } from '../src/game/puzzle'

type Policy = (options: Option[], sceneId: string) => 'A' | 'B' | 'C'

const ch04Complete = (CHAPTERS.find((chapter) => chapter.chapter === 'ch04')?.scenes.length ?? 0) >= 40

function play(policy: Policy, solveAll = false): GameState {
  let state = createInitialState(START_SCENE)
  let scene = getScene(START_SCENE)
  const visited: string[] = []
  while (scene && !visited.includes(scene.id)) {
    visited.push(scene.id)
    if (scene.effects) state = applyEffects(state, scene.effects)
    if (scene.ending) {
      const ending = scene.ending === 'auto' ? decideEnding(state) : scene.ending
      return { ...state, sceneId: scene.id, visited, ending }
    }
    if (solveAll) {
      for (const recipe of availableRecipes(state.clues)) {
        state = solvePuzzle(state, ...recipe.cards).state
      }
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
  if (sceneId === 'c0706' || sceneId === 'c0706p') return 'A'
  const sorted = [...options].sort((a, b) => (a.effects.danger ?? 0) - (b.effects.danger ?? 0))
  const minDanger = sorted[0].effects.danger ?? 0
  const tied = options.filter((o) => (o.effects.danger ?? 0) === minDanger)
  return (tied.find((o) => o.key === 'B') ?? tied[0]).key
}

const neutralPolicy: Policy = (options, sceneId) => {
  if (sceneId === 'c0706' || sceneId === 'c0706p') return 'B'
  return safePolicy(options, sceneId)
}

const recklessPolicy: Policy = (options) => {
  const sorted = [...options].sort((a, b) => (b.effects.danger ?? 0) - (a.effects.danger ?? 0))
  return sorted[0].key
}

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

  it('推理配方的两张卡与全部记忆都有授予点', () => {
    const granted = new Set<string>()
    const memories = new Set<string>()
    for (const scene of SCENES.values()) {
      for (const effects of [scene.effects, ...(scene.options ?? []).map((o) => o.effects)]) {
        for (const id of effects?.clues ?? []) granted.add(id)
        for (const id of effects?.memories ?? []) memories.add(id)
      }
    }
    for (const recipe of RECIPES) {
      for (const card of recipe.cards) expect(granted.has(card), recipe.id + ' 缺少 ' + card).toBe(true)
    }
    for (const id of MEMORY_MAP.keys()) expect(memories.has(id), id + ' 没有授予点').toBe(true)
  })

  it('选择场景恰好 3 个选项且键为 ABC', () => {
    for (const scene of SCENES.values()) {
      if (!scene.options || scene.options.length === 0) continue
      expect(scene.options.map((o) => o.key).join(''), scene.id).toBe('ABC')
    }
  })

  it('每条支路必然收束到终幕，且没有死路或循环', () => {
    const pending = new Set<string>()
    const done = new Set<string>()
    const visit = (id: string) => {
      if (done.has(id)) return
      expect(pending.has(id), `循环：${id}`).toBe(false)
      const scene = getScene(id)
      expect(scene, `跳转缺失：${id}`).toBeDefined()
      const next = scene!.options?.map((option) => option.next) ?? (scene!.next ? [scene!.next] : [])
      if (scene!.ending) {
        expect(['c0716a', 'c0716b', 'c0716c'], `终幕 id ${id}`).toContain(id)
        expect(next).toEqual([])
      } else {
        expect(next.length, `走不下去：${id}`).toBeGreaterThan(0)
      }
      pending.add(id)
      for (const target of next) visit(target)
      pending.delete(id)
      done.add(id)
    }
    visit(START_SCENE)
    expect(done.size).toBe(SCENES.size)
  })

  it('跳转、线索、记忆与地点引用合法', () => {
    for (const scene of SCENES.values()) {
      if (scene.next) expect(SCENES.has(scene.next), `${scene.id} next`).toBe(true)
      expect(LOCATION_MAP.has(scene.locationId), `${scene.id} location`).toBe(true)
      for (const option of scene.options ?? []) {
        expect(SCENES.has(option.next), `${scene.id} option next`).toBe(true)
      }
      for (const effects of [scene.effects, ...(scene.options ?? []).map((o) => o.effects)]) {
        for (const clue of effects?.clues ?? []) {
          expect(CLUE_MAP.has(clue), `${scene.id} clue ${clue}`).toBe(true)
        }
        for (const memory of effects?.memories ?? []) {
          expect(MEMORY_MAP.has(memory), `${scene.id} memory ${memory}`).toBe(true)
        }
      }
    }
  })

  it('笔记本、断柄杯与终幕副卷不在揭晓前入档', () => {
    const sources = (clue: string) => [...SCENES.values()].filter((scene) =>
      scene.effects?.clues?.includes(clue) || scene.options?.some((o) => o.effects.clues?.includes(clue)),
    ).map(({ id }) => id)
    if (SCENES.has('c0609')) expect(sources('C22')).toEqual(['c0609'])
    if (SCENES.has('c0408')) expect(sources('C24')).toEqual(['c0408'])
    if (SCENES.has('c0609')) expect(sources('C25')).toEqual(['c0609'])
    if (SCENES.has('c0708')) expect(sources('C26')).toEqual(['c0708'])
    // 序章至第二章已重写，线索发放表待重排；本项先只守第三至第七章。
    const essential = ['C22', 'C24', 'C25', 'C26']
    if (!ch04Complete || !SCENES.has('c0408')) return
    for (const policy of [safePolicy, neutralPolicy, recklessPolicy, () => 'B', () => 'C'] satisfies Policy[]) {
      expect(play(policy).clues).toEqual(expect.arrayContaining(essential))
    }
  })

  it('推理板只整理已获线索，不替主线立结论，也不重复加分', () => {
    const pairs = new Set<string>()
    for (const recipe of RECIPES) {
      const pair = [...recipe.cards].sort().join('/')
      expect(pairs.has(pair), recipe.id).toBe(false)
      expect(new Set(recipe.cards).size, recipe.id).toBe(2)
      expect(recipe.cards.every((id) => CLUE_MAP.has(id)), recipe.id).toBe(true)
      pairs.add(pair)
      const state = { ...createInitialState('p01'), clues: [...recipe.cards] }
      const result = solvePuzzle(state, ...recipe.cards)
      expect(result.result).toBe(recipe)
      expect(result.state.flags).toEqual(state.flags)
      expect(result.state.meta.clue).toBe(state.meta.clue + 2)
      expect(solvePuzzle({ ...state, meta: { ...state.meta, clue: 60 } }, ...recipe.cards).state.meta.clue).toBe(62)
      expect(solvePuzzle(result.state, ...recipe.cards).state).toBe(result.state)
      expect(solvePuzzle({ ...state, clues: [] }, ...recipe.cards).result).toBeNull()
    }
  })

  it('写入的剧情旗帜都有回收，回收都有来源', () => {
    const writes = new Set<string>()
    const reads = new Set<string>(['F61_XIE_XIAOLONG_TRUTH', 'F62_MEMORY_TRUTH', 'F76_ESCAPED', 'F76_SANCHEZ_CAUGHT'])
    for (const scene of SCENES.values()) {
      for (const effects of [scene.effects, ...(scene.options ?? []).map((o) => o.effects)]) {
        for (const flag of effects?.flags ?? []) writes.add(flag)
      }
      for (const entry of [...(scene.recalls ?? []), ...(scene.variants ?? [])]) reads.add(entry.flag)
    }
    for (const opportunities of Object.values(OPPORTUNITIES)) for (const { action, requires } of opportunities) {
      for (const flag of action.effects.flags ?? []) writes.add(flag)
      if (requires) reads.add(requires)
    }
    for (const ending of Object.values(ENDINGS)) for (const entry of ending.variants) reads.add(entry.flag)
    expect([...writes].sort()).toEqual([...reads].sort())
  })

  it('正文长度与禁用词', () => {
    const forbidden = ['TODO', 'FIXME', 'undefined', '抖音', '共享单车', '健康码', '5G']
    for (const scene of SCENES.values()) {
      expect(scene.body.length, `${scene.id} body 过短`).toBeGreaterThanOrEqual(160)
      for (const term of forbidden) {
        expect(scene.body.includes(term), `${scene.id} 含禁用词 ${term}`).toBe(false)
      }
    }
  })
})
