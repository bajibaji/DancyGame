import type { Scene } from '../../../game/types'

export default function SceneGuide({ guide }: { guide?: Scene['guide'] }) {
  if (!guide) return null
  return (
    <aside aria-label={guide.title} className="mt-5 rounded-[12px] border border-clue/25 bg-surface/60 px-4 py-3">
      <p className="mb-1 text-sm font-medium leading-relaxed text-clue">{guide.title}</p>
      <p className="text-[13px] leading-7 text-text-secondary">{guide.body}</p>
    </aside>
  )
}
