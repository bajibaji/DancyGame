import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatMeters from '../src/components/game/HUD/StatMeters'

const meta = { clue: 5, relation: 10, danger: 0, memory: 4 }

describe('调查状态条', () => {
  it('三项状态按顺序给出一致的百分比读数和填充', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta, showMemory: false }))
    const meters = Array.from(html.matchAll(/<meter[^>]+aria-label="([^"]+)"[^>]+aria-valuetext="([^"]+)"/g), ([, label, value]) => [label, value])
    expect(meters).toEqual([['线索', '17%'], ['关系', '100%'], ['危险', '0%']])
    expect(Array.from(html.matchAll(/style="width:(\d+%);/g), ([, width]) => width)).toEqual(['17%', '100%', '0%'])
    expect(html).not.toContain('5/30')
  })

  it('记忆只在开放后加入状态条', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta, showMemory: true }))
    expect(html).toContain('aria-label="记忆" aria-valuetext="40%"')
  })
})
