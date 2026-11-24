import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const partsDir = join(root, 'book', 'parts')

const NAMES = {
  海姝: '江嘉', 谢惊屿: '战远', 小宇: '战远', 温叙: '顾淮', 隋星: '陆晚',
  程危: '贺川', 斯小伟: '贺川', 乔恒: '傅铮', 荀苏苏: '薛岚', 高明雀: '姜瑾',
  黄雨嘉: '姜瑾', 桑切斯: '白鸮', 伊雨: '白鸮', 李云: '霍正', 孔平远: '霍正',
  尹灿曦: '叶小满', 小小: '叶小满', 万泽宇: '马宏图', 广军: '杜衡', 广永国: '杜远山',
  梁澜军: '章冽', 赵月: '闻茉', 许巧: '孟小禾', 刘兴: '周鹤鸣', 刘布泉: '钱满仓',
  李云婷: '阮青禾', 唐金栗: '苗菁', 解阳: '严崇', 萧竞: '秦朗', 盛岿然: '裴重光',
  曾晓颖: '黎安', 张典治: '屠正清', 柯小棉: '罗小诗', 谢小龙: '战守诚',
  周佳佳: '方恬', 周飞航: '方舟', 荣敬: '宋云裳', 贺北城: '秦北望', 张幼辉: '涂文辉',
  水依婷: '水依婷',
}

const VERB = '(?:说|问|道|答|笑|喊|叫|开口|回答|低声|轻声|补充|解释|反问|叹气|嘟囔|嘀咕)'
const nameList = Object.keys(NAMES).sort((a, b) => b.length - a.length)

const files = readdirSync(partsDir).filter((f) => f.endsWith('.txt')).sort()
let raw = ''
for (const f of files) raw += '\n' + readFileSync(join(partsDir, f), 'utf8')
raw = raw.replace(/^\uFEFF/, '').replace(/\u3000/g, ' ')

const chapters = []
let current = { no: 0, title: '前言', text: '' }
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^第(\d+)章\s*(.*)$/)
  if (m) {
    if (current.text.trim()) chapters.push(current)
    current = { no: Number(m[1]), title: m[2].trim(), text: '' }
  } else {
    current.text += line + '\n'
  }
}
if (current.text.trim()) chapters.push(current)

function speakerOf(before, after) {
  const afterHead = after.replace(/^[，。：:、\s]+/, '')
  for (const name of nameList) {
    if (!afterHead.startsWith(name)) continue
    const rest = afterHead.slice(name.length)
    if (new RegExp('^[，：:]?' + VERB).test(rest)) return name
  }
  const tail = before.slice(-24)
  for (const name of nameList) {
    const idx = tail.lastIndexOf(name)
    if (idx < 0) continue
    const prev = idx > 0 ? tail[idx - 1] : ''
    if (prev && !/[。！？…\n\s，、；：]/.test(prev)) continue
    const rest = tail.slice(idx + name.length)
    if (new RegExp('^(?:低声|轻声|沉声|笑着|冷笑)?(?:了|着)?' + VERB + '(?:道|着|了)?[，。！？：:、\\s]*$').test(rest)) return name
  }
  return null
}

const stats = new Map()
let quotes = 0
let attributed = 0
const samples = new Map()

function statOf(name) {
  if (!stats.has(name)) {
    stats.set(name, {
      quotes: 0, chars: 0, sentences: 0, sentenceChars: 0,
      questions: 0, exclaims: 0, particles: 0, longest: 0,
      chapters: new Set(),
    })
  }
  return stats.get(name)
}

const PARTICLES = /[啊呢吧吗呀哦嗯唉嘛呗哈呐嘞]/g

for (const ch of chapters) {
  const text = ch.text
  const re = /“([^”]{1,300})”/g
  let m
  while ((m = re.exec(text))) {
    quotes++
    const body = m[1]
    const before = text.slice(Math.max(0, m.index - 48), m.index)
    const after = text.slice(m.index + m[0].length, m.index + m[0].length + 12)
    const name = speakerOf(before, after)
    if (!name) continue
    attributed++
    const s = statOf(name)
    s.quotes++
    s.chars += body.length
    s.chapters.add(ch.no)
    const sents = body.split(/[。！？…]+/).map((x) => x.trim()).filter((x) => x.length > 0)
    s.sentences += Math.max(1, sents.length)
    s.sentenceChars += body.length
    if (/[？?]/.test(body)) s.questions++
    if (/[！!]/.test(body)) s.exclaims++
    s.particles += (body.match(PARTICLES) ?? []).length
    if (body.length > s.longest) s.longest = body.length
    if (!samples.has(name)) samples.set(name, [])
    const arr = samples.get(name)
    if (arr.length < 40 && body.length >= 8) arr.push({ no: ch.no, text: body })
  }
}

const rows = [...stats.entries()]
  .map(([name, s]) => ({
    name,
    game: NAMES[name],
    quotes: s.quotes,
    avgQuote: Math.round(s.chars / s.quotes),
    avgSentence: +(s.sentenceChars / s.sentences).toFixed(1),
    questionRate: +((s.questions / s.quotes) * 100).toFixed(0),
    particlePer100: +((s.particles / s.chars) * 100).toFixed(1),
    longest: s.longest,
    chapters: [...s.chapters].sort((a, b) => a - b),
  }))
  .sort((a, b) => b.quotes - a.quotes)

const pickSample = (name, n) => {
  const arr = samples.get(name) ?? []
  if (arr.length === 0) return []
  const out = []
  const step = Math.max(1, Math.floor(arr.length / n))
  for (let i = 0; i < arr.length && out.length < n; i += step) out.push(arr[i])
  return out
}

const lines = []
lines.push('# 声线语料（自动生成）')
lines.push('')
lines.push('从原著 139 章台词中按“名字 + 说话动词”规则归属得到。归属是启发式，未识别说话人的台词不计入；样本量小的角色数字仅供参照。')
lines.push('')
lines.push('- 总台词段落：' + quotes + '，识别出说话人：' + attributed + '（' + Math.round((attributed / quotes) * 100) + '%）')
lines.push('- 生成脚本：scripts/voice-corpus.mjs；重跑：node scripts/voice-corpus.mjs')
lines.push('')
lines.push('| 原著 | 游戏 | 台词段 | 平均句长 | 问句占比 | 语气词/百字 | 最长一句 | 出现章 |')
lines.push('| --- | --- | --- | --- | --- | --- | --- | --- |')
for (const r of rows) {
  const span = r.chapters.length > 1 ? r.chapters[0] + '–' + r.chapters[r.chapters.length - 1] : String(r.chapters[0] ?? '')
  lines.push('| ' + r.name + ' | ' + r.game + ' | ' + r.quotes + ' | ' + r.avgSentence + ' | ' + r.questionRate + '% | ' + r.particlePer100 + ' | ' + r.longest + ' | ' + span + ' |')
}
lines.push('')
lines.push('## 代表台词')
for (const r of rows.slice(0, 12)) {
  lines.push('')
  lines.push('### ' + r.name + ' → ' + r.game + '（' + r.quotes + ' 段，平均句长 ' + r.avgSentence + '）')
  for (const s of pickSample(r.name, 2)) lines.push('- 第' + s.no + '章：' + s.text)
}

const spread = (v) => (v.length <= 3 ? v : [v[0], v[Math.floor(v.length / 2)], v[v.length - 1]])
const payload = { totals: { quotes, attributed }, rows, samples: Object.fromEntries([...samples].map(([k, v]) => [k, spread(v)])) }
console.log(JSON.stringify(payload))
