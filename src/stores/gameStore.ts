import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { EndingId, Epilogue, GameMeta, HistoryEntry, Option, Scene, Snapshot } from '../game/types'
import { applyEffects, choose as engineChoose, createInitialState, decideEnding, makeSnapshot, restoreSnapshot } from '../game/engine'
import { solvePuzzle as engineSolvePuzzle } from '../game/puzzle'
import type { Recipe } from '../game/puzzle'
import { getScene } from '../content/index'
import { characterIdsInText } from '../game/characterNames'

interface GameStore {
  screen: string
  sceneId: string
  meta: GameMeta
  relationship: Record<string, number>
  flags: Record<string, boolean>
  clues: string[]
  memories: string[]
  solved: string[]
  appliedScenes: string[]
  history: HistoryEntry[]
  metCharacters: string[]
  started: boolean
  ending: EndingId | null
  epilogue: Epilogue | null
  snapshot: Snapshot | null
  puzzleResult: { recipe: Recipe | null; cards: [string, string] } | null
  start: () => void
  choose: (option: Option, scene: Scene) => void
  advance: (scene: Scene) => void
  solvePuzzle: (a: string, b: string) => void
  closePuzzle: (nextSceneId?: string) => void
  finishAutoEnding: () => void
  setEpilogue: (epilogue: Epilogue) => void
  meet: (text: string) => void
  undo: () => void
  reset: () => void
  setScreen: (screen: string) => void
}

const initial = createInitialState('p01')

function withSceneEffects(state: GameStore, sceneId: string): Partial<GameStore> {
  const scene = getScene(sceneId)
  if (!scene || state.appliedScenes.includes(sceneId)) {
    return { sceneId }
  }
  if (!scene.effects) {
    return { sceneId, appliedScenes: [...state.appliedScenes, sceneId] }
  }
  const applied = applyEffects(
    {
      sceneId: state.sceneId,
      meta: state.meta,
      relationship: state.relationship,
      flags: state.flags,
      clues: state.clues,
      memories: state.memories,
      solved: state.solved,
      appliedScenes: state.appliedScenes,
      history: state.history,
    },
    scene.effects,
  )
  return {
    sceneId,
    meta: applied.meta,
    flags: applied.flags,
    clues: applied.clues,
    memories: applied.memories,
    appliedScenes: [...state.appliedScenes, sceneId],
  }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'title',
      sceneId: initial.sceneId,
      meta: initial.meta,
      relationship: initial.relationship,
      flags: initial.flags,
      clues: initial.clues,
      memories: initial.memories,
      solved: initial.solved,
      appliedScenes: initial.appliedScenes,
      history: initial.history,
      metCharacters: ['jiangjia'],
      started: false,
      ending: null,
      epilogue: null,
      snapshot: null,
      puzzleResult: null,
      start: () => {
        const fresh = createInitialState('p01')
        set({
          ...fresh,
          screen: 'story',
          metCharacters: ['jiangjia'],
          started: true,
          ending: null,
          epilogue: null,
          snapshot: null,
          puzzleResult: null,
        })
      },
      choose: (option, scene) => {
        const state = get()
        const snapshot = makeSnapshot({
          sceneId: state.sceneId,
          meta: state.meta,
          relationship: state.relationship,
          flags: state.flags,
          clues: state.clues,
          memories: state.memories,
          solved: state.solved,
          appliedScenes: state.appliedScenes,
          history: state.history,
        })
        const next = engineChoose(
          {
            sceneId: state.sceneId,
            meta: state.meta,
            relationship: state.relationship,
            flags: state.flags,
            clues: state.clues,
            memories: state.memories,
            solved: state.solved,
            appliedScenes: state.appliedScenes,
            history: state.history,
          },
          scene,
          option,
        )
        const base = { ...state, ...next, snapshot }
        const entered = withSceneEffects(base, option.next)
        set({ ...next, ...entered, snapshot, screen: 'story' })
      },
      advance: (scene) => {
        if (scene.puzzle) {
          set({ screen: 'puzzle', puzzleResult: null })
          return
        }
        if (scene.ending === 'auto') {
          get().finishAutoEnding()
          return
        }
        if (scene.next) {
          const entered = withSceneEffects(get(), scene.next)
          set({ ...entered, snapshot: null })
        }
      },
      solvePuzzle: (a, b) => {
        const state = get()
        const result = engineSolvePuzzle(
          {
            sceneId: state.sceneId,
            meta: state.meta,
            relationship: state.relationship,
            flags: state.flags,
            clues: state.clues,
            memories: state.memories,
            solved: state.solved,
            appliedScenes: state.appliedScenes,
            history: state.history,
          },
          a,
          b,
        )
        set({
          meta: result.state.meta,
          flags: result.state.flags,
          solved: result.state.solved,
          puzzleResult: { recipe: result.result, cards: [a, b] },
        })
      },
      closePuzzle: (nextSceneId) => {
        const state = get()
        const scene = getScene(state.sceneId)
        const target = nextSceneId ?? scene?.next
        if (target) {
          const entered = withSceneEffects(state, target)
          set({ ...entered, screen: 'story', puzzleResult: null })
        } else {
          set({ screen: 'story', puzzleResult: null })
        }
      },
      finishAutoEnding: () => {
        const state = get()
        const ending = decideEnding({
          sceneId: state.sceneId,
          meta: state.meta,
          relationship: state.relationship,
          flags: state.flags,
          clues: state.clues,
          memories: state.memories,
          solved: state.solved,
          appliedScenes: state.appliedScenes,
          history: state.history,
        })
        set({ ending, screen: 'ending', snapshot: null })
      },
      setEpilogue: (epilogue) => set({ epilogue }),
      meet: (text) => {
        const ids = characterIdsInText(text)
        if (ids.length === 0) return
        const current = get().metCharacters
        const union = Array.from(new Set([...current, ...ids]))
        if (union.length !== current.length) set({ metCharacters: union })
      },
      undo: () => {
        const state = get()
        if (!state.snapshot) return
        if (Date.now() - state.snapshot.at > 5000) {
          set({ snapshot: null })
          return
        }
        const restored = restoreSnapshot(state.snapshot)
        set({ ...restored, snapshot: null, screen: 'story' })
      },
      reset: () => {
        const fresh = createInitialState('p01')
        set({
          ...fresh,
          screen: 'title',
          metCharacters: ['jiangjia'],
          started: false,
          ending: null,
          epilogue: null,
          snapshot: null,
          puzzleResult: null,
        })
      },
      setScreen: (screen) => set({ screen }),
    }),
    {
      name: 'jiangjia.save.v1',
      version: 1,
      partialize: (state) => ({
        screen: state.screen,
        sceneId: state.sceneId,
        meta: state.meta,
        relationship: state.relationship,
        flags: state.flags,
        clues: state.clues,
        memories: state.memories,
        solved: state.solved,
        appliedScenes: state.appliedScenes,
        history: state.history,
        metCharacters: state.metCharacters,
        started: state.started,
        ending: state.ending,
        epilogue: state.epilogue,
      }),
    },
  ),
)
