import type { LocationCard } from '../../../content/index'
import { chapterTitle } from '../../../content/index'

interface LocationBarProps {
  location: LocationCard | undefined
  timeOfDay: string
  chapter: string
}

export default function LocationBar({ location, timeOfDay, chapter }: LocationBarProps) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle/60 px-4 py-2 text-xs text-text-secondary md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="shrink-0 text-accent">杭州</span>
        <span className="truncate">
          {location ? `${location.district} · ${location.name}` : '未知地点'}
        </span>
        <span className="shrink-0 text-text-dim">｜{timeOfDay}</span>
      </div>
      <span className="shrink-0 font-display text-text-secondary">{chapterTitle(chapter)}</span>
    </div>
  )
}
