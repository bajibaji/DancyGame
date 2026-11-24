import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'motion/react'
import { Archive, Settings } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import LocationBar from '../components/game/HUD/LocationBar'
import StatMeters from '../components/game/HUD/StatMeters'
import ChoiceFeedback from '../components/game/Scene/ChoiceFeedback'
import RichText from '../components/game/Scene/RichText'
import TypedRichText from '../components/game/Scene/TypedRichText'
import StarBorder from '../components/reactbits/StarBorder/StarBorder'
import GlitchText from '../components/reactbits/GlitchText/GlitchText'
import { CHARACTERS, CLUES, MEMORIES, chapterTitle, CLUE_MAP, getScene, LOCATION_MAP, MEMORY_MAP } from '../content/index'
import { RECIPES } from '../game/puzzle'
import { useGameStore } from '../stores/gameStore'
import { SPEED_MS, useSettingsStore } from '../stores/settingsStore'
import { useGameKeys } from '../lib/keyboard'
import { CHOICE_UNDO_MS, worldLine } from '../game/engine'
import { resolveSceneBody, resolveSceneFollowUps, resolveSceneProgress } from '../game/narrative'
import type { Option, Scene } from '../game/types'

interface SelectedCharacter {
  id: string
  alias: string
}
export default function StoryPage() {
  const navigate = useNavigate()
  const sceneId = useGameStore((s) => s.sceneId)
  const meta = useGameStore((s) => s.meta)
  const flags = useGameStore((s) => s.flags)
  const ending = useGameStore((s) => s.ending)
  const screen = useGameStore((s) => s.screen)
  const choose = useGameStore((s) => s.choose)
  const advance = useGameStore((s) => s.advance)
  const undo = useGameStore((s) => s.undo)
  const meet = useGameStore((s) => s.meet)
  const visited = useGameStore((s) => s.visited)
  const history = useGameStore((s) => s.history)
  const snapshot = useGameStore((s) => s.snapshot)
  const clues = useGameStore((s) => s.clues)
  const memories = useGameStore((s) => s.memories)
  const solved = useGameStore((s) => s.solved)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const autoAdvance = useSettingsStore((s) => s.autoAdvance)
  const [readScene, setReadScene] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ sceneId: string; message: string | null; canUndo: boolean } | null>(null)
  const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null)
  const [demoNotice, setDemoNotice] = useState(false)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const latestRef = useRef<HTMLElement | null>(null)

  const scene = getScene(sceneId)
  const location = scene ? LOCATION_MAP.get(scene.locationId) : undefined
  const instant = textSpeed === 'instant' || reducedMotion
  const textReady = instant || readScene === sceneId
  const showMemoryTag = Boolean(scene?.effects?.memories?.length)
  const options = scene?.options ?? []
  const choiceEnabled = textReady && options.length > 0
  const showOptions = options.length > 0 && textReady
  const arrivals = useMemo(() => new Map(history.map((entry) => [entry.next, entry])), [history])
  const line = worldLine(meta)
  const resolveBody = (section: Scene) => resolveSceneBody(section, flags, arrivals.get(section.id), line)
  const activeBody = scene ? resolveBody(scene) : ''
  const activeFollowUps = scene ? resolveSceneFollowUps(scene, solved) : []
  const currentFeedback = feedback?.sceneId === sceneId ? feedback : null
  const canUndo = Boolean(snapshot && currentFeedback?.canUndo)
  const pathIds = useMemo(
    () => (visited.length > 0 && visited[visited.length - 1] === sceneId ? visited : [...visited, sceneId]),
    [visited, sceneId],
  )
  const visitedScenes = useMemo(
    () => pathIds.map((id) => getScene(id)).filter((s): s is Scene => Boolean(s)),
    [pathIds],
  )

  useEffect(() => {
    setSelectedCharacter(null)
  }, [sceneId])

  useEffect(() => {
    if (!scene) return
    if (!['ch03', 'ch04', 'ch05', 'ch06', 'ch07'].includes(scene.chapter)) return
    if (!history.some((entry) => entry.chapter === 'ch02')) return
    if (sessionStorage.getItem('demo-notice-seen') === '1') return
    setDemoNotice(true)
  }, [scene, history])

  useEffect(() => {
    if (!scene) return
    const activeUndo = snapshot ? CHOICE_UNDO_MS - (Date.now() - snapshot.at) : 0
    const newClues = snapshot ? clues.filter((id) => !snapshot.clues.includes(id)) : scene.effects?.clues ?? []
    const newMemories = snapshot ? memories.filter((id) => !snapshot.memories.includes(id)) : scene.effects?.memories ?? []
    const names = [...newClues.map((id) => CLUE_MAP.get(id)?.title), ...newMemories.map((id) => MEMORY_MAP.get(id)?.title)].filter(Boolean)
    const message = names.length ? `已归档：${names.join('、')}` : null
    if (!message && activeUndo <= 0) {
      setFeedback(null)
      return
    }
    setFeedback({ sceneId: scene.id, message, canUndo: activeUndo > 0 })
    const timer = setTimeout(() => setFeedback(null), activeUndo > 0 ? activeUndo : 4000)
    return () => clearTimeout(timer)
  }, [scene, snapshot, clues, memories])

  useEffect(() => {
    if (activeBody) meet(activeBody)
  }, [activeBody, meet])

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
    if (ending && screen === 'ending') navigate('/ending')
  }, [ending, screen, navigate])

  useEffect(() => {
    if (!autoAdvance || !scene || scene.options?.length || !textReady || resolveSceneFollowUps(scene, solved).length) return
    const remainingUndo = snapshot ? CHOICE_UNDO_MS - (Date.now() - snapshot.at) : 0
    const timer = setTimeout(() => advance(scene), Math.max(3000, remainingUndo))
    return () => clearTimeout(timer)
  }, [autoAdvance, scene, textReady, advance, snapshot, solved])

  const characterCard = useMemo(
    () => (selectedCharacter ? CHARACTERS.find((c) => c.id === selectedCharacter.id) : undefined),
    [selectedCharacter],
  )

  const onChoose = useCallback((option: Option) => {
    if (!scene || !choiceEnabled) return
    choose(option, scene)
  }, [scene, choiceEnabled, choose])

  const revealText = useCallback(() => {
    if (useGameStore.getState().sceneId === sceneId) setReadScene(sceneId)
  }, [sceneId])

  const onAdvance = useCallback(() => {
    if (!scene) return
    if (!textReady) {
      revealText()
      return
    }
    advance(scene)
  }, [scene, textReady, revealText, advance])

  const onUndo = useCallback(() => {
    if (!canUndo || !snapshot) return
    undo()
    setReadScene(snapshot.sceneId)
    setFeedback(null)
  }, [canUndo, snapshot, undo])

  const keys = useMemo(
    () => ({
      onChoice: (key: 'A' | 'B' | 'C') => {
        const option = options.find((o) => o.key === key)
        if (option && choiceEnabled) onChoose(option)
      },
      onAdvance,
      onUndo,
      onEscape: () => selectedCharacter ? setSelectedCharacter(null) : navigate('/settings'),
    }),
    [options, choiceEnabled, onChoose, onAdvance, onUndo, navigate, selectedCharacter],
  )
  useGameKeys(keys, true)

  if (!scene) {
    return (
      <GameShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4">
          <p className="text-text-secondary">没有进行中的调查。</p>
          <button type="button" className="min-h-11 text-accent" onClick={() => navigate('/')}>
            返回标题
          </button>
        </div>
      </GameShell>
    )
  }

  return (
    <GameShell>
      <div className="flex h-dvh flex-col overflow-hidden">
        {demoNotice && (
          <div className="flex shrink-0 items-start gap-3 border-b border-clue/40 bg-clue/10 px-4 py-2 text-xs leading-relaxed text-text-secondary md:px-6">
            <span className="min-w-0 flex-1">试玩段落到此。第三章起仍是旧稿，节奏和写法都与前面不同；想停下可以从设置回到标题页。</span>
            <button
              type="button"
              className="shrink-0 rounded-sm border border-clue/50 px-2 py-1 text-clue"
              onClick={() => {
                sessionStorage.setItem('demo-notice-seen', '1')
                setDemoNotice(false)
              }}
            >
              继续看旧稿
            </button>
          </div>
        )}
        <header className="shrink-0 border-b border-border-subtle/50 bg-bg-deep/80">
          <LocationBar location={location} timeOfDay={scene.timeOfDay} chapter={scene.chapter} line={line} />
          <div className="flex min-h-13 items-center justify-between gap-4 px-3 lg:hidden">
            <div className="min-w-0 flex-1 md:max-w-[400px]">
              <StatMeters meta={meta} />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/archive')}
                className="flex h-11 min-w-11 flex-col items-center justify-center rounded-[18px] px-2 text-[10px] leading-tight text-text-dim active:bg-surface"
              >
                <span aria-hidden><Archive size={16} strokeWidth={1.8} /></span>
                档案库
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="flex h-11 min-w-11 flex-col items-center justify-center rounded-[18px] px-2 text-[10px] leading-tight text-text-dim active:bg-surface"
              >
                <span aria-hidden><Settings size={16} strokeWidth={1.8} /></span>
                设置
              </button>
            </div>
          </div>
        </header>

        <ChoiceFeedback message={currentFeedback?.message ?? null} canUndo={canUndo} onUndo={onUndo} />

        <main className="flex min-h-0 flex-1 flex-col lg:mx-auto lg:w-full lg:max-w-[1120px] lg:flex-row lg:gap-8 lg:px-8">
          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              className="reading-scroll h-full select-none overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-10 pt-5 [touch-action:pan-y] md:mx-auto md:w-full md:max-w-[680px] md:px-8 md:pt-7 lg:max-w-[720px] lg:px-4 lg:pt-5"
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
                    {isCurrent && showMemoryTag && (
                      <div className="mb-3">
                        <GlitchText mode="scan" intensity={0.35} trigger="click" fontSize={12} fontWeight={500} shadowColors={['#67c7d8', '#d9a24b']} className="tracking-[0.3em] text-memory">
                          记忆碎片 · 读取中
                        </GlitchText>
                      </div>
                    )}
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
                          onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                        />
                      ) : (
                        <RichText
                          text={resolveBody(section)}
                          onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                        />
                      )}
                    </div>
                    {!isCurrent && <SceneProgress items={resolveSceneProgress(section, arrivals.get(section.id))} />}
                  </section>
                )
              })
            ) : (
              <>
                {showMemoryTag && (
                  <div className="mb-3">
                    <GlitchText mode="scan" intensity={0.35} trigger="click" fontSize={12} fontWeight={500} shadowColors={['#67c7d8', '#d9a24b']} className="tracking-[0.3em] text-memory">
                      记忆碎片 · 读取中
                    </GlitchText>
                  </div>
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={scene.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: reducedMotion ? 0.12 : 0.22 }}
                  >
                    <h2 className="scene-title mb-4 flex items-center gap-3 font-display tracking-wide text-text-hi">
                      <span aria-hidden className="h-4 w-[3px] shrink-0 rounded-sm bg-clue/80" />
                      {scene.title}
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
                        onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            )}
            {textReady && (
              <div key={scene.id}>
                <SceneProgress items={resolveSceneProgress(scene, arrivals.get(scene.id))} />
                {activeFollowUps.map(({ recipe, label, text }) => (
                  <details key={recipe} className="mt-4 border-l-2 border-clue/45 pl-3">
                    <summary className="min-h-11 cursor-pointer py-3 text-sm leading-relaxed text-clue">{label}</summary>
                    <p className="pb-2 text-sm leading-relaxed text-text-secondary">{text}</p>
                  </details>
                ))}
              </div>
            )}
            <div className="mt-6 flex min-w-0 flex-col gap-2 overflow-x-hidden md:mx-auto md:w-full md:max-w-[560px]">
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: reducedMotion ? 0.12 : 0.3 }}
                  className="flex flex-col gap-2"
                >
                  {options.map((option) => (
                    <StarBorder
                      key={option.key}
                      as="button"
                      onClick={() => onChoose(option)}
                      disabled={!choiceEnabled}
                      className="w-full text-left active:scale-[0.99] disabled:cursor-not-allowed"
                      color="var(--color-accent)"
                      trailColor="var(--color-clue)"
                      backgroundColor="var(--color-surface-raised)"
                      textColor="var(--color-text)"
                      borderColor="var(--color-border)"
                      hover="reveal"
                      clickPulse
                      stars={1}
                      radius={18}
                      thickness={1}
                    >
                      <span className="flex w-full items-center gap-3 px-4 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-strong font-display text-sm text-accent">
                          {option.key}
                        </span>
                        <span className="option-label min-w-0 flex-1">{option.label}</span>
                      </span>
                    </StarBorder>
                  ))}
                </motion.div>
              )}
              {options.length === 0 && textReady && (
                <button
                  type="button"
                  onClick={onAdvance}
                  className="w-full rounded-[18px] border border-border-strong bg-surface-raised py-3.5 text-[15px] text-text active:scale-[0.99] active:border-accent/60 active:text-accent"
                >
                  {scene.ending === 'auto' ? '查看结局' : scene.puzzle ? '继续下一章' : '继续'}
                </button>
              )}
            </div>
            </div>
          </div>

          <aside className="hidden lg:flex lg:w-[300px] lg:shrink-0 lg:flex-col lg:gap-3 lg:pb-6 lg:pt-4">
            <section className="rounded-[14px] border border-border bg-surface/70 p-4">
              <h2 className="mb-3 text-[11px] tracking-[0.2em] text-text-dim">调查状态</h2>
              <StatMeters meta={meta} />
            </section>
            <section className="rounded-[14px] border border-border bg-surface/70 p-4">
              <h2 className="mb-3 text-[11px] tracking-[0.2em] text-text-dim">进度</h2>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className="tabular text-lg text-text-hi">{clues.length}<span className="text-xs text-text-dim">/{CLUES.length}</span></div>
                  <div className="mt-0.5 text-[10px] text-text-dim">线索</div>
                </div>
                <div>
                  <div className="tabular text-lg text-text-hi">{memories.length}<span className="text-xs text-text-dim">/{MEMORIES.length}</span></div>
                  <div className="mt-0.5 text-[10px] text-text-dim">记忆</div>
                </div>
                <div>
                  <div className="tabular text-lg text-text-hi">{solved.length}<span className="text-xs text-text-dim">/{RECIPES.length}</span></div>
                  <div className="mt-0.5 text-[10px] text-text-dim">推演</div>
                </div>
              </div>
            </section>
            <section className="grid gap-2">
              <button
                type="button"
                onClick={() => navigate('/archive')}
                className="flex min-h-11 items-center gap-2 rounded-[18px] border border-border bg-surface px-4 text-sm text-text-secondary active:bg-surface-hover"
              >
                <Archive size={16} strokeWidth={1.8} />
                档案库
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="flex min-h-11 items-center gap-2 rounded-[18px] border border-border bg-surface px-4 text-sm text-text-secondary active:bg-surface-hover"
              >
                <Settings size={16} strokeWidth={1.8} />
                设置
              </button>
            </section>
          </aside>
        </main>
      </div>

      <AnimatePresence>
        {selectedCharacter && characterCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 flex items-end justify-center bg-black/55"
            onClick={() => setSelectedCharacter(null)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-[430px] rounded-t-2xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-[620px] lg:max-w-[780px]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-display text-xl text-text-hi">{characterCard.name}</h3>
                <button type="button" onClick={() => setSelectedCharacter(null)} className="min-h-11 rounded-[18px] px-3 text-sm text-text-dim active:text-text">
                  关闭
                </button>
              </div>
              <p className="mt-1 text-xs text-clue">{characterCard.role}</p>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{characterCard.note}</p>
              {selectedCharacter.alias !== characterCard.name && (
                <p className="mt-2 text-[11px] text-text-dim">文中称谓：{selectedCharacter.alias}</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </GameShell>
  )
}

function SceneProgress({ items }: { items: string[] }) {
  if (!items.length) return null
  return (
    <div role="group" aria-label="调查进展" className="mt-5 border-l-2 border-success/70 pl-3">
      <p className="mb-1 text-xs text-success">调查进展</p>
      {items.map((item) => <p key={item} className="text-sm leading-relaxed text-text-secondary">{item}</p>)}
    </div>
  )
}
