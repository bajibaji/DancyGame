import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatMeters from '../src/components/game/HUD/StatMeters'
import { RATIO, ratio, statCaps } from '../src/game/balance'
import { INITIAL_META } from '../src/game/engine'

const meta = { world: 0, clue: 6, relation: 10, danger: 3, memory: 4 }
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
  it('三项状态按当前章节上限给出一致的百分比读数与状态标签', () => {
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
    /* 只允许三条 meter；不再用 "40%" 字符串判断，CountUp 生成的 SVG width="140%" 会误命中 */
    expect(html.match(/<meter/g) ?? []).toHaveLength(3)
  })

  it('数值变化前只显示名称和问号，状态词与进度条一起隐藏', () => {
    const initial = renderToStaticMarkup(createElement(StatMeters, { meta: INITIAL_META }))
    expect(initial.match(/？？/g)).toHaveLength(3)
    for (const label of ['不足', '磨合', '稳定']) expect(initial).not.toContain(label)
    expect(initial).not.toContain('style="width:')
    expect(initial).not.toContain('aria-label="线索"')
    const changed = renderToStaticMarkup(createElement(StatMeters, { meta: { ...INITIAL_META, clue: 6 } }))
    expect(changed.match(/？？/g)).toHaveLength(2)
    expect(changed).toContain(pct(6, caps.clue))
    expect(changed).toContain(clueLabel(6))
  })
})
