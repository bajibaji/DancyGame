import type { ReactNode } from 'react'
import { AlertTriangle, Brain, Heart, Search } from 'lucide-react'
import { LIMITS } from '../../../game/engine'
import type { GameMeta } from '../../../game/types'

interface StatMetersProps {
  meta: GameMeta
  showMemory: boolean
}

function Meter({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: ReactNode }) {
  const percent = Math.round((value / max) * 100)
  const display = `${percent}%`
  return (
    <div className="relative grid grid-cols-[max-content_minmax(0,1fr)_3em] items-center gap-x-1.5 text-[0.6875rem]/[0.75rem]">
      <meter className="sr-only" min={0} max={100} value={percent} aria-label={label} aria-valuetext={display} />
      <span aria-hidden className="flex items-center gap-1 whitespace-nowrap text-text-secondary">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <div aria-hidden className="h-1 overflow-hidden rounded-full bg-border">
        <div className="h-full rounded-full motion-safe:transition-[width] motion-safe:duration-300" style={{ width: display, background: color }} />
      </div>
      <span aria-hidden className="tabular text-end text-text-secondary">{display}</span>
    </div>
  )
}

export default function StatMeters({ meta, showMemory }: StatMetersProps) {
  return (
    <div className="grid gap-y-px">
      <Meter label="线索" value={meta.clue} max={LIMITS.clue[1]} color="var(--color-clue)" icon={<Search size={11} strokeWidth={1.9} />} />
      <Meter label="关系" value={meta.relation} max={LIMITS.relation[1]} color="var(--color-success)" icon={<Heart size={11} strokeWidth={1.9} />} />
      <Meter label="危险" value={meta.danger} max={LIMITS.danger[1]} color="var(--color-danger)" icon={<AlertTriangle size={11} strokeWidth={1.9} />} />
      {showMemory && <Meter label="记忆" value={meta.memory} max={LIMITS.memory[1]} color="var(--color-memory)" icon={<Brain size={11} strokeWidth={1.9} />} />}
    </div>
  )
}
