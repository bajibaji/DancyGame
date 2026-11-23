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
          className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-3 z-40 flex min-h-11 items-center gap-1.5 rounded-[14px] border border-accent/40 bg-bg-deep/95 px-3.5 text-xs text-accent shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur active:bg-accent/15"
        >
          <Undo2 size={14} aria-hidden />
          撤销
        </button>
      )}
    </>
  )
}
