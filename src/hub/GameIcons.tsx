import type { GameEntry } from '../games/types'

const STROKE = { stroke: 'var(--grape)', strokeWidth: 4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const

function Cards() {
  return (
    <svg viewBox="0 0 96 96" fill="none">
      <g transform="rotate(-14 34 52)">
        <rect x="12" y="22" width="40" height="54" rx="9" fill="var(--lavender)" {...STROKE} />
        <path d="M32 40l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="white" opacity="0.9" />
      </g>
      <g transform="rotate(12 62 50)">
        <rect x="44" y="18" width="40" height="54" rx="9" fill="var(--cream)" {...STROKE} />
        <path d="M64 34l3 7 8 1-6 5 2 8-7-4-7 4 2-8-6-5 8-1z" fill="var(--butter)" {...STROKE} strokeWidth={3} />
      </g>
    </svg>
  )
}

function Kart() {
  return (
    <svg viewBox="0 0 96 96" fill="none">
      <path d="M10 58q0-14 14-16l10-14h22l8 14q18 2 18 16v8H10z" fill="var(--pink)" {...STROKE} />
      <path d="M38 32h14l5 10H31z" fill="var(--sky)" {...STROKE} strokeWidth={3} />
      {[28, 70].map((x) => (
        <g key={x}>
          <circle cx={x} cy="68" r="12" fill="var(--grape)" />
          <circle cx={x} cy="68" r="5" fill="var(--cream)" />
        </g>
      ))}
    </svg>
  )
}

function Present() {
  return (
    <svg viewBox="0 0 96 96" fill="none">
      <rect x="14" y="40" width="68" height="40" rx="8" fill="var(--sky)" {...STROKE} />
      <rect x="10" y="28" width="76" height="18" rx="8" fill="var(--lavender)" {...STROKE} />
      <path d="M48 28v52" {...STROKE} stroke="var(--butter)" strokeWidth={10} />
      <path d="M48 28C34 28 28 12 38 12s10 16 10 16zM48 28c14 0 20-16 10-16s-10 16-10 16z" fill="var(--butter)" {...STROKE} />
      <text x="48" y="68" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--grape)" fontFamily="Fredoka, sans-serif">
        ?
      </text>
    </svg>
  )
}

export function Padlock() {
  return (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M15 22v-6a9 9 0 0 1 18 0v6" {...STROKE} />
      <rect x="9" y="22" width="30" height="21" rx="6" fill="var(--butter)" {...STROKE} />
      <circle cx="24" cy="32" r="3.5" fill="var(--grape)" />
    </svg>
  )
}

export function GameIcon({ icon }: { icon: GameEntry['icon'] }) {
  if (icon === 'cards') return <Cards />
  if (icon === 'kart') return <Kart />
  return <Present />
}
