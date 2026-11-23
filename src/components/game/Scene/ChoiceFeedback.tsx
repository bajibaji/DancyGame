import { Undo2 } from 'lucide-react'

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
}

export default function ChoiceFeedback({ message, canUndo, onUndo }: ChoiceFeedbackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <span role="status" className="sr-only">{message}</span>
      {(message || canUndo) && (
        <div className="pointer-events-auto flex max-w-[430px] min-w-0 items-center gap-3 rounded-[18px] border border-border bg-surface/95 px-3 py-1 text-xs text-text-secondary shadow-lg backdrop-blur">
          {message && <span aria-hidden className="min-w-0 break-words">{message}</span>}
          {canUndo && (
            <button
              type="button"
              onClick={onUndo}
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-[18px] border border-accent/40 px-3 text-accent active:bg-accent/15"
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
