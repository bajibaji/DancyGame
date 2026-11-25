import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import PuzzleBoard from '../components/game/PuzzleBoard'
import GooeyNav from '../components/reactbits/GooeyNav/GooeyNav'
import FlipCard from '../components/reactbits/FlipCard/FlipCard'
import ChromaGrid from '../components/reactbits/ChromaGrid/ChromaGrid'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import SplitText from '../components/reactbits/SplitText/SplitText'
import BlurText from '../components/reactbits/BlurText/BlurText'
import CountUp from '../components/reactbits/CountUp/CountUp'
import Noise from '../components/reactbits/Noise/Noise'
import { RELEASED_CHARACTERS as CHARACTERS, RELEASED_CLUES as CLUES, RELEASED_MEMORIES as MEMORIES, isReleasedRecipe } from '../content/release'
import { RECIPES } from '../game/puzzle'
import { useGameStore } from '../stores/gameStore'

const TABS = [
  { value: 'puzzle', label: '推理板' },
  { value: 'clues', label: '线索' },
  { value: 'memories', label: '记忆' },
  { value: 'people', label: '人物' },
]

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
  const [cardWidth, setCardWidth] = useState(250)

  const accent = 'var(--color-accent)'

  useEffect(() => {
    const measure = () => setCardWidth(Math.min(260, window.innerWidth - 64))
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

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

  return (
    <GameShell>
      <Noise fixed zIndex={1} opacity={0.04} size={1} fps={20} blendMode="overlay" />
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur md:px-6 lg:px-8">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <SpecularButton
            size="sm"
            radius={18}
            onClick={() => navigate('/story')}
            className="justify-self-start"
            lineColor="var(--color-accent)"
            textColor="var(--color-accent)"
          >
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </SpecularButton>
          <SplitText
            text="档案库"
            tag="h1"
            className="font-display text-lg text-text-hi"
            splitType="chars"
            effect="fade"
            trigger="load"
            duration={0.5}
            delay={30}
          />
          <span aria-hidden />
        </div>
        <div className="mt-1 flex items-center justify-center gap-4 text-[11px] text-text-dim">
          <span>
            线索 <CountUp to={ownedClues.length} className="tabular" />/{CLUES.length}
          </span>
          <span>
            记忆 <CountUp to={ownedMemories.length} className="tabular" />/{MEMORIES.length}
          </span>
          <span>
            推演 <CountUp to={solvedCount} className="tabular" />/{releasedRecipes.length}
          </span>
        </div>
      </header>

      <main className="relative z-10 w-full flex-1 px-4 py-5 md:px-6 md:py-6 lg:mx-auto lg:max-w-[1120px]">
        <div className="mb-5 flex justify-center">
          <GooeyNav
            items={TABS.map(({ label }) => ({ label }))}
            activeIndex={TABS.findIndex(({ value }) => value === tab)}
            onChange={(index) => changeTab(TABS[index].value)}
            color={accent}
            activeTextColor="var(--color-bg-deep)"
            size="lg"
            frame
            animationTime={400}
            particleCount={15}
            timeVariance={50}
            spread={18}
          />
        </div>

        <div className="min-w-0">
          <div hidden={tab !== 'puzzle'}>
            <PuzzleBoard />
          </div>

          {tab === 'clues' && (
            <div>
              {ownedClues.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-3">
                  {ownedClues.map((clue) => (
                    <FlipCard
                      key={clue.id}
                      width={cardWidth}
                      height={160}
                      radius={18}
                      background="var(--color-surface)"
                      color="var(--color-text)"
                      shadowColor="#000000"
                      ariaLabel={`${clue.title}，翻面查看描述`}
                      front={
                        <div className="flex h-full flex-col justify-between p-4">
                          <div className="flex items-baseline justify-between gap-2 text-[10px] text-text-dim">
                            <span className="tabular">{clue.id}</span>
                            <span>{clue.category}</span>
                          </div>
                          <h2 className="text-sm text-clue">{clue.title}</h2>
                          <span className="text-[10px] text-text-dim">翻面看描述</span>
                        </div>
                      }
                      back={
                        <div className="h-full overflow-y-auto p-4">
                          <h2 className="text-sm text-clue">{clue.title}</h2>
                          <p className="mt-2 text-xs leading-relaxed text-text-secondary">{clue.description}</p>
                        </div>
                      }
                    />
                  ))}
                </div>
              ) : (
                <BlurText
                  text="还没有入档线索。调查现场会获得线索。"
                  animateBy="words"
                  trigger="load"
                  className="justify-center text-sm text-text-dim"
                />
              )}
            </div>
          )}

          {tab === 'memories' && (
            <div>
              {ownedMemories.length > 0 ? (
                <>
                  <ChromaGrid items={memoryItems} columns={2} minCardWidth={150} grayscale={0.2} dim={0.12} reveal="spotlight" showInfo={false} className="mb-5" />
                  <div className="flex flex-wrap justify-center gap-3">
                    {ownedMemories.map((memory) => (
                      <FlipCard
                        key={memory.id}
                        width={cardWidth}
                        height={170}
                        radius={18}
                        background="var(--color-surface)"
                        color="var(--color-text)"
                        shadowColor="#000000"
                        ariaLabel={`${memory.title}，翻面查看内容`}
                        front={
                          <div className="flex h-full flex-col justify-between p-4">
                            <span className="tabular text-[10px] text-text-dim">{memory.id}</span>
                            <h2 className="text-sm text-memory">{memory.title}</h2>
                            <span className="text-[10px] text-text-dim">翻面看内容</span>
                          </div>
                        }
                        back={
                          <div className="h-full overflow-y-auto p-4">
                            <h2 className="text-sm text-memory">{memory.title}</h2>
                            <p className="mt-2 text-xs leading-relaxed text-text-secondary">{memory.body}</p>
                          </div>
                        }
                      />
                    ))}
                  </div>
                </>
              ) : (
                <BlurText
                  text="记忆一片空白。有些气味、声音与物件会把它唤醒。"
                  animateBy="words"
                  trigger="load"
                  className="justify-center text-sm text-text-dim"
                />
              )}
            </div>
          )}

          {tab === 'people' && (
            <div className="flex flex-wrap justify-center gap-3">
              {visiblePeople.map((character) => (
                <FlipCard
                  key={character.id}
                  width={cardWidth}
                  height={170}
                  radius={18}
                  background="var(--color-surface)"
                  color="var(--color-text)"
                  shadowColor="#000000"
                  ariaLabel={`${character.name}，翻面查看备注`}
                  front={
                    <div className="flex h-full flex-col justify-between p-4">
                      <span className="text-[10px] text-text-dim">{character.role}</span>
                      <h2 className="text-sm text-text-hi">{character.name}</h2>
                      <span className="text-[10px] text-text-dim">翻面看备注</span>
                    </div>
                  }
                  back={
                    <div className="h-full overflow-y-auto p-4">
                      <h2 className="text-sm text-text-hi">{character.name}</h2>
                      <p className="mt-1 text-[10px] text-text-dim">{character.role}</p>
                      <p className="mt-2 text-xs leading-relaxed text-text-secondary">{character.note}</p>
                    </div>
                  }
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </GameShell>
  )
}
