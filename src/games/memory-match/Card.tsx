import { motion } from 'motion/react'
import { findCreature } from './creatures'
import type { Power } from './logic'
import { PowerBadge } from './PowerBadge'

type Props = {
  creatureId: string
  faceUp: boolean
  matched: boolean
  wrong: boolean
  focused: boolean
  peeked: boolean
  swirling: boolean
  power?: Power
  spent?: boolean
  onClick: () => void
}

export function Card({ creatureId, faceUp, matched, wrong, focused, peeked, swirling, power, spent, onClick }: Props) {
  const { name, color, Svg } = findCreature(creatureId)
  const cls = [
    'mm-card',
    faceUp && 'mm-card--up',
    matched && 'mm-card--matched',
    wrong && 'mm-card--wrong',
    focused && 'mm-card--focus',
    peeked && 'mm-card--peek',
    swirling && 'mm-card--swirl',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    // `layout` slides the card to its new cell when a shuffle reorders the board.
    <motion.button
      layout
      transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      type="button"
      className={cls}
      onClick={onClick}
      aria-label={faceUp ? name : 'Hidden card'}
    >
      <span className="mm-card__inner">
        <span className="mm-card__face mm-card__back">
          <svg viewBox="0 0 100 100" width="60%" height="60%">
            <path d="M50 8l10 24 26 3-19 18 5 26-22-13-22 13 5-26-19-18 26-3z" fill="white" opacity="0.9" />
            <path d="M44 34 50 14l6 20z" fill="#FFD23F" />
          </svg>
          {power && !spent && <i className="mm-card__twinkle" />}
        </span>
        <span className="mm-card__face mm-card__front" style={{ background: color }}>
          <Svg />
          {power && (
            <span className={`mm-card__power${spent ? ' mm-card__power--spent' : ''}`}>
              <PowerBadge power={power} />
            </span>
          )}
        </span>
      </span>
      {matched && (
        <span className="mm-sparkles" aria-hidden>
          {Array.from({ length: 6 }, (_, i) => (
            <i key={i} style={{ ['--a' as string]: `${i * 60}deg` }} />
          ))}
        </span>
      )}
    </motion.button>
  )
}
