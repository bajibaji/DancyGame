import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { CHAPTERS, CLUES, MEMORIES, getScene } from '../src/content/index'
import { RELEASED_CHAPTERS, RELEASED_CLUES, RELEASED_MEMORIES, isReleasedChapter, isReleasedScene, isReleasedRecipe } from '../src/content/release'
import { PUZZLES } from '../src/game/puzzles'
import ComingSoon from '../src/components/game/ComingSoon'

describe('第五章开放范围', () => {
  it('只开放序章与第一至第五章，后续原稿仍在', () => {
    expect(RELEASED_CHAPTERS.map(({ chapter }) => chapter)).toEqual(['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05'])
    expect(CHAPTERS).toHaveLength(14)
    expect(isReleasedScene('festivalbridgec')).toBe(true)
    expect(isReleasedScene('c0304a')).toBe(false)
    expect(isReleasedScene('c0716a')).toBe(false)
    expect(getScene('c0304a')).toBeDefined()
  })

  it('每条开放路径走到同一截止点，不进入后段效果', () => {
    const seen = new Set<string>()
    const walk = (id: string, gap: number) => {
      if (!isReleasedScene(id)) {
        expect(id).toBe('c0304a')
        return
      }
      if (seen.has(id)) return
      seen.add(id)
      const scene = getScene(id)!
      const nextGap = gap + 1
      if (scene.options?.length) {
        expect(nextGap, id).toBeLessThanOrEqual(3)
        for (const option of scene.options) walk(option.next, 0)
      } else {
        expect(scene.next, id).toBeDefined()
        walk(scene.next!, nextGap)
      }
    }
    walk('p01a', 0)
    expect(seen.size).toBe(RELEASED_CHAPTERS.reduce((n, chapter) => n + chapter.scenes.length, 0))
  })

  it('后段的档案和推理题不列入开放范围', () => {
    const visiblePuzzles = PUZZLES.filter((puzzle) => isReleasedChapter(puzzle.chapter) && isReleasedRecipe(puzzle.kind === 'pair' ? puzzle.answer : puzzle.materials))
    expect(visiblePuzzles.some(({ id }) => id === 'pz19')).toBe(true)
    expect(visiblePuzzles.some(({ id }) => id === 'pz20')).toBe(true)
    expect(visiblePuzzles.some(({ id }) => id === 'pz07')).toBe(false)
    expect(RELEASED_CLUES.some(({ id }) => id === 'C39')).toBe(true)
    expect(RELEASED_CLUES.some(({ id }) => id === 'C25')).toBe(false)
    expect(RELEASED_MEMORIES.length).toBeLessThan(MEMORIES.length)
    expect(RELEASED_CLUES.length).toBeLessThan(CLUES.length)
  })

  it('截止页明确保留进度且没有继续第六章入口', () => {
    const html = renderToStaticMarkup(createElement(MemoryRouter, null, createElement(ComingSoon)))
    expect(html).toContain('敬请期待')
    expect(html).toContain('进度已保留')
    expect(html).toContain('查看档案')
    expect(html).not.toContain('继续第六章')
  })
})
