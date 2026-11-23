import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatMeters from '../src/components/game/HUD/StatMeters'

const meta = { clue: 5, relation: 10, danger: 0, memory: 4 }

describe('调查状态条', () => {
  it('三项状态按顺序给出一致的百分比读数与状态标签', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta }))
    const meters = Array.from(html.matchAll(/<meter[^>]+aria-label="([^"]+)"[^>]+aria-valuetext="([^"]+)"/g), ([, label, value]) => [label, value])
    expect(meters).toEqual([['线索', '17% · 不足'], ['关系', '33% · 磨合'], ['危险', '0% · 稳定']])
    expect(Array.from(html.matchAll(/style="width:(\d+%);/g), ([, width]) => width)).toEqual(['17%', '33%', '0%'])
    expect(html).not.toContain('5/30')
  })

  it('记忆是隐藏进度，不进入状态栏', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta }))
    expect(html).not.toContain('aria-label="记忆"')
    expect(html).not.toContain('40%')
  })
})
