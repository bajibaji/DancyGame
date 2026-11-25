import fs from 'node:fs'
import path from 'node:path'

const storyDir = path.join(process.cwd(), 'src/content/story')
const outDir = path.join(process.cwd(), 'twine')

const clean = (text) => text.replace(/\]\]/g, '】】')

const chapters = fs
  .readdirSync(storyDir)
  .filter((file) => file.endsWith('.json'))
  .sort()
  .map((file) => ({ file, data: JSON.parse(fs.readFileSync(path.join(storyDir, file), 'utf8')) }))

const payloadOf = (chapter) => {
  const map = {}
  for (const scene of chapter.scenes) {
    map[scene.id] = {
      title: scene.title,
      next: scene.next,
      ending: scene.ending,
      locationId: scene.locationId,
      timeOfDay: scene.timeOfDay,
      effects: scene.effects,
      variants: scene.variants,
      worldVariants: scene.worldVariants,
      recalls: scene.recalls,
      followUps: scene.followUps,
      progress: scene.progress,
      puzzle: scene.puzzle,
      options: scene.options?.map((option) => ({
        key: option.key,
        tendency: option.tendency,
        risk: option.risk,
        effects: option.effects,
        consequence: option.consequence,
        progress: option.progress,
      })),
    }
  }
  return map
}

let out = ':: StoryTitle\n沙漏停摆\n\n'
out += `:: StoryData\n${JSON.stringify({ ifid: '9F2A0C44-7B31-4C0E-9A55-8D1B04A6C202', format: 'Harlowe', 'format-version': '3.3.9', start: chapters[0]?.data.scenes[0]?.id ?? '' }, null, 2)}\n\n`

for (const chapter of chapters) {
  for (const scene of chapter.data.scenes) {
    out += `:: ${scene.id} [${chapter.data.chapter}]\n`
    out += `${scene.title}\n\n`
    out += `${clean(scene.body)}\n\n`
    if (scene.options?.length) {
      for (const option of scene.options) out += `[[${option.key}. ${option.label}->${option.next}]]\n`
    } else if (scene.next) {
      out += `[[→ 下一幕->${scene.next}]]\n`
    }
    out += '\n'
  }
  out += `:: _data_${chapter.data.chapter} [payload]\n${JSON.stringify(payloadOf(chapter.data), null, 2)}\n\n`
}

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'story.twee'), out)
console.log(`已导出 ${chapters.length} 章到 twine/story.twee`)
