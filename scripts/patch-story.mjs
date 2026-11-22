import fs from 'node:fs'
import path from 'node:path'

const dir = 'src/content/story'
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
const data = new Map()
for (const f of files) {
  data.set(f, JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
}

const nextFix = {
  p08: 'c0101',
  c0110: 'c0201',
  c0209: 'c0301',
  c0309: 'c0401',
  c0409: 'c0501',
  c0510: 'c0601',
  c0610: 'c0701',
}

for (const chapter of data.values()) {
  for (const scene of chapter.scenes) {
    if (nextFix[scene.id] && scene.next) {
      scene.next = nextFix[scene.id]
    }
    if (scene.ending === 'auto') {
      delete scene.next
    }
  }
}

function findScene(id) {
  for (const chapter of data.values()) {
    const scene = chapter.scenes.find((s) => s.id === id)
    if (scene) return scene
  }
  return null
}

const c0609 = findScene('c0609')
if (c0609) {
  c0609.effects = c0609.effects ?? {}
  c0609.effects.clues = Array.from(new Set([...(c0609.effects.clues ?? []), 'C22', 'C25']))
  c0609.effects.flags = Array.from(new Set([...(c0609.effects.flags ?? []), 'F61_XIE_XIAOLONG_TRUTH', 'F62_MEMORY_TRUTH']))
}

const c0708 = findScene('c0708')
if (c0708) {
  c0708.effects = c0708.effects ?? {}
  c0708.effects.clues = Array.from(new Set([...(c0708.effects.clues ?? []), 'C26']))
}

const c0506 = findScene('c0506')
if (c0506) {
  c0506.effects = c0506.effects ?? {}
  c0506.effects.flags = Array.from(new Set([...(c0506.effects.flags ?? []), 'F79_WEN_ALIVE']))
  c0506.effects.clues = Array.from(new Set([...(c0506.effects.clues ?? []), 'C17', 'C18']))
}

const c0303 = findScene('c0303')
if (c0303) {
  c0303.effects = c0303.effects ?? {}
  c0303.effects.clues = Array.from(new Set([...(c0303.effects.clues ?? []), 'C13']))
}

for (const [f, chapter] of data) {
  fs.writeFileSync(path.join(dir, f), JSON.stringify(chapter, null, 1) + '\n', 'utf8')
}

const missing = ['p08', 'c0110', 'c0209', 'c0309', 'c0409', 'c0510', 'c0610'].filter((id) => {
  const scene = findScene(id)
  return !scene || !scene.next
})
if (missing.length > 0) {
  console.log('missing scenes:', missing.join(','))
} else {
  console.log('story links patched')
}
