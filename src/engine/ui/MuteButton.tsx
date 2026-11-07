import { motion } from 'motion/react'
import { play, setMuted } from '../audio'
import { useStore } from '../store'
import './ui.css'

export function MuteButton() {
  const muted = useStore((s) => s.muted)
  const toggleMute = useStore((s) => s.toggleMute)

  return (
    <motion.button
      type="button"
      className="corner-button corner-button--right"
      aria-label={muted ? 'Turn sound on' : 'Turn sound off'}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      onClick={() => {
        // Unmuting plays the click so the child hears that sound is back.
        toggleMute()
        setMuted(useStore.getState().muted)
        play('click')
      }}
    >
      <svg viewBox="0 0 48 48" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
        <path d="M6 18h8l10-8v28l-10-8H6z" fill="var(--butter)" />
        {muted ? (
          <path d="m32 18 12 12m0-12L32 30" />
        ) : (
          <>
            <path d="M32 18a8 8 0 0 1 0 12" />
            <path d="M37 12a16 16 0 0 1 0 24" />
          </>
        )}
      </svg>
    </motion.button>
  )
}
