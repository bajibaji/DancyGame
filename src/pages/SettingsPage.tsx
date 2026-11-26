import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import HoldButton from '../components/reactbits/HoldButton/HoldButton'
import SpecularButton from '../components/reactbits/SpecularButton/SpecularButton'
import Switch from '../components/ui/Switch'
import Segmented from '../components/ui/Segmented'
import { FONT_SCALE, useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
import { GAME } from '../content/index'
import { APP_VERSION } from '../lib/version'

const SPEED_ITEMS = [
  { value: 'slow', label: '慢' },
  { value: 'normal', label: '标准' },
  { value: 'fast', label: '快' },
  { value: 'instant', label: '瞬显' },
]

const FONT_ITEMS = [
  { value: 'small', label: '小' },
  { value: 'medium', label: '中' },
  { value: 'large', label: '大' },
  { value: 'extra-large', label: '特大' },
]

const READING_ITEMS = [
  { value: 'single', label: '单场景' },
  { value: 'linear', label: '连续' },
]

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-b border-border-subtle/40 pb-4 last:border-0">
      <h2 className="mb-1 text-[10px] tracking-[0.24em] text-text-dim">{title}</h2>
      {children}
    </section>
  )
}

function SegmentRow({ label, items, value, onChange, name }: { label: string; items: { value: string; label: string }[]; value: string; onChange: (value: string) => void; name: string }) {
  return (
    <div className="border-b border-border-subtle/40 py-3.5 last:border-0">
      <p className="mb-2 text-[13px] text-text">{label}</p>
      <Segmented items={items} value={value} onChange={onChange} label={name} />
    </div>
  )
}

function ToggleRow({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border-subtle/40 py-3.5 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-text">{label}</p>
        {description && <p className="mt-0.5 text-[11px] leading-relaxed text-text-dim">{description}</p>}
      </div>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  )
}

export default function SettingsPage() {
  const navigate = useNavigate()
  const textSpeed = useSettingsStore((s) => s.textSpeed)
  const fontSize = useSettingsStore((s) => s.fontSize)
  const readingMode = useSettingsStore((s) => s.readingMode)
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const staticBackground = useSettingsStore((s) => s.staticBackground)
  const autoAdvance = useSettingsStore((s) => s.autoAdvance)
  const setTextSpeed = useSettingsStore((s) => s.setTextSpeed)
  const setFontSize = useSettingsStore((s) => s.setFontSize)
  const setReadingMode = useSettingsStore((s) => s.setReadingMode)
  const setReducedMotion = useSettingsStore((s) => s.setReducedMotion)
  const setStaticBackground = useSettingsStore((s) => s.setStaticBackground)
  const setAutoAdvance = useSettingsStore((s) => s.setAutoAdvance)
  const reset = useGameStore((s) => s.reset)

  useEffect(() => {
    document.documentElement.style.setProperty('--fs-scale', String(FONT_SCALE[fontSize]))
  }, [fontSize])

  const onClear = () => {
    reset()
    navigate('/')
  }

  return (
    <GameShell>
      <header className="glass-header sticky top-0 z-20 pt-[env(safe-area-inset-top)]">
        <div className="relative flex h-12 items-center px-3 md:px-5 lg:mx-auto lg:w-full lg:max-w-[560px]">
          <SpecularButton
            size="sm"
            radius={12}
            onClick={() => navigate(-1)}
            lineColor="var(--color-border)"
            textColor="var(--color-text-secondary)"
            className="shrink-0"
          >
            <ArrowLeft size={15} strokeWidth={1.8} /> 返回
          </SpecularButton>
          <h1 className="pointer-events-none absolute inset-x-0 text-center font-display text-base text-text-hi">设置</h1>
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-6 px-4 py-5 md:px-6 lg:mx-auto lg:max-w-[560px]">
        <Group title="阅读">
          <SegmentRow label="文字速度" items={SPEED_ITEMS} value={textSpeed} onChange={(value) => setTextSpeed(value as typeof textSpeed)} name="文字速度" />
          <SegmentRow label="字号" items={FONT_ITEMS} value={fontSize} onChange={(value) => setFontSize(value as typeof fontSize)} name="字号" />
          <SegmentRow label="阅读方式" items={READING_ITEMS} value={readingMode} onChange={(value) => setReadingMode(value as typeof readingMode)} name="阅读方式" />
          <ToggleRow label="自动继续" description="无选择的段落自动推进" checked={autoAdvance} onChange={setAutoAdvance} />
        </Group>

        <Group title="动效">
          <ToggleRow label="静态背景" description="关闭丝绸波纹流动，使用静态底色" checked={staticBackground} onChange={setStaticBackground} />
          <ToggleRow label="减弱动效" description="暂停背景动画、关闭闪烁与打字机" checked={reducedMotion} onChange={setReducedMotion} />
        </Group>

        <Group title="存档">
          <p className="mb-3 mt-2 text-[11px] leading-relaxed text-text-dim">
            清除存档会删除本机进度，无法恢复。长按下方按钮确认。
          </p>
          <HoldButton
            holdTime={1500}
            radius={12}
            fillColor="var(--color-danger)"
            backgroundColor="var(--color-bg-sunken)"
            textColor="var(--color-text-secondary)"
            fillTextColor="#ffffff"
            onHold={onClear}
            className="w-full"
          >
            长按清除存档
          </HoldButton>
        </Group>

        <Group title="关于">
          <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
            《{GAME.title}》 v{APP_VERSION} · {GAME.subtitle}
          </p>
        </Group>
      </main>
    </GameShell>
  )
}
