import { describe, expect, it } from 'vitest'
import { applyPatch, narrationOf, parseScene, recordTurn } from '../src/ai/parse'
import { INITIAL_WORLD } from '../src/ai/world'

const sample = `【正文】
院墙外的草垛动了一下。你睁开眼。

【选项】
A. 开门放他进来
B. 等他翻墙
C. 先去叫杨惠

【状态】
{"progress":60,"stats":{"危险":1},"flags":["盯梢"],"summary":"孙麻子奉命盯梢伊家。"}`

describe('narrationOf', () => {
  it('只取正文段', () => {
    expect(narrationOf(sample)).toBe('院墙外的草垛动了一下。你睁开眼。')
  })

  it('流式未完成时也能取到已有正文', () => {
    expect(narrationOf('【正文】\n第一句')).toBe('第一句')
  })
})

describe('parseScene', () => {
  it('解析三个选项与状态', () => {
    const scene = parseScene(sample)
    expect(scene.options.map((option) => option.key)).toEqual(['A', 'B', 'C'])
    expect(scene.options[2].label).toBe('先去叫杨惠')
    expect(scene.patch.progress).toBe(60)
    expect(scene.patch.flags).toEqual(['盯梢'])
  })

  it('选项不足三个时报错', () => {
    expect(() => parseScene('【正文】\n只有正文')).toThrow('三个选项')
  })

  it('状态段缺失时给空补丁', () => {
    const scene = parseScene('【正文】\n正文\n【选项】\nA. 一\nB. 二\nC. 三')
    expect(scene.patch).toEqual({})
  })
})

describe('applyPatch', () => {
  it('年龄一次最多加一岁', () => {
    expect(applyPatch(INITIAL_WORLD, { age: 70 }).age).toBe(61)
  })

  it('境界一次最多升一级', () => {
    const next = applyPatch(INITIAL_WORLD, { realmLevel: 5 })
    expect(next.realmLevel).toBe(1)
    expect(next.realmName).toBe('气血一重')
  })

  it('关系值夹在正负一百之间', () => {
    const next = applyPatch(INITIAL_WORLD, { relations: { 姜月欣: 500, 伊巡: -500 } })
    expect(next.relations.姜月欣).toBe(100)
    expect(next.relations.伊巡).toBe(-100)
  })

  it('标记与物品去重', () => {
    const next = applyPatch(INITIAL_WORLD, { flags: ['a', 'a'], inventory: ['柴刀', '紫木'] })
    expect(next.flags).toEqual(['a'])
    expect(next.inventory).toEqual(['柴刀', '破扇子', '紫木'])
  })

  it('不改动原状态', () => {
    applyPatch(INITIAL_WORLD, { progress: 100, stats: { 危险: 9 } })
    expect(INITIAL_WORLD.progress).toBe(0)
    expect(INITIAL_WORLD.stats.危险).toBe(0)
  })
})

describe('recordTurn', () => {
  it('记录选择并只保留最近八条', () => {
    let state = INITIAL_WORLD
    for (let i = 0; i < 10; i++) state = recordTurn(state, `第 ${i} 幕`)
    expect(state.recent).toHaveLength(8)
    expect(state.turn).toBe(10)
  })
})

describe('天命面板', () => {
  it('解析系统提示并从正文里剥离', () => {
    const text = '【正文】\n正文。\n【系统】\n叮。检测到敌意。\n【选项】\nA. 一\nB. 二\nC. 三\n【状态】\n{}'
    const scene = parseScene(text)
    expect(scene.narration).toBe('正文。')
    expect(scene.system).toBe('叮。检测到敌意。')
  })

  it('没有系统段时为空', () => {
    expect(parseScene(sample).system).toBe('')
  })

  it('任务可以标记完成', () => {
    const next = applyPatch(INITIAL_WORLD, { tasks: [{ id: 'guard', title: '护住姜月欣', done: true }] })
    expect(next.tasks.find((task) => task.id === 'guard')?.done).toBe(true)
    expect(next.tasks).toHaveLength(3)
  })

  it('新任务会加进列表', () => {
    const next = applyPatch(INITIAL_WORLD, { tasks: [{ id: 'blade', title: '拿到趁手的刀', done: false }] })
    expect(next.tasks.some((task) => task.id === 'blade')).toBe(true)
  })

  it('境界突破后进度归零', () => {
    const next = applyPatch({ ...INITIAL_WORLD, progress: 900 }, { realmLevel: 1 })
    expect(next.progress).toBe(0)
    expect(next.realmName).toBe('气血一重')
  })

  it('进度上限可以更新', () => {
    const next = applyPatch(INITIAL_WORLD, { progressGoal: 3000 })
    expect(next.progressGoal).toBe(3000)
  })
})
