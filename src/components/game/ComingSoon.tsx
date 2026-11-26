import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Hourglass } from 'lucide-react'
import GameShell from './Layout/GameShell'
import { GAME } from '../../content/index'

export default function ComingSoon() {
  const navigate = useNavigate()
  return (
    <GameShell>
      <main className="mx-auto flex min-h-dvh w-full max-w-[560px] flex-col items-center justify-center gap-6 px-6 py-12 text-center">
        <Hourglass size={44} strokeWidth={1.3} className="text-accent" aria-hidden />
        <p className="text-sm text-text-secondary">{GAME.title} · {GAME.subtitle}</p>
        <h1 className="font-display text-3xl text-text-hi">敬请期待</h1>
        {GAME.lines.map((line) => (
          <p key={line} className="text-sm leading-relaxed text-text-secondary">{line}</p>
        ))}
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-2 flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm text-text-secondary"
        >
          <ArrowLeft size={16} aria-hidden />返回标题
        </button>
      </main>
    </GameShell>
  )
}
