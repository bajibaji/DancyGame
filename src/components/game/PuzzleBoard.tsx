import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Lock, RotateCcw, X } from 'lucide-react'
import { CHAPTERS, CLUE_MAP, chapterTitle, getScene, getSceneBaseId } from '../../content/index'
import { useGameStore } from '../../stores/gameStore'
import { RECIPES } from '../../game/puzzle'
import { PUZZLES, assistFor, judgePuzzle, puzzleStatus } from '../../game/puzzles'
import type { Puzzle } from '../../game/puzzles'
import { isReleasedChapter, isReleasedRecipe } from '../../content/release'
import StarBorder from '../reactbits/StarBorder/StarBorder'
import SpecularButton from '../reactbits/SpecularButton/SpecularButton'
import SplitText from '../reactbits/SplitText/SplitText'
import BlurText from '../reactbits/BlurText/BlurText'

const CLUE_CHAPTER = new Map<string, number>()
CHAPTERS.forEach((chapter, index) => {
  for (const scene of chapter.scenes) {
    for (const id of scene.effects?.clues ?? []) if (!CLUE_CHAPTER.has(id)) CLUE_CHAPTER.set(id, index)
    for (const option of scene.options ?? []) for (const id of option.effects.clues ?? []) if (!CLUE_CHAPTER.has(id)) CLUE_CHAPTER.set(id, index)
  }
})

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
  const [shaking, setShaking] = useState<string[]>([])

  const scene = getScene(sceneId)
  const currentChapter = scene?.chapter

  const statuses = useMemo(
    () =>
      PUZZLES.filter((puzzle) => isReleasedChapter(puzzle.chapter) && isReleasedRecipe(puzzle.kind === 'pair' ? puzzle.answer : puzzle.materials)).map((entry) => {
        const chapterIndex = CHAPTERS.findIndex(({ chapter }) => chapter === entry.chapter)
        const puzzle = entry.kind === 'pair'
          ? { ...entry, choices: entry.choices.filter((id) => clues.includes(id) || (CLUE_CHAPTER.get(id) ?? Number.POSITIVE_INFINITY) <= chapterIndex) }
          : entry
        return {
          puzzle,
          status: puzzleStatus(puzzle, currentChapter, clues, solved),
        }
      }),
    [currentChapter, clues, solved],
  )
  const solvedCount = statuses.filter(({ status }) => status === 'solved').length
  const progress = statuses.length ? Math.round((solvedCount / statuses.length) * 100) : 0
  const openEntry = statuses.find(({ puzzle }) => puzzle.id === openId)
  const open = openEntry?.puzzle
  const openIndex = statuses.findIndex(({ puzzle }) => puzzle.id === openId)

  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  const chapterScenes = CHAPTERS.find(({ chapter }) => chapter === scene?.chapter)?.scenes.filter((section) => !section.inherits) ?? []
  const currentIndex = chapterScenes.findIndex(({ id }) => id === getSceneBaseId(sceneId))
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
    setShaking([])
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
      const result = recipe ? solvePuzzle(recipe.cards[0], recipe.cards[1]) : null
      if (!result) {
        setNotice('这两张材料还没有同时入档，暂时不能推演。')
        return
      }
      setSuccessRecipe(open.recipe)
      setNotice(null)
      return
    }
    const nextWrong = wrong + 1
    setWrong(nextWrong)
    setShaking(picked)
    window.setTimeout(() => setShaking([]), 420)
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

  const rewardTitle = open ? RECIPES.find(({ id }) => id === open.recipe)?.title ?? open.title : ''

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface">
          <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <span className="tabular text-[11px] text-text-dim">
          {solvedCount}/{statuses.length}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 lg:grid-cols-4">
        {statuses.map(({ puzzle, status }) => {
          const locked = status === 'locked-chapter' || status === 'locked-clues'
          return (
            <StarBorder
              key={puzzle.id}
              as="button"
              disabled={locked}
              onClick={() => openPuzzle(puzzle)}
              radius={18}
              thickness={1}
              color={
                status === 'solved'
                  ? 'var(--color-success)'
                  : status === 'ready'
                    ? 'var(--color-clue)'
                    : 'var(--color-border)'
              }
              className={`flex min-h-[92px] flex-col justify-between gap-2 p-3.5 text-left active:scale-[0.98] ${locked ? 'opacity-55' : ''}`}
            >
              <span className="flex items-center justify-between">
                <span
                  aria-hidden
                  className={`grid h-7 w-7 place-items-center rounded-full border ${
                    status === 'solved'
                      ? 'border-success/50 text-success'
                      : status === 'ready'
                        ? 'border-accent/50 text-accent'
                        : 'border-border-strong text-text-dim'
                  }`}
                >
                  {status === 'solved' ? <Check size={13} strokeWidth={2.2} /> : status === 'ready' ? <ChevronRight size={13} /> : <Lock size={12} />}
                </span>
                <span className="text-[10px] text-text-dim">
                  {status === 'solved' ? '已推演' : status === 'ready' ? '可推演' : status === 'locked-chapter' ? '未开放' : '缺线索'}
                </span>
              </span>
              <span className={`line-clamp-2 text-[13px] leading-snug ${status === 'solved' ? 'text-success' : status === 'ready' ? 'text-text-hi' : 'text-text-dim'}`}>
                {puzzle.title}
              </span>
            </StarBorder>
          )
        })}
      </div>

      {!statuses.length && (
        <BlurText
          text="推理题会在调查推进后陆续出现。"
          animateBy="words"
          trigger="view"
          className="justify-center py-8 text-center text-xs text-text-dim"
        />
      )}

      {open && (
        <div className="fixed inset-0 z-40 flex flex-col bg-bg-deep/95 backdrop-blur-xl">
          <header className="flex items-center gap-2.5 border-b border-border-subtle/60 px-3 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
            <SpecularButton
              size="sm"
              radius={12}
              onClick={closePuzzle}
              lineColor="var(--color-border)"
              textColor="var(--color-text-secondary)"
              className="shrink-0"
            >
              <X size={15} strokeWidth={2} /> 列表
            </SpecularButton>
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-sm text-text-hi">{open.title}</h2>
              <p className="truncate text-[10px] text-text-dim">
                {chapterTitle(open.chapter)} · 第 {openIndex + 1} / {statuses.length} 题
              </p>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto px-4 py-4 pb-40">
            {successRecipe ? (
              <div className="mx-auto flex max-w-[560px] flex-col items-center pt-8 text-center">
                <span className="grid h-14 w-14 place-items-center rounded-full border border-success/50 bg-success/10 text-success">
                  <Check size={26} strokeWidth={2.2} />
                </span>
                <SplitText
                  text="推理成立"
                  tag="h3"
                  className="mt-4 font-display text-xl text-success"
                  splitType="chars"
                  effect="pop"
                  trigger="load"
                  duration={0.5}
                  delay={40}
                />
                <p className="mt-2 text-sm text-text-hi">{rewardTitle}</p>
                <p className="mt-1 text-xs text-text-secondary">
                  {followUpScene ? `${followUpScene.title} · 已准备一份补充材料。` : '结论已记入档案。'}
                </p>
                <StarBorder as="div" radius={18} thickness={1} color="var(--color-success)" className="mt-6 flex w-full flex-col items-start gap-0 p-4 text-left">
                  <p className="text-[11px] text-success">{open.reward.label}</p>
                  <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{open.reward.text}</p>
                </StarBorder>
              </div>
            ) : (
              <div className="mx-auto max-w-[720px]">
                <p className="text-xs leading-relaxed text-text-secondary">{open.prompt}</p>

                {solved.includes(open.recipe) ? (
                  <StarBorder as="div" radius={18} thickness={1} color="var(--color-success)" className="mt-6 flex flex-col items-start gap-0 p-4">
                    <p className="flex items-center gap-1.5 text-sm text-success">
                      <Check size={15} strokeWidth={2.2} />
                      这道题已经推演过
                    </p>
                    <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">{rewardTitle}</p>
                    <p className="mt-2 text-[11px] leading-relaxed text-text-dim">{open.reward.text}</p>
                  </StarBorder>
                ) : open.kind === 'pair' ? (
                  <>
                    <p className="mt-4 text-[11px] text-text-dim">选两张能互相印证的线索</p>
                    <div className="mt-2 grid grid-cols-2 gap-2.5 md:grid-cols-3">
                      {open.choices.map((id) => {
                        const clue = CLUE_MAP.get(id)
                        if (!clue) return null
                        const active = picked.includes(id)
                        const revealed = assist.revealed.includes(id)
                        return (
                          <StarBorder
                            key={id}
                            as="button"
                            aria-pressed={active}
                            onClick={() => toggle(id)}
                            radius={18}
                            thickness={1}
                            color={active ? 'var(--color-clue)' : 'var(--color-border)'}
                            className={`relative flex min-h-[116px] flex-col gap-1.5 p-3 text-left ${shaking.includes(id) ? 'animate-[puzzle-shake_0.4s_ease-in-out]' : ''}`}
                          >
                            <span className="flex items-center justify-between gap-1 text-[10px] text-text-dim">
                              <span className="tabular">{clue.id}</span>
                              <span>{clue.category}</span>
                            </span>
                            <span className={`line-clamp-2 text-[13px] font-medium leading-snug ${active ? 'text-clue' : 'text-clue/90'}`}>
                              {clue.title}
                            </span>
                            <span className="line-clamp-2 text-[10px] leading-relaxed text-text-dim">{clue.description}</span>
                            {active && (
                              <span aria-hidden className="absolute right-2 top-2 grid h-5 w-5 place-items-center rounded-full bg-clue text-bg-deep">
                                <Check size={12} strokeWidth={3} />
                              </span>
                            )}
                            {revealed && !active && (
                              <span aria-hidden className="absolute right-2 top-2 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-semibold text-bg-deep">
                                保底
                              </span>
                            )}
                          </StarBorder>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mt-4 grid gap-2 md:grid-cols-2">
                      {open.materials.map((id) => {
                        const clue = CLUE_MAP.get(id)
                        if (!clue) return null
                        return (
                          <StarBorder key={id} as="div" radius={18} thickness={1} color="var(--color-border)" className="flex flex-col items-start gap-0 p-3">
                            <div className="flex items-baseline justify-between gap-2">
                              <h3 className="text-[13px] text-clue">{clue.title}</h3>
                              <span className="tabular text-[10px] text-text-dim">{clue.id}</span>
                            </div>
                            <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{clue.description}</p>
                          </StarBorder>
                        )
                      })}
                    </div>
                    <p className="mt-4 text-[11px] text-text-dim">选一条能被材料支持的判断</p>
                    <div className="mt-2 grid gap-2">
                      {open.items.map((item) => {
                        const active = picked.includes(item.key)
                        const excluded = assist.excluded.includes(item.key)
                        return (
                          <StarBorder
                            key={item.key}
                            as="button"
                            aria-pressed={active}
                            disabled={excluded}
                            onClick={() => toggle(item.key)}
                            radius={18}
                            thickness={1}
                            color={active ? 'var(--color-clue)' : 'var(--color-border)'}
                            className={`flex min-h-[56px] items-start gap-3 p-3.5 text-left text-[13px] leading-relaxed ${excluded ? 'opacity-60' : ''} ${shaking.includes(item.key) ? 'animate-[puzzle-shake_0.4s_ease-in-out]' : ''}`}
                          >
                            <span
                              aria-hidden
                              className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[11px] ${
                                active ? 'border-clue/70 text-clue' : 'border-border-strong text-text-dim'
                              }`}
                            >
                              {item.key}
                            </span>
                            <span className={`flex-1 ${excluded ? 'text-text-dim line-through' : active ? 'text-clue' : 'text-text-secondary'}`}>{item.text}</span>
                          </StarBorder>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </main>

          <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-border-subtle/60 bg-bg-deep/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
            <div className="mx-auto w-full max-w-[720px]">
              {notice && <p className="mb-2 text-center text-[11px] leading-relaxed text-warning">{notice}</p>}
              {!successRecipe && wrong >= 3 && (
                <p className="mb-2 flex items-center justify-center gap-1 text-[10px] text-text-dim">
                  <RotateCcw size={11} />
                  再错一次也会保留当前提示，逐项排除
                </p>
              )}
              {successRecipe ? (
                <div className="flex gap-2">
                  {followUpScene && (
                    <SpecularButton
                      size="md"
                      radius={18}
                      onClick={() => navigate('/story')}
                      lineColor="var(--color-success)"
                      textColor="var(--color-success)"
                      className="flex-1"
                    >
                      查看补充材料
                    </SpecularButton>
                  )}
                  <SpecularButton
                    size="md"
                    radius={18}
                    onClick={closePuzzle}
                    lineColor="var(--color-accent)"
                    textColor="var(--color-accent)"
                    className="flex-1"
                  >
                    返回列表
                  </SpecularButton>
                </div>
              ) : solved.includes(open.recipe) ? (
                <SpecularButton
                  size="md"
                  radius={18}
                  onClick={closePuzzle}
                  lineColor="var(--color-border)"
                  textColor="var(--color-text-secondary)"
                  className="w-full"
                >
                  返回列表
                </SpecularButton>
              ) : (
                <SpecularButton
                  size="md"
                  radius={18}
                  onClick={onSubmit}
                  disabled={!canSubmit}
                  lineColor="var(--color-clue)"
                  textColor="var(--color-clue)"
                  className="w-full"
                >
                  {open.kind === 'pair' ? `推演${picked.length === 2 ? '' : `（已选 ${picked.length} / 2）`}` : '推演'}
                </SpecularButton>
              )}
            </div>
          </footer>
        </div>
      )}
    </>
  )
}
