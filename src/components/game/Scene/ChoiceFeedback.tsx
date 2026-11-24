import { Undo2 } from 'lucide-react'

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
}

export default function ChoiceFeedback({ message, canUndo, onUndo }: ChoiceFeedbackProps) {
  if (!message && !canUndo) return null
  return (
    <>
      <span role="status" className="sr-only">{message}</span>
      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-40 flex min-h-11 items-center gap-1.5 rounded-[12px] border border-border bg-bg-deep/90 px-3 text-[11px] tracking-[0.06em] text-text-secondary shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur active:bg-surface"
        >
          <Undo2 size={14} aria-hidden />
          撤销
        </button>
      )}
    </>
  )
}
