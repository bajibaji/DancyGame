import type { Chapter, Scene } from '../game/types'

export interface GameInfo {
  title: string
  subtitle: string
  kicker: string
  lines: string[]
  code: string
}

export const GAME: GameInfo = {
  title: '系统文',
  subtitle: '筹备中',
  kicker: '',
  lines: ['新作筹备中。', '文本、人物与系统设定将在文稿确定后写入。'],
  code: 'SYSTEM',
}

export const CHAPTERS: Chapter[] = []

export const SCENES = new Map<string, Scene>()
for (const chapter of CHAPTERS) {
  for (const scene of chapter.scenes) {
    SCENES.set(scene.id, scene)
  }
}

export const START_SCENE = ''

export function getScene(id: string): Scene | undefined {
  return SCENES.get(id)
}

export function chapterTitle(chapterId: string): string {
  return CHAPTERS.find((c) => c.chapter === chapterId)?.title ?? chapterId
}
