import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReasoningEffort } from '../ai/client'

export type { ReasoningEffort }

interface AiStore {
  apiKey: string
  model: string
  baseUrl: string
  effort: ReasoningEffort
  setConfig: (patch: Partial<Pick<AiStore, 'apiKey' | 'model' | 'baseUrl' | 'effort'>>) => void
}

export const useAiStore = create<AiStore>()(
  persist(
    (set) => ({
      apiKey: '',
      model: 'deepseek-flash',
      baseUrl: 'https://api.deepseek.com',
      effort: 'none',
      setConfig: (patch) => set(patch),
    }),
    {
      name: 'jiage.ai.v1',
      version: 2,
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<AiStore>
        if (version < 2) {
          return {
            ...state,
            model: state.model === 'deepseek-chat' || !state.model ? 'deepseek-flash' : state.model,
            effort: state.effort ?? 'none',
          }
        }
        return state
      },
    },
  ),
)
