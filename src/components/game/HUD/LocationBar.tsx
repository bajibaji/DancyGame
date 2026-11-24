import type { LocationCard } from '../../../content/index'
import { chapterTitle } from '../../../content/index'
import type { WorldLine } from '../../../game/types'

interface LocationBarProps {
  location: LocationCard | undefined
  timeOfDay: string
  chapter: string
  line?: WorldLine
}

const LINE_LABEL: Record<WorldLine, string> = { order: '顺', loss: '逆', neutral: '悬' }

export default function LocationBar({ location, timeOfDay, chapter, line = 'neutral' }: LocationBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle/60 px-4 py-2 text-xs text-text-secondary md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-accent">杭州</span>
        <span className="truncate">
          {location ? `${location.district} · ${location.name}` : '未知地点'}
        </span>
        <span className="shrink-0 text-text-dim">｜{timeOfDay}</span>
      </div>
      <span className="flex shrink-0 items-center gap-2">
        <span
          className={`rounded-sm border px-1.5 py-0.5 ${line === 'order' ? 'border-clue/50 text-clue' : line === 'loss' ? 'border-danger/50 text-danger' : 'border-border-subtle text-text-dim'}`}
          title={`局面：${LINE_LABEL[line]}`}
        >
          {LINE_LABEL[line]}
        </span>
        <span className="font-display text-text-secondary">{chapterTitle(chapter)}</span>
      </span>
    </div>
  )
}
