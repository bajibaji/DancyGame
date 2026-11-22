import { motion, AnimatePresence } from 'motion/react'

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
}

export default function ChoiceFeedback({ message, canUndo, onUndo }: ChoiceFeedbackProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-[calc(env(safe-area-inset-top)+0.5rem)]">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex max-w-[430px] items-center gap-3 rounded-[18px] border border-border bg-surface/95 px-4 py-2 text-xs text-text-secondary shadow-lg backdrop-blur"
          >
            <span>{message}</span>
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="rounded-[18px] border border-accent/40 px-4 py-1.5 text-accent active:bg-accent/15"
              >
                撤销
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
