import { useEffect, useRef } from 'react'
import { Route, Routes, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import TitlePage from './pages/TitlePage'
import StoryPage from './pages/StoryPage'
import ArchivePage from './pages/ArchivePage'
import EndingPage from './pages/EndingPage'
import SettingsPage from './pages/SettingsPage'
import { FONT_SCALE, useSettingsStore } from './stores/settingsStore'
import { useGameSession } from './game/useGameSession'
import ResumeRecap from './components/game/ResumeRecap'

const EASE = [0.32, 0.72, 0, 1] as const

export default function App() {
  useGameSession()
  const fontSize = useSettingsStore((s) => s.fontSize)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const location = useLocation()
  const idx = ((window.history.state as { idx?: number } | null)?.idx ?? 0)
  const prevIdx = useRef(idx)
  const back = idx < prevIdx.current

  useEffect(() => {
    prevIdx.current = idx
  }, [idx])

  useEffect(() => {
    document.documentElement.style.setProperty('--fs-scale', String(FONT_SCALE[fontSize]))
    document.documentElement.dataset.readingSize = fontSize
  }, [fontSize])

  return (
    <>
    <ResumeRecap />
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reducedMotion ? false : { x: back ? -28 : 28, opacity: 0, scale: 0.992 }}
        animate={reducedMotion ? undefined : { x: 0, opacity: 1, scale: 1 }}
        exit={reducedMotion ? undefined : { opacity: 0, scale: 0.982, transition: { duration: 0.12, ease: EASE } }}
        transition={{ duration: reducedMotion ? 0 : 0.32, ease: EASE }}
        className="min-h-dvh"
      >
        <Routes location={location}>
          <Route path="/" element={<TitlePage />} />
          <Route path="/story" element={<StoryPage />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/puzzle" element={<Navigate to="/archive" replace />} />
          <Route path="/ending" element={<EndingPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<TitlePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
    </>
  )
}
