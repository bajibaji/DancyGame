import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ChoiceKey, EndingId, Epilogue, GameMeta, HistoryEntry, Scene, Snapshot } from '../game/types'
import { applyEffects, CHOICE_UNDO_MS, choose as engineChoose, createInitialState, decideEnding, LIMITS, makeSnapshot, restoreSnapshot } from '../game/engine'
import { choiceOffers } from '../game/choices'
import { solvePuzzle as engineSolvePuzzle } from '../game/puzzle'
import type { Recipe } from '../game/puzzle'
import { getScene, START_SCENE } from '../content/index'
import { characterIdsInText } from '../game/characterNames'

interface GameStore {
  screen: string
  sceneId: string
  runSeed: number
  meta: GameMeta
  relationship: Record<string, number>
  flags: Record<string, boolean>
  clues: string[]
  memories: string[]
  solved: string[]
  appliedScenes: string[]
  visited: string[]
  history: HistoryEntry[]
  metCharacters: string[]
  started: boolean
  ending: EndingId | null
  epilogue: Epilogue | null
  snapshot: (Snapshot & { metCharacters: string[] }) | null
  start: () => void
  choose: (key: ChoiceKey, sceneId: string) => void
  advance: (scene: Scene) => void
  solvePuzzle: (a: string, b: string) => Recipe | null
  finishAutoEnding: () => void
  setEpilogue: (epilogue: Epilogue) => void
  meet: (text: string) => void
  undo: () => void
  repairScene: () => void
  reset: () => void
  setScreen: (screen: string) => void
}

const initial = createInitialState(START_SCENE)

function migrateSave(persisted: unknown, version: number): GameStore {
  const state = (persisted ?? {}) as Partial<GameStore>
  if (version >= 2 || !state.meta) return state as GameStore
  return {
    ...state,
    meta: {
      ...state.meta,
      relation: Math.min(LIMITS.relation[1], state.meta.relation * 2),
    },
  } as GameStore
}

function validSceneId(state: GameStore): string {
  if (getScene(state.sceneId)) return state.sceneId
  for (let i = state.visited.length - 1; i >= 0; i--) {
    if (getScene(state.visited[i])) return state.visited[i]
  }
  return START_SCENE
}

function mergeRaw(saved: unknown, current: GameStore): GameStore {
  const merged = { ...current, ...(saved as Partial<GameStore>) }
  const state: GameStore = {
    ...merged,
    meta: { ...merged.meta, world: merged.meta?.world ?? 0 },
    runSeed: Number.isInteger(merged.runSeed) && merged.runSeed >= 0 && merged.runSeed <= 0xffffffff ? merged.runSeed : 0,
  }
  if (state.sceneId === 'c0609' || state.visited.includes('c0609')) return state
  if (!state.clues.includes('C22') && !state.flags.F62_MEMORY_TRUTH) return state
  const flags = { ...state.flags }
  delete flags.F62_MEMORY_TRUTH
  return { ...state, clues: state.clues.filter((id) => id !== 'C22'), flags }
}

function mergeSave(saved: unknown, current: GameStore): GameStore {
  const state = mergeRaw(saved, current)
  const sceneId = validSceneId(state)
  const visited = state.visited.filter((id) => Boolean(getScene(id)))
  const appliedScenes = state.appliedScenes.filter((id) => Boolean(getScene(id)))
  if (sceneId === state.sceneId && visited.length === state.visited.length && appliedScenes.length === state.appliedScenes.length) {
    return state
  }
  return { ...state, sceneId, visited, appliedScenes }
}

function withSceneEffects(state: GameStore, sceneId: string): Partial<GameStore> {
  const scene = getScene(sceneId)
  const visited =
    state.visited[state.visited.length - 1] === sceneId ? state.visited : [...state.visited, sceneId]
  if (!scene || state.appliedScenes.includes(sceneId)) {
    return { sceneId, visited }
  }
  if (!scene.effects) {
    return { sceneId, visited, appliedScenes: [...state.appliedScenes, sceneId] }
  }
  const applied = applyEffects(
    {
      sceneId: state.sceneId,
      runSeed: state.runSeed,
      meta: state.meta,
      relationship: state.relationship,
      flags: state.flags,
      clues: state.clues,
      memories: state.memories,
      solved: state.solved,
      appliedScenes: state.appliedScenes,
      visited: state.visited,
      history: state.history,
    },
    scene.effects,
  )
  return {
    sceneId,
    visited,
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
      runSeed: initial.runSeed,
      meta: initial.meta,
      relationship: initial.relationship,
      flags: initial.flags,
      clues: initial.clues,
      memories: initial.memories,
      solved: initial.solved,
      appliedScenes: initial.appliedScenes,
      visited: initial.visited,
      history: initial.history,
      metCharacters: ['jiangjia'],
      started: false,
      ending: null,
      epilogue: null,
      snapshot: null,
      start: () => {
        const fresh = createInitialState(START_SCENE, Math.floor(Math.random() * 0x100000000))
        set({
          ...fresh,
          screen: 'story',
          metCharacters: ['jiangjia'],
          started: true,
          ending: null,
          epilogue: null,
          snapshot: null,
        })
      },
      choose: (key, sceneId) => {
        const state = get()
        if (sceneId !== state.sceneId) return
        const scene = getScene(sceneId)
        if (!scene) return
        const offer = choiceOffers(scene, state.runSeed, state.flags).find((candidate) => candidate.key === key)
        if (!offer) return
        const { option } = offer
        const snapshot = {
          ...makeSnapshot({ ...state, ending: undefined, epilogue: undefined }),
          metCharacters: state.metCharacters,
        }
        const next = engineChoose(
          {
            sceneId: state.sceneId,
            runSeed: state.runSeed,
            meta: state.meta,
            relationship: state.relationship,
            flags: state.flags,
            clues: state.clues,
            memories: state.memories,
            solved: state.solved,
            appliedScenes: state.appliedScenes,
            visited: state.visited,
            history: state.history,
          },
          scene,
          option,
          key,
        )
        const base = { ...state, ...next, snapshot }
        const entered = withSceneEffects(base, option.next)
        set({ ...next, ...entered, snapshot, screen: 'story' })
      },
      advance: (scene) => {
        if (scene.id !== get().sceneId || scene.options?.length) return
        if (scene.ending) {
          if (scene.ending === 'auto' || scene.ending === 'good') get().finishAutoEnding()
          else set({ ending: scene.ending, screen: 'ending', snapshot: null })
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
            runSeed: state.runSeed,
            meta: state.meta,
            relationship: state.relationship,
            flags: state.flags,
            clues: state.clues,
            memories: state.memories,
            solved: state.solved,
            appliedScenes: state.appliedScenes,
            visited: state.visited,
            history: state.history,
          },
          a,
          b,
        )
        if (result.result) set({ meta: result.state.meta, solved: result.state.solved })
        return result.result
      },
      finishAutoEnding: () => {
        const state = get()
        const ending = decideEnding({
          sceneId: state.sceneId,
          runSeed: state.runSeed,
          meta: state.meta,
          relationship: state.relationship,
          flags: state.flags,
          clues: state.clues,
          memories: state.memories,
          solved: state.solved,
          appliedScenes: state.appliedScenes,
          visited: state.visited,
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
        if (Date.now() - state.snapshot.at >= CHOICE_UNDO_MS) {
          set({ snapshot: null })
          return
        }
        const restored = restoreSnapshot(state.snapshot)
        set({ ...restored, metCharacters: state.snapshot.metCharacters, snapshot: null, screen: 'story' })
      },
      repairScene: () => {
        const state = get()
        const sceneId = validSceneId(state)
        const visited = state.visited.filter((id) => Boolean(getScene(id)))
        const appliedScenes = state.appliedScenes.filter((id) => Boolean(getScene(id)))
        if (sceneId !== state.sceneId || visited.length !== state.visited.length || appliedScenes.length !== state.appliedScenes.length) {
          set({ sceneId, visited, appliedScenes })
        }
      },
      reset: () => {
        const fresh = createInitialState(START_SCENE)
        set({
          ...fresh,
          screen: 'title',
          metCharacters: ['jiangjia'],
          started: false,
          ending: null,
          epilogue: null,
          snapshot: null,
        })
      },
      setScreen: (screen) => set({ screen }),
    }),
    {
      name: 'jiangjia.save.v1',
      version: 3,
      migrate: migrateSave,
      merge: mergeSave,
      partialize: (state) => ({
        screen: state.screen,
        sceneId: state.sceneId,
        runSeed: state.runSeed,
        meta: state.meta,
        relationship: state.relationship,
        flags: state.flags,
        clues: state.clues,
        memories: state.memories,
        solved: state.solved,
        appliedScenes: state.appliedScenes,
        visited: state.visited,
        history: state.history,
        metCharacters: state.metCharacters,
        started: state.started,
        ending: state.ending,
        epilogue: state.epilogue,
      }),
    },
  ),
)
