import { describe, expect, it } from 'vitest'
import { CHARACTERS, getScene, SCENES } from '../src/content/index'

const ch04Complete = SCENES.has('c0406') && SCENES.has('c0407')
import { choose, createInitialState } from '../src/game/engine'
import { resolveSceneBody, resolveSceneProgress } from '../src/game/narrative'
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
    ['p03f', 'p04e'],
    ['p04f', 'p02b'],
    ['p06f', 'p07b'],
    ['p08f', 'c0101a'],
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

  it('新开档第一幕是序章第一幕，初次选择的三条路都通向下一节拍', () => {
    const opening = getScene('p01a')!
    expect(opening.options).toBeUndefined()
    expect(opening.next).toBe('p01b')
    const choice = getScene('p01c')!
    expect(choice.options?.map(({ key, next }) => [key, next])).toEqual([['A', 'pw01a'], ['B', 'pw01a_B'], ['C', 'pw01a_C']])
  })

  it('第一次选择前先交代空椅、新娘与她做过线人', () => {
    const opening = resolveSceneBody(getScene('p01a')!, {})
    expect(opening).toMatch(/折叠椅|空椅/)
    expect(opening).toMatch(/叶小满/)
    expect(opening).toMatch(/线人/)
    expect(opening).toMatch(/二十六岁/)
    expect(opening).toMatch(/刑侦一队.*代理队长/)
    expect(opening).toMatch(/六岁.*嘉兴/)
    expect(resolveSceneBody(getScene('p01c')!, {})).toMatch(/伴郎马宏图.*老同学/)
    const note = CHARACTERS.find(({ id }) => id === 'jiangjia')?.note
    expect(note).toMatch(/杭州本地人/)
  })

  it.each(['墓前', '台阶上', '车没有发动'])('扫墓有独立揭晓正文：%s', (location) => {
    if (!ch04Complete) return
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
    if (!ch04Complete) return
    const scene = getScene('c0407')!
    const legacy: HistoryEntry = { sceneId: 'c0406', chapter: 'ch04', choice: 'A', label: '在远处等。', at: 100 }
    expect(resolveSceneBody(scene, {}, legacy)).toBe(scene.body)
    expect(resolveSceneProgress(scene, legacy)).toEqual([])
    expect(resolveSceneBody(getScene('c0707')!, {})).not.toContain('白鸮在押')
  })

  it('每个选择都有互不相同的进展回执，并只在实际到达的幕显示', () => {
    for (const scene of SCENES.values()) {
      if (!scene.options) continue
      if (!['prologue', 'ch01', 'ch02'].includes(scene.chapter)) continue
      const receipts = scene.options.map((option) => option.progress?.trim())
      expect(receipts.every(Boolean), scene.id).toBe(true)
      expect(new Set(receipts).size, scene.id).toBe(3)
      for (const option of scene.options) {
        const state = choose(createInitialState(scene.id), scene, option)
        const arrival = state.history[0]
        expect(resolveSceneProgress(getScene(option.next)!, arrival)).toContain(option.progress)
        expect(resolveSceneProgress(scene, arrival)).toEqual([])
      }
    }
  })

  it('即时后果、当前幕的回收、变体正文按阅读顺序组合', () => {
    for (const scene of SCENES.values()) {
      for (const option of scene.options ?? []) {
        const target = getScene(option.next)
        if (!target?.recalls?.length) continue
        const state = choose(createInitialState(scene.id), scene, option)
        const recall = target.recalls.find(({ flag }) => state.flags[flag])
        if (!recall) continue
        expect(resolveSceneBody(target, state.flags, state.history[0])).toBe([option.consequence, recall.text, target.body].join('\n\n'))
        return
      }
    }
    throw new Error('没有找到带回收的选择')
  })
})
