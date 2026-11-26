import { describe, expect, it } from 'vitest'
import { resolveSceneBody } from '../src/game/narrative'
import type { Scene } from '../src/game/types'

const scene: Scene = {
  id: 'ch01-a',
  chapter: 'ch01',
  title: '第一幕',
  body: '默认正文',
  variants: [{ flag: 'met', body: '重逢正文' }],
}

describe('resolveSceneBody', () => {
  it('没有到达记录时只返回正文', () => {
    expect(resolveSceneBody(scene, {})).toBe('默认正文')
  })

  it('标记命中时使用变体正文', () => {
    expect(resolveSceneBody(scene, { met: true })).toBe('重逢正文')
  })

  it('到达记录里的后果置于正文之前', () => {
    const arrival = {
      sceneId: 'ch01-a',
      chapter: 'ch01',
      choice: 'A' as const,
      label: '选项',
      at: 0,
      next: 'ch01-a',
      consequence: '门开了。',
    }
    expect(resolveSceneBody(scene, {}, arrival)).toBe('门开了。\n\n默认正文')
  })
})
