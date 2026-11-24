import { CHAPTERS, CHARACTERS, CLUES, MEMORIES, SCENES } from './index'
import { characterIdsInText } from '../game/characterNames'

export const LAST_RELEASED_CHAPTER = 'ch05'
export const RELEASED_CHAPTERS = CHAPTERS.slice(0, CHAPTERS.findIndex(({ chapter }) => chapter === LAST_RELEASED_CHAPTER) + 1)
const chapterIds = new Set(RELEASED_CHAPTERS.map(({ chapter }) => chapter))
const scenes = RELEASED_CHAPTERS.flatMap(({ scenes }) => scenes)
const effects = scenes.flatMap((scene) => [scene.effects, ...(scene.options ?? []).map(({ effects }) => effects)])
const clueIds = new Set(effects.flatMap((effect) => effect?.clues ?? []))
const memoryIds = new Set(effects.flatMap((effect) => effect?.memories ?? []))
const characterIds = new Set(scenes.flatMap((scene) => characterIdsInText([scene.body, ...(scene.recalls ?? []).map(({ text }) => text), ...(scene.options ?? []).flatMap(({ label, consequence }) => [label, consequence])].join('\n'))))

export const RELEASED_CLUES = CLUES.filter(({ id }) => clueIds.has(id))
export const RELEASED_MEMORIES = MEMORIES.filter(({ id }) => memoryIds.has(id))
export const RELEASED_CHARACTERS = CHARACTERS.filter(({ id }) => id === 'jiangjia' || characterIds.has(id))

export function isReleasedChapter(chapter: string | undefined): boolean {
  return Boolean(chapter && chapterIds.has(chapter))
}

export function isReleasedScene(id: string): boolean {
  return isReleasedChapter(SCENES.get(id)?.chapter)
}

export function isReleasedRecipe(cards: readonly string[]): boolean {
  return cards.every((id) => clueIds.has(id))
}
