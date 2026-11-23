import { describe, expect, it } from 'vitest'
import { getScene, SCENES } from '../src/content/index'
import { choose, createInitialState } from '../src/game/engine'
import { resolveSceneBody, resolveSceneFollowUps, resolveSceneProgress } from '../src/game/narrative'
import { RECIPES, solvePuzzle } from '../src/game/puzzle'
import type { HistoryEntry } from '../src/game/types'

describe('选项在正文里的后果', () => {
  it('每组选项的标签与即时后果均不重复，只在实际到达的幕显示', () => {
    for (const scene of SCENES.values()) {
      if (!scene.options) continue
      expect(new Set(scene.options.map((option) => option.label.trim())).size, scene.id).toBe(3)
      expect(new Set(scene.options.map((option) => option.consequence.trim())).size, scene.id).toBe(3)
      for (const option of scene.options) {
        const context = `${scene.id}/${option.key}`
        expect(option.consequence.trim().length, context).toBeGreaterThanOrEqual(24)
        expect(Object.keys(option.effects).length, context).toBeGreaterThan(0)
        const state = choose(createInitialState(scene.id), scene, option)
        const arrival = state.history[0]
        const body = resolveSceneBody(getScene(option.next)!, state.flags, arrival)
        expect(body, context).toMatch(`${option.consequence}\n\n`)
        for (const other of scene.options.filter((candidate) => candidate !== option)) {
          expect(body, context).not.toContain(other.consequence)
        }
        expect(resolveSceneBody(scene, state.flags, arrival), context).not.toContain(option.consequence)
      }
    }
  })

  it.each([
    ['p01', 'p07'],
    ['p01', 'c0107'],
    ['c0108', 'c0110'],
    ['c0103', 'c0206a'],
    ['c0206a', 'c0206b'],
    ['c0205', 'c0209'],
    ['c0304', 'c0308'],
    ['c0304', 'c0309'],
    ['c0306', 'c0405'],
    ['c0402', 'c0404'],
    ['c0404', 'c0409'],
    ['c0508', 'c0510'],
    ['c0603', 'c0609'],
    ['c0605', 'c0610'],
    ['c0608', 'c0708'],
    ['c0701', 'c0709'],
    ['c0706p', 'c0707p'],
  ])('%s 的三条迟回收分别出现于 %s', (choiceId, recallId) => {
    const scene = getScene(choiceId)!
    const target = getScene(recallId)!
    const matching = new Set<string>()
    for (const option of scene.options!) {
      const state = choose(createInitialState(scene.id), scene, option)
      const active = target.recalls!.filter(({ flag }) => state.flags[flag])
      expect(active).toHaveLength(1)
      const body = resolveSceneBody(target, state.flags, state.history[0])
      expect(body).toContain(active[0].text)
      matching.add(active[0].flag)
      for (const entry of target.recalls!.filter(({ flag }) => !state.flags[flag])) {
        expect(body).not.toContain(entry.text)
      }
    }
    expect(matching.size).toBe(3)
  })

  it('新开档第一幕直接选合照，序章仍只有两次抉择', () => {
    const opening = getScene('p01')!
    expect(opening.next).toBeUndefined()
    expect(opening.options?.map(({ key, next }) => [key, next])).toEqual([['A', 'p02'], ['B', 'p02'], ['C', 'p02']])
    expect([...SCENES.values()].filter((scene) => scene.chapter === 'prologue' && scene.options?.length).map(({ id }) => id)).toEqual(['p01', 'p04'])
  })

  it.each(['墓前', '台阶上', '车没有发动'])('扫墓有独立揭晓正文：%s', (location) => {
    const scene = getScene('c0406')!
    const option = scene.options![['墓前', '台阶上', '车没有发动'].indexOf(location)]
    const state = choose(createInitialState(scene.id), scene, option)
    const target = getScene('c0407')!
    const variant = target.variants!.find(({ flag }) => state.flags[flag])!
    const body = resolveSceneBody(target, state.flags, state.history[0])
    expect(variant.body).toContain(location)
    expect(body).toContain(variant.body)
    expect(body).not.toContain(target.body)
  })

  it('旧历史只保留玩家原先做过的选择，不套用新版同字母的后果', () => {
    const scene = getScene('c0308')!
    const legacy: HistoryEntry = { sceneId: 'c0304', chapter: 'ch03', choice: 'A', label: '收起警棍周旋。', at: 100 }
    expect(resolveSceneBody(scene, {}, legacy)).toBe(scene.body)
    expect(resolveSceneProgress(scene, legacy)).toEqual([])
    expect(resolveSceneBody(getScene('c0707')!, {})).not.toContain('白鸮在押')
  })

  it('对质三条路线只显示实际取得的进展，旧档仍能接到共用结果', () => {
    const scene = getScene('c0206a')!
    const result = getScene('c0206b')!
    expect(getScene('c0206')?.next).toBe(scene.id)
    for (const option of scene.options!) {
      const state = choose(createInitialState(scene.id), scene, option)
      const arrival = state.history[0]
      expect(resolveSceneProgress(scene, arrival)).toEqual([])
      expect(resolveSceneProgress(result, arrival)).toEqual([option.progress, result.progress])
      expect(resolveSceneBody(result, state.flags, arrival)).toContain('杜衡签完字')
    }
    expect(new Set(scene.options!.map(({ progress }) => progress)).size).toBe(3)
    expect(resolveSceneProgress(result)).toEqual([result.progress])
    expect(resolveSceneBody(result, {})).toBe(result.body)
  })

  it.each([['D10', 'c0206a'], ['D03', 'c0207']])('%s 只开放 %s 的补充材料', (id, sceneId) => {
    const recipe = RECIPES.find((item) => item.id === id)!
    const scene = getScene(sceneId)!
    const before = { ...createInitialState(sceneId), clues: [...recipe.cards] }
    expect(resolveSceneFollowUps(scene, before.solved)).toEqual([])
    const { state } = solvePuzzle(before, ...recipe.cards)
    const unlocked = [...SCENES.values()].flatMap((section) =>
      resolveSceneFollowUps(section, state.solved).map(({ recipe }) => [section.id, recipe]),
    )
    expect(unlocked).toEqual([[sceneId, id]])
    expect(state.sceneId).toBe(before.sceneId)
    expect(state.flags).toEqual(before.flags)
    expect(resolveSceneBody(scene, state.flags)).toBe(scene.body)
  })

  it('即时后果、当前幕的回收、变体正文按阅读顺序组合', () => {
    const scene = getScene('c0706p')!
    const option = scene.options![0]
    const state = choose(createInitialState(scene.id), scene, option)
    const target = getScene(option.next)!
    const recall = target.recalls!.find(({ flag }) => state.flags[flag])!
    expect(resolveSceneBody(target, state.flags, state.history[0])).toBe([option.consequence, recall.text, target.body].join('\n\n'))
  })
})
