import { NAME_PATTERN, NAME_TO_ID } from '../../../game/characterNames'

export type RichTextToken =
  | { kind: 'text'; text: string }
  | { kind: 'name'; text: string; id: string }
  | { kind: 'quote'; text: string; speech: boolean }

export interface RichTextParagraph {
  dialogueLead: boolean
  tokens: RichTextToken[]
}

const QUOTE = /「[^」]*」/g
const SPEECH_END = /[。！？…]/
const SPEECH_VERB = /(说|问|喊|道|答|叫|应|开口|补|低声|念叨|嘟囔|自语)$/
const ATTRIBUTION = /^[\u4e00-\u9fff]{1,3}(说|问|道|答|喊|叫|应|笑|补|开口|低声|自语|嘟囔|念叨)/

function splitNames(segment: string): RichTextToken[] {
  return segment
    .split(NAME_PATTERN)
    .filter((part) => part.length > 0)
    .map((part): RichTextToken => {
      const id = NAME_TO_ID.get(part)
      return id ? { kind: 'name', text: part, id } : { kind: 'text', text: part }
    })
}

function isSpeech(quote: string, before: string, after: string): boolean {
  if (before.trim().length === 0) return true
  if (SPEECH_END.test(quote)) return true
  const head = before.trimEnd()
  if ((head.endsWith('：') || head.endsWith(':')) && SPEECH_VERB.test(head.slice(0, -1).trimEnd())) return true
  return ATTRIBUTION.test(after.trimStart())
}

export function parseRichText(text: string): RichTextParagraph[] {
  return text.split(/\n\n+/).map((paragraph) => {
    const tokens: RichTextToken[] = []
    let cursor = 0
    let foundQuote = false
    let leadSpeech = false
    for (const match of paragraph.matchAll(QUOTE)) {
      const index = match.index ?? 0
      const quote = match[0]
      const speech = isSpeech(quote, paragraph.slice(0, index), paragraph.slice(index + quote.length))
      if (!foundQuote) {
        foundQuote = true
        leadSpeech = speech
      }
      if (index > cursor) tokens.push(...splitNames(paragraph.slice(cursor, index)))
      tokens.push({ kind: 'quote', text: quote, speech })
      cursor = index + quote.length
    }
    if (cursor < paragraph.length) tokens.push(...splitNames(paragraph.slice(cursor)))
    return { dialogueLead: foundQuote && leadSpeech && paragraph.trimStart().startsWith('「'), tokens }
  })
}
