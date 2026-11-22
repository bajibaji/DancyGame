import { Fragment, useMemo } from 'react'
import { parseRichText } from './richTextTokens'
import type { RichTextToken } from './richTextTokens'

interface RichTextProps {
  text: string
  onSelect: (id: string, alias: string) => void
}

function renderToken(token: RichTextToken, key: string, onSelect: RichTextProps['onSelect']) {
  if (token.kind === 'name') {
    return (
      <span
        key={key}
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
        className="whitespace-nowrap font-medium text-accent-strong active:text-accent"
      >
        {token.text}
      </span>
    )
  }
  if (token.dialogue) {
    return (
      <span key={key} className="dialogue">
        {token.text}
      </span>
    )
  }
  return <Fragment key={key}>{token.text}</Fragment>
}

export default function RichText({ text, onSelect }: RichTextProps) {
  const paragraphs = useMemo(() => parseRichText(text), [text])
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={paragraph.dialogueLead ? 'dialogue-paragraph' : undefined}>
          {paragraph.tokens.map((token, tokenIndex) => renderToken(token, `${index}-${tokenIndex}`, onSelect))}
        </p>
      ))}
    </>
  )
}
