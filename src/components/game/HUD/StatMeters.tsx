import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, Heart, Search } from 'lucide-react'
import { RATIO, ratio, statCaps } from '../../../game/balance'
import type { GameMeta } from '../../../game/types'

interface StatMetersProps {
  meta: GameMeta
}

type Tone = { color: string; label: string }
type Flash = 'good' | 'bad' | null

const GREEN = 'var(--color-success)'
const YELLOW = 'var(--color-warning)'
const RED = 'var(--color-danger)'

const CAPS = statCaps()

function clueTone(value: number): Tone {
  const r = ratio(value, CAPS.clue)
  if (r >= RATIO.good.clue) return { color: GREEN, label: '够用' }
  if (r >= RATIO.good.clue * 0.78) return { color: YELLOW, label: '吃紧' }
  return { color: RED, label: '不足' }
}

function relationTone(value: number): Tone {
  const r = ratio(value, CAPS.relation)
  if (r >= RATIO.good.relation) return { color: GREEN, label: '信任' }
  if (r > RATIO.bad.relation) return { color: YELLOW, label: '磨合' }
  return { color: RED, label: '疏离' }
}

function dangerTone(value: number): Tone {
  const r = ratio(value, CAPS.danger)
  if (r >= RATIO.bad.danger) return { color: RED, label: '暴露' }
  if (r >= RATIO.bad.danger * 0.5) return { color: YELLOW, label: '警戒' }
  return { color: GREEN, label: '稳定' }
}

const flashClass = (flash: Flash) =>
  flash === 'good'
    ? 'animate-[flash-good_0.9s_ease-out]'
    : flash === 'bad'
      ? 'animate-[flash-bad_0.9s_ease-out]'
      : ''

function Meter({ label, value, max, color, icon, tone, flash }: { label: string; value: number; max: number; color: string; icon: ReactNode; tone: Tone; flash: Flash }) {
  const percent = Math.round(Math.min(1, ratio(value, max)) * 100)
  const display = `${percent}%`
  return (
    <div className="relative grid grid-cols-[max-content_minmax(0,1fr)_3em] items-center gap-x-1.5 text-[0.6875rem]/[0.75rem]">
      <meter className="sr-only" min={0} max={100} value={percent} aria-label={label} aria-valuetext={`${display} · ${tone.label}`} />
      <span aria-hidden className="flex items-center gap-1 whitespace-nowrap text-text-secondary">
        <span style={{ color }}>{icon}</span>
        {label}
        <span style={{ color: tone.color }}>{tone.label}</span>
      </span>
      <div aria-hidden className="h-1 rounded-full bg-border">
        <div
          className={`h-full rounded-full motion-safe:transition-[width,background-color] motion-safe:duration-300 ${flashClass(flash)}`}
          style={{ width: display, background: tone.color }}
        />
      </div>
      <span aria-hidden className="tabular text-end" style={{ color: tone.color }}>{display}</span>
    </div>
  )
}

export default function StatMeters({ meta }: StatMetersProps) {
  const [flashes, setFlashes] = useState<Record<'clue' | 'relation' | 'danger', Flash>>({
    clue: null,
    relation: null,
    danger: null,
  })
  const previous = useRef<GameMeta | null>(null)

  useEffect(() => {
    const before = previous.current
    previous.current = meta
    if (!before) return
    const direction = (key: 'clue' | 'relation'): Flash =>
      meta[key] === before[key] ? null : meta[key] > before[key] ? 'good' : 'bad'
    const danger: Flash = meta.danger === before.danger ? null : meta.danger > before.danger ? 'bad' : 'good'
    setFlashes({ clue: direction('clue'), relation: direction('relation'), danger })
    const timer = setTimeout(() => setFlashes({ clue: null, relation: null, danger: null }), 900)
    return () => clearTimeout(timer)
  }, [meta])

  return (
    <div className="grid gap-y-px">
      <Meter label="线索" value={meta.clue} max={CAPS.clue} color="var(--color-clue)" icon={<Search size={11} strokeWidth={1.9} />} tone={clueTone(meta.clue)} flash={flashes.clue} />
      <Meter label="关系" value={meta.relation} max={CAPS.relation} color="var(--color-success)" icon={<Heart size={11} strokeWidth={1.9} />} tone={relationTone(meta.relation)} flash={flashes.relation} />
      <Meter label="危险" value={meta.danger} max={CAPS.danger} color={dangerTone(meta.danger).color} icon={<AlertTriangle size={11} strokeWidth={1.9} />} tone={dangerTone(meta.danger)} flash={flashes.danger} />
    </div>
  )
}
