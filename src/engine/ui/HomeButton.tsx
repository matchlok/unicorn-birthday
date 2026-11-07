import { motion } from 'motion/react'
import { play } from '../audio'
import './ui.css'

export function HomeButton({ onClick }: { onClick: () => void }) {
  return (
    <motion.button
      type="button"
      className="corner-button corner-button--left"
      aria-label="Back to party"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      onClick={() => {
        play('click')
        onClick()
      }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M6 22 24 7l18 15" />
        <path d="M10 20v22h28V20" fill="var(--pink)" />
        <path d="M20 42V28h8v14" fill="var(--butter)" />
      </svg>
    </motion.button>
  )
}
