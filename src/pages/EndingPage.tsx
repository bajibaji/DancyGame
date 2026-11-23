import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import GameShell from '../components/game/Layout/GameShell'
import HoloCard from '../components/reactbits/HoloCard/HoloCard'
import SplitText from '../components/reactbits/SplitText/SplitText'
import CountUp from '../components/reactbits/CountUp/CountUp'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import { ENDING_MEMORY, ENDINGS, getScene } from '../content/index'
import { useGameStore } from '../stores/gameStore'
import { breakdownCause } from '../game/engine'
import { captureStatus, memoryStatus } from '../game/narrative'
import type { Epilogue } from '../game/types'

const KEY_DECISIONS = new Set(['c0304', 'c0508', 'c0610', 'c0704', 'c0706', 'c0706p'])

function endingArt(name: string, accent: string, bg: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400"><rect width="600" height="400" fill="${bg}"/><circle cx="480" cy="90" r="160" fill="${accent}" opacity="0.12"/><circle cx="120" cy="340" r="200" fill="${accent}" opacity="0.06"/><path d="M300 80 L340 160 L260 160 Z M260 220 L340 220 L300 300 Z" stroke="${accent}" stroke-width="2" fill="none" opacity="0.7"/><text x="40" y="360" fill="#93a1b0" font-size="22" font-family="serif">${name}</text><text x="40" y="384" fill="#4a5869" font-size="12" font-family="monospace">CASE FILE · HZ-2015</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function EndingPage() {
  const navigate = useNavigate()
  const ending = useGameStore((s) => s.ending)
  const epilogue = useGameStore((s) => s.epilogue)
  const setEpilogue = useGameStore((s) => s.setEpilogue)
  const meta = useGameStore((s) => s.meta)
  const memories = useGameStore((s) => s.memories)
  const flags = useGameStore((s) => s.flags)
  const history = useGameStore((s) => s.history)

  useEffect(() => {
    if (!ending) navigate('/')
  }, [ending, navigate])

  const data = ending ? ENDINGS[ending] : null
  const accent = ending === 'good' ? '#e3b769' : ending === 'bad' ? '#b04545' : '#a9bdb8'
  const bg = ending === 'good' ? '#0b1116' : ending === 'bad' ? '#140c0f' : '#0e1316'
  const art = useMemo(() => (data ? endingArt(data.name, accent, bg) : ''), [data, accent, bg])
  const variants = useMemo(
    () => (data ? data.variants.filter((v) => flags[v.flag]) : []),
    [data, flags],
  )
  const replay = useMemo(() => {
    const keyEntries = history.filter((entry) => KEY_DECISIONS.has(entry.sceneId))
    return keyEntries.length ? keyEntries : history.slice(-5)
  }, [history])
  const status = captureStatus(flags)
  const cause = breakdownCause(meta)
  const fallout = ending === 'bad' && cause ? data?.fallout?.[cause] : undefined
  const epilogueText = epilogue && data ? data.epilogues[epilogue].text : ''

  if (!ending || !data) return null

  return (
    <GameShell>
      <main className="flex w-full flex-1 flex-col items-center px-5 pb-16 pt-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex w-full flex-col items-center"
        >
          <div className="mb-6 flex w-full justify-center">
            <HoloCard
              image={art}
              preset="gold"
              width={300}
              radius={16}
              intensity={0.7}
              foilColor={accent}
              className="w-full"
            />
          </div>
          <p className="mb-2 text-xs tracking-[0.4em] text-text-dim">终章 · 案卷回执</p>
          <div style={{ color: accent }}>
            <SplitText
              text={data.name}
              tag="h1"
              className="font-display text-3xl font-semibold"
              splitType="chars"
              effect="rise"
              mask
              trigger="load"
              staggerFrom="center"
            />
          </div>
          <div className="reading mt-6 w-full text-text">
            {[data.caseStatus[status], fallout, ENDING_MEMORY[memoryStatus(meta.memory)], data.body].filter(Boolean).join('\n\n').split(/\n\n+/).map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
            {variants.map((variant) => (
              <p key={variant.flag} className="text-text-secondary">{variant.text}</p>
            ))}
          </div>

          <div className="mt-8 grid w-full grid-cols-3 gap-3 rounded-lg border border-border bg-surface/80 p-4 text-center">
            <div>
              <div className="tabular text-2xl text-text-hi">
                <CountUp to={meta.clue} from={0} duration={1.1} trigger="load" />
              </div>
              <div className="mt-1 text-[11px] text-text-dim">线索</div>
            </div>
            <div>
              <div className="tabular text-2xl text-text-hi">
                <CountUp to={memories.length} from={0} duration={1.1} trigger="load" />
              </div>
              <div className="mt-1 text-[11px] text-text-dim">记忆碎片</div>
            </div>
            <div>
              <div className="tabular text-2xl text-text-hi">
                <CountUp to={history.length} from={0} duration={1.1} trigger="load" />
              </div>
              <div className="mt-1 text-[11px] text-text-dim">抉择</div>
            </div>
          </div>

          {replay.length > 0 && <section className="mt-8 w-full">
            <h2 className="mb-3 text-xs tracking-[0.2em] text-text-dim">关键分歧</h2>
            <ol className="flex flex-col gap-2">
              {replay.map((entry) => (
                <li key={`${entry.sceneId}-${entry.at}`} className="rounded-md border border-border-subtle bg-surface/70 px-3 py-2 text-xs text-text-secondary">
                  <span className="text-text-dim">{getScene(entry.sceneId)?.title ?? entry.chapter} · {entry.choice}</span>
                  <span className="mt-0.5 block text-text-secondary">{entry.label}</span>
                  {entry.consequence && <p className="mt-2 leading-relaxed text-text-dim">{entry.consequence}</p>}
                </li>
              ))}
            </ol>
          </section>}

          <section className="mt-8 w-full">
            <h2 className="mb-3 text-xs tracking-[0.2em] text-text-dim">尾声 · 你的去留</h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(data.epilogues) as Epilogue[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setEpilogue(key)}
                  aria-pressed={epilogue === key}
                  className={`min-h-11 rounded-[18px] border px-3 py-3 text-sm transition-colors ${epilogue === key ? 'border-accent bg-accent/10 text-accent' : 'border-border bg-surface text-text-secondary'}`}
                >
                  {data.epilogues[key].label}
                </button>
              ))}
            </div>
            {epilogueText && <p className="mt-4 text-sm leading-relaxed text-text-secondary">{epilogueText}</p>}
          </section>

          <div className="mt-10 flex flex-col items-center gap-3">
            <SpecularButton onClick={() => navigate('/')} lineColor={accent} textColor="var(--color-text-hi)">
              返回标题
            </SpecularButton>
            <button type="button" onClick={() => navigate('/archive')} className="min-h-11 rounded-[18px] px-4 text-xs text-text-dim active:text-text-secondary">
              查看档案库
            </button>
          </div>
        </motion.div>
      </main>
    </GameShell>
  )
}
