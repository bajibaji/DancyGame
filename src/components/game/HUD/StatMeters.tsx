import type { GameMeta } from '../../../game/types'

interface StatMetersProps {
  meta: GameMeta
  showMemory: boolean
}

function Meter({ label, value, max, color, icon }: { label: string; value: number; max: number; color: string; icon: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap" title={`${label} ${value}/${max}`}>
      <span aria-hidden className="text-[10px]" style={{ color }}>{icon}</span>
      <span className="text-[10px] text-text-secondary">{label}</span>
      <div className="h-1.5 w-8 overflow-hidden rounded-full bg-bg-sunken md:w-16">
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="tabular text-[10px] text-text-dim">{value}</span>
    </div>
  )
}

export default function StatMeters({ meta, showMemory }: StatMetersProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
      <Meter label="线索" value={meta.clue} max={30} color="var(--color-clue)" icon="◈" />
      <Meter label="关系" value={meta.relation} max={10} color="var(--color-success)" icon="❖" />
      <Meter label="危险" value={meta.danger} max={10} color="var(--color-danger)" icon="▲" />
      {showMemory && <Meter label="记忆" value={meta.memory} max={10} color="var(--color-memory)" icon="◇" />}
    </div>
  )
}
