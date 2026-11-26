import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import { AlertTriangle, RotateCcw, Settings } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import RichText from '../components/game/Scene/RichText'
import StarBorder from '../components/reactbits/StarBorder/StarBorder'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import { useStoryStore } from '../stores/storyStore'
import { useAiStore } from '../stores/aiStore'
import { useSettingsStore } from '../stores/settingsStore'
import { multiplier } from '../ai/world'

export default function StoryPage() {
  const navigate = useNavigate()
  const world = useStoryStore((s) => s.world)
  const scene = useStoryStore((s) => s.scene)
  const status = useStoryStore((s) => s.status)
  const streaming = useStoryStore((s) => s.streaming)
  const error = useStoryStore((s) => s.error)
  const start = useStoryStore((s) => s.start)
  const choose = useStoryStore((s) => s.choose)
  const retry = useStoryStore((s) => s.retry)
  const reset = useStoryStore((s) => s.reset)
  const apiKey = useAiStore((s) => s.apiKey)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [confirmRestart, setConfirmRestart] = useState(false)

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [streaming, scene])

  useEffect(() => {
    if (!scene && status === 'idle') start()
  }, [scene, status, start])

  const text = status === 'generating' ? streaming : scene?.narration ?? ''

  return (
    <GameShell>
      <div className="flex h-dvh flex-col overflow-hidden">
        <header className="glass-header shrink-0 border-b border-border-subtle/40 pt-[env(safe-area-inset-top)]">
          <div className="flex min-h-13 items-center justify-between gap-3 px-4">
            <button type="button" onClick={() => navigate('/system')} className="min-w-0 flex-1 text-left active:opacity-70">
              <p className="truncate text-[11px] leading-tight text-text-secondary">
                {world.location} · {world.gameTime}
              </p>
              <p className="mt-0.5 truncate text-[11px] leading-tight text-text-dim">
                {world.age} 岁 · 天命 {multiplier(world.age)} 倍 · {world.realmName}
                {world.progress > 0 && ` ${world.progress}`}
              </p>
            </button>
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

        <main className="min-h-0 flex-1">
          <div
            ref={scrollRef}
            className="reading-scroll h-full select-none overflow-y-auto overflow-x-hidden overscroll-contain pb-[calc(2.5rem+env(safe-area-inset-bottom))] pl-5 pr-4 pt-5 md:mx-auto md:w-full md:max-w-[680px] md:px-8 md:pt-6"
            onContextMenu={(event) => event.preventDefault()}
          >
            {status === 'error' && (
              <div className="mb-6 rounded-[14px] border border-danger/40 bg-danger/10 p-4">
                <p className="flex items-center gap-2 text-sm text-danger">
                  <AlertTriangle size={16} aria-hidden />
                  这一幕没写出来
                </p>
                <p className="mt-2 break-words text-[12px] leading-relaxed text-text-secondary">{error}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <SpecularButton size="sm" radius={12} onClick={retry} lineColor="var(--color-accent)" textColor="var(--color-text-hi)">
                    重试
                  </SpecularButton>
                  <SpecularButton size="sm" radius={12} onClick={() => navigate('/settings')} lineColor="var(--color-border)" textColor="var(--color-text-secondary)">
                    检查密钥
                  </SpecularButton>
                </div>
              </div>
            )}

            {!apiKey.trim() && status !== 'generating' && (
              <div className="mb-6 rounded-[14px] border border-border bg-surface/70 p-4">
                <p className="text-sm text-text">还差一步：填上 DeepSeek 密钥</p>
                <p className="mt-1 text-[12px] leading-relaxed text-text-dim">密钥只存在这台设备的浏览器里，不会上传到别处。</p>
                <div className="mt-3">
                  <SpecularButton size="sm" radius={12} onClick={() => navigate('/settings')} lineColor="var(--color-accent)" textColor="var(--color-text-hi)">
                    去设置
                  </SpecularButton>
                </div>
              </div>
            )}

            {status === 'generating' && !streaming && (
              <div className="flex items-center gap-2 py-2 text-sm text-text-dim">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                正在书写这一幕…
              </div>
            )}

            {status === 'ready' && scene?.system && (
              <div className="mb-4 rounded-[10px] border-l-2 border-clue/60 bg-clue/5 px-3 py-2">
                <p className="text-[10px] tracking-[0.3em] text-clue/60">天命</p>
                <p className="mt-1 text-[13px] leading-relaxed text-clue/90">{scene.system}</p>
              </div>
            )}

            {text && (
              <motion.div
                key={scene?.narration?.slice(0, 12) ?? streaming.slice(0, 12)}
                initial={{ opacity: reducedMotion ? 1 : 0.6 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="reading text-text"
              >
                <RichText text={text} />
                {status === 'generating' && <span className="ml-0.5 inline-block h-[1em] w-[2px] animate-pulse bg-accent align-middle" />}
              </motion.div>
            )}

            {status === 'ready' && scene && (
              <div className="mt-8 flex min-w-0 flex-col gap-2">
                {scene.options.map((option) => (
                  <StarBorder
                    key={option.key}
                    as="button"
                    onClick={() => choose(option)}
                    style={{ padding: 0 }}
                    className="option-card min-h-[88px] w-full text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
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
                        <span className="font-display text-[14px] tracking-[0.1em] text-accent/85">{option.key}</span>
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-4 pl-4 pr-5">
                        <span className="option-label">{option.label}</span>
                      </span>
                    </span>
                  </StarBorder>
                ))}
              </div>
            )}

            {status === 'ready' && scene && (
              <button
                type="button"
                onClick={() => setConfirmRestart(true)}
                className="mt-10 flex min-h-11 items-center gap-1.5 text-[11px] text-text-dim/70"
              >
                <RotateCcw size={13} aria-hidden />
                从头开始
              </button>
            )}
          </div>
        </main>
      </div>

      {confirmRestart && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/55" onClick={() => setConfirmRestart(false)}>
          <div
            className="w-full max-w-[430px] rounded-t-2xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-[620px]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-lg text-text-hi">从头开始？</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">这一世走到的所有地方都会消失，无法恢复。</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setConfirmRestart(false)} className="rounded-[18px] border border-border py-3 text-sm text-text-secondary active:bg-surface-hover">
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmRestart(false)
                  reset()
                  start()
                }}
                className="rounded-[18px] border border-danger/50 bg-danger/10 py-3 text-sm text-danger active:bg-danger/20"
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      )}
    </GameShell>
  )
}
