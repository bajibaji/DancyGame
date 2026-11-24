import { useEffect, useRef, useState } from 'react'
import { RATIO, ratio, statCapsThrough, type StatCaps } from '../../../game/balance'
import { INITIAL_META } from '../../../game/engine'
import type { GameMeta } from '../../../game/types'

interface StatMetersProps {
  meta: GameMeta
  chapter?: string
}

type Tone = { color: string; label: string }
type Flash = 'good' | 'bad' | null

const GREEN = 'var(--color-success)'
const YELLOW = 'var(--color-warning)'
const RED = 'var(--color-danger)'

function clueTone(value: number, caps: StatCaps): Tone {
  const r = ratio(value, caps.clue)
  if (r >= RATIO.good.clue) return { color: GREEN, label: '够用' }
  if (r >= RATIO.good.clue * 0.78) return { color: YELLOW, label: '吃紧' }
  return { color: RED, label: '不足' }
}

function relationTone(value: number, caps: StatCaps): Tone {
  const r = ratio(value, caps.relation)
  if (r >= RATIO.good.relation) return { color: GREEN, label: '信任' }
  if (r > RATIO.bad.relation) return { color: YELLOW, label: '磨合' }
  return { color: RED, label: '疏离' }
}

function dangerTone(value: number, caps: StatCaps): Tone {
  const r = ratio(value, caps.danger)
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

function Meter({ label, value, max, color, tone, flash, revealed }: { label: string; value: number; max: number; color: string; tone: Tone; flash: Flash; revealed: boolean }) {
  const percent = Math.round(Math.min(1, ratio(value, max)) * 100)
  return (
    <div className="relative grid grid-cols-[max-content_minmax(0,1fr)_3em] items-center gap-x-2 text-[10px]/[0.75rem]">
      {revealed && <meter className="sr-only" min={0} max={100} value={percent} aria-label={label} aria-valuetext={`${percent}% · ${tone.label}`} />}
      <span aria-hidden className="flex items-center gap-1.5 whitespace-nowrap tracking-[0.1em] text-text-dim">
        <span className="h-[5px] w-[5px] rounded-full" style={{ background: revealed ? color : 'var(--color-border-strong)', opacity: revealed ? 0.8 : 0.55 }} />
        {label}
        {revealed && <span className="tracking-normal" style={{ color: tone.color, opacity: 0.85 }}>{tone.label}</span>}
      </span>
      {revealed ? (
        <>
          <div aria-hidden className="h-[3px] rounded-[1px] bg-border/45">
            <div
              className={`h-full rounded-[1px] motion-safe:transition-[width,background-color] motion-safe:duration-300 ${flashClass(flash)}`}
              style={{ width: `${percent}%`, background: tone.color, opacity: 0.9 }}
            />
          </div>
          <span aria-hidden className="tabular text-end text-text-secondary">{percent}%</span>
        </>
      ) : (
        <>
          <div aria-hidden className="h-[3px] rounded-[1px] bg-border/30" />
          <span aria-hidden className="tabular text-end text-text-dim/70">？？</span>
        </>
      )}
    </div>
  )
}

export default function StatMeters({ meta, chapter }: StatMetersProps) {
  const caps = statCapsThrough(chapter)
  const [revealed, setRevealed] = useState<Record<'clue' | 'relation' | 'danger', boolean>>({
    clue: meta.clue !== INITIAL_META.clue,
    relation: meta.relation !== INITIAL_META.relation,
    danger: meta.danger !== INITIAL_META.danger,
  })
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

  useEffect(() => {
    setRevealed((prev) => ({
      clue: prev.clue || meta.clue !== INITIAL_META.clue,
      relation: prev.relation || meta.relation !== INITIAL_META.relation,
      danger: prev.danger || meta.danger !== INITIAL_META.danger,
    }))
  }, [meta.clue, meta.relation, meta.danger])

  return (
    <div className="grid gap-y-[3px]">
      <Meter label="线索" value={meta.clue} max={caps.clue} color="var(--color-clue)" tone={clueTone(meta.clue, caps)} flash={flashes.clue} revealed={revealed.clue} />
      <Meter label="关系" value={meta.relation} max={caps.relation} color="var(--color-success)" tone={relationTone(meta.relation, caps)} flash={flashes.relation} revealed={revealed.relation} />
      <Meter label="危险" value={meta.danger} max={caps.danger} color={dangerTone(meta.danger, caps).color} tone={dangerTone(meta.danger, caps)} flash={flashes.danger} revealed={revealed.danger} />
    </div>
  )
}
