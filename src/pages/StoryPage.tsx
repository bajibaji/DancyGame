import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
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
import { CHARACTERS, CHAPTERS, chapterTitle, getScene, LOCATION_MAP } from '../content/index'
import { useGameStore } from '../stores/gameStore'
import { SPEED_MS, useSettingsStore } from '../stores/settingsStore'
import { useGameKeys } from '../lib/keyboard'
import { pinChoices } from '../lib/choiceScrollLock'
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
  const snapshot = useGameStore((s) => s.snapshot)
  const choose = useGameStore((s) => s.choose)
  const advance = useGameStore((s) => s.advance)
  const undo = useGameStore((s) => s.undo)
  const meet = useGameStore((s) => s.meet)
  const visited = useGameStore((s) => s.visited)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const autoAdvance = useSettingsStore((s) => s.autoAdvance)
  const [skipped, setSkipped] = useState(false)
  const [typedDone, setTypedDone] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [canUndo, setCanUndo] = useState(false)
  const [selectedCharacter, setSelectedCharacter] = useState<SelectedCharacter | null>(null)
  const [unlockedScene, setUnlockedScene] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const endRef = useRef<HTMLDivElement | null>(null)
  const optionsRef = useRef<HTMLDivElement | null>(null)
  const latestRef = useRef<HTMLElement | null>(null)

  const scene = getScene(sceneId)
  const location = scene ? LOCATION_MAP.get(scene.locationId) : undefined
  const instant = textSpeed === 'instant' || reducedMotion
  const textReady = instant || skipped || typedDone
  const showMemoryTag = Boolean(scene?.effects?.memories?.length)
  const options = scene?.options ?? []
  const choiceEnabled = textReady && options.length > 0
  const showOptions = options.length > 0 && textReady && unlockedScene === sceneId
  const chapterData = scene ? CHAPTERS.find((c) => c.chapter === scene.chapter) : undefined
  const sceneIndex = scene && chapterData ? chapterData.scenes.findIndex((s) => s.id === scene.id) + 1 : 0
  const sceneTotal = chapterData?.scenes.length ?? 0
  const chapterLabel = scene ? (scene.chapter === 'prologue' ? '序章' : `第${Number(scene.chapter.replace('ch', ''))}章`) : ''
  const resolveBody = (section: Scene) => section.variants?.find((variant) => flags[variant.flag])?.body ?? section.body
  const pathIds = useMemo(
    () => (visited.length > 0 && visited[visited.length - 1] === sceneId ? visited : [...visited, sceneId]),
    [visited, sceneId],
  )
  const visitedScenes = useMemo(
    () => pathIds.map((id) => getScene(id)).filter((s): s is Scene => Boolean(s)),
    [pathIds],
  )

  useEffect(() => {
    setSkipped(false)
    setTypedDone(false)
    setMessage(null)
    setCanUndo(false)
    setSelectedCharacter(null)
    setReviewing(false)
    const fixedClues = scene?.effects?.clues ?? []
    if (fixedClues.length > 0) {
      setMessage(`线索已入档 · ${fixedClues.join(' / ')} · 可去档案库推理`)
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => setMessage(null), 4000)
    }
  }, [sceneId])

  useEffect(() => {
    if (!scene) return
    meet(
      [
        scene.body,
        ...(scene.variants?.map((variant) => variant.body) ?? []),
        ...(scene.options?.map((option) => option.label) ?? []),
      ].join('\n'),
    )
  }, [sceneId, scene, meet])

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
    const end = endRef.current
    if (!el) return
    const update = () => {
      if (!textReady) return
      const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
      if (remaining <= 8) setUnlockedScene(sceneId)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    let sentinel: IntersectionObserver | null = null
    if (end) {
      sentinel = new IntersectionObserver(
        (entries) => {
          if (textReady && entries.some((entry) => entry.isIntersecting)) setUnlockedScene(sceneId)
        },
        { root: el, threshold: 0.01 },
      )
      sentinel.observe(end)
    }
    const timer = setTimeout(update, 300)
    return () => {
      observer.disconnect()
      sentinel?.disconnect()
      clearTimeout(timer)
    }
  }, [sceneId, textReady, fontSize])

  useEffect(() => {
    if (ending && screen === 'ending') navigate('/ending')
  }, [ending, screen, navigate])

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])

  useLayoutEffect(() => {
    const el = scrollRef.current
    const block = optionsRef.current
    if (!el || !block || !showOptions || reviewing) return
    return pinChoices(el, block)
  }, [showOptions, reviewing, options.length, fontSize])

  useEffect(() => {
    if (!autoAdvance || !scene || scene.options?.length || !textReady) return
    const timer = setTimeout(() => advance(scene), 3000)
    return () => clearTimeout(timer)
  }, [autoAdvance, scene, textReady, advance])

  const characterCard = useMemo(
    () => (selectedCharacter ? CHARACTERS.find((c) => c.id === selectedCharacter.id) : undefined),
    [selectedCharacter],
  )

  const onChoose = (option: Option) => {
    if (!scene || !choiceEnabled) return
    choose(option, scene)
    const gainedMemories = option.effects.memories ?? []
    const gainedClues = option.effects.clues ?? []
    let text = '选择已记录'
    if (gainedMemories.length > 0) text = `记忆碎片已归档 · ${gainedMemories.join(' / ')}`
    else if (gainedClues.length > 0) text = `线索已入档 · ${gainedClues.join(' / ')} · 可去档案库推理`
    setMessage(text)
    setCanUndo(true)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCanUndo(false)
      setMessage(null)
    }, 5000)
    scrollRef.current?.scrollTo({ top: 0 })
  }

  const onAdvance = () => {
    if (!scene) return
    if (!textReady) {
      setSkipped(true)
      return
    }
    advance(scene)
  }

  const keys = useMemo(
    () => ({
      onChoice: (key: 'A' | 'B' | 'C') => {
        const option = options.find((o) => o.key === key)
        if (option && choiceEnabled) onChoose(option)
      },
      onAdvance,
      onUndo: () => {
        if (canUndo) {
          undo()
          setMessage(null)
          setCanUndo(false)
        }
      },
      onEscape: () => navigate('/settings'),
    }),
    [options, choiceEnabled, scene, canUndo],
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
        <header className="shrink-0 border-b border-border-subtle/50 bg-bg-deep/80">
          <LocationBar location={location} timeOfDay={scene.timeOfDay} chapter={scene.chapter} />
          <div className="flex items-center justify-between gap-1 px-3 py-1">
            <div className="min-w-0 flex-1">
              <StatMeters meta={meta} showMemory={meta.memory > 0 || scene.effects?.memories !== undefined} />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => navigate('/archive')}
                className="flex h-11 min-w-11 flex-col items-center justify-center rounded-[18px] px-2 text-[10px] leading-tight text-text-dim active:bg-surface"
              >
                <span aria-hidden><Archive size={16} strokeWidth={1.8} /></span>
                档案
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

        <main className="flex min-h-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <div
              ref={scrollRef}
              className="h-full select-none overflow-y-auto overflow-x-hidden overscroll-contain px-5 pb-10 pt-5 [touch-action:pan-y]"
              onScroll={() => {
                if (!textReady) return
                const el = scrollRef.current
                if (!el) return
                const remaining = el.scrollHeight - el.scrollTop - el.clientHeight
                if (remaining <= 8) setUnlockedScene(sceneId)
              }}
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
                        if (!textReady) setSkipped(true)
                      } : undefined}
                    >
                      {isCurrent ? (
                        <TypedRichText
                          text={resolveBody(section)}
                          speed={SPEED_MS[textSpeed]}
                          revealAll={skipped || reducedMotion || instant}
                          onDone={() => setTypedDone(true)}
                          onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                        />
                      ) : (
                        <RichText
                          text={resolveBody(section)}
                          onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                        />
                      )}
                    </div>
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
                        if (!textReady) setSkipped(true)
                      }}
                    >
                      <TypedRichText
                        text={resolveBody(scene)}
                        speed={SPEED_MS[textSpeed]}
                        revealAll={skipped || reducedMotion || instant}
                        onDone={() => setTypedDone(true)}
                        onSelect={(id, alias) => setSelectedCharacter({ id, alias })}
                      />
                    </div>
                  </motion.div>
                </AnimatePresence>
              </>
            )}
            <div ref={endRef} aria-hidden className="h-1 w-full" />
            <div
              ref={optionsRef}
              className="mt-6 flex min-w-0 flex-col gap-2 overflow-x-hidden [touch-action:none]"
            >
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
                  {scene.ending === 'auto' ? '合上案卷' : '继 续'}
                </button>
              )}
            </div>
            </div>
          </div>

          <div className="shrink-0 border-t border-border-subtle/60 bg-bg-deep/95 px-4 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2">
            <div className="flex min-h-8 items-center justify-between gap-2 text-[11px] text-text-dim">
              <span>{chapterLabel} · {sceneIndex}/{sceneTotal}</span>
              {showOptions && (
                <button
                  type="button"
                  onClick={() => setReviewing((value) => !value)}
                  className="rounded-[18px] border border-border px-3 py-1 text-text-secondary active:bg-surface"
                >
                  {reviewing ? '回到选择' : '回看正文'}
                </button>
              )}
              {canUndo && snapshot ? (
                <button
                  type="button"
                  onClick={() => { undo(); setMessage(null); setCanUndo(false) }}
                  className="rounded-[18px] border border-accent/40 px-3 py-1 text-accent"
                >
                  撤销上一步
                </button>
              ) : (
                <span>{textReady ? '' : '轻点正文可立即显示全文'}</span>
              )}
            </div>
          </div>
        </main>
      </div>

      <ChoiceFeedback message={message} canUndo={canUndo} onUndo={() => { undo(); setMessage(null); setCanUndo(false) }} />

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
              className="w-full max-w-[430px] rounded-t-2xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
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
