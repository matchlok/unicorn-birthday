import { motion } from 'motion/react'
import { useEffect } from 'react'
import { play } from '../../engine/audio'
import { Stars } from '../../engine/ui/Stars'
import { DIFFICULTY, type Difficulty } from './logic'

const OPTIONS: { id: Difficulty; stars: 1 | 2 | 3; color: string }[] = [
  { id: 'easy', stars: 1, color: 'var(--mint)' },
  { id: 'medium', stars: 2, color: 'var(--butter)' },
  { id: 'hard', stars: 3, color: 'var(--pink)' },
]

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
        const { cols, rows } = DIFFICULTY[id]
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
            <Stars count={stars} />
            <span className="mm-picker__dots" style={{ ['--cols' as string]: cols }}>
              {Array.from({ length: cols * rows }, (_, i) => (
                <i key={i} />
              ))}
            </span>
          </motion.button>
        )
      })}
    </div>
  )
}
