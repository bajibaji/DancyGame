import { Fragment, useMemo } from 'react'
import { NAME_PATTERN, NAME_TO_ID } from '../../../game/characterNames'

interface RichTextProps {
  text: string
  onSelect: (id: string, alias: string) => void
}

const DIALOGUE = /(「[^」]*」)/g

function renderNarration(segment: string, keyPrefix: string, onSelect: RichTextProps['onSelect']) {
  return segment.split(NAME_PATTERN).map((token, index) => {
    const id = NAME_TO_ID.get(token)
    if (!id) return <Fragment key={`${keyPrefix}-n${index}`}>{token}</Fragment>
    return (
      <span
        key={`${keyPrefix}-b${index}`}
        role="button"
        tabIndex={0}
        onClick={(event) => {
          event.stopPropagation()
          onSelect(id, token)
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            event.stopPropagation()
            onSelect(id, token)
          }
        }}
        className="font-medium text-accent-strong active:text-accent"
      >
        {token}
      </span>
    )
  })
}

export default function RichText({ text, onSelect }: RichTextProps) {
  const paragraphs = useMemo(() => text.split(/\n\n+/), [text])
  return (
    <>
      {paragraphs.map((paragraph, index) => {
        const isDialogue = paragraph.trimStart().startsWith('「')
        return (
          <p key={index} className={isDialogue ? 'dialogue-paragraph' : undefined}>
            {paragraph.split(DIALOGUE).map((segment, i) => {
              if (segment.startsWith('「') && segment.endsWith('」')) {
                return (
                  <span key={`d${i}`} className="dialogue">
                    {segment}
                  </span>
                )
              }
              return (
                <Fragment key={`s${i}`}>
                  {renderNarration(segment, `p${index}-s${i}`, onSelect)}
                </Fragment>
              )
            })}
          </p>
        )
      })}
    </>
  )
}
