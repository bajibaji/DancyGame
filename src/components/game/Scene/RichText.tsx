import { Fragment, useMemo } from 'react'
import { parseRichText } from './richTextTokens'
import type { RichTextToken } from './richTextTokens'

interface RichTextProps {
  text: string
}

function renderToken(token: RichTextToken, key: string) {
  if (token.kind === 'quote') {
    return (
      <span key={key} className={token.speech ? 'dialogue' : 'dialogue-inline'}>
        {token.text}
      </span>
    )
  }
  return <Fragment key={key}>{token.text}</Fragment>
}

export default function RichText({ text }: RichTextProps) {
  const paragraphs = useMemo(() => parseRichText(text), [text])
  return (
    <>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={paragraph.dialogueLead ? 'dialogue-paragraph' : undefined}>
          {paragraph.tokens.map((token, tokenIndex) => renderToken(token, `${index}-${tokenIndex}`))}
        </p>
      ))}
    </>
  )
}
