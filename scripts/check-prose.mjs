import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const strictChapters = ['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07']
const MAX_BODY = 400
const CHOICE_MIN = 160
const PLAIN_MIN = 200
const CONSEQUENCE_MIN = 40
const VARIANT_MIN = 80
const MAX_CHOICE_GAP = 3

const errors = []
const lines = []

for (const name of strictChapters) {
  const chapter = JSON.parse(readFileSync(join(root, 'src', 'content', 'story', name + '.json'), 'utf8'))
  let gap = 0
  let chars = 0
  let variants = 0
  for (const scene of chapter.scenes) {
    const id = scene.id
    chars += scene.body.length
    gap++
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
if (errors.length) {
  console.log('')
  console.log('不合规 ' + errors.length + ' 处：')
  for (const error of errors) console.log('  - ' + error)
  process.exit(1)
}
console.log('剧本硬约束通过')
