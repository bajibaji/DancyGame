import type { Chapter, Scene } from '../game/types'
export function resolveChapters(chapters: readonly { chapter: string; title: string; scenes: (Partial<Scene> & { id: string; inherits?: string })[] }[]): Chapter[]
