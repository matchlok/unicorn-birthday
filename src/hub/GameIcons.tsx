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

// Tilted red rock fins under a sun, with a coin.
function Rocks() {
  return (
    <svg viewBox="0 0 96 96" fill="none">
      <circle cx="72" cy="22" r="11" fill="var(--butter)" {...STROKE} strokeWidth={3} />
      <path d="M8 80q14-30 34-52l8 4 14 48z" fill="#D9694F" {...STROKE} />
      <path d="M46 80q10-20 26-34l6 3 10 31z" fill="#EE8B6A" {...STROKE} />
      <path d="M22 62l20-22M30 72l18-20" stroke="#FFD5BC" strokeWidth={3} strokeLinecap="round" />
      <circle cx="30" cy="22" r="10" fill="#FFD84D" {...STROKE} strokeWidth={3} />
      <path d="M8 80h80" {...STROKE} />
    </svg>
  )
}

// Little steam engine: pink boiler, sky cab, butter funnel, grape wheels.
function Train() {
  return (
    <svg viewBox="0 0 96 96" fill="none">
      <path d="M16 30h14v-6h-6v-6h18v6h-6v6h8v10H16z" fill="var(--butter)" {...STROKE} strokeWidth={3} />
      <rect x="10" y="38" width="44" height="28" rx="8" fill="var(--pink)" {...STROKE} />
      <rect x="50" y="26" width="32" height="40" rx="7" fill="var(--sky)" {...STROKE} />
      <rect x="58" y="33" width="16" height="13" rx="4" fill="var(--cream)" {...STROKE} strokeWidth={3} />
      <path d="M8 66h80" {...STROKE} />
      {[26, 44, 68].map((x) => (
        <g key={x}>
          <circle cx={x} cy="70" r="9" fill="var(--grape)" />
          <circle cx={x} cy="70" r="3.5" fill="var(--cream)" />
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
  if (icon === 'rocks') return <Rocks />
  if (icon === 'train') return <Train />
  return <Present />
}
