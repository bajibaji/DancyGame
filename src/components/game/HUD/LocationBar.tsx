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

const LINE_DOT: Record<WorldLine, string> = {
  order: 'bg-clue',
  loss: 'bg-danger',
  neutral: 'bg-text-dim/55',
}

export default function LocationBar({ location, timeOfDay, chapter, line = 'neutral' }: LocationBarProps) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border-subtle/40 px-4 py-[7px] md:px-6">
      <div className="flex min-w-0 items-baseline gap-2">
        <span className="shrink-0 text-[10px] leading-none tracking-[0.16em] text-accent/75">杭州</span>
        <span className="min-w-0 truncate text-[12px] leading-none text-text-secondary">
          {location ? `${location.district} · ${location.name}` : '未知地点'}
        </span>
        <span className="shrink-0 text-[10px] leading-none text-text-dim/40">/</span>
        <span className="shrink-0 text-[10px] leading-none text-text-dim">{timeOfDay}</span>
      </div>
      <span className="flex shrink-0 items-center gap-3">
        <span className="flex items-center gap-1.5 text-[10px] leading-none text-text-dim" title={`局面：${LINE_LABEL[line]}`}>
          <span aria-hidden className={`h-[5px] w-[5px] rounded-full ${LINE_DOT[line]}`} />
          {LINE_LABEL[line]}
        </span>
        <span className="font-display text-[11px] leading-none tracking-[0.14em] text-text-secondary">
          {chapterTitle(chapter)}
        </span>
      </span>
    </div>
  )
}
