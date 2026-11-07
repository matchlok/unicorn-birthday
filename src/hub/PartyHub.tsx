import { motion } from 'motion/react'
import { play } from '../engine/audio'
import { useStore } from '../engine/store'
import { GAMES } from '../games/registry'
import { GameIcon, Padlock } from './GameIcons'
import './hub.css'

const BALLOONS = [
  { color: 'var(--pink-deep)', x: '6%', delay: 0 },
  { color: 'var(--butter)', x: '14%', delay: 0.8 },
  { color: 'var(--sky)', x: '86%', delay: 0.4 },
  { color: 'var(--mint)', x: '94%', delay: 1.2 },
]

const BUNTING = ['var(--pink-deep)', 'var(--butter)', 'var(--mint)', 'var(--sky)', 'var(--lavender)']

// 2D landing page. Phase 3 replaces it with the 3D hub; the registry-driven cards stay the source of truth.
export function PartyHub() {
  const goTo = useStore((s) => s.goTo)
  const name = useStore((s) => s.unicornName)

  return (
    <main className="hub">
      <div className="hub__bunting" aria-hidden>
        {Array.from({ length: 14 }, (_, i) => (
          <i key={i} style={{ background: BUNTING[i % BUNTING.length] }} />
        ))}
      </div>

      {BALLOONS.map(({ color, x, delay }) => (
        <span key={x} className="hub__balloon" aria-hidden style={{ left: x, background: color, animationDelay: `${delay}s` }} />
      ))}

      <header className="hub__header">
        <motion.div
          className="hub__unicorn"
          animate={{ y: [0, -10, 0], rotate: [-2, 2, -2] }}
          transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
        >
          <svg viewBox="0 0 200 200" aria-hidden>
            <path d="M52 100q-22 30-8 62M62 82q-30 20-22 52M76 66q-30 6-30 36" fill="none" stroke="#C8B6FF" strokeWidth="16" strokeLinecap="round" />
            <path d="M62 88q-8 24 4 46" fill="none" stroke="#A0E7FF" strokeWidth="9" strokeLinecap="round" />
            <path d="M52 112q-4 20 6 36" fill="none" stroke="#FFE66D" strokeWidth="9" strokeLinecap="round" />
            <circle cx="104" cy="118" r="56" fill="white" stroke="var(--grape)" strokeWidth="5" />
            <path d="M80 70 76 36 104 66" fill="white" stroke="var(--grape)" strokeWidth="5" strokeLinejoin="round" />
            <path d="M96 64 112 14q4-4 8 0l6 52z" fill="#FFD23F" stroke="var(--grape)" strokeWidth="5" strokeLinejoin="round" />
            {[82, 126].map((x) => (
              <g key={x}>
                <circle cx={x} cy="112" r="11" fill="white" stroke="var(--grape)" strokeWidth="4" />
                <circle cx={x} cy="113" r="6" fill="var(--grape)" />
                <circle cx={x - 2} cy="110" r="2.4" fill="white" />
              </g>
            ))}
            <circle cx="66" cy="138" r="8" fill="#FF7EB9" opacity="0.6" />
            <circle cx="142" cy="138" r="8" fill="#FF7EB9" opacity="0.6" />
            <path d="M92 144Q104 156 116 144" fill="none" stroke="var(--grape)" strokeWidth="5" strokeLinecap="round" />
          </svg>
        </motion.div>
        <h1 className="hub__title">
          <span>Unicorn</span> Birthday Bash
        </h1>
        {name && (
          <motion.button
            type="button"
            className="hub__name"
            aria-label="Change the unicorn's name"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 400, damping: 15 }}
            onClick={() => {
              play('click')
              goTo({ kind: 'name' })
            }}
          >
            {name}
            <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="var(--grape)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
              <path d="M4 20l1-5L16 4l4 4L9 19z" fill="var(--butter)" />
            </svg>
          </motion.button>
        )}
      </header>

      <nav className="hub__games" aria-label="Games">
        {GAMES.map((game) => {
          const ready = game.status === 'ready'
          return (
            <motion.button
              key={game.id}
              type="button"
              className={`game-card${ready ? '' : ' game-card--soon'}`}
              style={{ background: game.padColor }}
              aria-label={game.id}
              whileHover={ready ? { y: -8, scale: 1.04 } : { rotate: [0, -2, 2, 0] }}
              whileTap={{ scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              onClick={() => {
                if (ready) {
                  play('click')
                  goTo({ kind: 'game', id: game.id })
                } else {
                  play('locked')
                }
              }}
            >
              <span className="game-card__icon">
                <GameIcon icon={game.icon} />
              </span>
              <span className={ready ? 'game-card__badge game-card__badge--play' : 'game-card__badge'}>
                {ready ? (
                  <svg viewBox="0 0 24 24" aria-hidden>
                    <path d="M8 5l12 7-12 7z" fill="white" stroke="var(--grape)" strokeWidth="2.5" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <Padlock />
                )}
              </span>
            </motion.button>
          )
        })}
      </nav>
    </main>
  )
}
