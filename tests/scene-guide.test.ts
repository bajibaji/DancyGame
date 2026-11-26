import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import SceneGuide from '../src/components/game/Scene/SceneGuide'
import { getScene } from '../src/content'

describe('婚宴中的游玩说明', () => {
  it('普通场景没有额外空面板，教学场景展示完整说明与可访问名称', () => {
    expect(renderToStaticMarkup(createElement(SceneGuide, {}))).toBe('')
    for (const id of ['p01c', 'pw02c', 'pw03c', 'pw04c', 'pw05c']) {
      const guide = getScene(id)!.guide!
      const html = renderToStaticMarkup(createElement(SceneGuide, { guide }))
      expect(html).toContain('aria-label="' + guide.title + '"')
      expect(html).toContain(guide.body)
    }
  })
})
