import { useEffect } from 'react'

export interface KeyHandlers {
  onChoice?: (key: 'A' | 'B' | 'C') => void
  onAdvance?: () => void
  onUndo?: () => void
  onEscape?: () => void
}

export function useGameKeys(handlers: KeyHandlers, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      const key = event.key.toUpperCase()
      if (key === 'A' || key === '1') handlers.onChoice?.('A')
      else if (key === 'B' || key === '2') handlers.onChoice?.('B')
      else if (key === 'C' || key === '3') handlers.onChoice?.('C')
      else if (key === ' ' || key === 'ENTER') {
        if (target && (target.tagName === 'BUTTON' || target.tagName === 'A')) return
        event.preventDefault()
        handlers.onAdvance?.()
      } else if (key === 'Z') handlers.onUndo?.()
      else if (key === 'ESCAPE') handlers.onEscape?.()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers, enabled])
}
