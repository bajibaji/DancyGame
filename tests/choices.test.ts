import { describe, expect, it } from 'vitest'
import { CHAPTERS, getScene, START_SCENE } from '../src/content/index'
import { OPPORTUNITIES } from '../src/content/opportunities'
import { statCaps } from '../src/game/balance'
import { choiceOffers } from '../src/game/choices'
import { applyEffects, choiceImpact, choose, createInitialState, decideEnding } from '../src/game/engine'
import type { GameState, Scene } from '../src/game/types'

const seeds = Array.from({ length: 48 }, (_, i) => i)

function endingRun(seed: number, policy: 'balanced' | 'reckless' | 'compromise') {
  let scene: Scene | undefined = getScene(START_SCENE)
  let state = createInitialState(START_SCENE, seed)
  const visited = new Set<string>()
  while (scene && !visited.has(scene.id)) {
    visited.add(scene.id)
    state = applyEffects(state, scene.effects)
    if (scene.ending) return { state, ending: scene.ending === 'good' || scene.ending === 'auto' ? decideEnding(state) : scene.ending }
    const offers = choiceOffers(scene, seed, state.flags)
    if (!offers.length) {
      scene = scene.next ? getScene(scene.next) : undefined
      continue
    }
    const score = ({ option }: (typeof offers)[number]) => {
      const { clue, relation, danger } = choiceImpact(state, option)
      if (policy === 'reckless') return danger * 10 + clue
      const caps = statCaps()
      const clueWeight = state.meta.clue / caps.clue < state.meta.relation / caps.relation ? 1.2 : 0.85
      return clue * clueWeight + relation - danger + (option.effects.memory ?? 0) * 2
    }
    const offer = scene.id === 'c0715c' ? offers[policy === 'compromise' ? 1 : 0] :
      [...offers].sort((a, b) => score(b) - score(a))[0]
    state = choose(state, scene, offer.option, offer.key)
    scene = getScene(offer.option.next)
  }
  throw new Error(`没有抵达终幕：${seed}/${policy}，停在 ${scene?.id ?? '无后继场景'}`)
}

describe('每局的调查选项', () => {
  it('所有章节都有场景专属行动，且不能替换唯一材料、回收标记或去向', () => {
    const chapters = new Set<string>()
    for (const [id, options] of Object.entries(OPPORTUNITIES)) {
      const scene = getScene(id)!
      chapters.add(scene.chapter)
      for (const { action, context, insteadOf, requires } of options) {
        const original = scene.options!.find(({ key }) => key === insteadOf)!
        expect(original.effects.flags ?? [], id).toEqual([])
        expect(original.effects.clues ?? [], id).toEqual([])
        expect(original.effects.memories ?? [], id).toEqual([])
        expect(action.effects.clue ?? 0, id).toBeGreaterThanOrEqual(0)
        expect(action.consequence.length, id).toBeGreaterThanOrEqual(40)
        expect(context.length, id).toBeGreaterThan(0)
        expect(action.progress, id).toBeTruthy()
        const offered = seeds.flatMap((seed) => choiceOffers(scene, seed, requires ? { [requires]: true } : {}))
        expect(offered.find(({ option }) => option.label === action.label)?.option.next, id).toBe(original.next)
      }
    }
    expect(chapters.size).toBe(CHAPTERS.length)
  })

  it('周目能改变行动和位置，每幕仍只有三个不同的行动和后果', () => {
    const opening = getScene('p01c')!
    expect(new Set(seeds.map((seed) => choiceOffers(opening, seed, {}).map(({ option }) => option.label).sort().join('|'))).size).toBe(3)
    expect(new Set(seeds.map((seed) => choiceOffers(opening, seed, {}).find(({ option }) => option.key === 'A')!.key)).size).toBe(3)
    const openingState = createInitialState(opening.id)
    for (const seed of seeds) {
      const impacts = choiceOffers(opening, seed, {}).map(({ option }) => JSON.stringify(choiceImpact(openingState, option)))
      expect(new Set(impacts).size).toBe(3)
    }
    for (const chapter of CHAPTERS) for (const scene of chapter.scenes) {
      if (!scene.options) continue
      for (const seed of seeds.slice(0, 12)) {
        const offers = choiceOffers(scene, seed, {})
        expect(offers.map(({ key }) => key).join(''), scene.id).toBe('ABC')
        expect(new Set(offers.map(({ option }) => option.label)).size, scene.id).toBe(3)
        expect(new Set(offers.map(({ option }) => option.consequence)).size, scene.id).toBe(3)
        expect(Math.min(...offers.map(({ option }) => option.effects.world ?? 0)), scene.id).toBeLessThanOrEqual(0)
      }
    }
  })

  it('写席卡的选择会解锁后续行动，与开局随机位置无关', () => {
    const opening = getScene('p01c')!
    const followup = getScene('p03c')!
    const card = seeds.flatMap((seed) => choiceOffers(opening, seed, {})).find(({ option }) => option.effects.flags?.includes('F_WEDDING_BLANK_CARD'))!
    const state = choose(createInitialState(opening.id), opening, card.option, card.key)
    expect(choiceOffers(followup, 0, {}).some(({ opportunity }) => opportunity)).toBe(false)
    expect(choiceOffers(followup, 0, state.flags).find(({ opportunity }) => opportunity)?.option.label).toContain('席卡')
  })

  it('第三次连续冒险额外加一点危险，停一下能减压并打断连累', () => {
    const scene = getScene('c0201c')!
    const [risky, , wait] = scene.options!
    let state: GameState = createInitialState(scene.id)
    for (let i = 0; i < 2; i++) state = choose(state, scene, risky)
    expect(choiceImpact(state, risky)).toMatchObject({ danger: 3, pressured: true })
    expect(choose(state, scene, risky).meta.danger - state.meta.danger).toBe(3)
    expect(choiceImpact({ ...state, meta: { ...state.meta, danger: 1 } }, wait).danger).toBe(-1)
    state = choose(state, scene, wait)
    expect(choiceImpact(state, risky)).toMatchObject({ danger: 2, pressured: false })
  })

  it('用 48 个周目检验稳健调查、交换和一味冒进能走出不同结案', () => {
    for (const seed of seeds) {
      for (const [policy, ending] of [['balanced', 'good'], ['compromise', 'neutral'], ['reckless', 'bad']] as const) {
        const result = endingRun(seed, policy)
        expect(result.ending, `${seed}/${policy}: ${JSON.stringify(result.state.meta)}`).toBe(ending)
        expect(result.state.clues).toEqual(expect.arrayContaining(['C22', 'C24', 'C25', 'C26']))
      }
    }
  })
})
