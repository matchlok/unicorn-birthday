import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { play } from '../../engine/audio'
import { useStore } from '../../engine/store'
import { BigButton } from '../../engine/ui/BigButton'
import { celebrateBig } from '../../engine/ui/celebrate'
import { findCreature } from './creatures'

type Props = { onReplay: () => void; onChangeDifficulty: () => void; onHome: () => void }

const LETTER_COLORS = ['var(--pink-deep)', 'var(--lavender)', 'var(--sky)', 'var(--butter)', 'var(--mint)', 'var(--peach)']
const FLOATERS = ['⭐', '✨', '💖', '🌈', '⭐', '✨', '💖', '🌈', '⭐', '✨']

const STAR_PATH = 'M24 4l6 13 14 2-10 10 3 14-13-7-13 7 3-14L4 19l14-2z'

export function WinScreen({ onReplay, onChangeDifficulty, onHome }: Props) {
  const name = useStore((s) => s.unicornName)
  const addSticker = useStore((s) => s.addSticker)
  const done = useRef(false)
  const { Svg } = findCreature('unicorn')
  const title = `Yay${name ? `, ${name}` : ''}!`

  useEffect(() => {
    if (done.current) return // StrictMode runs effects twice in dev
    done.current = true
    play('win')
    addSticker('memory-match')
  }, [addSticker])

  useEffect(() => celebrateBig(), [])

  return (
    <div className="mm-win">
      <div className="mm-win__rays" aria-hidden />
      {FLOATERS.map((f, i) => (
        <span
          key={i}
          className="mm-win__floater"
          aria-hidden
          style={{ ['--x' as string]: `${5 + i * 10}%`, ['--d' as string]: `${i * 0.45}s`, ['--s' as string]: `${2.2 + (i % 3) * 0.8}rem` }}
        >
          {f}
        </span>
      ))}
      <h1 className="mm-win__title" aria-label={title}>
        {[...title].map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            className="mm-win__letter"
            style={{ color: LETTER_COLORS[i % LETTER_COLORS.length] }}
            initial={{ y: -300, scale: 0, rotate: -40, opacity: 0 }}
            animate={{ y: [0, -22, 0], scale: 1, rotate: [-6, 6, -6], opacity: 1 }}
            transition={{
              y: { repeat: Infinity, duration: 0.8, delay: 0.6 + i * 0.07, ease: 'easeInOut' },
              rotate: { repeat: Infinity, duration: 1.6, delay: i * 0.07, ease: 'easeInOut' },
              scale: { type: 'spring', stiffness: 300, damping: 10, delay: i * 0.07 },
              opacity: { duration: 0.1, delay: i * 0.07 },
            }}
          >
            {ch === ' ' ? ' ' : ch}
          </motion.span>
        ))}
      </h1>
      <motion.div
        className="mm-win__unicorn"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 160, damping: 9, delay: 0.3 }}
      >
        <motion.div
          className="mm-win__unicorn-inner"
          animate={{ y: [0, -36, 0], rotate: [-4, 4, -4], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
        >
          <Svg />
        </motion.div>
      </motion.div>
      <div className="mm-win__buttons">
        <BigButton onClick={onReplay} color="var(--mint)" label="Play again">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="var(--grape)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38 24a14 14 0 1 1-5-10.7" />
            <path d="M36 6v10H26" />
          </svg>
        </BigButton>
        <BigButton onClick={onChangeDifficulty} color="var(--lavender)" label="Change difficulty">
          <svg viewBox="0 0 96 48" width="104" height="52" stroke="var(--grape)" strokeWidth="3" strokeLinejoin="round">
            <g transform="translate(0 14) scale(0.5)" fill="var(--butter)">
              <path d={STAR_PATH} />
            </g>
            <g transform="translate(24 8) scale(0.7)" fill="var(--butter)">
              <path d={STAR_PATH} />
            </g>
            <g transform="translate(54 0) scale(0.9)" fill="var(--butter)">
              <path d={STAR_PATH} />
            </g>
          </svg>
        </BigButton>
        <BigButton onClick={onHome} color="var(--butter)" label="Back to party">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            <path d="M6 22 24 7l18 15" />
            <path d="M10 20v22h28V20" fill="var(--pink)" />
            <path d="M20 42V28h8v14" fill="var(--butter)" />
          </svg>
        </BigButton>
      </div>
    </div>
  )
}
