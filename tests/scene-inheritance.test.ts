import { describe, expect, it } from 'vitest'
import { resolveChapters } from '../src/content/sceneInheritance.js'
import { CHAPTERS, getScene, getSceneBaseId } from '../src/content'
import { choiceOffers } from '../src/game/choices'
import { choose, createInitialState } from '../src/game/engine'
import { resolveSceneBody } from '../src/game/narrative'
import { buildStoryRecap } from '../src/game/recap'
import { OPPORTUNITIES } from '../src/content/opportunities'

const base = { id: 'base', title: '原幕', locationId: 'room', timeOfDay: '夜', body: '原文', next: 'finish', effects: { clue: 1, clues: ['C01'] }, recalls: [{ flag: 'first', text: '旧回响' }] }
const chapter = (scenes: Parameters<typeof resolveChapters>[0][number]['scenes']) => [{ chapter: 'chapter', title: '一章', scenes }]

describe('继承幕与实际分支', () => {
  it('继承可跨多层，正文与去向可独立覆盖，数组和结算整项替换', () => {
    const input = chapter([base, { id: 'middle', inherits: 'base', body: '另一段经历', next: 'branch', recalls: [] }, { id: 'child', inherits: 'middle', title: '改写幕', effects: { relation: 2 } }])
    const scenes = resolveChapters(input)[0].scenes
    expect(scenes[1]).toMatchObject({ body: '另一段经历', locationId: 'room', next: 'branch', recalls: [], effects: base.effects })
    expect(scenes[2]).toMatchObject({ title: '改写幕', body: '另一段经历', next: 'branch', recalls: [], effects: { relation: 2 } })
    expect(scenes[2].effects?.clues).toBeUndefined()
    scenes[1].effects!.clues!.push('C02')
    expect(scenes[0].effects!.clues).toEqual(['C01'])
    expect(input[0].scenes[0].effects!.clues).toEqual(['C01'])
  })

  it('修改跳转方式会移除继承的另一种出口', () => {
    const option = { key: 'A' as const, label: '行动', tendency: 'evidence' as const, risk: 'low' as const, effects: {}, consequence: '后果', next: 'finish' }
    const [resolved] = resolveChapters(chapter([base, { id: 'choice', inherits: 'base', options: [option] }, { id: 'plain', inherits: 'choice', next: 'branch' }]))
    expect(resolved.scenes[1].next).toBeUndefined()
    expect(resolved.scenes[1].options).toHaveLength(1)
    expect(resolved.scenes[2].options).toBeUndefined()
    expect(resolved.scenes[2].next).toBe('branch')
  })

  it('缺少来源、继承循环与重复编号直接拒绝加载', () => {
    expect(() => resolveChapters(chapter([{ id: 'a', inherits: 'missing' }]))).toThrow('继承目标不存在')
    expect(() => resolveChapters(chapter([{ id: 'a', inherits: 'b' }, { id: 'b', inherits: 'a' }]))).toThrow('场景继承循环')
    expect(() => resolveChapters(chapter([base, base]))).toThrow('重复场景')
    expect(() => resolveChapters(chapter([{ id: 'a', title: '不完整' }]))).toThrow('场景字段不完整')
  })

  it('54 组选择均有三个独立经历，继承分支保留母幕证据与同一汇合点', () => {
    const choices = CHAPTERS.slice(0, 2).flatMap(({ scenes }) => scenes.filter(({ options }) => options))
    expect(choices).toHaveLength(54)
    for (const scene of choices) {
      const experiences = scene.options!.map((option) => {
        const state = choose(createInitialState(scene.id), scene, option)
        const next = getScene(option.next)!
        expect(next.effects, scene.id).toEqual(getScene(getSceneBaseId(next.id))!.effects)
        expect(next.next, scene.id).toBe(getScene(scene.options![0].next)!.next)
        return resolveSceneBody(next, state.flags)
      })
      expect(new Set(experiences).size, scene.id).toBe(3)
      for (const body of experiences) expect(body.length, scene.id).toBeGreaterThanOrEqual(200)
    }
  })

  it('随机行动用自己的变体，连续旧旗帜不会覆盖本次分支', () => {
    const written = new Set<string>()
    for (const chapter of CHAPTERS.slice(0, 2)) for (const scene of chapter.scenes) {
      if (!scene.options) continue
      const before = Object.fromEntries([...written].map((flag) => [flag, true]))
      const variants = new Set<string>()
      for (let seed = 0; seed < 96; seed++) for (const { option, opportunity } of choiceOffers(scene, seed, before)) {
        const state = choose({ ...createInitialState(scene.id, seed), flags: before }, scene, option)
        const target = getScene(option.next)!
        const active = target.variants?.filter(({ flag }) => state.flags[flag]) ?? []
        if (opportunity) {
          expect(active, scene.id).toHaveLength(1)
          expect(resolveSceneBody(target, state.flags), scene.id).toBe(active[0].body)
          variants.add(opportunity)
        } else if (scene.chapter === target.chapter) {
          expect(active, scene.id).toHaveLength(0)
          expect(resolveSceneBody(target, state.flags), scene.id).toBe(target.body)
        }
      }
      expect(variants.size, scene.id).toBe((OPPORTUNITIES[scene.id] ?? []).length)
      for (const option of scene.options) for (const flag of option.effects.flags ?? []) written.add(flag)
      for (const { action } of OPPORTUNITIES[scene.id] ?? []) for (const flag of action.effects.flags ?? []) written.add(flag)
    }
  })

  it('旧档落在母幕仍保留原行动，局值不覆盖玩家已经做过的选择', () => {
    const scene = getScene('p13a')!
    const flags = { F_BEAT_p12c_B: true }
    const expected = scene.variants!.find(({ flag }) => flags[flag as keyof typeof flags])!.body
    for (const line of ['order', 'loss', 'neutral'] as const) expect(resolveSceneBody(scene, flags, undefined, line)).toBe(expected)
  })

  it('树上提取后才响两声，电话访问后再当面接续，不将未发生的动作写成完成', () => {
    for (const id of ['p07a', 'p07a_B', 'p07a_C']) expect(getScene(id)!.body).not.toContain('不存在的门')
    expect(getScene('p07b')!.body).toContain('不存在的门')
    expect(getScene('lab02c')!.options![1].consequence).toContain('联系挡酒工人')
    expect(getScene('feast01a_B')!.body).toContain('在电话里')
    expect(getScene('feast01a_B')!.body).not.toContain('他摇头')
    expect(getScene('pw07b')!.body).toContain('你与叶小满打过招呼，陪他')
    expect(getScene('pw07c')!.options![1].label).toContain('再回电话')
  })

  it('分支幕的已读事实参与提要，停在该幕时不提前揭晓', () => {
    const current = { ...createInitialState('p06a_B'), visited: ['p05c', 'p06a_B'] }
    expect(buildStoryRecap(current).facts.join('')).not.toContain('躯干')
    const after = { ...current, sceneId: 'p06b', visited: [...current.visited, 'p06b'] }
    expect(buildStoryRecap(after)).toEqual(buildStoryRecap({ ...after, visited: ['p05c', 'p06a', 'p06b'] }))
    expect(buildStoryRecap(after).facts.length).toBeGreaterThan(0)
  })
})
