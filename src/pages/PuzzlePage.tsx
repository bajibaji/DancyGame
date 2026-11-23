import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard'
import { CHAPTERS, CLUE_MAP, getScene } from '../content/index'
import { useGameStore } from '../stores/gameStore'
import { availableRecipes, matchRecipe } from '../game/puzzle'
import type { Recipe } from '../game/puzzle'

export default function PuzzlePage() {
  const navigate = useNavigate()
  const sceneId = useGameStore((s) => s.sceneId)
  const clues = useGameStore((s) => s.clues)
  const solved = useGameStore((s) => s.solved)
  const solvePuzzle = useGameStore((s) => s.solvePuzzle)
  const [selected, setSelected] = useState<string[]>([])
  const [notice, setNotice] = useState<string | null>(null)
  const [result, setResult] = useState<{ recipe: Recipe | null } | null>(null)

  const scene = getScene(sceneId)
  const owned = useMemo(() => clues.filter((id) => CLUE_MAP.has(id)), [clues])
  const solvedTitles = useMemo(() => availableRecipes(clues).filter((r) => solved.includes(r.id)).map((r) => r.title), [clues, solved])
  const success = result?.recipe
  const chapterScenes = CHAPTERS.find(({ chapter }) => chapter === scene?.chapter)?.scenes ?? []
  const currentIndex = chapterScenes.findIndex(({ id }) => id === sceneId)
  const followUpScene = success && chapterScenes.find((section, index) =>
    index >= currentIndex && section.followUps?.some(({ recipe }) => recipe === success.id),
  )

  const toggle = (id: string) => {
    setNotice(null)
    setResult(null)
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
    setResult({ recipe: solvePuzzle(selected[0], selected[1]) })
  }

  const onContinue = () => {
    navigate('/archive')
  }

  return (
    <GameShell>
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={onContinue} className="flex min-h-11 items-center rounded-[18px] pl-1 pr-3 text-sm text-accent active:opacity-70">
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </button>
          <h1 className="font-display text-lg text-text-hi">推理板</h1>
          <span className="max-w-24 truncate text-[11px] text-text-dim">{scene?.title}</span>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col px-4 pb-44 pt-4">
        <p className="mb-3 text-xs leading-relaxed text-text-secondary">
          对照已入档的线索，不代替现场核查。
        </p>
        {solvedTitles.length > 0 && (
          <p className="mb-3 text-[11px] text-success">已推演：{solvedTitles.join('、')}</p>
        )}
        {notice && <p className="mb-3 text-[11px] text-warning">{notice}</p>}

        {result && (
          <div className={`mb-4 rounded-[18px] border p-3.5 text-sm ${success ? 'border-success/50 bg-success/10 text-success' : 'border-border bg-surface text-text-secondary'}`}>
            {success ? (
              <>
                <p className="font-display text-base text-text-hi">推理成立 · {success.title}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {followUpScene ? `${followUpScene.title} · 已准备一份补充材料。` : '已记入推理板。'}
                </p>
              </>
            ) : (
              <p>暂未发现这两条线索的关联。</p>
            )}
          </div>
        )}

        <h2 className="mb-2 text-[11px] tracking-[0.2em] text-text-dim">已入档线索（{owned.length}）</h2>
        <div className="flex flex-col gap-2">
          {owned.map((id) => {
            const clue = CLUE_MAP.get(id)!
            const active = selected.includes(id)
            return (
              <button key={id} type="button" aria-pressed={active} onClick={() => toggle(id)} className="text-left active:scale-[0.99]">
                <SpotlightCard
                  className={`rounded-[18px] border px-3.5 py-3 transition-colors ${active ? 'border-accent bg-accent/10' : 'border-border bg-surface'}`}
                  spotlightColor="rgba(217,162,75,0.18)"
                  intensity={0.35}
                  borderGlow={active ? 0.8 : 0.15}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <span className={`text-sm ${active ? 'text-accent' : 'text-clue'}`}>{clue.title}</span>
                    <span className="tabular shrink-0 text-[10px] text-text-dim">{clue.id} · {clue.category}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-text-secondary">{clue.description}</p>
                </SpotlightCard>
              </button>
            )
          })}
          {owned.length === 0 && <p className="text-sm text-text-dim">还没有线索可以推演。</p>}
        </div>
      </main>

      <div className="fixed bottom-0 left-1/2 z-20 w-full max-w-[430px] -translate-x-1/2 border-t border-border-subtle/60 bg-bg-deep/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur">
        <div className="mb-2 flex items-center gap-2">
          {[0, 1].map((slot) => {
            const id = selected[slot]
            const clue = id ? CLUE_MAP.get(id) : undefined
            return (
              <div
                key={slot}
                className={`flex min-h-9 flex-1 items-center justify-center truncate rounded-[18px] border px-3 text-xs ${clue ? 'border-accent/60 bg-accent/10 text-accent' : 'border-dashed border-border-strong bg-bg-sunken/50 text-text-dim'}`}
              >
                {clue ? clue.title : `选卡 ${slot + 1}`}
              </div>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {!success && (
            <button
              type="button"
              onClick={onSolve}
              disabled={selected.length !== 2}
              className="flex-1 rounded-[18px] border border-accent/50 bg-accent/10 py-3.5 text-sm text-accent active:scale-[0.99] disabled:border-border disabled:bg-surface disabled:text-text-dim"
            >
              推演（{selected.length}/2）
            </button>
          )}
          <button
            type="button"
            onClick={onContinue}
            className={success ? 'w-full rounded-[18px] border border-success/50 bg-success/10 py-3.5 text-sm text-success active:scale-[0.99]' : 'shrink-0 rounded-[18px] px-3 py-3.5 text-xs text-text-dim active:text-text-secondary'}
          >
            返回档案库
          </button>
        </div>
      </div>
    </GameShell>
  )
}
