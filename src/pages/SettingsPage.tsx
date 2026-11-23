import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import GameShell from '../components/game/Layout/GameShell'
import HoldButton from '../components/reactbits/HoldButton/HoldButton'
import { FONT_SCALE, useSettingsStore } from '../stores/settingsStore'
import { useGameStore } from '../stores/gameStore'
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
]

const READING_ITEMS = [
  { value: 'single', label: '单场景' },
  { value: 'linear', label: '连续' },
]

function SettingToggle({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex min-h-11 min-w-[76px] shrink-0 items-center justify-center rounded-[18px] border px-4 text-sm transition-colors active:opacity-80 ${
        checked
          ? 'border-accent bg-accent text-bg-deep'
          : 'border-border bg-surface text-text-secondary active:bg-surface-hover'
      }`}
    >
      {checked ? '开启' : '关闭'}
    </button>
  )
}

function SettingSegment({ items, value, onChange, label }: { items: { value: string; label: string }[]; value: string; onChange: (value: string) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="grid grid-flow-col auto-cols-fr gap-1 rounded-[18px] border border-border bg-surface p-1">
      {items.map((item) => (
        <button
          key={item.value}
          type="button"
          role="radio"
          aria-checked={value === item.value}
          onClick={() => onChange(item.value)}
          className={`flex min-h-11 items-center justify-center rounded-[14px] px-2 text-sm transition-colors ${
            value === item.value ? 'bg-accent font-medium text-bg-deep' : 'text-text-secondary active:bg-surface-hover'
          }`}
        >
          {item.label}
        </button>
      ))}
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
      <header className="sticky top-0 z-20 border-b border-border-subtle/50 bg-bg-deep/80 px-4 py-3 backdrop-blur md:px-6 lg:mx-auto lg:w-full lg:max-w-[1000px]">
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => navigate(-1)} className="flex min-h-11 items-center rounded-[18px] pl-1 pr-3 text-sm text-accent active:opacity-70">
            <ArrowLeft size={16} strokeWidth={1.8} /> 返回
          </button>
          <h1 className="font-display text-lg text-text-hi">设置</h1>
          <span className="w-12" />
        </div>
      </header>

      <main className="flex w-full flex-1 flex-col gap-6 px-4 py-6 md:grid md:grid-cols-2 md:items-start md:gap-5 md:px-6 lg:mx-auto lg:max-w-[1000px]">
        <section className="rounded-lg border border-border bg-surface/70 p-4">
          <h2 className="mb-3 text-xs tracking-[0.2em] text-text-dim">阅读</h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-2 text-sm text-text">文字速度</p>
              <SettingSegment
                items={SPEED_ITEMS}
                value={textSpeed}
                onChange={(value) => setTextSpeed(value as typeof textSpeed)}
                label="文字速度"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-text">字号（正文与选项）</p>
              <SettingSegment
                items={FONT_ITEMS}
                value={fontSize}
                onChange={(value) => setFontSize(value as typeof fontSize)}
                label="字号"
              />
            </div>
            <div>
              <p className="mb-2 text-sm text-text">阅读方式</p>
              <SettingSegment
                items={READING_ITEMS}
                value={readingMode}
                onChange={(value) => setReadingMode(value as typeof readingMode)}
                label="阅读方式"
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text">自动继续</p>
                <p className="mt-0.5 text-[11px] text-text-dim">无选择的段落自动推进</p>
              </div>
              <SettingToggle checked={autoAdvance} onChange={setAutoAdvance} label="自动继续" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-surface/70 p-4">
          <h2 className="mb-3 text-xs tracking-[0.2em] text-text-dim">动效</h2>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text">静态背景</p>
                <p className="mt-0.5 text-[11px] text-text-dim">关闭丝绸波纹流动，使用静态底色</p>
              </div>
              <SettingToggle checked={staticBackground} onChange={setStaticBackground} label="静态背景" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-text">减弱动效</p>
                <p className="mt-0.5 text-[11px] text-text-dim">暂停背景动画、关闭闪烁与打字机</p>
              </div>
              <SettingToggle checked={reducedMotion} onChange={setReducedMotion} label="减弱动效" />
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-danger/30 bg-surface/70 p-4">
          <h2 className="mb-3 text-xs tracking-[0.2em] text-danger/80">存档</h2>
          <p className="mb-3 text-[11px] leading-relaxed text-text-dim">
            清除存档会删除本机进度，无法恢复。长按下方按钮确认。
          </p>
          <HoldButton
            holdTime={1500}
            radius={18}
            fillColor="var(--color-danger)"
            backgroundColor="var(--color-bg-sunken)"
            textColor="var(--color-text-secondary)"
            fillTextColor="#ffffff"
            onHold={onClear}
            className="w-full"
          >
            长按清除存档
          </HoldButton>
        </section>

        <section className="rounded-lg border border-border bg-surface/70 p-4 text-[11px] leading-relaxed text-text-dim">
          <h2 className="mb-2 text-xs tracking-[0.2em] text-text-dim">关于</h2>
          <p>《沙漏停摆》 v{APP_VERSION} · 杭州失忆刑侦档案。平行改编自《空相沙漏》（作者：初禾二）。</p>
          <p className="mt-1">故事、人物与机构均为虚构；真实地名仅作空间锚点。存档格式 v2。</p>
        </section>
      </main>
    </GameShell>
  )
}
