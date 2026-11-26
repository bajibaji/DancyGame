import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import { useStoryStore } from '../stores/storyStore'
import { multiplier } from '../ai/world'

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border-subtle/30 py-2.5 last:border-0">
      <span className="text-[12px] text-text-dim">{label}</span>
      <span className="text-right text-[13px] text-text">{value}</span>
    </div>
  )
}

export default function SystemPage() {
  const navigate = useNavigate()
  const world = useStoryStore((s) => s.world)
  const percent = world.progressGoal > 0 ? Math.min(100, Math.round((world.progress / world.progressGoal) * 100)) : 0
  const stats = Object.entries(world.stats)
  const relations = Object.entries(world.relations).sort((a, b) => b[1] - a[1])

  return (
    <GameShell>
      <header className="glass-header sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-12 items-center px-3 md:px-5 lg:mx-auto lg:w-full lg:max-w-[560px]">
          <SpecularButton size="sm" radius={12} onClick={() => navigate(-1)} lineColor="var(--color-border)" textColor="var(--color-text-secondary)" className="shrink-0">
            <ArrowLeft size={15} strokeWidth={1.8} /> 返回
          </SpecularButton>
          <h1 className="pointer-events-none absolute inset-x-0 text-center font-display text-base text-text-hi">天命</h1>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-4 px-4 py-5 md:px-6 lg:mx-auto lg:max-w-[560px]">
        <section className="rounded-[14px] border border-clue/40 bg-clue/5 px-4 py-4">
          <p className="text-[10px] tracking-[0.3em] text-clue/70">天命</p>
          <h2 className="mt-1 font-display text-xl text-text-hi">老骥伏枥，志在千里</h2>
          <p className="mt-2 text-[12px] leading-relaxed text-text-secondary">
            任何功法、技艺，只要去练就涨进度，没有资质门槛，没有瓶颈。
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-secondary">
            进度受寿数加持：{world.age} 岁，练一遍顶 {multiplier(world.age)} 遍。
          </p>
        </section>

        <section className="rounded-[14px] border border-border bg-surface/70 px-4 py-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] text-text-dim">境界</span>
            <span className="font-display text-sm text-text-hi">{world.realmName}</span>
          </div>
          <div className="mt-2.5 h-[4px] rounded-full bg-border/50">
            <div className="h-full rounded-full bg-accent/80" style={{ width: `${percent}%` }} />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between text-[11px] text-text-dim">
            <span>进度</span>
            <span className="tabular">{world.progress} / {world.progressGoal}</span>
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-surface/70 px-4 py-2">
          {stats.map(([key, value]) => (
            <Row key={key} label={key} value={String(value)} />
          ))}
        </section>

        <section className="rounded-[14px] border border-border bg-surface/70 px-4 py-3">
          <p className="mb-1 text-[10px] tracking-[0.24em] text-text-dim">任务</p>
          {world.tasks.length === 0 && <p className="py-2 text-[13px] text-text-dim">暂无</p>}
          {world.tasks.map((task) => (
            <div key={task.id} className="flex items-baseline gap-2 border-b border-border-subtle/30 py-2 last:border-0">
              <span className={task.done ? 'text-success' : 'text-text-dim'}>{task.done ? '✓' : '·'}</span>
              <span className={task.done ? 'text-[13px] text-text-dim line-through' : 'text-[13px] text-text'}>{task.title}</span>
            </div>
          ))}
        </section>

        <section className="rounded-[14px] border border-border bg-surface/70 px-4 py-3">
          <p className="mb-2 text-[10px] tracking-[0.24em] text-text-dim">持有</p>
          <div className="flex flex-wrap gap-2">
            {world.inventory.length === 0 && <span className="text-[13px] text-text-dim">空</span>}
            {world.inventory.map((item) => (
              <span key={item} className="rounded-[8px] border border-border px-2.5 py-1 text-[12px] text-text-secondary">
                {item}
              </span>
            ))}
          </div>
        </section>

        <section className="rounded-[14px] border border-border bg-surface/70 px-4 py-2">
          <p className="mb-1 mt-2 text-[10px] tracking-[0.24em] text-text-dim">人物</p>
          {relations.map(([name, value]) => (
            <Row key={name} label={name} value={value >= 60 ? '亲近' : value >= 20 ? '友好' : value >= 0 ? '平常' : value > -50 ? '冷淡' : '仇视'} />
          ))}
        </section>
      </main>
    </GameShell>
  )
}
