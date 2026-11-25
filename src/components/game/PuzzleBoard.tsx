import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronRight, Lock, RotateCcw } from 'lucide-react'
import { CHAPTERS, CLUE_MAP, chapterTitle, getScene } from '../../content/index'
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
        <StarBorder as="div" radius={18} thickness={1} color="var(--color-success)" className="w-full p-3">
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
              <SpecularButton size="sm" radius={18} onClick={() => navigate('/story')} lineColor="var(--color-success)" textColor="var(--color-success)" className="flex-1">
                查看补充材料
              </SpecularButton>
            )}
            <SpecularButton size="sm" radius={18} onClick={closePuzzle} lineColor="var(--color-border)" textColor="var(--color-text-secondary)" className="flex-1">
              返回题目列表
            </SpecularButton>
          </div>
        </StarBorder>
      )
    }
    if (solved.includes(open.recipe)) {
      return (
        <SpecularButton size="md" radius={18} onClick={closePuzzle} lineColor="var(--color-border)" textColor="var(--color-text-secondary)" className="w-full">
          返回题目列表
        </SpecularButton>
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
        <SpecularButton
          size="md"
          radius={18}
          onClick={onSubmit}
          disabled={!canSubmit}
          lineColor="var(--color-clue)"
          textColor="var(--color-clue)"
          className="w-full"
        >
          推演
        </SpecularButton>
      </>
    )
  })()

  return (
    <>
      <div className={open ? 'pb-48 lg:pb-4' : 'pb-4'}>
        <div className={open ? 'hidden lg:block' : 'block'}>
          <p className="mb-3 text-[11px] leading-relaxed text-text-dim">
            收齐材料后可复核。判断有误时，档案会标出需要重看的地方。
          </p>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[11px] tracking-[0.2em] text-text-dim">推理题（{solvedCount}/{statuses.length}）</h2>
          </div>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
            {statuses.map(({ puzzle, status }) => {
              const active = openId === puzzle.id
              const locked = status === 'locked-chapter' || status === 'locked-clues'
              return (
                <StarBorder
                  key={puzzle.id}
                  as="button"
                  disabled={locked}
                  aria-pressed={active}
                  onClick={() => openPuzzle(puzzle)}
                  radius={18}
                  thickness={1}
                  color={
                    active
                      ? 'var(--color-accent)'
                      : status === 'solved'
                        ? 'var(--color-success)'
                        : status === 'ready'
                          ? 'var(--color-clue)'
                          : 'var(--color-border)'
                  }
                  className={`flex h-full items-center gap-2.5 p-3 text-left ${locked ? 'opacity-60' : ''}`}
                >
                  <span
                    aria-hidden
                    className={`grid h-7 w-7 shrink-0 place-items-center rounded-full border text-[11px] ${
                      status === 'solved'
                        ? 'border-success/50 text-success'
                        : status === 'ready'
                          ? 'border-accent/50 text-accent'
                          : 'border-border-strong text-text-dim'
                    }`}
                  >
                    {status === 'solved' ? <Check size={13} strokeWidth={2.2} /> : status === 'ready' ? <ChevronRight size={13} /> : <Lock size={12} />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`line-clamp-2 block text-[12px] leading-snug ${status === 'solved' ? 'text-success' : status === 'ready' ? 'text-text-hi' : 'text-text-dim'}`}>
                      {puzzle.title}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-text-dim">
                      {status === 'solved' ? '已推演' : status === 'ready' ? chapterTitle(puzzle.chapter) : status === 'locked-chapter' ? '未开放' : '缺线索'}
                    </span>
                  </span>
                </StarBorder>
              )
            })}
          </div>
        </div>

        <div className={`${open ? 'block' : 'hidden lg:block'} mt-4 min-w-0`}>
          {open ? (
            <div className="md:mx-auto md:w-full md:max-w-[700px] lg:mx-0 lg:max-w-none">
              <div className="mb-3 flex items-center justify-between gap-2">
                <SplitText
                  text={open.title}
                  tag="h2"
                  className="font-display text-base text-text-hi"
                  splitType="chars"
                  effect="fade"
                  trigger="load"
                  duration={0.4}
                  delay={20}
                />
                <SpecularButton size="sm" radius={18} onClick={closePuzzle} lineColor="var(--color-border)" textColor="var(--color-text-dim)">
                  返回列表
                </SpecularButton>
              </div>
              <p className="mt-1 text-[11px] leading-relaxed text-text-dim">{open.prompt}</p>

              {solved.includes(open.recipe) && !successRecipe ? (
                <StarBorder as="div" radius={18} thickness={1} color="var(--color-success)" className="mt-4 w-full p-4">
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
                </StarBorder>
              ) : open.kind === 'pair' ? (
                <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-3">
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
                        className="relative flex min-h-[92px] flex-col gap-1 p-2.5 text-left"
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
                      </StarBorder>
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
                        <StarBorder key={id} as="div" radius={18} thickness={1} color="var(--color-border)" className="w-full p-3">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="text-[13px] text-clue">{clue.title}</h3>
                            <span className="tabular text-[10px] text-text-dim">{clue.id} · {clue.category}</span>
                          </div>
                          <p className="mt-1 text-[11px] leading-relaxed text-text-secondary">{clue.description}</p>
                        </StarBorder>
                      )
                    })}
                  </div>
                  <div className="grid gap-1.5">
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
                          className={`flex min-h-11 items-start gap-2.5 p-3 text-left text-[12px] leading-relaxed ${excluded ? 'opacity-60' : ''}`}
                        >
                          <span aria-hidden className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded border border-current text-[10px]">
                            {item.key}
                          </span>
                          <span className={excluded ? 'line-through' : active ? 'text-clue' : 'text-text-secondary'}>{item.text}</span>
                        </StarBorder>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="mt-4 hidden lg:block">{controls}</div>
            </div>
          ) : (
            <BlurText
              text="从上面选择一道推理题开始。"
              animateBy="words"
              trigger="view"
              className="justify-center rounded-[14px] border border-dashed border-border bg-surface/40 p-8 text-center text-xs text-text-dim"
            />
          )}
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
