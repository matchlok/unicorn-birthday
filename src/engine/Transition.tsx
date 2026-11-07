import { motion } from 'motion/react'
import './ui/ui.css'

export const TRANSITION_MS = 300

// A pink circle that grows to cover the screen, then shrinks away.
export function Transition({ covering }: { covering: boolean }) {
  return (
    <motion.div
      className={covering ? 'transition-circle transition-circle--covering' : 'transition-circle'}
      initial={{ scale: 0 }}
      animate={{ scale: covering ? 1 : 0 }}
      transition={{ duration: TRANSITION_MS / 1000, ease: 'easeInOut' }}
    />
  )
}
