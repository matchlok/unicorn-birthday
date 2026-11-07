import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { play } from '../audio'
import './ui.css'

type Props = {
  onClick: () => void
  children: ReactNode
  color?: string
  disabled?: boolean
  label?: string
}

export function BigButton({ onClick, children, color = 'var(--pink)', disabled, label }: Props) {
  return (
    <motion.button
      type="button"
      className="big-button"
      style={{ background: color }}
      aria-label={label}
      disabled={disabled}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      onClick={() => {
        play('click')
        onClick()
      }}
    >
      {children}
    </motion.button>
  )
}
