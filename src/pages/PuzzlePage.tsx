import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard'
import { CLUE_MAP, getScene } from '../content/index'
import { useGameStore } from '../stores/gameStore'
import { RECIPES, matchRecipe } from '../game/puzzle'

export default function PuzzlePage() {
  const navigate = useNavigate()
  const sceneId = useGameStore((s) => s.sceneId)
  const clues = useGameStore((s) => s.clues)
  const solved = useGameStore((s) => s.solved)
  const puzzleResult = useGameStore((s) => s.puzzleResult)
  const solvePuzzle = useGameStore((s) => s.solvePuzzle)
  const closePuzzle = useGameStore((s) => s.closePuzzle)
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)

  const scene = getScene(sceneId)
  const owned = useMemo(() => clues.filter((id) => CLUE_MAP.has(id)), [clues])
  const result = puzzleResult
  const solvedTitles = useMemo(() => RECIPES.filter((r) => solved.includes(r.id)).map((r) => r.title), [solved])

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id)
      if (prev.length >= 2) return [prev[1], id]
      return [...prev, id]
    })
  }

  const onSolve = () => {
    if (selected.length !== 2) return
    const matched = matchRecipe(clues, selected[0], selected[1])
    if (matched && solved.includes(matched.id)) {
      setNotice('这组已经推演过了，换一组试试。')
      return
    }
    setNotice(null)
    solvePuzzle(selected[0], selected[1])
  }

  const onContinue = () => {
    closePuzzle()
    navigate('/story')
  }

  return (
    <GameShell>
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onContinue} className="flex min-h-11 items-center rounded-[18px] pl-1 pr-3 text-sm text-accent active:opacity-70">
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </button>
          <h1 className="font-display text-lg text-text-hi">推理板</h1>
          <span className="text-[11px] text-text-dim">{scene?.title}</span>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col px-4 py-5">
        <p className="mb-4 text-sm leading-relaxed text-text-secondary">
          选择两张线索卡进行组合推演。推演正确会加深证据链；推错只是死胡同，不会扣分。
        </p>
        {solvedTitles.length > 0 && (
          <p className="mb-4 text-xs text-success">已推演：{solvedTitles.join('、')}</p>
        )}
        {notice && <p className="mb-4 text-xs text-warning">{notice}</p>}

        <div className="mb-5 grid grid-cols-2 gap-3">
          {[0, 1].map((slot) => {
            const id = selected[slot]
            const clue = id ? CLUE_MAP.get(id) : undefined
            return (
              <div
                key={slot}
                className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-bg-sunken/60 p-3 text-center"
              >
                {clue ? (
                  <>
                    <span className="text-xs text-clue">{clue.title}</span>
                    <span className="tabular mt-1 text-[10px] text-text-dim">{clue.id}</span>
                  </>
                ) : (
                  <span className="text-xs text-text-dim">槽位 {slot + 1}</span>
                )}
              </div>
            )
          })}
        </div>

        {(!result || !result.recipe) && (
          <button
            type="button"
            onClick={onSolve}
            disabled={selected.length !== 2}
            className="mb-6 w-full rounded-[18px] border border-accent/50 bg-accent/10 py-3 text-sm text-accent transition-colors disabled:border-border disabled:bg-surface disabled:text-text-dim"
          >
            推 演
          </button>
        )}

        {result?.recipe && (
          <button
            type="button"
            onClick={onContinue}
            className="mb-6 w-full rounded-[18px] border border-success/50 bg-success/10 py-3 text-sm text-success"
          >
            线索 +2 · 继续调查
          </button>
        )}

        {result && (
          <div className={`mb-6 rounded-lg border p-4 text-sm ${result.recipe ? 'border-success/50 bg-success/10 text-success' : 'border-border bg-surface text-text-secondary'}`}>
            {result.recipe ? (
              <>
                <p className="font-display text-base text-text-hi">推理成立 · {result.recipe.title}</p>
                <p className="mt-1 text-xs text-text-secondary">线索 +2，组合已记入案情板。</p>
              </>
            ) : (
              <p>两张卡对不上。这是个死胡同——换个组合，或者继续调查。</p>
            )}
          </div>
        )}

        <h2 className="mb-3 text-xs tracking-[0.2em] text-text-dim">已入档线索（{owned.length}）</h2>
        <div className="grid gap-2 pb-28">
          {owned.map((id) => {
            const clue = CLUE_MAP.get(id)!
            const active = selected.includes(id)
            const used = solved.length > 0 && result?.recipe !== null && result?.cards.includes(id)
            return (
              <button key={id} type="button" onClick={() => toggle(id)} className="text-left">
                <SpotlightCard
                  className={`rounded-[18px] border p-3 transition-colors ${active ? 'border-accent bg-accent/10' : used ? 'border-success/40 bg-surface' : 'border-border bg-surface'}`}
                  spotlightColor="rgba(217,162,75,0.2)"
                  intensity={0.4}
                  borderGlow={active ? 0.8 : 0.2}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="text-xs text-clue">{clue.title}</span>
                    <span className="tabular text-[10px] text-text-dim">{clue.id}</span>
                  </div>
                  <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{clue.description}</p>
                </SpotlightCard>
              </button>
            )
          })}
          {owned.length === 0 && <p className="text-sm text-text-dim">还没有线索可以推演。</p>}
        </div>

        <div className="fixed bottom-0 left-1/2 w-full max-w-[430px] -translate-x-1/2 border-t border-border-subtle/50 bg-bg-deep/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
          <button type="button" onClick={onContinue} className="w-full rounded-[18px] border border-border-strong bg-surface-raised py-3.5 text-sm text-text active:scale-[0.99]">
            跳过推理，继续调查
          </button>
        </div>
      </main>
    </GameShell>
  )
}
