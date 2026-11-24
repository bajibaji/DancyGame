import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const strictChapters = ['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13']
const MAX_BODY = 400
const CHOICE_MIN = 160
const PLAIN_MIN = 200
const CONSEQUENCE_MIN = 40
const VARIANT_MIN = 80
const MAX_CHOICE_GAP = 3

const errors = []
const lines = []
const shortBodies = []

for (const name of strictChapters) {
  const text = readFileSync(join(root, 'src', 'content', 'story', name + '.json'), 'utf8')
  const chapter = JSON.parse(text)
  let gap = 0
  let chars = 0
  let variants = 0
  for (const scene of chapter.scenes) {
    const id = scene.id
    chars += scene.body.length
    gap++
    const start = text.indexOf(`"id": "${id}"`)
    const end = text.indexOf('"id": "', start + 10)
    const slice = text.slice(start, end === -1 ? text.length : end)
    const keys = [...slice.matchAll(/^ {3}"([A-Za-z]+)":/gm)].map((match) => match[1])
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index)
    if (duplicates.length) errors.push(id + ' 重复顶层字段：' + Array.from(new Set(duplicates)).join('、'))
    const sentences = scene.body.split(/[。！？\n]/).map((part) => part.replace(/[，、；：""''「」『』（）()\s]/g, '')).filter((part) => part.length >= 12)
    const seenSentences = new Set()
    for (const sentence of sentences) {
      if (seenSentences.has(sentence)) errors.push(id + ' 同一幕重复句子：' + sentence.slice(0, 16) + '…')
      seenSentences.add(sentence)
    }
    const compactLength = scene.body.replace(/\s/g, '').length
    if (compactLength < 180) shortBodies.push(id + ':' + compactLength)
    if (scene.body.length > MAX_BODY) errors.push(id + ' 正文 ' + scene.body.length + ' 字，超过 ' + MAX_BODY)
    if (scene.options) {
      const worlds = scene.options.map((option) => option.effects.world ?? 0)
      if (Math.min(...worlds) > 0) errors.push(id + ' 三个选项都不加逆线，世界线无法摆荡')
      if (scene.body.length < CHOICE_MIN) errors.push(id + ' 选择幕正文 ' + scene.body.length + ' 字，低于 ' + CHOICE_MIN)
      if (gap > MAX_CHOICE_GAP) errors.push(id + ' 距上一次选择隔了 ' + gap + ' 幕')
      gap = 0
      for (const option of scene.options) {
        if (option.consequence.length < CONSEQUENCE_MIN) errors.push(id + '/' + option.key + ' 即时后果过短')
      }
    } else if (scene.body.length < PLAIN_MIN) {
      errors.push(id + ' 正文 ' + scene.body.length + ' 字，低于 ' + PLAIN_MIN)
    }
    if (scene.worldVariants) {
      variants++
      const kinds = scene.worldVariants.map((entry) => entry.line).sort().join(',')
      if (kinds !== 'loss,order') errors.push(id + ' 双版本线不完整：' + kinds)
      for (const entry of scene.worldVariants) {
        if (entry.body.length < VARIANT_MIN) errors.push(id + ' ' + entry.line + ' 版本过短')
        if (entry.body === scene.body) errors.push(id + ' ' + entry.line + ' 版本与主版本相同')
      }
    }
    for (const effects of [scene.effects, ...(scene.options ?? []).map((option) => option.effects)]) {
      if (!effects) continue
      if ((effects.clue ?? 0) < 0) errors.push(id + ' 出现负线索，信息会丢失')
    }
  }
  lines.push(name + '：' + chapter.scenes.length + ' 幕，平均 ' + Math.round(chars / chapter.scenes.length) + ' 字，双版本 ' + variants + ' 幕')
}

console.log(lines.join('\n'))
if (shortBodies.length) {
  console.log('')
  console.log('去空白偏短 ' + shortBodies.length + ' 幕（低于 180，先提示不阻断）：' + shortBodies.slice(0, 10).join(' ') + (shortBodies.length > 10 ? ' …' : ''))
}
if (errors.length) {
  console.log('')
  console.log('不合规 ' + errors.length + ' 处：')
  for (const error of errors) console.log('  - ' + error)
  process.exit(1)
}
console.log('剧本硬约束通过')
