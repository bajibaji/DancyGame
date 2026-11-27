import { useEffect } from 'react'
import { useGameStore } from '../stores/gameStore'

export function useGameSession(): void {
  useEffect(() => {
    const enter = () => {
      if (document.visibilityState === 'visible') useGameStore.getState().enterSession(Date.now())
    }
    const leave = () => useGameStore.getState().recordActive(Date.now())
    const visibility = () => document.visibilityState === 'visible' ? enter() : leave()
    enter()
    document.addEventListener('visibilitychange', visibility)
    const pageHide = () => {
      if (document.visibilityState === 'visible') leave()
    }
    window.addEventListener('pagehide', pageHide)
    window.addEventListener('pageshow', enter)
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') leave()
    }, 60_000)
    return () => {
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', pageHide)
      window.removeEventListener('pageshow', enter)
      window.clearInterval(timer)
      if (document.visibilityState === 'visible') leave()
    }
  }, [])
}
