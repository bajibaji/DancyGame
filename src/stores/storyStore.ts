import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChoiceKey, GeneratedOption, GeneratedScene, WorldState } from '../ai/world'
import { INITIAL_WORLD } from '../ai/world'
import { applyPatch, narrationOf, parseScene, recordTurn } from '../ai/parse'
import { buildMessages } from '../ai/prompt'
import { streamChat } from '../ai/client'
import { useAiStore } from './aiStore'
import { PROLOGUE_START, getPrologueScene } from '../content/prologue'

export interface SceneView {
  narration: string
  system: string
  options: GeneratedOption[]
}

type Phase = 'prologue' | 'generated'

interface StoryStore {
  world: WorldState
  scene: SceneView | null
  phase: Phase
  prologueId: string
  prologueSeen: string[]
  started: boolean
  status: 'idle' | 'generating' | 'ready' | 'error'
  streaming: string
  error: string | null
  start: () => void
  choosePrologue: (key: ChoiceKey) => void
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
  const messages = buildMessages(world, choice)
  const config = {
    apiKey: ai.apiKey.trim(),
    model: ai.model.trim() || 'deepseek-flash',
    baseUrl: ai.baseUrl.trim() || 'https://api.deepseek.com',
    effort: ai.effort,
  }
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 120000)
  const onDelta = (_delta: string, full: string) => set({ streaming: narrationOf(full) })

  set({ status: 'generating', streaming: '', error: null })
  try {
    let text = await streamChat(config, messages, onDelta, controller.signal)
    let scene: GeneratedScene
    try {
      scene = parseScene(text)
    } catch {
      set({ streaming: '' })
      const retryMessages = [
        ...messages,
        { role: 'assistant' as const, content: text },
        {
          role: 'user' as const,
          content: '格式不对，没有识别到三个选项。请重新输出这一幕，严格按【正文】、【系统】（可省略）、【选项】A./B./C. 各一行、【状态】的顺序，不要用其他编号或写法。',
        },
      ]
      text = await streamChat(config, retryMessages, onDelta, controller.signal)
      scene = parseScene(text)
    }
    const nextWorld = recordTurn(applyPatch(world, scene.patch), scene.narration, choice, text)
    lastChoice = undefined
    set({
      world: nextWorld,
      scene: { narration: scene.narration, system: scene.system, options: scene.options },
      status: 'ready',
      streaming: '',
    })
  } catch (error) {
    const message = error instanceof DOMException && error.name === 'AbortError'
      ? '生成超时了，检查一下网络，再点重试。'
      : error instanceof Error ? error.message : String(error)
    set({ status: 'error', error: message, streaming: '' })
  } finally {
    clearTimeout(timer)
    busy = false
  }
}

const PROLOGUE_SUMMARY =
  '伊阳六十岁，三木村老樵夫，今日觉醒天命：任何功法只要练就涨进度，年龄即倍率，六十岁练一遍顶六十遍。孙女姜月欣被村痞孙麻子威胁，要伊阳把青木山捡来的紫木交出去，否则明天带人拆屋。'

export const useStoryStore = create<StoryStore>()(
  persist(
    (set, get) => ({
      world: INITIAL_WORLD,
      scene: null,
      phase: 'prologue',
      prologueId: PROLOGUE_START,
      prologueSeen: [PROLOGUE_START],
      started: false,
      status: 'idle',
      streaming: '',
      error: null,
      start: () => {
        const state = get()
        if (state.phase === 'generated' && state.scene) {
          set({ started: true, status: 'ready' })
          return
        }
        if (state.phase === 'prologue') {
          set({ started: true })
          return
        }
        set({ started: true })
        void generate(undefined, set, get)
      },
      choosePrologue: (key) => {
        const state = get()
        if (state.phase !== 'prologue') return
        const scene = getPrologueScene(state.prologueId)
        const option = scene?.options.find((candidate) => candidate.key === key)
        if (!option) return
        if (option.next) {
          const seen = state.prologueSeen.includes(option.next) ? state.prologueSeen : [...state.prologueSeen, option.next]
          set({ prologueId: option.next, prologueSeen: seen })
          return
        }
        const world: WorldState = {
          ...state.world,
          progress: 60,
          progressGoal: 1000,
          summary: PROLOGUE_SUMMARY,
          flags: [...state.world.flags, '序章完成', `序章选择：${option.label}`],
          recent: [{ turn: 0, choice: option.label, narration: '序章：伊阳在院里觉醒天命，孙女月欣说出孙麻子的威胁。' }],
        }
        set({ phase: 'generated', world, scene: null, status: 'idle' })
        void generate(undefined, set, get)
      },
      choose: (option) => {
        const state = get()
        if (!state.scene || state.status === 'generating') return
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
          phase: 'prologue',
          prologueId: PROLOGUE_START,
          prologueSeen: [PROLOGUE_START],
          started: false,
          status: 'idle',
          streaming: '',
          error: null,
        })
      },
    }),
    {
      name: 'jiage.story.v1',
      version: 2,
      migrate: (persisted, version) => {
        const saved = (persisted ?? {}) as Partial<StoryStore>
        const base: StoryStore = {
          world: INITIAL_WORLD,
          scene: null,
          phase: 'prologue',
          prologueId: PROLOGUE_START,
          prologueSeen: [PROLOGUE_START],
          started: false,
          status: 'idle',
          streaming: '',
          error: null,
          start: () => undefined,
          choosePrologue: () => undefined,
          choose: () => undefined,
          retry: () => undefined,
          reset: () => undefined,
        }
        if (version < 2) {
          return {
            ...base,
            ...saved,
            phase: (saved.scene ? 'generated' : 'prologue') as Phase,
          }
        }
        return { ...base, ...saved }
      },
      partialize: (state) => ({
        world: state.world,
        scene: state.scene,
        phase: state.phase,
        prologueId: state.prologueId,
        prologueSeen: state.prologueSeen,
        started: state.started,
      }),
    },
  ),
)

export function hasScene(state: StoryStore): state is StoryStore & { scene: SceneView } {
  return Boolean(state.scene)
}
