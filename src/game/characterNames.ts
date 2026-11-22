import { CHARACTERS } from '../content/index'

export const NAME_TO_ID = new Map(CHARACTERS.map((character) => [character.name, character.id]))

const names = Array.from(NAME_TO_ID.keys()).sort((a, b) => b.length - a.length)

const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const NAME_PATTERN = new RegExp(`(${names.map(escape).join('|')})`, 'g')

export function characterIdsInText(text: string): string[] {
  const ids: string[] = []
  for (const name of names) {
    if (text.includes(name)) ids.push(NAME_TO_ID.get(name)!)
  }
  return ids
}
