import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AiStore {
  apiKey: string
  model: string
  baseUrl: string
  setConfig: (patch: Partial<Pick<AiStore, 'apiKey' | 'model' | 'baseUrl'>>) => void
}

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'deepseek-chat',
      baseUrl: 'https://api.deepseek.com',
      setConfig: (patch) => set(patch),
    }),
    { name: 'jiage.ai.v1', version: 1 },
  ),
)
