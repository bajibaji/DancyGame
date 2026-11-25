import type { ReactNode } from 'react'

const FIBER = `url("data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='f'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/><feColorMatrix type='saturate' values='0'/></filter><rect width='220' height='220' filter='url(#f)'/></svg>`,
)}")`

export default function PaperGrain() {
  return (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-[0.22] mix-blend-overlay"
        style={{ backgroundImage: FIBER, backgroundSize: '180px 180px' }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-70"
        style={{
          backgroundImage:
            'repeating-linear-gradient(112deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 21px)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-80"
        style={{
          backgroundImage:
            'linear-gradient(118deg, transparent 46%, rgba(255,255,255,0.035) 48%, rgba(0,0,0,0.09) 50%, transparent 54%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          backgroundImage:
            'radial-gradient(130% 110% at 50% -10%, rgba(255,255,255,0.06) 0%, transparent 40%, rgba(0,0,0,0.34) 100%)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          boxShadow:
            'inset 0 1px 0 rgba(255,255,255,0.09), inset 1px 0 0 rgba(255,255,255,0.04), inset 0 -2px 6px rgba(0,0,0,0.55), inset -1px 0 4px rgba(0,0,0,0.35), inset 0 0 34px rgba(0,0,0,0.34)',
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 bottom-0 h-px opacity-40"
        style={{ backgroundImage: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.14), transparent)' }}
      />
    </>
  )
}

export function PaperFace({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className="relative h-full">
      <PaperGrain />
      <div className={`relative h-full ${className}`}>{children}</div>
    </div>
  )
}
