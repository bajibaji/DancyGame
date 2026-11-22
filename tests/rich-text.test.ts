import { describe, expect, it } from 'vitest'
import { parseRichText } from '../src/components/game/Scene/richTextTokens'

const quotes = (text: string) => {
  const [paragraph] = parseRichText(text)
  return paragraph.tokens.filter((token) => token.kind === 'quote')
}

describe('parseRichText', () => {
  it('keeps a quoted term inline in the middle of a sentence', () => {
    const [paragraph] = parseRichText('打一笔「货款」？卢旭是杜家的财务。')
    expect(paragraph.dialogueLead).toBe(false)
    const [quote] = quotes('打一笔「货款」？卢旭是杜家的财务。')
    expect(quote).toMatchObject({ text: '「货款」', speech: false })
  })

  it('treats a paragraph-leading quote as speech', () => {
    const [paragraph] = parseRichText('「进来。」傅铮没抬头。')
    expect(paragraph.dialogueLead).toBe(true)
    expect(quotes('「进来。」傅铮没抬头。')[0]).toMatchObject({ text: '「进来。」', speech: true })
  })

  it('treats a quote followed by an attribution as speech', () => {
    const [quote] = quotes('他说「玻璃纤维，」然后停下。')
    expect(quote).toMatchObject({ speech: false })
    const [attributed] = quotes('细丝。「玻璃纤维，」他说。')
    expect(attributed).toMatchObject({ speech: true })
  })

  it('keeps a written word after a colon inline', () => {
    const [paragraph] = parseRichText('最后一页：「长期服用」和「意识」。')
    expect(paragraph.dialogueLead).toBe(false)
    expect(quotes('最后一页：「长期服用」和「意识」。').map((quote) => quote.speech)).toEqual([false, false])
  })

  it('treats a quote after a speech colon as speech', () => {
    const [quote] = quotes('他开口：「市局，江嘉。」')
    expect(quote).toMatchObject({ speech: true })
  })

  it('preserves the paragraph text', () => {
    const paragraphs = parseRichText('第一段。\n\n「第二段」还有。')
    expect(paragraphs.map((paragraph) => paragraph.tokens.map((token) => token.text).join(''))).toEqual([
      '第一段。',
      '「第二段」还有。',
    ])
  })
})
