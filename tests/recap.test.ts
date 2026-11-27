import { describe, expect, it } from 'vitest'
import { CHAPTERS, getScene, START_SCENE } from '../src/content'
import { buildStoryRecap, RECAP_AFTER_MS, shouldShowRecap } from '../src/game/recap'
import { createInitialState } from '../src/game/engine'

function at(id: string) {
  const scenes = CHAPTERS.flatMap(({ scenes }) => scenes)
  const index = scenes.findIndex((scene) => scene.id === id)
  return { ...createInitialState(id), visited: scenes.slice(0, index + 1).map(({ id }) => id), started: true, ending: null }
}

describe('离线后的前情提要', () => {
  it('满四小时才触发，旧档无时间、新开局、已结案和未开放内容不触发', () => {
    const state = at('p06a')
    const before = 1_800_000_000_000
    expect(shouldShowRecap(state, before, before + RECAP_AFTER_MS - 1)).toBe(false)
    expect(shouldShowRecap(state, before, before + RECAP_AFTER_MS)).toBe(true)
    expect(shouldShowRecap(state, before, before + RECAP_AFTER_MS + 1)).toBe(true)
    for (const stamp of [null, 0, NaN, Infinity, before + RECAP_AFTER_MS + 1]) expect(shouldShowRecap(state, stamp, before + RECAP_AFTER_MS)).toBe(false)
    expect(shouldShowRecap({ ...state, started: false }, before, before + RECAP_AFTER_MS)).toBe(false)
    expect(shouldShowRecap({ ...state, ending: 'bad' }, before, before + RECAP_AFTER_MS)).toBe(false)
    expect(shouldShowRecap(at(START_SCENE), before, before + RECAP_AFTER_MS)).toBe(false)
    expect(shouldShowRecap(at('c0304a'), before, before + RECAP_AFTER_MS)).toBe(false)
  })

  it('婚宴里回来不会透露遗骸、后续姓名或尚未读到的当前幕', () => {
    const state = at('p03c')
    const recap = buildStoryRecap(state)
    const text = recap.facts.join('')
    expect(text).toContain('马宏图')
    expect(text).not.toContain('离席')
    for (const spoiler of ['躯干', '遗骸', '袁衷', '孟小禾']) expect(text).not.toContain(spoiler)
    expect(recap.scene).toBe(getScene(state.sceneId)!.title)
    const arrived = buildStoryRecap(at('p06a')).facts.join('')
    expect(arrived).toContain('十五')
    expect(arrived).not.toContain('发现人的躯干')
    expect(buildStoryRecap(at('p06b')).facts.join('')).toContain('躯干')
  })

  it('按实际完成场景回顾，不凭存档位置或被塞入的未来记录补剧情', () => {
    const minimal = { ...createInitialState('handoff01c'), visited: ['handoff01c'] }
    expect(buildStoryRecap(minimal).facts).toEqual([])
    const state = at('pw03c')
    state.visited.push('c0101a', 'handoff01b')
    const text = buildStoryRecap(state).facts.join('')
    expect(text).not.toContain('身份检验')
    expect(text).not.toContain('袁衷')
  })

  it('最近行动采用当时记录的实际后果，不能按新版同字母重算', () => {
    const state = at('pw06a')
    const chosen = getScene('pw05c')!.options![1]
    state.history = [{ sceneId: 'pw05c', chapter: 'prologue', choice: 'A', label: '旧版实际标签', at: 10, next: 'pw06a', progress: chosen.progress }]
    expect(buildStoryRecap(state).choices).toEqual([chosen.progress])
    state.history[0] = { ...state.history[0], progress: undefined, consequence: '旧版本已经结算的实际后果。' }
    expect(buildStoryRecap(state).choices).toEqual(['旧版本已经结算的实际后果。'])
    state.history[0] = { ...state.history[0], consequence: undefined }
    expect(buildStoryRecap(state).choices).toEqual(['你选择了：旧版实际标签'])
  })

  it('第一章身份回执与学校旧事只在读过以后进入提要，后续只回顾实际持有材料', () => {
    expect(buildStoryRecap(at('c0101a')).facts.join('')).not.toContain('01 是马宏图')
    expect(buildStoryRecap(at('c0101b')).facts.join('')).toContain('01 是马宏图')
    expect(buildStoryRecap(at('handoff01a')).facts.join('')).not.toContain('空椅是留给')
    expect(buildStoryRecap(at('handoff01b')).facts.join('')).toContain('空椅是留给')
    expect(buildStoryRecap(at('clock01a')).facts.join('')).toContain('01 是马宏图')
    const later = at('c0109a')
    later.clues = ['C04', 'C22']
    const text = buildStoryRecap(later).facts.join('')
    expect(text).toContain('八万元流水')
    expect(text).not.toContain('笔记本')
  })
})
