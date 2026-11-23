import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import PuzzleBoard from '../components/game/PuzzleBoard'
import RubberSegment from '../components/reactbits/RubberSegment/RubberSegment'
import SpotlightCard from '../components/reactbits/SpotlightCard/SpotlightCard'
import ChromaGrid from '../components/reactbits/ChromaGrid/ChromaGrid'
import { CHARACTERS, CLUES, MEMORIES } from '../content/index'
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

const TAB_KEY = 'jiangjia.archive.tab'

function readTab(): string {
  try {
    const saved = localStorage.getItem(TAB_KEY)
    if (saved && TABS.some(({ value }) => value === saved)) return saved
  } catch {
    // 存储不可用时回落到默认标签
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
  const [tab, setTab] = useState(readTab)

  const changeTab = (value: string) => {
    setTab(value)
    window.scrollTo(0, 0)
    try {
      localStorage.setItem(TAB_KEY, value)
    } catch {
      // 存储不可用时只保留内存状态
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
  const memoryItems = useMemo(
    () => ownedMemories.map((m, i) => ({ image: memoryImage(m.title, i), title: m.title, subtitle: m.id, alt: m.title })),
    [ownedMemories],
  )

  return (
    <GameShell>
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <button type="button" onClick={() => navigate('/story')} className="flex min-h-11 items-center gap-1 justify-self-start rounded-[18px] pl-1 pr-3 text-sm text-accent active:opacity-70">
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </button>
          <h1 className="font-display text-lg text-text-hi">档案库</h1>
          <span aria-hidden />
        </div>
        <div className="mt-1 text-[11px] text-text-dim">
          线索 {ownedClues.length}/{CLUES.length} · 记忆 {ownedMemories.length}/{MEMORIES.length} · 推演 {solved.length}/{RECIPES.length}
        </div>
      </header>

      <main className="w-full flex-1 px-4 py-5">
        <div className="mb-5 w-full">
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

        <div hidden={tab !== 'puzzle'}>
          <PuzzleBoard />
        </div>

        {tab === 'clues' && (
          <div className="grid gap-3">
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
                <div className="grid gap-3">
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
          <div className="grid gap-3">
            {CHARACTERS.filter((character) => character.id === 'jiangjia' || metCharacters.includes(character.id)).map((character) => (
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
      </main>
    </GameShell>
  )
}
