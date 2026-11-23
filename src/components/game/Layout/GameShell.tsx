import type { ReactNode } from 'react'
import Silk from '../../reactbits/Silk/Silk'
import Noise from '../../reactbits/Noise/Noise'
import GradualBlur from '../../reactbits/GradualBlur/GradualBlur'
import { useSettingsStore } from '../../../stores/settingsStore'

export default function GameShell({ children }: { children: ReactNode }) {
  const reducedMotion = useSettingsStore((s) => s.reducedMotion)
  const staticBackground = useSettingsStore((s) => s.staticBackground)
  const staticMode = reducedMotion || staticBackground
  return (
    <div className="relative min-h-dvh overflow-hidden bg-bg-deep">
      <div className="pointer-events-none fixed inset-0 z-0">
        {staticMode ? (
          <div
            className="h-full w-full bg-bg-deep"
            style={{
              backgroundImage:
                'radial-gradient(1200px 600px at 20% 0%, rgba(46,90,104,0.16), transparent 60%), radial-gradient(900px 500px at 80% 100%, rgba(217,162,75,0.05), transparent 60%)',
            }}
          />
        ) : (
          <Silk
            speed={2.2}
            scale={1}
            color="#0b1620"
            sheenColor="#2e5a68"
            noiseIntensity={0.6}
            fade={0.75}
            paused={false}
            dpr={1.5}
            className="h-full w-full"
          />
        )}
      </div>
      <Noise opacity={0.05} fps={12} fixed zIndex={1} blendMode="soft-light" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[430px] flex-col border-x border-border-subtle/20 md:max-w-[620px] lg:max-w-[1120px]">
        {children}
      </div>
      <GradualBlur position="bottom" height="80px" strength={1.4} tint="#0a0e13" zIndex={2} />
    </div>
  )
}
