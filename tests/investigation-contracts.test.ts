import { existsSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CHAPTERS, SCENES, START_SCENE, getScene } from '../src/content/index'
import { applyEffects, choose, createInitialState } from '../src/game/engine'
import { choiceOffers } from '../src/game/choices'
import { resolveSceneBody, resolveSceneFollowUps } from '../src/game/narrative'
import { PUZZLES, judgePuzzle, puzzleStatus } from '../src/game/puzzles'
import { solvePuzzle } from '../src/game/puzzle'
import type { GameState } from '../src/game/types'

function route(seed: number) {
  let state = createInitialState(START_SCENE, seed)
  const states = new Map<string, GameState>()
  while (!states.has(state.sceneId)) {
    const scene = getScene(state.sceneId)!
    expect(scene, state.sceneId).toBeDefined()
    state = applyEffects(state, scene.effects)
    states.set(scene.id, state)
    if (scene.ending) return states
    if (scene.options?.length) {
      const offers = choiceOffers(scene, seed, state.flags)
      const offer = offers[(seed + state.history.length) % offers.length]
      state = choose(state, scene, offer.option, offer.key)
    } else state = { ...state, sceneId: scene.next! }
  }
  throw new Error('调查路线出现循环')
}

describe('调查材料与章界', () => {
  it('按调查单元进入十四章，所有出口只进紧邻下一章', () => {
    const starts = ['p01a', 'c0101a', 'c0109a', 'well01a', 'c0202a', 'c0301a', 'c0304a', 'c0310a', 'c0411a', 'c0504a', 'c0601a', 'c0608a', 'c0701a', 'c0709a']
    expect(CHAPTERS.map((chapter) => chapter.scenes[0].id)).toEqual(starts)
    const index = new Map(CHAPTERS.map((chapter, i) => [chapter.chapter, i]))
    for (const chapter of CHAPTERS) for (const scene of chapter.scenes) {
      expect(scene.chapter, scene.id).toBe(chapter.chapter)
      const targets = scene.options?.map((option) => option.next) ?? (scene.next ? [scene.next] : [])
      for (const target of targets) {
        const next = getScene(target)!
        const step = index.get(next.chapter)! - index.get(scene.chapter)!
        expect([0, 1], scene.id + ' -> ' + target).toContain(step)
        if (step === 1) expect(CHAPTERS[index.get(next.chapter)!].scenes[0].id).toBe(target)
      }
    }
  })

  it('每条抽样路线在对应查证后取得卡片，不能在井下发现前读到遗骸卡', () => {
    const sources = { C04: 'money02b', C08: 'c0108c', C06: 'ring01b', C02: 'yuan04b', C07: 'well03a', C29: 'well03a', C22: 'c0614b', C30: 'lab02b', C31: 'clock01b', C32: 'yuan04a', C33: 'key02a', C34: 'shaftreview01a', C05: 'hill03a', C35: 'hill03a', C36: 'hospital01b', C37: 'video02b', C38: 'list01b', C39: 'identity01a' }
    for (let seed = 0; seed < 32; seed++) {
      const states = route(seed)
      for (const [card, source] of Object.entries(sources)) {
        let obtained = false
        for (const [id, state] of states) {
          if (id === source) obtained = true
          expect(state.clues.includes(card), card + ' at ' + id).toBe(obtained)
        }
      }
      expect(states.get('well01a')!.clues).not.toContain('C07')
      expect(states.get('well03a')!.clues).toEqual(expect.arrayContaining(['C07', 'C29']))
    }
  })

  it('竖井判断须先取得分号与试锁材料，完成或跳过都能跨章', () => {
    const puzzle = PUZZLES.find(({ id }) => id === 'pz12')!
    const states = route(7)
    const before = states.get('well02c')!
    expect(puzzleStatus(puzzle, 'ch03', before.clues, [])).toBe('locked-clues')
    const ready = states.get('well03a')!
    expect(puzzleStatus(puzzle, 'ch03', ready.clues, [])).toBe('ready')
    expect(judgePuzzle(puzzle, ['A'])).toBe(false)
    expect(judgePuzzle(puzzle, ['C'])).toBe(true)
    const solved = solvePuzzle(ready, 'C07', 'C29').state
    expect(resolveSceneFollowUps(getScene('well03b')!, solved.solved)).toHaveLength(1)
    expect(resolveSceneFollowUps(getScene('well03b')!, [])).toHaveLength(0)
    expect(states.has('family03a')).toBe(true)
    expect(states.has('shaftbridgec')).toBe(true)
    for (const option of getScene('shaftbridgec')!.options!) expect(option.next).toBe('c0202a')
  })

  it('拍照与等待路线均由支护后正式提取补齐，不把照片写成已经拿到实物', () => {
    const scene = getScene('c0113c')!
    for (const option of scene.options!) {
      const state = choose(createInitialState(scene.id), scene, option)
      let current = getScene(state.sceneId)!
      const seen = new Set<string>()
      while (current.id !== 'c0114a' && !seen.has(current.id)) {
        seen.add(current.id)
        current = getScene(current.options?.[0].next ?? current.next!)!
      }
      expect(current.id).toBe('c0114a')
      const body = resolveSceneBody(current, state.flags)
      expect(body).toContain('支护组确认砖体稳定后')
      expect(body).toContain('连续录像下提取')
      expect(body).not.toContain('封条被撕在次日凌晨')
    }
  })

  it('学校与竖井选择都能在后续看到对应回响', () => {
    for (const [from, to] of [['c0108c', 'c0109a'], ['well01c', 'well02a'], ['well02c', 'well03a'], ['well03c', 'c0202a']]) {
      const scene = getScene(from)!
      for (const option of scene.options!) {
        const state = choose(createInitialState(from), scene, option)
        const target = getScene(to)!
        const recalls = target.recalls!.filter(({ flag }) => state.flags[flag])
        expect(recalls.length, from + '/' + option.key).toBeGreaterThanOrEqual(1)
        expect(resolveSceneBody(target, state.flags)).toContain(recalls[0].text)
      }
    }
  })

  it('移除机械补字脚本及固定补句，前两章不混用人物与时间窗', () => {
    expect(existsSync('scripts/pad-prose.mjs')).toBe(false)
    const banned = ['纸上的时间被反复核对，数字没有再变。', '陆晚把来源标签压平，没有让任何一页盖住另一页。', '灯管嗡了一声，屋里没人抬头。', '风从门缝里进来，桌角的纸轻轻掀起。', '顾淮把取样袋的编号念了一遍，谁也没有接话。', '傅铮把笔放回口袋，等着先有结果的那一条线。', '墙上的钟走得很慢，走廊尽头有人经过。', '照片边缘的折痕还在，没人去抚平。', '记录本翻到新的一页，页脚只写了日期。', '手电的光落在地上，照出一小片灰。', '窗外的天色又暗了一点，桌上的纸没有动。', '两个人隔着桌子看同一页，谁也没有先开口。']
    for (const scene of SCENES.values()) for (const phrase of banned) expect(scene.body, scene.id).not.toContain(phrase)
    for (const chapter of CHAPTERS.slice(1, 3)) {
      const text = JSON.stringify(chapter)
      expect(text).not.toContain('谢惊屿')
      expect(text).not.toContain('四分钟')
      expect(text).not.toContain('三名死者')
      expect(text).not.toContain('井底三个人')
    }
  })
})
