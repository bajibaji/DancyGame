import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatMeters from '../src/components/game/HUD/StatMeters'
import { RATIO, ratio, statCaps } from '../src/game/balance'

const meta = { world: 0, clue: 5, relation: 10, danger: 0, memory: 4 }
const caps = statCaps()
const pct = (value: number, cap: number) => Math.round((value / cap) * 100) + '%'

function clueLabel(value: number) {
  const r = ratio(value, caps.clue)
  if (r >= RATIO.good.clue) return '够用'
  if (r >= RATIO.good.clue * 0.78) return '吃紧'
  return '不足'
}

function relationLabel(value: number) {
  const r = ratio(value, caps.relation)
  if (r >= RATIO.good.relation) return '信任'
  if (r > RATIO.bad.relation) return '磨合'
  return '疏离'
}

function dangerLabel(value: number) {
  const r = ratio(value, caps.danger)
  if (r >= RATIO.bad.danger) return '暴露'
  if (r >= RATIO.bad.danger * 0.5) return '警戒'
  return '稳定'
}

describe('调查状态条', () => {
  it('三项状态按上限比例给出一致的百分比读数与状态标签', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta }))
    const meters = Array.from(html.matchAll(/<meter[^>]+aria-label="([^"]+)"[^>]+aria-valuetext="([^"]+)"/g), ([, label, value]) => [label, value])
    expect(meters).toEqual([
      ['线索', pct(meta.clue, caps.clue) + ' · ' + clueLabel(meta.clue)],
      ['关系', pct(meta.relation, caps.relation) + ' · ' + relationLabel(meta.relation)],
      ['危险', pct(meta.danger, caps.danger) + ' · ' + dangerLabel(meta.danger)],
    ])
    expect(Array.from(html.matchAll(/style="width:(\d+%);/g), ([, width]) => width)).toEqual([
      pct(meta.clue, caps.clue),
      pct(meta.relation, caps.relation),
      pct(meta.danger, caps.danger),
    ])
    expect(html).not.toContain('5/30')
  })

  it('记忆是隐藏进度，不进入状态栏', () => {
    const html = renderToStaticMarkup(createElement(StatMeters, { meta }))
    expect(html).not.toContain('aria-label="记忆"')
    expect(html).not.toContain('40%')
  })
})
