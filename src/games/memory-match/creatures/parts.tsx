import type { ReactNode } from 'react'

export const LINE = {
  stroke: 'var(--grape)',
  strokeWidth: 6,
  strokeLinejoin: 'round',
  strokeLinecap: 'round',
} as const

// Soft background circle in the creature's color so cards match by color at a glance.
export function Frame({ bg, children }: { bg: string; children: ReactNode }) {
  return (
    <svg viewBox="0 0 200 200" width="100%" height="100%" role="img">
      <circle cx="100" cy="100" r="92" fill={bg} />
      {children}
    </svg>
  )
}

export function Eyes({ y, dx = 20, r = 11 }: { y: number; dx?: number; r?: number }) {
  return (
    <>
      {[100 - dx, 100 + dx].map((x) => (
        <g key={x}>
          <circle cx={x} cy={y} r={r} fill="white" {...LINE} strokeWidth={4} />
          <circle cx={x} cy={y + 1} r={r * 0.55} fill="var(--grape)" />
          <circle cx={x - r * 0.2} cy={y - r * 0.2} r={r * 0.22} fill="white" />
        </g>
      ))}
    </>
  )
}

export function Cheeks({ y, dx = 34 }: { y: number; dx?: number }) {
  return (
    <>
      <circle cx={100 - dx} cy={y} r="8" fill="#FF7EB9" opacity="0.6" />
      <circle cx={100 + dx} cy={y} r="8" fill="#FF7EB9" opacity="0.6" />
    </>
  )
}

export function Smile({ y, w = 12 }: { y: number; w?: number }) {
  return <path d={`M${100 - w} ${y} Q100 ${y + w} ${100 + w} ${y}`} fill="none" {...LINE} />
}

export function Star({ x, y, r, fill = '#FFE66D' }: { x: number; y: number; r: number; fill?: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const d = i % 2 === 0 ? r : r * 0.45
    return `${x + Math.cos(a) * d},${y + Math.sin(a) * d}`
  }).join(' ')
  return <polygon points={pts} fill={fill} {...LINE} strokeWidth={4} />
}
