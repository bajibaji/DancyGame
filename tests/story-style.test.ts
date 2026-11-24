import { describe, expect, it } from 'vitest'
import { ENDINGS, ENDING_MEMORY, SCENES } from '../src/content/index'
import type { Scene } from '../src/game/types'

const FORBIDDEN = ['心里一沉', '你意识到', '仿佛在说', '像是在诉说', '深吸一口气', '不由得', '不禁', '空气仿佛凝固']

const bodiesOf = (scene: Scene) => [
  scene.body,
  ...(scene.variants?.map((variant) => variant.body) ?? []),
]

const textToCheck = [
  ...[...SCENES.values()].flatMap((scene) => [
    ...bodiesOf(scene),
    ...(scene.recalls ?? []).map((entry) => entry.text),
    ...(scene.options ?? []).flatMap((option) => [option.label, option.consequence]),
  ].map((body) => [scene.id, body] as const)),
  ...Object.values(ENDING_MEMORY).map((body) => ['memoryRecap', body] as const),
  ...Object.entries(ENDINGS).flatMap(([id, ending]) => [
    ending.body,
    ...Object.values(ending.caseStatus),
    ...Object.values(ending.fallout ?? {}),
    ...Object.values(ending.epilogues).map((entry) => entry.text),
    ...ending.variants.map((entry) => entry.text),
  ].map((body) => [id, body] as const)),
]

describe('文风约束（去 AI 腔）', () => {
  it('不使用模板化表达', () => {
    for (const [id, body] of textToCheck) {
      for (const phrase of FORBIDDEN) {
        expect(body.includes(phrase), `${id} 含模板化表达「${phrase}」`).toBe(false)
      }
    }
  })

  it('控制比喻与破折号密度', () => {
    for (const scene of SCENES.values()) {
      for (const body of bodiesOf(scene)) {
        const metaphors = body.match(/仿佛|宛如/g)?.length ?? 0
        expect(metaphors, `${scene.id} 比喻过多`).toBeLessThanOrEqual(2)
        for (const paragraph of body.split(/\n\n+/)) {
          const dashes = paragraph.match(/——/g)?.length ?? 0
          expect(dashes, `${scene.id} 单段破折号过多`).toBeLessThanOrEqual(1)
        }
        const notBut = body.match(/不是[^。！？\n]{0,16}而是/g)?.length ?? 0
        expect(notBut, `${scene.id} 「不是…而是」过多`).toBeLessThanOrEqual(1)
      }
    }
  })

  it('段落不以「你」机械开头', () => {
    for (const scene of SCENES.values()) {
      for (const body of bodiesOf(scene)) {
        const paragraphs = body.split(/\n\n+/).filter((p) => p.trim().length > 0)
        if (paragraphs.length < 2) continue
        const startsWithYou = paragraphs.filter((p) => p.trimStart().startsWith('你')).length
        expect(startsWithYou / paragraphs.length, `${scene.id} 段落开头过于机械`).toBeLessThanOrEqual(0.6)
      }
    }
  })

  it('正文长度在可读区间', () => {
    for (const scene of SCENES.values()) {
      for (const body of bodiesOf(scene)) {
        const strict = ['prologue', 'ch01', 'ch02', 'ch03'].includes(scene.chapter)
        const min = strict ? (scene.options?.length ? 160 : 200) : 100
        expect(body.length, `${scene.id} 正文过短`).toBeGreaterThanOrEqual(min)
        expect(body.length, `${scene.id} 正文过长`).toBeLessThanOrEqual(460)
      }
    }
  })
})
