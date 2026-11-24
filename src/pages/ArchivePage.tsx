import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Brain, Search, Sparkles, Users } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import PuzzleBoard from '../components/game/PuzzleBoard'
import RubberSegment from '../components/reactbits/RubberSegment/RubberSegment'
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard'
import ChromaGrid from '../components/reactbits/ChromaGrid/ChromaGrid'
import { RELEASED_CHARACTERS as CHARACTERS, RELEASED_CLUES as CLUES, RELEASED_MEMORIES as MEMORIES, isReleasedRecipe } from '../content/release'
import { RECIPES } from '../game/puzzle'
import { useGameStore } from '../stores/gameStore'

const TABS = [
  { value: 'puzzle', label: '推理板' },
  { value: 'clues', label: '线索' },
  { value: 'memories', label: '记忆' },
  { value: 'people', label: '人物' },
]

const TAB_TINT: Record<string, string> = {
  puzzle: 'var(--color-accent)',
  clues: 'var(--color-clue)',
  memories: 'var(--color-memory)',
  people: 'var(--color-accent-strong)',
}

const TAB_ICONS: Record<string, typeof Brain> = {
  puzzle: Brain,
  clues: Search,
  memories: Sparkles,
  people: Users,
}

const TAB_KEY = 'jiangjia.archive.tab'

function readTab(): string {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (saved && TABS.some(({ value }) => value === saved)) return saved
  } catch {
    return 'puzzle'
  }
  return 'puzzle'
}

function memoryImage(title: string, index: number): string {
  const palette = ['#1a2430', '#202a38', '#16242c', '#241f2e']
  const bg = palette[index % palette.length]
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect width="400" height="300" fill="${bg}"/><circle cx="320" cy="60" r="90" fill="#67c7d8" opacity="0.08"/><circle cx="80" cy="250" r="120" fill="#d9a24b" opacity="0.06"/><text x="24" y="250" fill="#93a1b0" font-size="20" font-family="serif">${title}</text><text x="24" y="276" fill="#4a5869" font-size="12" font-family="monospace">MEMORY FRAGMENT</text></svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export default function ArchivePage() {
  const navigate = useNavigate()
  const clues = useGameStore((s) => s.clues)
  const memories = useGameStore((s) => s.memories)
  const metCharacters = useGameStore((s) => s.metCharacters)
  const solved = useGameStore((s) => s.solved)
  const releasedRecipes = RECIPES.filter(({ cards }) => isReleasedRecipe(cards))
  const solvedCount = releasedRecipes.filter(({ id }) => solved.includes(id)).length
  const [tab, setTab] = useState(readTab)

  const changeTab = (value: string) => {
    setTab(value)
    window.scrollTo(0, 0)
    try {
      localStorage.setItem(TAB_KEY, value)
    } catch {
      return
    }
  }

  const ownedClues = useMemo(
    () => CLUES.filter((c) => clues.includes(c.id)),
    [clues],
  )
  const ownedMemories = useMemo(
    () => MEMORIES.filter((m) => memories.includes(m.id)),
    [memories],
  )
  const visiblePeople = useMemo(
    () => CHARACTERS.filter((character) => character.id === 'jiangjia' || metCharacters.includes(character.id)),
    [metCharacters],
  )
  const memoryItems = useMemo(
    () => ownedMemories.map((m, i) => ({ image: memoryImage(m.title, i), title: m.title, subtitle: m.id, alt: m.title })),
    [ownedMemories],
  )
  const counts: Record<string, string> = {
    puzzle: `${solvedCount}/${releasedRecipes.length}`,
    clues: `${ownedClues.length}/${CLUES.length}`,
    memories: `${ownedMemories.length}/${MEMORIES.length}`,
    people: `${visiblePeople.length}`,
  }

  return (
    <GameShell>
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button type="button" onClick={() => navigate('/story')} className="flex min-h-11 items-center gap-1 justify-self-start rounded-[18px] pl-1 pr-3 text-sm text-accent active:opacity-70">
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </button>
          <h1 className="font-display text-lg text-text-hi">档案库</h1>
          <span aria-hidden />
        </div>
        <div className="mt-1 text-[11px] text-text-dim">
          线索 {ownedClues.length}/{CLUES.length} · 记忆 {ownedMemories.length}/{MEMORIES.length} · 推演 {solvedCount}/{releasedRecipes.length}
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-5 md:px-6 md:py-6 lg:mx-auto lg:max-w-[1120px]">
        <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:items-start lg:gap-8">
          <div className="mb-5 w-full lg:sticky lg:top-24 lg:mb-0">
            <div className="lg:hidden">
              <RubberSegment
                items={TABS}
                value={tab}
                onChange={changeTab}
                aria-label="档案分类"
                size="lg"
                radius={18}
                className="w-full border border-border-subtle/80"
                trackColor="var(--color-surface-raised)"
                thumbColor={TAB_TINT[tab]}
                textColor="var(--color-text-secondary)"
                activeTextColor="var(--color-bg-deep)"
              />
            </div>
            <nav className="hidden lg:flex lg:flex-col lg:gap-1.5" aria-label="档案分类">
              {TABS.map((item) => {
                const Icon = TAB_ICONS[item.value]
                const active = tab === item.value
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => changeTab(item.value)}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-[14px] border px-3 text-sm transition-colors ${
                      active
                        ? 'border-accent/40 bg-accent/10 text-accent'
                        : 'border-transparent text-text-secondary hover:bg-surface'
                    }`}
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="flex-1 text-left">{item.label}</span>
                    <span className="tabular text-[11px] text-text-dim">{counts[item.value]}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="min-w-0">
            <div hidden={tab !== 'puzzle'}>
              <PuzzleBoard />
            </div>

            {tab === 'clues' && (
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                {ownedClues.map((clue) => (
                  <SpotlightCard
                    key={clue.id}
                    className="rounded-lg border border-border bg-surface p-4"
                    spotlightColor="rgba(217,162,75,0.25)"
                    intensity={0.5}
                    borderGlow={0.4}
                    ambient
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-sm text-clue">{clue.title}</h2>
                      <span className="tabular text-[11px] text-text-dim">{clue.id} · {clue.category}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{clue.description}</p>
                  </SpotlightCard>
                ))}
                {ownedClues.length === 0 && <p className="text-sm text-text-dim">还没有入档线索。调查现场会获得线索。</p>}
              </div>
            )}

            {tab === 'memories' && (
              <div>
                {ownedMemories.length > 0 ? (
                  <>
                    <ChromaGrid items={memoryItems} columns={2} minCardWidth={150} grayscale={0.2} dim={0.12} reveal="spotlight" showInfo={false} className="mb-5" />
                    <div className="grid gap-3 md:grid-cols-2">
                      {ownedMemories.map((memory) => (
                        <div key={memory.id} className="rounded-lg border border-border bg-surface/80 p-4">
                          <div className="flex items-baseline justify-between gap-3">
                            <h2 className="text-sm text-memory">{memory.title}</h2>
                            <span className="tabular text-[11px] text-text-dim">{memory.id}</span>
                          </div>
                          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{memory.body}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-text-dim">记忆一片空白。有些气味、声音与物件会把它唤醒。</p>
                )}
              </div>
            )}

            {tab === 'people' && (
              <div className="grid gap-3 md:grid-cols-2">
                {visiblePeople.map((character) => (
                  <SpotlightCard
                    key={character.id}
                    className="rounded-lg border border-border bg-surface p-4"
                    spotlightColor="rgba(103,199,216,0.2)"
                    intensity={0.4}
                    borderGlow={0.3}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h2 className="text-sm text-text-hi">{character.name}</h2>
                      <span className="text-[11px] text-text-dim">{character.role}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">{character.note}</p>
                  </SpotlightCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </GameShell>
  )
}
