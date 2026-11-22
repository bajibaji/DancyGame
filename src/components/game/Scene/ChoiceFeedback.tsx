import { motion, AnimatePresence } from 'motion/react'

interface ChoiceFeedbackProps {
  message: string | null
  canUndo: boolean
  onUndo: () => void
}

export default function ChoiceFeedback({ message, canUndo, onUndo }: ChoiceFeedbackProps) {
  return (
    <div className="pointer-events-none fixed bottom-24 left-1/2 z-30 -translate-x-1/2">
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-3 rounded-full border border-border bg-surface/95 px-4 py-2 text-xs text-text-secondary shadow-lg backdrop-blur"
          >
            <span>{message}</span>
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="rounded-full border border-accent/40 px-4 py-1.5 text-accent active:bg-accent/15"
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
