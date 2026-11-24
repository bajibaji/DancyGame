import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const beats = JSON.parse(readFileSync(join(root, 'story', 'beats.json'), 'utf8'))
const threads = JSON.parse(readFileSync(join(root, 'story', 'threads.json'), 'utf8'))

const PER_CHAPTER = 16
const CHAPTER_ORDER = ['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05', 'ch06', 'ch07', 'ch08', 'ch09', 'ch10', 'ch11', 'ch12', 'ch13', 'ch14']
const TYPES = ['问谁', '查什么', '信谁']
const BAR = ['▁', '▂', '▃', '▄', '▅']

const errors = []
const warns = []

const ids = new Set()
const byId = new Map()
for (const b of beats) {
  if (ids.has(b.id)) errors.push('重复节拍 ' + b.id)
  ids.add(b.id)
  byId.set(b.id, b)
  if (!Array.isArray(b.scenes) || b.scenes.length !== 3) errors.push(b.id + ' 幕数不是 3')
  if (!b.source) errors.push(b.id + ' 缺原著出处')
  if (!Number.isInteger(b.tension) || b.tension < 1 || b.tension > 5) errors.push(b.id + ' tension 不在 1–5')
  if (!Number.isInteger(b.newInfo) || b.newInfo < 1 || b.newInfo > 5) errors.push(b.id + ' newInfo 不在 1–5')
  if (!b.choice) {
    warns.push(b.id + ' 没有选择，违反每 3 幕一次选择')
  } else {
    if (!TYPES.includes(b.choice.type)) errors.push(b.id + ' 选择类型非法：' + b.choice.type)
    if (!Number.isInteger(b.choice.weight) || b.choice.weight < 0 || b.choice.weight > 2) errors.push(b.id + ' 选择重量不在 0–2')
  }
}

const byChapter = new Map()
for (const b of beats) {
  if (!byChapter.has(b.chapter)) byChapter.set(b.chapter, [])
  byChapter.get(b.chapter).push(b)
}

const lines = []
for (const ch of CHAPTER_ORDER) {
  const list = (byChapter.get(ch) ?? []).sort((a, b) => a.index - b.index)
  if (list.length === 0) continue
  if (list.length !== PER_CHAPTER) warns.push(ch + ' 节拍数 ' + list.length + ' / ' + PER_CHAPTER)
  list.forEach((b, i) => {
    if (b.index !== i + 1) errors.push(ch + ' 序号断裂于 ' + b.id)
  })
  let run = 0
  for (const b of list) {
    run = b.tension <= 2 ? run + 1 : 0
    if (run >= 3) warns.push(b.id + ' 起连续 ' + run + ' 个低张力节拍')
  }
  const peak = Math.max(...list.map((b) => b.tension))
  if (peak < 4) warns.push(ch + ' 没有张力峰值')
  const weight = list.reduce((s, b) => s + (b.choice?.weight ?? 0), 0)
  lines.push('')
  lines.push('[' + ch + '] ' + list.length + ' 节拍 / ' + list.length * 3 + ' 幕  峰值 ' + peak + '  重量合计 ' + weight)
  for (const b of list) {
    const bar = BAR[b.tension - 1].repeat(3)
    const c = b.choice ? b.choice.type + b.choice.weight : '—'
    lines.push('  ' + String(b.index).padStart(2, '0') + ' ' + bar + ' ' + b.title.padEnd(8, ' ') + ' 选择 ' + c)
  }
}

const threadIds = new Set(threads.map((t) => t.id))
for (const b of beats) {
  for (const t of b.threads ?? []) if (!threadIds.has(t)) errors.push(b.id + ' 引用了不存在的线 ' + t)
}
for (const t of threads) {
  const plants = (t.plants ?? []).filter((id) => byId.has(id))
  if (plants.length < 2) warns.push(t.id + ' 埋点少于 2 处')
  for (const id of t.plants ?? []) if (!byId.has(id)) errors.push(t.id + ' 埋点缺失 ' + id)
  if (t.misread && byId.has(t.misread) && plants.length) {
    const first = byId.get(plants[0])
    const m = byId.get(t.misread)
    if (m.chapter === first.chapter && m.index < first.index) errors.push(t.id + ' 误读早于第一次埋点')
  }
  if (t.payoff && !String(t.payoff).startsWith('planned:') && !byId.has(t.payoff)) errors.push(t.id + ' 回收点缺失 ' + t.payoff)
}

const scenes = beats.reduce((s, b) => s + (b.scenes?.length ?? 0), 0)
lines.push('')
lines.push('合计 ' + beats.length + ' 节拍 / ' + scenes + ' 幕；线 ' + threads.length + ' 条；错误 ' + errors.length + '，警告 ' + warns.length)
if (warns.length) {
  lines.push('')
  lines.push('警告：')
  for (const w of warns) lines.push('  - ' + w)
}
if (errors.length) {
  lines.push('')
  lines.push('错误：')
  for (const e of errors) lines.push('  - ' + e)
}
console.log(lines.join('\n'))
process.exit(errors.length > 0 ? 1 : 0)
