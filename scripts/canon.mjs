import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (name) => JSON.parse(fs.readFileSync(path.join(root, 'book', name), 'utf8'))
const [command, ...rest] = process.argv.slice(2)
const keyword = rest.join(' ')
const meta = read('meta.json')
const characters = read('characters.json')
const events = read('events.json')
const evidence = read('evidence.json')
const mappings = read('mapping.json')
const differences = read('differences.json')
const anchor = (item) => `第${item.chapter}章 行${item.line}`

function overview() {
  console.log(`${meta.source.title}（${meta.source.author}）${meta.source.arc}单元，第${meta.source.chapterRange[0]}–${meta.source.chapterRange[1]}章`)
  console.log(`人物 ${meta.counts.characters}、事件 ${meta.counts.events}、证据 ${meta.counts.evidence}、关系 ${meta.counts.relations}、地点 ${meta.counts.places}、映射 ${meta.counts.mappings}、差异 ${meta.counts.differences}`)
  console.log(meta.note)
}

function people(query) {
  const hits = mappings.filter((item) => item.gameType === '人物' && (!query || item.gameName.includes(query) || (item.canonName ?? '').includes(query)))
  for (const item of hits) {
    const original = characters.find((person) => person.name === item.canonName)
    const where = original ? `第${original.firstChapter}章 行${original.firstLine}` : '无'
    console.log(`${item.gameName} → ${item.canonName ?? '无原著对应'}［${item.status}］${where}`)
    console.log(`  ${item.note}`)
    if (original) console.log(`  原著身份：${original.role}`)
  }
}

function clue(id) {
  const hits = mappings.filter((item) => item.gameType === '线索' && item.gameId.toLowerCase() === id.toLowerCase())
  if (!hits.length) {
    for (const item of evidence.filter((entry) => entry.gameClues.includes(id.toUpperCase()))) console.log(`${item.key} ${item.title} ${anchor(item)}：${item.detail}`)
    return
  }
  for (const item of hits) {
    console.log(`${item.gameId} ${item.gameName} → ${item.canonName ?? '无原著对应'}［${item.status}］`)
    console.log(`  ${item.note}`)
    for (const entry of evidence.filter((row) => row.gameClues.includes(item.gameId))) console.log(`  ${entry.key} ${anchor(entry)}：${entry.detail}（知情：${entry.whoKnows.join('、') || '未注明'}）`)
  }
}

function chapter(number) {
  const target = Number(number)
  for (const event of events.filter((item) => item.chapter === target)) console.log(`事件 ${event.key} ${event.title}${event.flashback ? '［插叙］' : ''}：${event.summary}（${event.participants.join('、')}）`)
  for (const item of evidence.filter((row) => row.chapter === target)) console.log(`证据 ${item.key} ${item.title}：${item.detail}（知情：${item.whoKnows.join('、') || '未注明'}）`)
}

function diff() {
  for (const item of differences) {
    const where = item.anchors.map(anchor).join('；') || '游戏原创'
    console.log(`${item.id} ${item.topic}［${where}］`)
    console.log(`  原著：${item.novel}`)
    console.log(`  游戏：${item.game}`)
    console.log(`  写稿注意：${item.impact}`)
  }
}

if (command === '总览') overview()
else if (command === '人物') people(keyword)
else if (command === '线索' && keyword) clue(keyword)
else if (command === '章节' && keyword) chapter(keyword)
else if (command === '差异') diff()
else console.log('用法：node scripts/canon.mjs 总览 | 人物 <姓名> | 线索 <编号> | 章节 <章号> | 差异')
