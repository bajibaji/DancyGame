import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { parseRichText } from './richTextTokens'

interface TypedRichTextProps {
  text: string
  speed: number
  revealAll: boolean
  onDone?: () => void
  onSelect: (id: string, alias: string) => void
}

export default function TypedRichText({ text, speed, revealAll, onDone, onSelect }: TypedRichTextProps) {
  const paragraphs = useMemo(() => parseRichText(text), [text])
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
              if (token.kind === 'quote') {
                return (
                  <span key={tokenIndex} className={token.speech ? 'dialogue' : 'dialogue-inline'}>
                    {part}
                  </span>
                )
              }
              if (token.kind === 'name') {
                if (part.length < token.text.length) {
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
