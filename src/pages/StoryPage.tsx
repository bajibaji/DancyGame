import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { ChevronDown, RotateCcw, Settings, Undo2 } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import RichText from '../components/game/Scene/RichText'
import TypedRichText from '../components/game/Scene/TypedRichText'
import StarBorder from '../components/reactbits/StarBorder/StarBorder'
import { chapterTitle, getScene, GAME } from '../content/index'
import { useGameStore } from '../stores/gameStore'
import { SPEED_MS, useSettingsStore } from '../stores/settingsStore'
import { useGameKeys } from '../lib/keyboard'
import { CHOICE_UNDO_MS } from '../game/engine'
import { resolveSceneBody } from '../game/narrative'
import type { ChoiceKey, Scene } from '../game/types'
import ComingSoon from '../components/game/ComingSoon'

export default function StoryPage() {
  const ending = useGameStore((s) => s.ending)
  const sceneId = useGameStore((s) => s.sceneId)
  if (ending) return <EndingView />
  const scene = getScene(sceneId)
  if (!scene) return <ComingSoon />
  return <SceneView scene={scene} />
}

function EndingView() {
  const navigate = useNavigate()
  const reset = useGameStore((s) => s.reset)
  return (
    <GameShell>
      <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <p className="text-sm text-text-secondary">{GAME.title}</p>
        <h1 className="font-display text-3xl text-text-hi">本篇完</h1>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => { reset(); navigate('/') }}
            className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm text-text-secondary"
          >
            <RotateCcw size={16} aria-hidden />返回标题
          </button>
        </div>
      </main>
    </GameShell>
  )
}

function SceneView({ scene }: { scene: Scene }) {
  const navigate = useNavigate()
  const sceneId = scene.id
  const flags = useGameStore((s) => s.flags)
  const history = useGameStore((s) => s.history)
  const visited = useGameStore((s) => s.visited)
  const snapshot = useGameStore((s) => s.snapshot)
  const advance = useGameStore((s) => s.advance)
  const choose = useGameStore((s) => s.choose)
  const undo = useGameStore((s) => s.undo)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const autoAdvance = useSettingsStore((s) => s.autoAdvance)
  const [readScene, setReadScene] = useState<string | null>(null)
  const [atBottom, setAtBottom] = useState(true)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const latestRef = useRef<HTMLElement | null>(null)

  const instant = textSpeed === 'instant' || reducedMotion
  const textReady = instant || readScene === sceneId
  const options = scene.options ?? []
  const choiceEnabled = textReady && options.length > 0
  const showOptions = options.length > 0 && textReady
  const arrivals = useMemo(() => new Map(history.map((entry) => [entry.next, entry])), [history])
  const activeBody = resolveSceneBody(scene, flags, arrivals.get(scene.id))
  const canUndo = Boolean(snapshot)
  const pathIds = useMemo(
    () => (visited.length > 0 && visited[visited.length - 1] === sceneId ? visited : [...visited, sceneId]),
    [visited, sceneId],
  )
  const visitedScenes = useMemo(
    () => pathIds.map((id) => getScene(id)).filter((s): s is Scene => Boolean(s)),
    [pathIds],
  )

  useLayoutEffect(() => {
    if (readingMode !== 'single') return
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = 0
    const frame = requestAnimationFrame(() => {
      el.scrollTop = 0
    })
    const timer = setTimeout(() => {
      el.scrollTop = 0
    }, 120)
    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [sceneId, readingMode])

  useEffect(() => {
    if (readingMode !== 'linear' || visited.length <= 1) return
    const el = latestRef.current
    if (!el) return
    const timer = setTimeout(() => {
      el.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' })
    }, 80)
    return () => clearTimeout(timer)
  }, [sceneId, readingMode, reducedMotion, visited.length])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const check = () => {
      setAtBottom(el.scrollTop + el.clientHeight >= el.scrollHeight - 24)
    }
    check()
    el.addEventListener('scroll', check, { passive: true })
    const observer = new ResizeObserver(check)
    observer.observe(el)
    return () => {
      el.removeEventListener('scroll', check)
      observer.disconnect()
    }
  }, [sceneId, readingMode, activeBody])

  useEffect(() => {
    if (!autoAdvance || !textReady || options.length) return
    const remainingUndo = snapshot ? CHOICE_UNDO_MS - (Date.now() - snapshot.at) : 0
    const timer = setTimeout(() => advance(scene), Math.max(3000, remainingUndo))
    return () => clearTimeout(timer)
  }, [autoAdvance, scene, textReady, advance, snapshot, options.length])

  const onChoose = useCallback((key: ChoiceKey) => {
    if (!choiceEnabled) return
    choose(key, scene.id)
  }, [scene.id, choiceEnabled, choose])

  const revealText = useCallback(() => {
    if (useGameStore.getState().sceneId === sceneId) setReadScene(sceneId)
  }, [sceneId])

  const onAdvance = useCallback(() => {
    if (!textReady) {
      revealText()
      return
    }
    advance(scene)
  }, [scene, textReady, revealText, advance])

  const onUndo = useCallback(() => {
    if (!canUndo) return
    undo()
    setReadScene(snapshot?.sceneId ?? null)
  }, [canUndo, snapshot, undo])

  const keys = useMemo(
    () => ({
      onChoice: onChoose,
      onAdvance,
      onUndo,
      onEscape: () => navigate('/settings'),
    }),
    [onChoose, onAdvance, onUndo, navigate],
  )
  useGameKeys(keys, true)

  return (
    <GameShell>
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="glass-header shrink-0 border-b border-border-subtle/40 pt-[env(safe-area-inset-top)]">
          <div className="flex min-h-13 items-center justify-between gap-3 px-4">
            <span className="min-w-0 truncate font-display text-[11px] leading-none tracking-[0.14em] text-text-secondary">
              {chapterTitle(scene.chapter)}
            </span>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="flex h-11 w-11 flex-col items-center justify-center gap-[3px] rounded-[12px] text-[10px] leading-none tracking-[0.1em] text-text-dim active:bg-surface/70"
            >
              <span aria-hidden><Settings size={15} strokeWidth={1.5} /></span>
              设置
            </button>
          </div>
        </header>

        <main className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[720px] lg:px-8">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <div
              ref={scrollRef}
              className="reading-scroll -mr-4 h-full select-none overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(1.75rem+env(safe-area-inset-bottom))] pl-5 pr-[calc(1.25rem+1rem)] pt-[18px] [touch-action:pan-y] md:mx-auto md:mr-0 md:w-full md:max-w-[680px] md:px-8 md:pt-6 lg:px-4 lg:pt-5"
              onContextMenu={(event) => event.preventDefault()}
            >
              {readingMode === 'linear' ? (
                visitedScenes.map((section, index) => {
                  const isCurrent = section.id === scene.id
                  const previous = visitedScenes[index - 1]
                  const chapterChanged = !previous || previous.chapter !== section.chapter
                  return (
                    <section key={section.id} ref={isCurrent ? latestRef : undefined} className="mb-7 scroll-mt-2">
                      {chapterChanged && (
                        <div className="mb-3 mt-1 flex items-center gap-3">
                          <span className="h-px flex-1 bg-border-subtle" />
                          <span className="font-display text-[11px] tracking-[0.3em] text-text-secondary">
                            {chapterTitle(section.chapter)}
                          </span>
                          <span className="h-px flex-1 bg-border-subtle" />
                        </div>
                      )}
                      <div className="mb-3 text-center text-[10px] tracking-[0.3em] text-text-dim/80">· {section.title} ·</div>
                      <div
                        className="reading text-text"
                        onClick={isCurrent ? () => {
                          if (!textReady) revealText()
                        } : undefined}
                      >
                        {isCurrent ? (
                          <TypedRichText
                            text={activeBody}
                            speed={SPEED_MS[textSpeed]}
                            revealAll={textReady}
                            onDone={revealText}
                          />
                        ) : (
                          <RichText text={resolveSceneBody(section, flags, arrivals.get(section.id))} />
                        )}
                      </div>
                    </section>
                  )
                })
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reducedMotion ? 0.12 : 0.22 }}
                  >
                    <h2 className="scene-title mb-5 flex items-center gap-3 font-display tracking-[0.06em] text-text-hi">
                      <span aria-hidden className="h-[13px] w-[2px] shrink-0 bg-clue/70" />
                      <span className="shrink-0">{scene.title}</span>
                      <span aria-hidden className="mb-[7px] h-px min-w-4 flex-1 self-end bg-gradient-to-r from-border/80 to-transparent" />
                    </h2>
                    <div
                      className="reading text-text"
                      onClick={() => {
                        if (!textReady) revealText()
                      }}
                    >
                      <TypedRichText
                        key={scene.id}
                        text={activeBody}
                        speed={SPEED_MS[textSpeed]}
                        revealAll={textReady}
                        onDone={revealText}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              )}
              <div className="mt-7 flex min-w-0 flex-col gap-2 overflow-x-hidden md:mx-auto md:w-full md:max-w-[560px]">
                {showOptions && (
                  <motion.div
                    initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0.12 : 0.3 }}
                    className="flex flex-col gap-2"
                  >
                    {options.map((option) => (
                      <StarBorder
                        key={option.key}
                        as="button"
                        onClick={() => onChoose(option.key)}
                        disabled={!choiceEnabled}
                        style={{ padding: 0 }}
                        className="option-card min-h-[92px] w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed"
                        color="var(--color-clue)"
                        trailColor="var(--color-accent)"
                        backgroundColor="transparent"
                        textColor="var(--color-text)"
                        borderColor="var(--color-border)"
                        hover="reveal"
                        clickPulse={!reducedMotion}
                        sparkle={false}
                        glow={0}
                        radius={12}
                        thickness={1}
                      >
                        <span className="flex w-full items-stretch self-stretch">
                          <span className="option-index flex w-12 shrink-0 items-center justify-center">
                            <span className="font-display text-[14px] tracking-[0.1em] text-accent/85">
                              {option.key}
                            </span>
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-4 pl-4 pr-5">
                            <span className="option-label">{option.label}</span>
                          </span>
                        </span>
                      </StarBorder>
                    ))}
                  </motion.div>
                )}
                {options.length === 0 && textReady && (
                  <button
                    type="button"
                    onClick={onAdvance}
                    className="glass-slab group flex min-h-14 w-full items-center justify-center gap-2.5 rounded-[12px] px-4 py-3"
                  >
                    <span className="pl-[0.14em] text-[15px] tracking-[0.14em] text-text">
                      {scene.ending ? '完成' : '继续'}
                    </span>
                    <ChevronDown size={16} strokeWidth={1.6} className="shrink-0 opacity-70 group-active:translate-y-px" aria-hidden />
                  </button>
                )}
              </div>
            </div>
            {!atBottom && (
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center pb-1" aria-hidden>
                <ChevronDown size={16} className="text-text-dim/60 motion-safe:animate-pulse" />
              </div>
            )}
          </div>
        </main>
      </div>

      {canUndo && (
        <button
          type="button"
          onClick={onUndo}
          className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] right-3 z-40 flex min-h-11 items-center gap-1.5 rounded-[12px] border border-border bg-bg-deep/90 px-3 text-[11px] tracking-[0.06em] text-text-secondary shadow-[0_8px_24px_rgba(0,0,0,0.4)] backdrop-blur active:bg-surface"
        >
          <Undo2 size={14} aria-hidden />
          撤销
        </button>
      )}
    </GameShell>
  )
}
