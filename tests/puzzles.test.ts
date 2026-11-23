import { describe, expect, it } from 'vitest'
import { CLUE_MAP } from '../src/content/index'
import { RECIPES } from '../src/game/puzzle'
import { PUZZLES, assistFor, judgePuzzle, puzzleStatus } from '../src/game/puzzles'

const recipeById = new Map(RECIPES.map((recipe) => [recipe.id, recipe]))
const pairAnswers = new Map(
  PUZZLES.filter((puzzle) => puzzle.kind === 'pair').map((puzzle) => [puzzle.id, puzzle.answer]),
)

describe('推理题库', () => {
  it('每个配方恰好一道题，题目与线索引用合法', () => {
    expect(new Set(PUZZLES.map((puzzle) => puzzle.id)).size).toBe(PUZZLES.length)
    const recipes = PUZZLES.map((puzzle) => puzzle.recipe)
    expect(new Set(recipes).size).toBe(RECIPES.length)
    expect(new Set(recipes)).toEqual(new Set(RECIPES.map((recipe) => recipe.id)))

    for (const puzzle of PUZZLES) {
      const recipe = recipeById.get(puzzle.recipe)
      expect(recipe, puzzle.id).toBeDefined()
      expect(['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07']).toContain(puzzle.chapter)
      expect(puzzle.prompt.length).toBeGreaterThan(8)
      expect(puzzle.reward.text.length).toBeGreaterThan(30)
      if (puzzle.kind === 'pair') {
        expect(puzzle.choices.length).toBeGreaterThanOrEqual(4)
        expect(new Set(puzzle.choices).size).toBe(puzzle.choices.length)
        expect(new Set(puzzle.answer).size).toBe(2)
        expect([...puzzle.answer].sort()).toEqual([...recipe!.cards].sort())
        for (const id of puzzle.choices) expect(CLUE_MAP.has(id), `${puzzle.id} ${id}`).toBe(true)
        for (const id of puzzle.answer) expect(puzzle.choices).toContain(id)
      } else {
        expect([...puzzle.materials].sort()).toEqual([...recipe!.cards].sort())
        expect(puzzle.items).toHaveLength(4)
        expect(new Set(puzzle.items.map((item) => item.key)).size).toBe(4)
        expect(puzzle.items.some((item) => item.key === puzzle.answer)).toBe(true)
        for (const id of puzzle.materials) expect(CLUE_MAP.has(id), `${puzzle.id} ${id}`).toBe(true)
      }
    }
  })

  it('配对题的其他候选不会构成另一组正确答案', () => {
    for (const puzzle of PUZZLES) {
      if (puzzle.kind !== 'pair') continue
      for (let i = 0; i < puzzle.choices.length; i++) {
        for (let j = i + 1; j < puzzle.choices.length; j++) {
          const pair = [puzzle.choices[i], puzzle.choices[j]].sort().join('|')
          const expected = [...puzzle.answer].sort().join('|')
          if (pair === expected) continue
          for (const [id, answer] of pairAnswers) {
            if (id === puzzle.id) continue
            expect([...answer].sort().join('|'), `${puzzle.id} 的候选与 ${id} 多解`).not.toBe(pair)
          }
        }
      }
    }
  })
})

describe('判定与保底', () => {
  const pair = PUZZLES.find((puzzle) => puzzle.kind === 'pair')!
  const contradiction = PUZZLES.find((puzzle) => puzzle.kind === 'contradiction')!

  it('配对题与判断题只认正确答案', () => {
    if (pair.kind !== 'pair') throw new Error('缺少配对题')
    expect(judgePuzzle(pair, [...pair.answer])).toBe(true)
    expect(judgePuzzle(pair, [pair.answer[0], pair.answer[0]])).toBe(false)
    const wrong = pair.choices.find((id) => !pair.answer.includes(id))!
    expect(judgePuzzle(pair, [pair.answer[0], wrong])).toBe(false)

    if (contradiction.kind !== 'contradiction') throw new Error('缺少判断题')
    expect(judgePuzzle(contradiction, [contradiction.answer])).toBe(true)
    const wrongKey = contradiction.items.find((item) => item.key !== contradiction.answer)!.key
    expect(judgePuzzle(contradiction, [wrongKey])).toBe(false)
  })

  it('配对题错两次标出一张正确卡，判断题逐步排除', () => {
    if (pair.kind !== 'pair' || contradiction.kind !== 'contradiction') throw new Error('题型缺失')
    expect(assistFor(pair, 1).revealed).toEqual([])
    expect(assistFor(pair, 2).revealed).toEqual([pair.answer[0]])

    expect(assistFor(contradiction, 1).excluded).toEqual([])
    const two = assistFor(contradiction, 2).excluded
    expect(two).toHaveLength(2)
    expect(two).not.toContain(contradiction.answer)
    const all = assistFor(contradiction, 3).excluded
    expect(all).toHaveLength(3)
    expect(all).not.toContain(contradiction.answer)
  })

  it('题目按章节与线索入档状态开放', () => {
    const puzzle = PUZZLES[0]
    const cards = puzzle.kind === 'pair' ? puzzle.answer : puzzle.materials
    expect(puzzleStatus(puzzle, 'prologue', [...cards], [])).toBe('locked-chapter')
    expect(puzzleStatus(puzzle, puzzle.chapter, [], [])).toBe('locked-clues')
    expect(puzzleStatus(puzzle, puzzle.chapter, [...cards], [])).toBe('ready')
    expect(puzzleStatus(puzzle, 'ch07', [...cards], [puzzle.recipe])).toBe('solved')
  })
})
