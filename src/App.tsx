import { useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import TitlePage from './pages/TitlePage'
import StoryPage from './pages/StoryPage'
import ArchivePage from './pages/ArchivePage'
import PuzzlePage from './pages/PuzzlePage'
import EndingPage from './pages/EndingPage'
import SettingsPage from './pages/SettingsPage'
import { FONT_SCALE, useSettingsStore } from './stores/settingsStore'

export default function App() {
  const fontSize = useSettingsStore((s) => s.fontSize)

  useEffect(() => {
    document.documentElement.style.setProperty('--fs-scale', String(FONT_SCALE[fontSize]))
  }, [fontSize])

  return (
    <Routes>
      <Route path="/" element={<TitlePage />} />
      <Route path="/story" element={<StoryPage />} />
      <Route path="/archive" element={<ArchivePage />} />
      <Route path="/puzzle" element={<PuzzlePage />} />
      <Route path="/ending" element={<EndingPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="*" element={<TitlePage />} />
    </Routes>
  )
}
