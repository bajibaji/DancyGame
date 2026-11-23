import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Lock, RotateCcw } from 'lucide-react'
import { CHAPTERS, CLUE_MAP, chapterTitle, getScene } from '../../content/index'
import { useGameStore } from '../../stores/gameStore'
import { RECIPES } from '../../game/puzzle'
import { PUZZLES, assistFor, judgePuzzle, puzzleStatus } from '../../game/puzzles'
import type { Puzzle } from '../../game/puzzles'

export default function PuzzleBoard() {
  const navigate = useNavigate()
  const sceneId = useGameStore((s) => s.sceneId)
  const clues = useGameStore((s) => s.clues)
  const solved = useGameStore((s) => s.solved)
  const solvePuzzle = useGameStore((s) => s.solvePuzzle)
  const [openId, setOpenId] = useState<string | null>(null)
  const [picked, setPicked] = useState<string[]>([])
  const [wrong, setWrong] = useState(0)
  const [notice, setNotice] = useState<string | null>(null)
  const [successRecipe, setSuccessRecipe] = useState<string | null>(null)

  const scene = getScene(sceneId)
  const currentChapter = scene?.chapter

  const statuses = useMemo(
    () =>
      PUZZLES.map((puzzle) => ({
        puzzle,
        status: puzzleStatus(puzzle, currentChapter, clues, solved),
      })),
    [currentChapter, clues, solved],
  )
  const solvedCount = statuses.filter(({ status }) => status === 'solved').length
  const openEntry = statuses.find(({ puzzle }) => puzzle.id === openId)
  const open = openEntry?.puzzle

  useEffect(() => {
    if (openId) return
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    const first = statuses.find(({ status }) => status === 'ready') ?? statuses.find(({ status }) => status === 'solved')
    if (first) setOpenId(first.puzzle.id)
  }, [openId, statuses])

  const chapterScenes = CHAPTERS.find(({ chapter }) => chapter === scene?.chapter)?.scenes ?? []
  const currentIndex = chapterScenes.findIndex(({ id }) => id === sceneId)
  const followUpScene =
    open &&
    chapterScenes.find(
      (section, index) =>
        index >= currentIndex && section.followUps?.some(({ recipe }) => recipe === open.recipe),
    )

  const reset = () => {
    setPicked([])
    setWrong(0)
    setNotice(null)
    setSuccessRecipe(null)
  }

  const openPuzzle = (puzzle: Puzzle) => {
    reset()
    setOpenId(puzzle.id)
  }

  const closePuzzle = () => {
    reset()
    setOpenId(null)
  }

  const assist = open ? assistFor(open, wrong) : { revealed: [], excluded: [] }

  const toggle = (key: string) => {
    if (!open || successRecipe) return
    setNotice(null)
    if (open.kind === 'pair') {
      if (assist.revealed.includes(key)) {
        setNotice('这张是保底标出的线索，不能取消。')
        return
      }
      setPicked((prev) => {
        if (prev.includes(key)) return prev.filter((id) => id !== key)
        if (prev.length < 2) return [...prev, key]
        const keep = prev.filter((id) => !assist.revealed.includes(id))
        return [...assist.revealed, ...keep.slice(1), key].slice(0, 2)
      })
      return
    }
    if (assist.excluded.includes(key)) {
      setNotice('这一项已经被排除了。')
      return
    }
    setPicked([key])
  }

  const onSubmit = () => {
    if (!open || successRecipe) return
    if (judgePuzzle(open, picked)) {
      const recipe = RECIPES.find(({ id }) => id === open.recipe)
      if (recipe) solvePuzzle(recipe.cards[0], recipe.cards[1])
      setSuccessRecipe(open.recipe)
      setNotice(null)
      return
    }
    const nextWrong = wrong + 1
    setWrong(nextWrong)
    const nextAssist = assistFor(open, nextWrong)
    if (open.kind === 'pair' && nextAssist.revealed.length > 0) {
      setPicked((prev) => {
        const keep = prev.filter((id) => !nextAssist.revealed.includes(id))
        return [...nextAssist.revealed, ...keep].slice(0, 2)
      })
      setNotice(`${open.hint} 已标出一条保底线索。`)
    } else if (open.kind === 'contradiction' && nextAssist.excluded.length > 0) {
      setPicked((prev) => prev.filter((key) => !nextAssist.excluded.includes(key)))
      setNotice(
        nextAssist.excluded.length >= 3
          ? '只剩一条判断，再试一次。'
          : '已排除两条错误判断，再试一次。',
      )
    } else {
      setNotice(open.hint)
    }
  }

  const canSubmit =
    open?.kind === 'pair'
      ? picked.length === 2
      : picked.length === 1 && !assist.excluded.includes(picked[0])

  const controls = (() => {
    if (!open) return null
    if (successRecipe) {
      return (
        <div className="rounded-[18px] border border-success/40 bg-success/10 p-3">
          <p className="font-display text-sm text-text-hi">
            推理成立 · {RECIPES.find(({ id }) => id === successRecipe)?.title ?? open.title}
          </p>
          <p className="mt-0.5 text-[11px] leading-relaxed text-text-secondary">
            {followUpScene ? `${followUpScene.title} · 已准备一份补充材料。` : '已记入推理板。'}
          </p>
          <details className="mt-2 border-l-2 border-success/40 pl-2.5">
            <summary className="min-h-9 cursor-pointer py-1.5 text-[11px] leading-relaxed text-success">
              {open.reward.label}
            </summary>
            <p className="pb-1.5 text-[11px] leading-relaxed text-text-secondary">{open.reward.text}</p>
          </details>
          <div className="mt-2.5 flex gap-2">
            {followUpScene && (
              <button
                type="button"
                onClick={() => navigate('/story')}
                className="flex-1 rounded-[18px] border border-success/50 bg-success/15 py-2.5 text-xs text-success active:scale-[0.99]"
              >
                查看补充材料
              </button>
            )}
            <button
              type="button"
              onClick={closePuzzle}
              className="flex-1 rounded-[18px] border border-border bg-surface py-2.5 text-xs text-text-secondary active:bg-surface-hover lg:hidden"
            >
              返回题目列表
            </button>
          </div>
        </div>
      )
    }
    if (solved.includes(open.recipe)) {
      return (
        <button
          type="button"
          onClick={closePuzzle}
          className="w-full rounded-[18px] border border-border bg-surface py-3 text-sm text-text-secondary active:bg-surface-hover lg:hidden"
        >
          返回题目列表
        </button>
      )
    }
    return (
      <>
        {notice && <p className="mb-2 text-[11px] leading-relaxed text-warning">{notice}</p>}
        {wrong >= 3 && (
          <p className="mb-2 flex items-center gap-1 text-[11px] text-text-dim">
            <RotateCcw size={12} />
            再错一次也会保留当前提示，逐项排除。
          </p>
        )}
        <button
          type="button"
          onClick={onSubmit}
          disabled={!canSubmit}
          className="w-full rounded-[18px] border border-clue/50 bg-clue/10 py-3 text-sm text-clue active:scale-[0.99] disabled:border-border disabled:bg-surface disabled:text-text-dim"
        >
          推演
        </button>
      </>
    )
  })()

  return (
    <>
      <div className={open ? 'pb-48 lg:pb-4' : 'pb-4'}>
        <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-6">
          <div className={`${open ? 'hidden lg:block' : 'block'} lg:sticky lg:top-24 lg:max-h-[calc(100dvh-7rem)] lg:overflow-y-auto lg:pr-1`}>
            <p className="mb-3 text-[11px] leading-relaxed text-text-dim">
              每章一道推理题。选错会先给方向，两次之后标出保底线索；推演成功会在后续剧情里留下回应。
            </p>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-[11px] tracking-[0.2em] text-text-dim">推理题（{solvedCount}/{PUZZLES.length}）</h2>
            </div>
            <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-1">
              {statuses.map(({ puzzle, status }) => {
                const active = openId === puzzle.id
                return (
                  <button
                    key={puzzle.id}
                    type="button"
                    disabled={status === 'locked-chapter' || status === 'locked-clues'}
                    onClick={() => openPuzzle(puzzle)}
                    className={`flex items-center gap-3 rounded-[14px] border p-3 text-left transition-colors active:scale-[0.99] ${
                      active
                        ? 'border-accent/50 bg-accent/5'
                        : status === 'solved'
                          ? 'border-success/40 bg-success/5'
                          : status === 'ready'
                            ? 'border-border bg-surface active:bg-surface-hover'
                            : 'border-border-subtle bg-bg-sunken/40 opacity-60'
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-[11px] ${
                        status === 'solved'
                          ? 'border-success/50 text-success'
                          : status === 'ready'
                            ? 'border-accent/50 text-accent'
                            : 'border-border-strong text-text-dim'
                      }`}
                    >
                      {status === 'solved' ? <Check size={14} strokeWidth={2.2} /> : status === 'ready' ? <ChevronRight size={14} /> : <Lock size={13} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block text-[13px] ${status === 'solved' ? 'text-success' : status === 'ready' ? 'text-text-hi' : 'text-text-dim'}`}>
                        {puzzle.title}
                      </span>
                      <span className="mt-0.5 flex items-center gap-1.5 text-[10px] text-text-dim">
                        <span>{chapterTitle(puzzle.chapter)}</span>
                        <span aria-hidden>·</span>
                        <span>
                          {status === 'solved'
                            ? '已推演'
                            : status === 'ready'
                              ? '可推演'
                              : status === 'locked-chapter'
                                ? '推进到该章后开放'
                                : '相关线索尚未入档'}
                        </span>
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className={`${open ? 'block' : 'hidden lg:block'} min-w-0`}>
            {open ? (
              <div className="md:mx-auto md:w-full md:max-w-[700px] lg:mx-0 lg:max-w-none">
                <button
                  type="button"
                  onClick={closePuzzle}
                  className="mb-3 flex min-h-9 items-center gap-1 rounded-[12px] pr-2 text-[11px] text-accent active:opacity-70 lg:hidden"
                >
                  <ChevronRight size={14} className="rotate-180" />
                  返回题目列表
                </button>
                <h2 className="font-display text-base text-text-hi">{open.title}</h2>
                <p className="mt-1 text-[11px] leading-relaxed text-text-dim">{open.prompt}</p>

                {solved.includes(open.recipe) && !successRecipe ? (
                  <div className="mt-4 rounded-[14px] border border-success/40 bg-success/5 p-4">
                    <p className="flex items-center gap-1.5 text-[13px] text-text-hi">
                      <Check size={14} strokeWidth={2.2} className="text-success" />
                      {RECIPES.find(({ id }) => id === open.recipe)?.title ?? open.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">这道题已经推演过，结论已记入档案。</p>
                    <details className="mt-2 border-l-2 border-success/40 pl-2.5">
                      <summary className="min-h-9 cursor-pointer py-1.5 text-[11px] leading-relaxed text-success">
                        {open.reward.label}
                      </summary>
                      <p className="pb-1.5 text-[11px] leading-relaxed text-text-secondary">{open.reward.text}</p>
                    </details>
                  </div>
                ) : open.kind === 'pair' ? (
                  <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
                    {open.choices.map((id) => {
                      const clue = CLUE_MAP.get(id)
                      if (!clue) return null
                      const active = picked.includes(id)
                      const revealed = assist.revealed.includes(id)
                      return (
                        <button
                          key={id}
                          type="button"
                          aria-pressed={active}
                          onClick={() => toggle(id)}
                          className={`relative flex min-h-[92px] flex-col gap-1 rounded-[14px] border p-2.5 text-left transition-colors active:scale-[0.99] ${
                            active ? 'border-clue/70 bg-clue/10' : 'border-border bg-surface active:bg-surface-hover'
                          }`}
                        >
                          <span className="flex items-center justify-between gap-1 text-[10px] leading-none text-text-dim">
                            <span className="tabular">{clue.id}</span>
                            <span>{clue.category}</span>
                          </span>
                          <span className={`line-clamp-2 text-[13px] font-medium leading-snug ${active ? 'text-clue' : 'text-clue/90'}`}>
                            {clue.title}
                          </span>
                          <span className="line-clamp-1 text-[10px] leading-relaxed text-text-dim">{clue.description}</span>
                          {revealed && (
                            <span aria-hidden className="absolute -right-1.5 -top-1.5 flex items-center gap-0.5 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-semibold text-bg-deep">
                              保底
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2 md:grid-cols-2">
                      {open.materials.map((id) => {
                        const clue = CLUE_MAP.get(id)
                        if (!clue) return null
                        return (
                          <div key={id} className="rounded-[14px] border border-border bg-surface p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="text-[13px] text-clue">{clue.title}</h3>
                              <span className="tabular text-[10px] text-text-dim">{clue.id} · {clue.category}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{clue.description}</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="grid gap-1.5">
                      {open.items.map((item) => {
                        const active = picked.includes(item.key)
                        const excluded = assist.excluded.includes(item.key)
                        return (
                          <button
                            key={item.key}
                            type="button"
                            aria-pressed={active}
                            disabled={excluded}
                            onClick={() => toggle(item.key)}
                            className={`flex min-h-11 items-start gap-2.5 rounded-[14px] border p-3 text-left text-[12px] leading-relaxed transition-colors active:scale-[0.99] ${
                              excluded
                                ? 'border-border-subtle bg-bg-sunken/40 text-text-dim line-through opacity-60'
                                : active
                                  ? 'border-clue/70 bg-clue/10 text-clue'
                                  : 'border-border bg-surface text-text-secondary active:bg-surface-hover'
                            }`}
                          >
                            <span aria-hidden className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-current text-[10px]">
                              {item.key}
                            </span>
                            {item.text}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                <div className="mt-4 hidden lg:block">{controls}</div>
              </div>
            ) : (
              <div className="rounded-[14px] border border-dashed border-border bg-surface/40 p-8 text-center text-xs leading-relaxed text-text-dim">
                从左侧选择一道推理题开始。
              </div>
            )}
          </div>
        </div>
      </div>

      {open && (
        <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border-subtle/60 bg-bg-deep/95 px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur md:max-w-[620px] md:px-6 lg:hidden">
          {controls}
        </div>
      )}
    </>
  )
}
