import { motion } from 'motion/react'
import { useEffect } from 'react'
import { play } from '../../engine/audio'
import { Stars } from '../../engine/ui/Stars'
import { LEVELS } from './levels'
import { MiniTrack } from './TrackArt'

export type StarCount = 1 | 2 | 3

const OPTIONS: { stars: StarCount; color: string }[] = [
  { stars: 1, color: 'var(--mint)' },
  { stars: 2, color: 'var(--butter)' },
  { stars: 3, color: 'var(--pink)' },
]

export function StarPicker({ onPick }: { onPick: (stars: StarCount) => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const option = OPTIONS[Number(e.key) - 1]
      if (option && !e.repeat) {
        play('click')
        onPick(option.stars)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onPick])

  return (
    <div className="tr-picker">
      {OPTIONS.map(({ stars, color }) => (
        <motion.button
          key={stars}
          type="button"
          className="tr-picker__card"
          style={{ background: color }}
          aria-label={`${stars} stars`}
          whileHover={{ rotate: [0, -3, 3, -3, 0], scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={() => {
            play('click')
            onPick(stars)
          }}
        >
          <Stars count={stars} size={44} />
          <span className="tr-picker__track">
            <MiniTrack level={LEVELS[stars][0]} width={150} />
          </span>
        </motion.button>
      ))}
    </div>
  )
}
