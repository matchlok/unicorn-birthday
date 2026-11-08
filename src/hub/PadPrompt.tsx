import { AnimatePresence, motion } from 'motion/react'
import type { GameEntry } from '../games/types'
import { GameIcon, Padlock } from './GameIcons'

// Bottom-centre prompt for the pad she is standing on. Pictures first: a huge Play button for a
// ready game, a padlock or present (no button) otherwise.
export function PadPrompt({ game, onPlay }: { game: GameEntry | null; onPlay: () => void }) {
  return (
    <div className="hub-prompt">
      <AnimatePresence mode="wait">
        {game && game.status === 'ready' && (
          <motion.button
            key={game.id}
            type="button"
            className="hub-play"
            aria-label="Play"
            initial={{ y: 80, opacity: 0, scale: 0.8 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            onClick={onPlay}
          >
            <span className="hub-play__icon">
              <GameIcon icon={game.icon} />
            </span>
            <span className="hub-play__label">Play!</span>
          </motion.button>
        )}
        {game && game.status !== 'ready' && (
          <motion.div
            key={game.id}
            className="hub-soon"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 380, damping: 20 }}
          >
            <span className="hub-soon__icon">{game.status === 'locked' ? <Padlock /> : <GameIcon icon="present" />}</span>
            <span>Coming soon!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
