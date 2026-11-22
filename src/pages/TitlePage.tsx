import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import SplitText from '../components/reactbits/SplitText/SplitText'
import BlurText from '../components/reactbits/BlurText/BlurText'
import DecryptedText from '../components/reactbits/DecryptedText/DecryptedText'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import GameShell from '../components/game/Layout/GameShell'
import { useGameStore } from '../stores/gameStore'

export default function TitlePage() {
  const navigate = useNavigate()
  const start = useGameStore((s) => s.start)
  const history = useGameStore((s) => s.history)
  const sceneId = useGameStore((s) => s.sceneId)
  const hasSave = history.length > 0 || sceneId !== 'p01'

  const onStart = () => {
    start()
    navigate('/story')
  }

  return (
    <GameShell>
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-14">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex w-full max-w-[360px] flex-col items-center text-center"
        >
          <p className="mb-6 text-xs tracking-[0.4em] text-text-dim">2015 · 杭州</p>
          <SplitText
            text="沙漏停摆"
            tag="h1"
            className="font-display text-4xl font-semibold text-text-hi"
            splitType="chars"
            effect="rise"
            mask
            trigger="load"
            accentColor="var(--color-clue)"
            duration={0.7}
            staggerFrom="center"
          />
          <div className="mt-5 text-base text-text-secondary">
            <BlurText text="杭州 · 失忆刑侦档案" animateBy="letters" effect="blur" trigger="load" delay={120} className="justify-center" />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-text-dim">
            一桩婚礼上的碎尸案，一只在记忆里晃动的沙漏。
            <br />
            你是江嘉，26 岁，杭州刑警。你不记得六岁那年的夏天。
          </p>
          <div className="mt-10">
            <DecryptedText
              text="HZ-2015-0419-ARCHIVE"
              speed={40}
              animateOn="view"
              effect="scramble"
              characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-"
              className="tabular text-xs tracking-[0.3em] text-clue/80"
              encryptedClassName="text-text-dim"
            />
          </div>
          <div className="mt-10 flex flex-col items-center gap-4">
            <SpecularButton size="lg" onClick={onStart} lineColor="var(--color-accent)" textColor="var(--color-text-hi)">
              {hasSave ? '重新开始调查' : '开始调查'}
            </SpecularButton>
            {hasSave && (
              <button
                type="button"
                onClick={() => navigate('/story')}
                className="min-h-11 px-4 text-sm text-accent active:text-accent-strong"
              >
                继续上次调查
              </button>
            )}
            <div className="flex items-center gap-3 text-sm text-text-dim">
              <button
                type="button"
                onClick={() => navigate('/archive')}
                className="min-h-11 rounded-lg border border-border-subtle px-4 py-2 active:bg-surface"
              >
                档案库
              </button>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="min-h-11 rounded-lg border border-border-subtle px-4 py-2 active:bg-surface"
              >
                设置
              </button>
            </div>
          </div>
          <p className="mt-12 max-w-[340px] text-[11px] leading-relaxed text-text-dim/80">
            平行改编自《空相沙漏》（作者：初禾二）。故事、人物与机构均为虚构；真实地名仅作空间锚点。
            2015 年杭州地理与交通按当年实际情况描写。
          </p>
        </motion.div>
      </div>
    </GameShell>
  )
}
