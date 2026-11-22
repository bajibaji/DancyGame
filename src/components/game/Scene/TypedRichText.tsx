import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { NAME_PATTERN, NAME_TO_ID } from '../../../game/characterNames'

interface TypedRichTextProps {
  text: string
  speed: number
  revealAll: boolean
  onDone?: () => void
  onSelect: (id: string, alias: string) => void
}

type Token =
  | { kind: 'text'; text: string }
  | { kind: 'dialogue'; text: string }
  | { kind: 'name'; text: string; id: string }

interface Paragraph {
  dialogueLead: boolean
  tokens: Token[]
}

const DIALOGUE = /(「[^」]*」)/g

function parse(text: string): Paragraph[] {
  return text.split(/\n\n+/).map((paragraph) => {
    const tokens: Token[] = []
    for (const segment of paragraph.split(DIALOGUE)) {
      if (!segment) continue
      if (segment.startsWith('「') && segment.endsWith('」')) {
        tokens.push({ kind: 'dialogue', text: segment })
        continue
      }
      for (const part of segment.split(NAME_PATTERN)) {
        if (!part) continue
        const id = NAME_TO_ID.get(part)
        tokens.push(id ? { kind: 'name', text: part, id } : { kind: 'text', text: part })
      }
    }
    return { dialogueLead: paragraph.trimStart().startsWith('「'), tokens }
  })
}

export default function TypedRichText({ text, speed, revealAll, onDone, onSelect }: TypedRichTextProps) {
  const paragraphs = useMemo(() => parse(text), [text])
  const total = useMemo(
    () => paragraphs.reduce((sum, paragraph) => sum + paragraph.tokens.reduce((n, token) => n + token.text.length, 0), 0),
    [paragraphs],
  )
  const [revealed, setRevealed] = useState(revealAll ? total : 0)
  const doneRef = useRef(false)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    doneRef.current = false
    setRevealed(revealAll ? total : 0)
  }, [text, revealAll, total])

  useEffect(() => {
    if (revealAll || speed <= 0) {
      setRevealed(total)
      return
    }
    if (revealed >= total) return
    const timer = setInterval(() => {
      setRevealed((value) => Math.min(total, value + 1))
    }, speed)
    return () => clearInterval(timer)
  }, [text, speed, revealAll, total, revealed])

  useEffect(() => {
    if (revealed < total || total === 0 || doneRef.current) return
    doneRef.current = true
    onDoneRef.current?.()
  }, [revealed, total])

  let offset = 0
  return (
    <>
      {paragraphs.map((paragraph, paragraphIndex) => {
        const start = offset
        const length = paragraph.tokens.reduce((n, token) => n + token.text.length, 0)
        offset += length
        const visible = Math.max(0, Math.min(revealed - start, length))
        if (visible <= 0) return null
        let used = 0
        return (
          <p key={paragraphIndex} className={paragraph.dialogueLead ? 'dialogue-paragraph' : undefined}>
            {paragraph.tokens.map((token, tokenIndex) => {
              const remaining = visible - used
              if (remaining <= 0) return null
              const part = token.text.slice(0, remaining)
              used += token.text.length
              if (token.kind === 'dialogue') {
                return (
                  <span key={tokenIndex} className="dialogue">
                    {part}
                  </span>
                )
              }
              if (token.kind === 'name') {
                const full = part.length === token.text.length
                if (!full) {
                  return (
                    <span key={tokenIndex} className="font-medium text-accent-strong">
                      {part}
                    </span>
                  )
                }
                return (
                  <span
                    key={tokenIndex}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      event.stopPropagation()
                      onSelect(token.id, token.text)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        event.stopPropagation()
                        onSelect(token.id, token.text)
                      }
                    }}
                    className="font-medium text-accent-strong active:text-accent"
                  >
                    {part}
                  </span>
                )
              }
              return <Fragment key={tokenIndex}>{part}</Fragment>
            })}
          </p>
        )
      })}
    </>
  )
}
