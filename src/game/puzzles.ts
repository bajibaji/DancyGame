import puzzlesData from '../content/puzzles.json'
import { CHAPTERS } from '../content/index'

export interface PuzzleBase {
  id: string
  recipe: string
  chapter: string
  title: string
  prompt: string
  hint: string
  reward: { label: string; text: string }
}

export interface PairPuzzle extends PuzzleBase {
  kind: 'pair'
  choices: string[]
  answer: [string, string] | string[]
}

export interface ContradictionItem {
  key: string
  text: string
}

export interface ContradictionPuzzle extends PuzzleBase {
  kind: 'contradiction'
  materials: string[]
  items: ContradictionItem[]
  answer: string
}

export type Puzzle = PairPuzzle | ContradictionPuzzle

export const PUZZLES: Puzzle[] = puzzlesData as Puzzle[]

export type PuzzleStatus = 'solved' | 'ready' | 'locked-chapter' | 'locked-clues'

const chapterIndex = (chapter: string | undefined) =>
  CHAPTERS.findIndex(({ chapter: value }) => value === chapter)

export function puzzleStatus(
  puzzle: Puzzle,
  currentChapter: string | undefined,
  ownedClues: string[],
  solved: string[],
): PuzzleStatus {
  if (solved.includes(puzzle.recipe)) return 'solved'
  if (chapterIndex(currentChapter) < chapterIndex(puzzle.chapter)) return 'locked-chapter'
  const cards = puzzle.kind === 'pair' ? puzzle.answer : puzzle.materials
  return cards.every((id) => ownedClues.includes(id)) ? 'ready' : 'locked-clues'
}

export function puzzleMaterials(puzzle: Puzzle): string[] {
  return puzzle.kind === 'pair' ? puzzle.choices : puzzle.materials
}

export function judgePuzzle(puzzle: Puzzle, input: string[]): boolean {
  if (puzzle.kind === 'pair') {
    if (input.length !== 2) return false
    return [...input].sort().join('|') === [...puzzle.answer].sort().join('|')
  }
  return input.length === 1 && input[0] === puzzle.answer
}

export interface Assist {
  revealed: string[]
  excluded: string[]
}

export function assistFor(puzzle: Puzzle, wrongCount: number): Assist {
  if (puzzle.kind === 'pair') {
    return { revealed: wrongCount >= 2 ? [puzzle.answer[0]] : [], excluded: [] }
  }
  const wrong = puzzle.items.filter(({ key }) => key !== puzzle.answer).map(({ key }) => key)
  const excluded = wrongCount >= 3 ? wrong : wrongCount >= 2 ? wrong.slice(0, 2) : []
  return { revealed: [], excluded }
}
