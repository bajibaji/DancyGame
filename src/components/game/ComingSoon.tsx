import { useNavigate } from 'react-router-dom'
import { Archive, ArrowLeft, Hourglass } from 'lucide-react'
import GameShell from './Layout/GameShell'
import { useGameStore } from '../../stores/gameStore'
import { isReleasedScene } from '../../content/release'

export default function ComingSoon() {
  const navigate = useNavigate()
  const history = useGameStore((state) => state.history)
  const arrival = history.at(-1)
  const response = arrival && isReleasedScene(arrival.sceneId) && !isReleasedScene(arrival.next ?? '') ? arrival.consequence : undefined
  return (
    <GameShell>
      <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Hourglass size={44} strokeWidth={1.3} className="text-accent" aria-hidden />
        <p className="text-sm text-text-secondary">沙漏停摆 · 第五章完</p>
        <h1 className="font-display text-3xl text-text-hi">敬请期待</h1>
        {response && <p className="text-sm leading-relaxed text-text-secondary">{response}</p>}
        <p className="text-sm leading-relaxed text-text-secondary">当前内容开放至第五章。后续篇章正在制作中，你的调查进度已保留。</p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={() => navigate('/archive')} className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm text-text-secondary">
            <Archive size={16} aria-hidden />查看档案
          </button>
          <button type="button" onClick={() => navigate('/')} className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm text-text-secondary">
            <ArrowLeft size={16} aria-hidden />返回标题
          </button>
        </div>
      </main>
    </GameShell>
  )
}
