import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type TextSpeed = 'slow' | 'normal' | 'fast' | 'instant'
export type FontSize = 'small' | 'medium' | 'large'

interface SettingsStore {
  textSpeed: TextSpeed
  fontSize: FontSize
  reducedMotion: boolean
  autoAdvance: boolean
  setTextSpeed: (speed: TextSpeed) => void
  setFontSize: (size: FontSize) => void
  setReducedMotion: (value: boolean) => void
  setAutoAdvance: (value: boolean) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      textSpeed: 'instant',
      fontSize: 'medium',
      reducedMotion: false,
      autoAdvance: false,
      setTextSpeed: (textSpeed) => set({ textSpeed }),
      setFontSize: (fontSize) => set({ fontSize }),
      setReducedMotion: (reducedMotion) => set({ reducedMotion }),
      setAutoAdvance: (autoAdvance) => set({ autoAdvance }),
    }),
    { name: 'jiangjia.settings.v2', version: 2 },
  ),
)

export const SPEED_MS: Record<TextSpeed, number> = {
  slow: 22,
  normal: 10,
  fast: 4,
  instant: 0,
}

export const FONT_SCALE: Record<FontSize, number> = {
  small: 0.92,
  medium: 1,
  large: 1.1,
}
