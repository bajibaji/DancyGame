import { describe, expect, it } from 'vitest'
import { parseRichText } from '../src/components/game/Scene/richTextTokens'

describe('parseRichText', () => {
  it('独立成行的引号识别为对话', () => {
    const [paragraph] = parseRichText('「你好。」')
    expect(paragraph.dialogueLead).toBe(true)
    expect(paragraph.tokens[0]).toMatchObject({ kind: 'quote', speech: true })
  })

  it('句中引号不算段首对话', () => {
    const [paragraph] = parseRichText('他说「你好。」')
    expect(paragraph.dialogueLead).toBe(false)
    expect(paragraph.tokens[1]).toMatchObject({ kind: 'quote' })
  })

  it('空行分段', () => {
    expect(parseRichText('第一段\n\n第二段')).toHaveLength(2)
  })

  it('空文本返回一个空段', () => {
    const [paragraph] = parseRichText('')
    expect(paragraph.tokens).toEqual([])
  })
})
