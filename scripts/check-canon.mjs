import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'))

const meta = read('book/meta.json')
const characters = read('book/characters.json')
const events = read('book/events.json')
const evidence = read('book/evidence.json')
const relations = read('book/relations.json')
const places = read('book/places.json')
const mappings = read('book/mapping.json')
const differences = read('book/differences.json')
const chapterIndex = read('book/chapters_index.json')
const gameCharacters = read('src/content/characters.json')
const gameClues = read('src/content/clues.json')
const canonText = fs
  .readdirSync(path.join(root, 'book/parts'))
  .filter((file) => file.endsWith('.txt'))
  .sort()
  .map((file) => fs.readFileSync(path.join(root, 'book/parts', file), 'utf8'))
  .join('\n')

const errors = []
const fail = (message) => errors.push(message)
const statuses = new Set(['确证', '改名对应', '同名异义', '游戏原创'])
const [minChapter, maxChapter] = meta.source.chapterRange
const [minLine, maxLine] = meta.source.lineRange

function checkUnique(items, key, label) {
  const seen = new Set()
  for (const item of items) {
    if (seen.has(item[key])) fail(`${label} 重复：${item[key]}`)
    seen.add(item[key])
  }
  return seen
}

function checkAnchor(chapter, line, label) {
  if (!Number.isInteger(chapter) || chapter < minChapter || chapter > maxChapter) fail(`${label} 章节越界：${chapter}`)
  if (!Number.isInteger(line) || line < minLine || line > maxLine) fail(`${label} 行号越界：${line}`)
  const owner = chapterIndex.find((item) => line >= item.start_line && line <= item.end_line)
  if (!owner) fail(`${label} 行号不在任何章节内：${line}`)
  else if (owner.idx !== chapter) fail(`${label} 章号与行号不符：标第${chapter}章，行${line}属第${owner.idx}章`)
}

const characterNames = checkUnique(characters, 'name', '原著人物')
const aliases = new Set(characters.flatMap((item) => item.aliases ?? []))
const knownPeople = new Set([...characterNames, ...aliases])
const placeNames = checkUnique(places, 'name', '原著地点')
checkUnique(events, 'key', '事件编号')
const evidenceKeys = checkUnique(evidence, 'key', '证据编号')
checkUnique(mappings, 'gameId', '映射游戏编号')
checkUnique(differences, 'id', '差异编号')
checkUnique(gameCharacters, 'id', '游戏人物编号')
const clueIds = checkUnique(gameClues, 'id', '游戏线索编号')

for (const event of events) {
  checkAnchor(event.chapter, event.line, `事件 ${event.key}`)
  for (const name of event.participants) if (!knownPeople.has(name)) fail(`事件 ${event.key} 的人物未登记：${name}`)
}
for (const item of evidence) {
  checkAnchor(item.chapter, item.line, `证据 ${item.key}`)
  const owner = chapterIndex.find((entry) => item.line >= entry.start_line && item.line <= entry.end_line)
  if (owner && item.sinceChapter !== owner.idx) fail(`证据 ${item.key} 的知悉章号与行号不符：标${item.sinceChapter}章，行${item.line}属${owner.idx}章`)
  for (const name of item.whoKnows) if (!knownPeople.has(name)) fail(`证据 ${item.key} 的知情者未登记：${name}`)
  for (const id of item.gameClues) if (!clueIds.has(id)) fail(`证据 ${item.key} 的游戏线索不存在：${id}`)
}
for (const place of places) checkAnchor(place.chapter, place.line, `地点 ${place.name}`)
for (const relation of relations) {
  checkAnchor(relation.sinceChapter, relation.line, `关系 ${relation.from}-${relation.to}`)
  if (!knownPeople.has(relation.from) && !placeNames.has(relation.from)) fail(`关系起点未登记：${relation.from}`)
  if (!knownPeople.has(relation.to) && !placeNames.has(relation.to)) fail(`关系终点未登记：${relation.to}`)
}
for (const difference of differences) {
  for (const anchor of difference.anchors) checkAnchor(anchor.chapter, anchor.line, `差异 ${difference.id}`)
}

const evidenceByKey = new Map(evidence.map((item) => [item.key, item]))
const eventTitles = new Set(events.map((item) => item.title))
for (const item of evidence) if (eventTitles.has(item.title)) fail(`同一事实重复记账：${item.title}`)
for (const item of evidence) {
  for (const id of item.gameClues) {
    const mapping = mappings.find((entry) => entry.gameId === id)
    if (mapping && mapping.canonKey && mapping.canonKey !== item.key) fail(`证据 ${item.key} 声明的线索 ${id} 指向了另一条证据：${mapping.canonKey}`)
  }
}
const validGameIds = new Set([...gameCharacters.map((item) => item.id), ...clueIds])
const gameNameById = new Map([...gameCharacters.map((item) => [item.id, item.name]), ...gameClues.map((item) => [item.id, item.title])])
for (const mapping of mappings) {
  if (!validGameIds.has(mapping.gameId)) fail(`映射的游戏编号不存在：${mapping.gameId}`)
  if (mapping.gameName !== gameNameById.get(mapping.gameId)) fail(`映射的游戏名称不符：${mapping.gameId}`)
  if (!statuses.has(mapping.status)) fail(`映射状态不合法：${mapping.gameId} ${mapping.status}`)
  if (mapping.canonType === '人物' && mapping.canonName && !knownPeople.has(mapping.canonName)) fail(`映射的原著人物不存在：${mapping.canonName}`)
  if (mapping.gameType === '人物') {
    if (mapping.status === '游戏原创') {
      if (mapping.canonName) fail(`人物 ${mapping.gameId} 标为游戏原创，却填了原著对应：${mapping.canonName}`)
      if (canonText.includes(mapping.gameName)) fail(`人物 ${mapping.gameName} 标为游戏原创，但原著全书中出现了该名字，须重新判定`)
    } else if (!mapping.canonName) {
      fail(`人物映射缺少原著对应：${mapping.gameId}`)
    }
  }
  if (mapping.canonType === '证据') {
    if (!mapping.canonKey) {
      if (mapping.status !== '游戏原创') fail(`证据映射缺少原著锚点：${mapping.gameId}`)
    } else {
      if (mapping.status === '游戏原创') fail(`线索 ${mapping.gameId} 标为游戏原创，却填了原著锚点：${mapping.canonKey}`)
      const item = evidenceByKey.get(mapping.canonKey)
      if (!item) fail(`映射的原著证据不存在：${mapping.canonKey}`)
      else if (item.title !== mapping.canonName) fail(`映射标题与证据不符：${mapping.gameId}`)
      else if (!(item.gameClues ?? []).includes(mapping.gameId)) fail(`证据 ${item.key} 未声明反向线索：${mapping.gameId}`)
    }
  }
}

const releasedClueIds = new Set()
for (const id of ['prologue', 'ch01', 'ch02', 'ch03', 'ch04', 'ch05']) {
  const chapter = read(`src/content/story/${id}.json`)
  for (const scene of chapter.scenes) {
    const effects = [scene.effects, ...(scene.options ?? []).map((option) => option.effects)]
    for (const effect of effects) for (const clue of effect?.clues ?? []) releasedClueIds.add(clue)
  }
}
const mappingByGameId = new Map(mappings.map((item) => [item.gameId, item]))
for (const id of releasedClueIds) {
  const mapping = mappingByGameId.get(id)
  if (!mapping || mapping.status === '未覆盖') fail(`已发布线索未接入原著锚点：${id}`)
}

for (const [key, list] of Object.entries({
  characters,
  events,
  evidence,
  relations,
  places,
  mappings,
  differences
})) {
  if (meta.counts[key] !== list.length) fail(`数量记录不符：${key}`)
}

if (errors.length) {
  console.error(`原著锚点库校验失败：${errors.length} 项`)
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}
console.log(`原著锚点库校验通过：${events.length} 事件、${evidence.length} 证据、${mappings.length} 映射，已发布 ${releasedClueIds.size} 条线索全部锚定`)
