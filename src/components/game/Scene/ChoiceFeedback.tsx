import { Undo2 } from 'lucide-react'

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
}

export default function ChoiceFeedback({ message, canUndo, onUndo }: ChoiceFeedbackProps) {
  return (
    <div className="shrink-0">
      <span role="status" className="sr-only">{message}</span>
      {(message || canUndo) && (
        <div className="flex items-center gap-4 border-b border-border-subtle/50 bg-surface/95 px-5 py-1 text-xs">
          {message && <span aria-hidden className="min-w-0 flex-1 break-words py-1 leading-relaxed text-success">{message}</span>}
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
