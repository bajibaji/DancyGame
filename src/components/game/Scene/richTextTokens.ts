import { NAME_PATTERN, NAME_TO_ID } from '../../../game/characterNames'

export type RichTextToken =
  | { kind: 'text'; text: string; dialogue: boolean }
  | { kind: 'name'; text: string; id: string; dialogue: boolean }

export interface RichTextParagraph {
  dialogueLead: boolean
  tokens: RichTextToken[]
}

const DIALOGUE = /「[^」]*」/g

function splitTokens(segment: string, dialogue: boolean): RichTextToken[] {
  return segment
    .split(NAME_PATTERN)
    .filter((part) => part.length > 0)
    .map((part): RichTextToken => {
      const id = NAME_TO_ID.get(part)
      return id ? { kind: 'name', text: part, id, dialogue } : { kind: 'text', text: part, dialogue }
    })
}

export function parseRichText(text: string): RichTextParagraph[] {
  return text.split(/\n\n+/).map((paragraph) => {
    const tokens: RichTextToken[] = []
    let cursor = 0
    for (const match of paragraph.matchAll(DIALOGUE)) {
      const index = match.index ?? 0
      if (index > cursor) tokens.push(...splitTokens(paragraph.slice(cursor, index), false))
      tokens.push(...splitTokens(match[0], true))
      cursor = index + match[0].length
    }
    if (cursor < paragraph.length) tokens.push(...splitTokens(paragraph.slice(cursor), false))
    return { dialogueLead: paragraph.trimStart().startsWith('「'), tokens }
  })
}
