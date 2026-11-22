import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type FontSize = 'small' | 'medium' | 'large'
export type ReadingMode = 'single' | 'linear'

interface SettingsStore {
  textSpeed: TextSpeed
  fontSize: FontSize
  readingMode: ReadingMode
  reducedMotion: boolean
  autoAdvance: boolean
  setTextSpeed: (speed: TextSpeed) => void
  setFontSize: (size: FontSize) => void
  setReadingMode: (mode: ReadingMode) => void
  setReducedMotion: (value: boolean) => void
  setAutoAdvance: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      textSpeed: 'fast',
      fontSize: 'small',
      readingMode: 'single',
      reducedMotion: false,
      autoAdvance: false,
      setTextSpeed: (textSpeed) => set({ textSpeed }),
      setFontSize: (fontSize) => set({ fontSize }),
      setReadingMode: (readingMode) => set({ readingMode }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setAutoAdvance: (autoAdvance) => set({ autoAdvance }),
    }),
    { name: 'jiangjia.settings.v3', version: 3 },
  ),
)

export const SPEED_MS: Record<TextSpeed, number> = {
  slow: 28,
  normal: 16,
  fast: 8,
  instant: 0,
}

export const FONT_SCALE: Record<FontSize, number> = {
  small: 0.92,
  medium: 1,
  large: 1.1,
}
