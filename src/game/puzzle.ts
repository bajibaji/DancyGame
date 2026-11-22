import recipesData from '../content/recipes.json'
import type { GameState } from './types'

export interface Recipe {
  id: string
  cards: [string, string]
  title: string
  flag?: string
}

export const RECIPES: Recipe[] = recipesData as Recipe[]

export function availableRecipes(clues: string[]): Recipe[] {
  const owned = new Set(clues)
  return RECIPES.filter((r) => owned.has(r.cards[0]) && owned.has(r.cards[1]))
}

export function matchRecipe(clues: string[], a: string, b: string): Recipe | null {
  const owned = new Set(clues)
  if (!owned.has(a) || !owned.has(b) || a === b) return null
  return (
    RECIPES.find(
      (r) =>
        (r.cards[0] === a && r.cards[1] === b) || (r.cards[0] === b && r.cards[1] === a),
    ) ?? null
  )
}

export function solvePuzzle(state: GameState, a: string, b: string): { state: GameState; result: Recipe | null } {
  const recipe = matchRecipe(state.clues, a, b)
  if (!recipe || state.solved.includes(recipe.id)) {
    return { state, result: null }
  }
  const flags = recipe.flag ? { ...state.flags, [recipe.flag]: true } : state.flags
  return {
    state: {
      ...state,
      flags,
      solved: [...state.solved, recipe.id],
      meta: { ...state.meta, clue: Math.min(30, state.meta.clue + 2) },
    },
    result: recipe,
  }
}
