import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CHAPTERS, SCENES, START_SCENE, CLUE_MAP, MEMORY_MAP, LOCATION_MAP, ENDINGS, getScene } from '../src/content/index'
import type { GameState, Option } from '../src/game/types'
import { applyEffects, choose, createInitialState, decideEnding } from '../src/game/engine'
import { captureStatus, resolveSceneBody } from '../src/game/narrative'
import { RECIPES, availableRecipes, solvePuzzle } from '../src/game/puzzle'

type Policy = (options: Option[], sceneId: string) => 'A' | 'B' | 'C'

function play(policy: Policy, solveAll = false): GameState {
  let state = createInitialState(START_SCENE)
  let scene = getScene(START_SCENE)
  const visited: string[] = []
  while (scene && !visited.includes(scene.id)) {
    visited.push(scene.id)
    if (scene.effects) state = applyEffects(state, scene.effects)
    if (scene.ending === 'auto') {
      return { ...state, sceneId: scene.id, visited, ending: decideEnding(state) }
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

describe('三结局可达性模拟', () => {
  it('留港提交核验件可达好结局，不去边境也不用推理板', () => {
    const result = play(safePolicy)
    expect(result.ending).toBe('good')
    expect(result.solved).toEqual([])
    expect(captureStatus(result.flags)).toBe('caught')
    expect(result.visited).toEqual(expect.arrayContaining(['c0705p', 'c0706p', 'c0707p', 'c0708']))
    expect(result.visited.map((id) => getScene(id)?.locationId)).not.toContain('border')
  })

  it('留港优先救人可达中立结局，不生成白鸮供述', () => {
    const result = play(neutralPolicy)
    expect(result.ending).toBe('neutral')
    expect(captureStatus(result.flags)).toBe('escaped')
    expect(resolveSceneBody(getScene('c0708')!, result.flags)).toContain('白鸮未到案')
  })

  it.each(['A', 'B', 'C'] as const)('边境路线选择 %s，通关回执与实际抓捕结果一致', (key) => {
    const result = play((options, id) => id === 'c0704' ? 'C' : id === 'c0706' ? key : safePolicy(options, id))
    expect(result.visited).toEqual(expect.arrayContaining(['c0705', 'c0706', 'c0707', 'c0708']))
    expect(result.visited).not.toContain('c0706p')
    expect(captureStatus(result.flags)).toBe(key === 'B' ? 'escaped' : 'caught')
    expect(resolveSceneBody(getScene('c0707')!, result.flags)).toContain(key === 'B' ? '最后一次在哪儿见到白鸮' : '白鸮在押')
    expect(resolveSceneBody(getScene('c0708')!, result.flags)).toContain(key === 'B' ? '白鸮未到案' : '签了真名倪雨')
    expect(result.ending).toBe(key === 'B' ? 'neutral' : 'good')
  })

  it('冒进路线可以到达坏结局', () => {
    const result = play(recklessPolicy)
    expect(result.ending).toBe('bad')
    expect(result.meta.danger).toBeGreaterThanOrEqual(16)
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

  it('固定种子抽样 5000 条路线，三结局均可达，线索分值不再普遍封顶', () => {
    let seed = 459147
    const sample: Policy = (options) => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return options[Math.floor((seed / 0x100000000) * options.length)].key
    }
    const endings = new Set<string>()
    const clues = new Set<number>()
    let caughtWithoutEnoughEvidence = false
    for (let index = 0; index < 5000; index++) {
      const result = play(sample)
      endings.add(result.ending!)
      clues.add(result.meta.clue)
      const { clue, relation, danger, memory } = result.meta
      if (clue < 18 && relation >= 18 && danger <= 14 && memory >= 8 && captureStatus(result.flags) === 'caught') {
        expect(result.ending).toBe('neutral')
        caughtWithoutEnoughEvidence = true
      }
    }
    expect(endings).toEqual(new Set(['good', 'neutral', 'bad']))
    expect(clues.size).toBeGreaterThanOrEqual(10)
    expect(caughtWithoutEnoughEvidence).toBe(true)
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
        expect(id).toBe('c0709')
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
    expect(sources('C22')).toEqual(['c0609'])
    expect(sources('C24')).toEqual(['c0408'])
    expect(sources('C25')).toEqual(['c0609'])
    expect(sources('C26')).toEqual(['c0708'])
    const essential = ['C01', 'C02', 'C05', 'C07', 'C09', 'C11', 'C12', 'C13', 'C15', 'C17', 'C19', 'C22', 'C23', 'C24', 'C25', 'C26']
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
      expect(solvePuzzle(result.state, ...recipe.cards).state).toBe(result.state)
      expect(solvePuzzle({ ...state, clues: [] }, ...recipe.cards).result).toBeNull()
    }
  })

  it('每个写入的剧情旗帜都有后续读取，每个读取都有来源', () => {
    const writes = new Set<string>()
    const reads = new Set(['F61_XIE_XIAOLONG_TRUTH', 'F62_MEMORY_TRUTH'])
    for (const scene of SCENES.values()) {
      for (const effects of [scene.effects, ...(scene.options ?? []).map((o) => o.effects)]) {
        for (const flag of effects?.flags ?? []) writes.add(flag)
      }
      for (const entry of [...(scene.recalls ?? []), ...(scene.variants ?? [])]) reads.add(entry.flag)
    }
    for (const ending of Object.values(ENDINGS)) for (const entry of ending.variants) reads.add(entry.flag)
    expect(writes).toEqual(reads)
  })

  it('编剧知识库中的场景锚点可反查到当前剧本', () => {
    const text = readFileSync(new URL('../docs/编剧知识库.md', import.meta.url), 'utf8')
    const references = new Set(text.match(/\b(?:p\d{2}|c\d{4}[a-z]?)\b/g) ?? [])
    expect(references.size).toBeGreaterThanOrEqual(30)
    for (const id of references) expect(SCENES.has(id), `知识库已失效的场景：${id}`).toBe(true)
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
