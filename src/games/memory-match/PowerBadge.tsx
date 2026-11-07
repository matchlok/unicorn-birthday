import type { Power } from './logic'

const COLORS: Record<Power, string> = { shuffle: '#C8B6FF', peek: '#A0E7FF', wand: '#FFE66D' }

// Round badge for a power card: swirl = shuffle, eye = peek, wand with a star = wand.
export function PowerBadge({ power }: { power: Power }) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden>
      <circle cx="24" cy="24" r="21" fill={COLORS[power]} stroke="var(--grape)" strokeWidth="4" />
      {power === 'shuffle' && (
        <path d="M24 24q0-6 6-6t6 6-8 10-12-2-4-12 12-8" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinecap="round" transform="translate(-4 0)" />
      )}
      {power === 'peek' && (
        <>
          <path d="M7 24q17-18 34 0-17 18-34 0z" fill="white" stroke="var(--grape)" strokeWidth="3.5" strokeLinejoin="round" />
          <circle cx="24" cy="24" r="6" fill="var(--grape)" />
        </>
      )}
      {power === 'wand' && (
        <>
          <path d="M12 38 28 22" stroke="var(--grape)" strokeWidth="5" strokeLinecap="round" />
          <path d="M32 8l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z" fill="white" stroke="var(--grape)" strokeWidth="3" strokeLinejoin="round" />
        </>
      )}
    </svg>
  )
}
