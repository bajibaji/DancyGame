import { Undo2 } from 'lucide-react'

interface StatDelta {
  key: 'clue' | 'relation' | 'danger'
  label: string
  value: number
}

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
  deltas?: StatDelta[]
}

function deltaTone(delta: StatDelta): string {
  if (delta.key === 'danger') return delta.value > 0 ? 'text-danger' : 'text-success'
  return delta.value > 0 ? 'text-success' : 'text-danger'
}

export default function ChoiceFeedback({ message, canUndo, onUndo, deltas = [] }: ChoiceFeedbackProps) {
  const status = [message, ...deltas.map((delta) => `${delta.label}${delta.value > 0 ? '+' : ''}${delta.value}`)]
    .filter(Boolean)
    .join('，')

  return (
    <div className="shrink-0">
      <span role="status" className="sr-only">{status}</span>
      {(message || canUndo || deltas.length > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-border-subtle/50 bg-surface/95 px-5 py-1 text-xs">
          {message && <span aria-hidden className="min-w-0 flex-1 break-words py-1 leading-relaxed text-success">{message}</span>}
          {deltas.length > 0 && (
            <span aria-hidden className="flex shrink-0 items-center gap-2 py-1 tabular">
              {deltas.map((delta) => (
                <span key={delta.key} className={deltaTone(delta)}>
                  {delta.label}
                  {delta.value > 0 ? '+' : ''}
                  {delta.value}
                </span>
              ))}
            </span>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="ms-auto flex min-h-11 shrink-0 items-center gap-1 rounded-[18px] border border-accent/40 px-3 text-accent active:bg-accent/15"
            >
              <Undo2 size={14} aria-hidden />
              撤销
            </button>
          )}
        </div>
      )}
    </div>
  )
}
