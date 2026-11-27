import type { EndingId, Epilogue, Scene } from '../game/types'
import type { CaptureStatus, MemoryStatus } from '../game/narrative'
import { resolveChapters } from './sceneInheritance.js'
import prologueJson from './story/prologue.json'
import ch01Json from './story/ch01.json'
import ch02Json from './story/ch02.json'
import ch03Json from './story/ch03.json'
import ch04Json from './story/ch04.json'
import ch05Json from './story/ch05.json'
import ch06Json from './story/ch06.json'
import ch07Json from './story/ch07.json'
import ch08Json from './story/ch08.json'
import ch09Json from './story/ch09.json'
import ch10Json from './story/ch10.json'
import ch11Json from './story/ch11.json'
import ch12Json from './story/ch12.json'
import ch13Json from './story/ch13.json'
import cluesJson from './clues.json'
import memoriesJson from './memories.json'
import locationsJson from './hz-locations.json'
import charactersJson from './characters.json'
import endingsJson from './endings.json'

export interface ClueCard {
  id: string
  title: string
  category: string
  description: string
}

export interface MemoryCard {
  id: string
  title: string
  body: string
}

export interface LocationCard {
  id: string
  name: string
  district: string
  detail: string
}

export interface CharacterCard {
  id: string
  name: string
  role: string
  note: string
}

export interface EndingData {
  name: string
  body: string
  caseStatus: Record<CaptureStatus, string>
  fallout?: { exposure: string; isolation: string }
  epilogues: Record<Epilogue, { label: string; text: string }>
  variants: { flag: string; text: string }[]
}

export const CHAPTERS = resolveChapters([
  prologueJson,
  ch01Json,
  ch02Json,
  ch03Json,
  ch04Json,
  ch05Json,
  ch06Json,
  ch07Json,
  ch08Json,
  ch09Json,
  ch10Json,
  ch11Json,
  ch12Json,
  ch13Json,
] as unknown as Parameters<typeof resolveChapters>[0])

export const SCENES = new Map<string, Scene>()
for (const chapter of CHAPTERS) {
  for (const scene of chapter.scenes) {
    SCENES.set(scene.id, scene)
  }
}

export const START_SCENE = 'p01a'

export function getScene(id: string): Scene | undefined {
  return SCENES.get(id)
}

export function getSceneBaseId(id: string): string {
  const scene = getScene(id)
  return scene?.inherits ? getSceneBaseId(scene.inherits) : id
}

export const CLUES: ClueCard[] = cluesJson as ClueCard[]
export const MEMORIES: MemoryCard[] = memoriesJson as MemoryCard[]
export const LOCATIONS: LocationCard[] = locationsJson as LocationCard[]
export const CHARACTERS: CharacterCard[] = charactersJson as CharacterCard[]
const { memoryRecap, ...endings } = endingsJson
export const ENDINGS: Record<EndingId, EndingData> = endings
export const ENDING_MEMORY: Record<MemoryStatus, string> = memoryRecap

export const CLUE_MAP = new Map(CLUES.map((c) => [c.id, c]))
export const MEMORY_MAP = new Map(MEMORIES.map((m) => [m.id, m]))
export const LOCATION_MAP = new Map(LOCATIONS.map((l) => [l.id, l]))

export function chapterTitle(chapterId: string): string {
  return CHAPTERS.find((c) => c.chapter === chapterId)?.title ?? chapterId
}
