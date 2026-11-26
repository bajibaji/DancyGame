import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import GlitchText from '../components/reactbits/GlitchText/GlitchText'
import BlurText from '../components/reactbits/BlurText/BlurText'
import DecryptedText from '../components/reactbits/DecryptedText/DecryptedText'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import GameShell from '../components/game/Layout/GameShell'
import CrystalizedBall from '../components/reactbits/CrystalizedBall/CrystalizedBall'
import { useStoryStore } from '../stores/storyStore'
import { GAME } from '../content/index'
import { APP_VERSION } from '../lib/version'

export default function TitlePage() {
  const navigate = useNavigate()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const start = useStoryStore((s) => s.start)
  const reset = useStoryStore((s) => s.reset)
  const started = useStoryStore((s) => s.started)
  const scene = useStoryStore((s) => s.scene)
  const hasSave = started || Boolean(scene)

  const onStart = () => {
    start()
    navigate('/story')
  }

  const onRestart = () => {
    reset()
    start()
    navigate('/story')
  }

  return (
    <GameShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-[360px] flex-col items-center text-center md:max-w-[480px]"
        >
          {GAME.kicker && (
            <p className="relative z-10 mb-12 text-xs tracking-[0.4em] md:mb-16 text-text-dim">{GAME.kicker}</p>
          )}
          <h1 className="relative inline-flex items-center justify-center">
            <span className="pointer-events-none absolute left-1/2 top-1/2 h-[140px] w-[62px] -translate-x-1/2 -translate-y-1/2 opacity-50 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_80%,transparent)] md:h-[176px] md:w-[78px]">
              <CrystalizedBall
                preset="nebula"
                color="#2b6994"
                crackle={1}
                flares={0.45}
                particleCount={11000}
                sway={0.4}
                dustSpeed={1.2}
                particleShape="round"
                size={0.96}
                sparks={0.55}
                depth={0.55}
                glow={0.7}
                fill={1}
                haze={0.2}
                waist={0.24}
                aspect={0.46}
                interactive={false}
              />
            </span>
            <span className="relative z-10 block text-4xl font-semibold text-text-hi md:text-5xl">
              <GlitchText
                mode="rgb"
                speed={9}
                intensity={0.22}
                flicker={false}
                trigger="always"
                enableShadows
                color="var(--color-text-hi)"
                shadowColors={['#2e5a68', '#8a6a2f']}
                fontSize="inherit"
                fontWeight={600}
                className="font-display"
              >
                {GAME.title}
              </GlitchText>
            </span>
            <span className="tabular absolute left-full top-1 ml-2 text-[10px] tracking-[0.2em] text-text-dim" aria-label={`游戏版本 ${APP_VERSION}`}>
              v{APP_VERSION}
            </span>
          </h1>
          <div className="relative z-10 mt-12 text-base text-text-secondary md:mt-16">
            <BlurText text={GAME.subtitle} animateBy="letters" effect="blur" trigger="load" delay={120} className="justify-center" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-dim">
            {GAME.lines.map((line, index) => (
              <span key={line}>
                {line}
                {index < GAME.lines.length - 1 && <br />}
              </span>
            ))}
          </p>
          <div className="mt-10">
            <DecryptedText
              text={GAME.code}
              speed={40}
              animateOn="view"
              effect="scramble"
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
              className="tabular text-xs tracking-[0.3em] text-clue/80"
              encryptedClassName="text-text-dim"
            />
          </div>
          <div className="mt-10 flex w-full flex-col items-center gap-4">
            <SpecularButton
              size="lg"
              radius={18}
              onClick={hasSave ? () => navigate('/story') : onStart}
              lineColor="var(--color-accent)"
              textColor="var(--color-text-hi)"
              className="md:w-[260px]"
            >
              {hasSave ? '继续' : '开始'}
            </SpecularButton>
            {hasSave && (
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="rounded-[18px] px-4 py-2 text-xs text-text-dim underline decoration-text-dim/40 underline-offset-4 active:text-text-secondary"
              >
                重新开始
              </button>
            )}
            <div className="flex items-center gap-3 text-sm text-text-dim">
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="min-h-11 rounded-[18px] border border-border-subtle px-4 py-2 active:bg-surface"
              >
                设置
              </button>
            </div>
          </div>
          <p className="mt-12 text-[10px] tracking-[0.12em] text-text-dim/70">建议用手机 Safari 打开，动效最完整</p>
        </motion.div>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-40 flex items-end justify-center bg-black/55"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            className="w-full max-w-[430px] rounded-t-2xl border-t border-border bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:max-w-[620px] lg:max-w-[780px]"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="font-display text-lg text-text-hi">重新开始？</h3>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">当前进度会被覆盖，无法恢复。</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-[18px] border border-border py-3 text-sm text-text-secondary active:bg-surface-hover"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false)
                  onRestart()
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
