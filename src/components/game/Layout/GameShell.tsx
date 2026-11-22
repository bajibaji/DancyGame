import type { ReactNode } from 'react'
import Silk from '../../reactbits/Silk/Silk'
import Noise from '../../reactbits/Noise/Noise'
import GradualBlur from '../../reactbits/GradualBlur/GradualBlur'
import { useSettingsStore } from '../../../stores/settingsStore'

export default function GameShell({ children }: { children: ReactNode }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg-deep">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Silk
          speed={2.2}
          scale={1}
          color="#0b1620"
          sheenColor="#2e5a68"
          noiseIntensity={0.6}
          fade={0.75}
          paused={reducedMotion}
          dpr={1.5}
          className="h-full w-full"
        />
      </div>
      <Noise opacity={0.05} fps={12} fixed zIndex={1} blendMode="soft-light" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-border-subtle/20">
        {children}
      </div>
      <GradualBlur position="bottom" height="80px" strength={1.4} tint="#0a0e13" zIndex={2} />
    </div>
  )
}
