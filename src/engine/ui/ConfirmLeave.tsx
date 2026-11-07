import { motion } from 'motion/react'
import { BigButton } from './BigButton'
import './ui.css'

type Props = { onStay: () => void; onLeave: () => void }

// "Are you sure?" for a pre-reader: big pictures, the safe choice is the first and biggest one.
export function ConfirmLeave({ onStay, onLeave }: Props) {
  return (
    <div className="confirm-backdrop" role="dialog" aria-modal="true" aria-label="Leave the game?">
      <motion.div
        className="confirm-panel"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        <div className="confirm-title">Leave the game?</div>
        <div className="confirm-buttons">
          <BigButton onClick={onStay} color="var(--mint)" label="Keep playing">
            <span aria-hidden>🦄 Keep playing</span>
          </BigButton>
          <BigButton onClick={onLeave} color="var(--peach)" label="Go home">
            <span aria-hidden>🏠 Go home</span>
          </BigButton>
        </div>
      </motion.div>
    </div>
  )
}
