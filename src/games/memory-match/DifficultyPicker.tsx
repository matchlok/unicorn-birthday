import { motion } from 'motion/react'
import { useEffect } from 'react'
import { play } from '../../engine/audio'
import { Stars } from '../../engine/ui/Stars'
import { DIFFICULTY, type Difficulty } from './logic'

const OPTIONS: { id: Difficulty; stars: 1 | 2 | 3 | 4 | 5; color: string }[] = [
  { id: 'easy', stars: 1, color: 'var(--mint)' },
  { id: 'medium', stars: 2, color: 'var(--butter)' },
  { id: 'hard', stars: 3, color: 'var(--pink)' },
  { id: 'expert', stars: 4, color: 'var(--sky)' },
  { id: 'wild', stars: 5, color: 'var(--lavender)' },
]

// Preview dots that glow gold on the 5-star card, hinting at the special cards.
const POWER_DOTS = [2, 8, 11, 15, 18]

export function DifficultyPicker({ onPick }: { onPick: (d: Difficulty) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const option = OPTIONS[Number(e.key) - 1]
      if (option && !e.repeat) {
        play('click')
        onPick(option.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPick])

  return (
    <div className="mm-picker">
      {OPTIONS.map(({ id, stars, color }) => {
        const { cols, rows, powers } = DIFFICULTY[id]
        return (
          <motion.button
            key={id}
            type="button"
            className="mm-picker__card"
            style={{ background: color }}
            aria-label={`${stars} stars`}
            whileHover={{ rotate: [0, -3, 3, -3, 0], scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={() => {
              play('click')
              onPick(id)
            }}
          >
            <Stars count={stars} size={stars > 3 ? 32 : 44} />
            <span className="mm-picker__dots" style={{ ['--cols' as string]: cols }}>
              {Array.from({ length: cols * rows }, (_, i) => (
                <i key={i} className={powers.length && POWER_DOTS.includes(i) ? 'mm-picker__power' : undefined} />
              ))}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
