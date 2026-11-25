import fs from 'node:fs'
import path from 'node:path'

const storyDir = path.join(process.cwd(), 'src/content/story')
const source = process.argv[2] ?? path.join(process.cwd(), 'twine/story.twee')

const parseTwee = (text) => {
  const passages = []
  let current = null
  for (const line of text.split(/\r?\n/)) {
    const match = /^::\s*(.+?)(?:\s*\[([^\]]*)\])?\s*$/.exec(line)
    if (match) {
      if (current) passages.push(current)
      current = { name: match[1].trim(), tags: match[2] ? match[2].split(/\s+/).filter(Boolean) : [], lines: [] }
      continue
    }
    if (current) current.lines.push(line)
  }
  if (current) passages.push(current)
  return passages.map((passage) => ({ ...passage, body: passage.lines.join('\n').trim() }))
}

const LINK = /\[\[(.+?)->(.+?)\]\]/g

const splitPassage = (body) => {
  const links = [...body.matchAll(LINK)].map((match) => ({ label: match[1].trim(), target: match[2].trim() }))
  const text = body.replace(LINK, '').replace(/\n{3,}/g, '\n\n').trim()
  const lines = text.split('\n')
  const title = lines[0]?.trim() ?? ''
  const content = lines.slice(1).join('\n').trim()
  return { title, content, links }
}

const passages = parseTwee(fs.readFileSync(source, 'utf8'))
const payloads = new Map()
for (const passage of passages) {
  if (!passage.tags.includes('payload')) continue
  const chapter = passage.name.replace(/^_data_/, '')
  payloads.set(chapter, JSON.parse(passage.body))
}

const byName = new Map(passages.filter((passage) => !passage.tags.includes('payload')).map((passage) => [passage.name, passage]))

let updated = 0
let created = 0
const missing = []

const files = fs.readdirSync(storyDir).filter((file) => file.endsWith('.json')).sort()
for (const file of files) {
  const target = path.join(storyDir, file)
  const data = JSON.parse(fs.readFileSync(target, 'utf8'))
  const payload = payloads.get(data.chapter) ?? {}
  const scenes = []

  for (const scene of data.scenes) {
    const passage = byName.get(scene.id)
    if (!passage) {
      missing.push(scene.id)
      scenes.push(scene)
      continue
    }
    const { title, content, links } = splitPassage(passage.body)
    const optionLinks = links.filter((link) => /^[ABC]\./.test(link.label))
    const nextLink = links.find((link) => link.label.startsWith('→'))
    const nextScene = {
      ...scene,
      title: title || scene.title,
      body: content || scene.body,
    }
    if (optionLinks.length && scene.options?.length) {
      nextScene.options = scene.options.map((option) => {
        const link = optionLinks.find((item) => item.label.startsWith(`${option.key}.`))
        if (!link) return option
        return { ...option, label: link.label.replace(/^[ABC]\.\s*/, ''), next: link.target }
      })
    } else if (nextLink) {
      nextScene.next = nextLink.target
    }
    scenes.push(nextScene)
    updated++
  }

  for (const passage of byName.values()) {
    if (!passage.tags.includes(data.chapter)) continue
    if (data.scenes.some((scene) => scene.id === passage.name)) continue
    const { title, content, links } = splitPassage(passage.body)
    const base = payload[passage.name] ?? {}
    const optionLinks = links.filter((link) => /^[ABC]\./.test(link.label))
    const nextLink = links.find((link) => link.label.startsWith('→'))
    const scene = {
      id: passage.name,
      chapter: data.chapter,
      title: title || passage.name,
      locationId: base.locationId ?? 'hz-police',
      timeOfDay: base.timeOfDay ?? '上午',
      body: content,
      ...(base.effects ? { effects: base.effects } : {}),
      ...(base.variants ? { variants: base.variants } : {}),
      ...(base.worldVariants ? { worldVariants: base.worldVariants } : {}),
      ...(base.recalls ? { recalls: base.recalls } : {}),
      ...(base.followUps ? { followUps: base.followUps } : {}),
      ...(base.progress ? { progress: base.progress } : {}),
      ...(base.puzzle ? { puzzle: base.puzzle } : {}),
      ...(base.ending ? { ending: base.ending } : {}),
    }
    if (optionLinks.length && base.options) {
      scene.options = optionLinks.map((link, index) => {
        const option = base.options[index] ?? base.options[0] ?? {}
        return {
          key: (link.label[0] ?? 'A'),
          label: link.label.replace(/^[ABC]\.\s*/, ''),
          tendency: option.tendency ?? 'evidence',
          risk: option.risk ?? 'low',
          effects: option.effects ?? {},
          consequence: option.consequence ?? '',
          next: link.target,
        }
      })
    } else if (nextLink) {
      scene.next = nextLink.target
    }
    scenes.push(scene)
    created++
  }

  fs.writeFileSync(target, `${JSON.stringify({ ...data, scenes }, null, 1)}\n`)
}

console.log(`更新 ${updated} 幕，新增 ${created} 幕`)
if (missing.length) console.log(`以下场景在 Twine 里找不到，保持原样：${missing.join(', ')}`)
