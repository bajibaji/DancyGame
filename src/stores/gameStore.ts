import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChoiceKey, HistoryEntry, Scene, Snapshot } from '../game/types'
import { applyEffects, CHOICE_UNDO_MS, choose as engineChoose, createInitialState, makeSnapshot, restoreSnapshot } from '../game/engine'
import { getScene, START_SCENE } from '../content/index'

interface GameStore {
  sceneId: string
  stats: Record<string, number>
  flags: Record<string, boolean>
  history: HistoryEntry[]
  visited: string[]
  started: boolean
  ending: string | null
  snapshot: Snapshot | null
  start: () => void
  choose: (key: ChoiceKey, sceneId: string) => void
  advance: (scene: Scene) => void
  undo: () => void
  repairScene: () => void
  reset: () => void
}

const initial = createInitialState(START_SCENE)

function validSceneId(state: GameStore): string {
  if (getScene(state.sceneId)) return state.sceneId
  for (let i = state.visited.length - 1; i >= 0; i--) {
    if (getScene(state.visited[i])) return state.visited[i]
  }
  return START_SCENE
}

function mergeSave(saved: unknown, current: GameStore): GameStore {
  const merged = { ...current, ...(saved as Partial<GameStore>) }
  const state: GameStore = {
    ...merged,
    stats: { ...(merged.stats ?? {}) },
    flags: { ...(merged.flags ?? {}) },
    history: merged.history ?? [],
    visited: merged.visited ?? [],
  }
  const sceneId = validSceneId(state)
  const visited = state.visited.filter((id) => Boolean(getScene(id)))
  if (sceneId === state.sceneId && visited.length === state.visited.length) return state
  return { ...state, sceneId, visited }
}

function withSceneEffects(state: GameStore, sceneId: string): Partial<GameStore> {
  const scene = getScene(sceneId)
  const visited = state.visited[state.visited.length - 1] === sceneId ? state.visited : [...state.visited, sceneId]
  if (!scene?.effects) return { sceneId, visited }
  const applied = applyEffects(
    {
      sceneId: state.sceneId,
      stats: state.stats,
      flags: state.flags,
      history: state.history,
      visited: state.visited,
    },
    scene.effects,
  )
  return { sceneId, visited, stats: applied.stats, flags: applied.flags }
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      sceneId: initial.sceneId,
      stats: initial.stats,
      flags: initial.flags,
      history: initial.history,
      visited: initial.visited,
      started: false,
      ending: null,
      snapshot: null,
      start: () => {
        set({
          ...createInitialState(START_SCENE),
          started: true,
          ending: null,
          snapshot: null,
        })
      },
      choose: (key, sceneId) => {
        const state = get()
        if (sceneId !== state.sceneId) return
        const scene = getScene(sceneId)
        if (!scene) return
        const option = scene.options?.find((candidate) => candidate.key === key)
        if (!option) return
        const snapshot = makeSnapshot({ ...state, ending: undefined })
        const next = engineChoose(
          {
            sceneId: state.sceneId,
            stats: state.stats,
            flags: state.flags,
            history: state.history,
            visited: state.visited,
          },
          scene,
          option,
          key,
        )
        const entered = withSceneEffects({ ...state, ...next }, option.next)
        set({ ...next, ...entered, snapshot })
      },
      advance: (scene) => {
        const state = get()
        if (scene.id !== state.sceneId || scene.options?.length) return
        if (scene.ending) {
          const ending = typeof scene.ending === 'string' ? scene.ending : 'auto'
          set({ ending, snapshot: null })
          return
        }
        if (scene.next) {
          const entered = withSceneEffects(state, scene.next)
          set({ ...entered, snapshot: null })
        }
      },
      undo: () => {
        const state = get()
        if (!state.snapshot) return
        if (Date.now() - state.snapshot.at >= CHOICE_UNDO_MS) {
          set({ snapshot: null })
          return
        }
        const restored = restoreSnapshot(state.snapshot)
        set({ ...restored, snapshot: null })
      },
      repairScene: () => {
        const state = get()
        const sceneId = validSceneId(state)
        const visited = state.visited.filter((id) => Boolean(getScene(id)))
        if (sceneId !== state.sceneId || visited.length !== state.visited.length) {
          set({ sceneId, visited })
        }
      },
      reset: () => {
        set({
          ...createInitialState(START_SCENE),
          started: false,
          ending: null,
          snapshot: null,
        })
      },
    }),
    {
      name: 'jiage.save.v1',
      version: 1,
      merge: mergeSave,
      partialize: (state) => ({
        sceneId: state.sceneId,
        stats: state.stats,
        flags: state.flags,
        history: state.history,
        visited: state.visited,
        started: state.started,
        ending: state.ending,
      }),
    },
  ),
)
