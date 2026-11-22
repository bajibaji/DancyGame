import { describe, expect, it } from 'vitest'
import { parseRichText } from '../src/components/game/Scene/richTextTokens'

const flatten = (paragraph: ReturnType<typeof parseRichText>[number]) =>
  paragraph.tokens.map((token) => [token.text, token.dialogue])

describe('parseRichText', () => {
  it('keeps a quote in the middle of a sentence inline', () => {
    const [paragraph] = parseRichText('他写下「老厂区」，没有作声。')
    expect(paragraph.dialogueLead).toBe(false)
    expect(flatten(paragraph)).toEqual([
      ['他写下', false],
      ['「老厂区」', true],
      ['，没有作声。', false],
    ])
  })

  it('marks a paragraph that starts with a quote as dialogue', () => {
    const [paragraph] = parseRichText('「玻璃纤维，」他说。')
    expect(paragraph.dialogueLead).toBe(true)
    expect(flatten(paragraph)).toEqual([
      ['「玻璃纤维，」', true],
      ['他说。', false],
    ])
  })

  it('keeps the question mark after a quote out of the dialogue token', () => {
    const [paragraph] = parseRichText('打一笔「货款」？卢旭是杜家的财务。')
    expect(flatten(paragraph)).toEqual([
      ['打一笔', false],
      ['「货款」', true],
      ['？卢旭是杜家的财务。', false],
    ])
  })

  it('links names that appear inside quotes', () => {
    const [paragraph] = parseRichText('「傅铮，你好。」')
    const name = paragraph.tokens.find((token) => token.kind === 'name')
    expect(name).toMatchObject({ kind: 'name', text: '傅铮', dialogue: true })
  })

  it('keeps multiple quotes in one paragraph inline', () => {
    const [paragraph] = parseRichText('「进来。」傅铮没抬头，「说。」')
    expect(flatten(paragraph).filter(([, dialogue]) => dialogue)).toHaveLength(2)
    expect(paragraph.tokens.some((token) => token.kind === 'name' && token.text === '傅铮')).toBe(true)
  })

  it('splits paragraphs and preserves their text', () => {
    const paragraphs = parseRichText('第一段。\n\n「第二段」还有。')
    expect(paragraphs.map((paragraph) => paragraph.tokens.map((token) => token.text).join(''))).toEqual([
      '第一段。',
      '「第二段」还有。',
    ])
  })
})
