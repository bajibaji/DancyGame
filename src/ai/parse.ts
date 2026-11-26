import type { ChoiceKey, GeneratedOption, GeneratedScene, Quest, StatePatch, WorldState } from './world'
import { REALMS } from './world'

export function narrationOf(text: string): string {
  const cut = text.split('【系统】')[0]?.split('【选项】')[0] ?? ''
  return cut.replace(/^\s*【正文】\s*/, '').trim()
}

function parseSystem(text: string): string {
  const section = text.split('【系统】')[1]?.split('【选项】')[0] ?? ''
  return section.trim().slice(0, 120)
}

function parseOptions(text: string): GeneratedOption[] {
  const section = text.split('【选项】')[1]?.split('【状态】')[0] ?? ''
  const found: GeneratedOption[] = []
  for (const match of section.matchAll(/^\s*([ABC])\s*[.、．:：]\s*(.+)$/gm)) {
    const key = match[1] as ChoiceKey
    if (found.some((option) => option.key === key)) continue
    found.push({ key, label: match[2].trim().replace(/^[「『"]|[」』"]$/g, '') })
  }
  return found
}

function parsePatch(text: string): StatePatch {
  const section = text.split('【状态】')[1] ?? ''
  const start = section.indexOf('{')
  const end = section.lastIndexOf('}')
  if (start === -1 || end <= start) return {}
  try {
    return JSON.parse(section.slice(start, end + 1)) as StatePatch
  } catch {
    return {}
  }
}

export function parseScene(text: string): GeneratedScene {
  const options = parseOptions(text)
  if (options.length !== 3) {
    throw new Error('这一幕没有生成完整的三个选项')
  }
  return { narration: narrationOf(text), system: parseSystem(text), options, patch: parsePatch(text) }
}

function mergeTasks(existing: Quest[], incoming: Quest[]): Quest[] {
  const next = existing.map((task) => ({ ...task }))
  for (const task of incoming) {
    if (!task || typeof task.id !== 'string' || typeof task.title !== 'string' || !task.id || !task.title) continue
    const hit = next.find((item) => item.id === task.id)
    if (hit) {
      hit.title = task.title
      hit.done = Boolean(task.done)
    } else {
      next.push({ id: task.id, title: task.title, done: Boolean(task.done) })
    }
  }
  return next
}

export function applyPatch(state: WorldState, patch: StatePatch): WorldState {
  const next: WorldState = {
    ...state,
    stats: { ...state.stats },
    relations: { ...state.relations },
    flags: [...state.flags],
    inventory: [...state.inventory],
    tasks: state.tasks.map((task) => ({ ...task })),
    recent: [...state.recent],
  }

  if (typeof patch.age === 'number' && patch.age > state.age) next.age = Math.min(state.age + 1, patch.age)
  if (typeof patch.progress === 'number' && Number.isFinite(patch.progress)) next.progress = Math.max(0, Math.round(patch.progress))
  if (typeof patch.progressGoal === 'number' && Number.isFinite(patch.progressGoal) && patch.progressGoal > 0) {
    next.progressGoal = Math.round(patch.progressGoal)
  }

  const level = state.realmLevel
  if (typeof patch.realmLevel === 'number' && patch.realmLevel > level) {
    next.realmLevel = Math.min(level + 1, patch.realmLevel)
    next.realmName = REALMS[next.realmLevel] ?? state.realmName
    next.progress = 0
  } else if (typeof patch.realmName === 'string' && patch.realmName.trim()) {
    next.realmName = patch.realmName.trim()
  }

  if (typeof patch.location === 'string' && patch.location.trim()) next.location = patch.location.trim()
  if (typeof patch.gameTime === 'string' && patch.gameTime.trim()) next.gameTime = patch.gameTime.trim()
  if (typeof patch.summary === 'string' && patch.summary.trim()) next.summary = patch.summary.trim().slice(0, 240)

  for (const [key, value] of Object.entries(patch.stats ?? {})) {
    if (typeof value === 'number' && Number.isFinite(value)) next.stats[key] = Math.round(value * 10) / 10
  }
  for (const [key, value] of Object.entries(patch.relations ?? {})) {
    if (typeof value === 'number' && Number.isFinite(value)) next.relations[key] = Math.min(100, Math.max(-100, Math.round(value)))
  }
  for (const flag of patch.flags ?? []) {
    if (typeof flag === 'string' && flag && !next.flags.includes(flag)) next.flags.push(flag)
  }
  for (const item of patch.inventory ?? []) {
    if (typeof item === 'string' && item && !next.inventory.includes(item)) next.inventory.push(item)
  }
  next.tasks = mergeTasks(next.tasks, patch.tasks ?? [])
  return next
}

export function recordTurn(state: WorldState, narration: string, choice?: string): WorldState {
  const entry = { turn: state.turn + 1, choice, narration: narration.slice(0, 800) }
  return { ...state, turn: entry.turn, recent: [...state.recent.slice(-7), entry] }
}
