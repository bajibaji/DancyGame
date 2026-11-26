import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedOption, GeneratedScene, WorldState } from '../ai/world'
import { INITIAL_WORLD } from '../ai/world'
import { applyPatch, narrationOf, parseScene, recordTurn } from '../ai/parse'
import { buildSystemPrompt, buildUserPrompt } from '../ai/prompt'
import { streamChat } from '../ai/client'
import { useAiStore } from './aiStore'

export interface SceneView {
  narration: string
  system: string
  options: GeneratedOption[]
}

interface StoryStore {
  world: WorldState
  scene: SceneView | null
  started: boolean
  status: 'idle' | 'generating' | 'ready' | 'error'
  streaming: string
  error: string | null
  start: () => void
  choose: (option: GeneratedOption) => void
  retry: () => void
  reset: () => void
}

let lastChoice: string | undefined
let busy = false

async function generate(choice: string | undefined, set: (partial: Partial<StoryStore>) => void, get: () => StoryStore): Promise<void> {
  if (busy) return
  const ai = useAiStore.getState()
  if (!ai.apiKey.trim()) {
    set({ status: 'error', error: '还没有填 DeepSeek 密钥，去设置里填一下。' })
    return
  }

  busy = true
  const { world } = get()
  const contextText = [world.summary, ...world.recent.map((entry) => entry.narration), choice ?? ''].join(' ')
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(world, contextText) },
    { role: 'user' as const, content: buildUserPrompt(world, choice) },
  ]

  set({ status: 'generating', streaming: '', error: null })
  try {
    const text = await streamChat(
      { apiKey: ai.apiKey.trim(), model: ai.model.trim() || 'deepseek-chat', baseUrl: ai.baseUrl.trim() || 'https://api.deepseek.com' },
      messages,
      (_delta, full) => set({ streaming: narrationOf(full) }),
    )
    const scene: GeneratedScene = parseScene(text)
    const nextWorld = recordTurn(applyPatch(world, scene.patch), scene.narration, choice)
    lastChoice = undefined
    set({
      world: nextWorld,
      scene: { narration: scene.narration, system: scene.system, options: scene.options },
      status: 'ready',
      streaming: '',
    })
  } catch (error) {
    set({
      status: 'error',
      error: error instanceof Error ? error.message : String(error),
      streaming: '',
    })
  } finally {
    busy = false
  }
}

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      world: INITIAL_WORLD,
      scene: null,
      started: false,
      status: 'idle',
      streaming: '',
      error: null,
      start: () => {
        const state = get()
        if (state.scene) {
          set({ started: true, status: 'ready' })
          return
        }
        set({ started: true })
        void generate(undefined, set, get)
      },
      choose: (option) => {
        const state = get()
        if (state.status !== 'ready' || !state.scene) return
        lastChoice = option.label
        void generate(option.label, set, get)
      },
      retry: () => {
        void generate(lastChoice, set, get)
      },
      reset: () => {
        lastChoice = undefined
        set({
          world: INITIAL_WORLD,
          scene: null,
          started: false,
          status: 'idle',
          streaming: '',
          error: null,
        })
      },
    }),
    {
      name: 'jiage.story.v1',
      version: 1,
      partialize: (state) => ({
        world: state.world,
        scene: state.scene,
        started: state.started,
      }),
    },
  ),
)

export function hasScene(state: StoryStore): state is StoryStore & { scene: SceneView } {
  return Boolean(state.scene)
}
