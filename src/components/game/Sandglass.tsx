import { useId } from 'react'

export default function Sandglass({ className = '' }: { className?: string }) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const topClip = `${id}-top`
  const bottomClip = `${id}-bottom`

  return (
    <svg viewBox="-11 0 40 40" className={`sandglass ${className}`} aria-hidden="true" focusable="false">
      <defs>
        <clipPath id={topClip}>
          <path d="M3 2h12l-5.4 16H8.4z" />
        </clipPath>
        <clipPath id={bottomClip}>
          <path d="M8.4 22h1.2l5.4 16H3z" />
        </clipPath>
      </defs>
      <g className="sandglass-spin">
        <path
          d="M3 2h12l-5.4 16v4L15 38H3l5.4-16v-4z"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.9"
          strokeLinejoin="round"
        />
        <g clipPath={`url(#${topClip})`}>
          <rect className="sandglass-top-sand" x="3" y="2" width="12" height="16" fill="currentColor" opacity="0.85" />
        </g>
        <g clipPath={`url(#${bottomClip})`}>
          <rect className="sandglass-bottom-sand" x="3" y="22" width="12" height="16" fill="currentColor" />
        </g>
        <line
          className="sandglass-stream"
          x1="9"
          y1="18"
          x2="9"
          y2="22"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <rect x="5" y="0.8" width="8" height="1.2" rx="0.6" fill="currentColor" opacity="0.9" />
        <rect x="5" y="38" width="8" height="1.2" rx="0.6" fill="currentColor" opacity="0.9" />
      </g>
    </svg>
  )
}
