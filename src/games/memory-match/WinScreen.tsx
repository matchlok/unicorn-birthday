import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { play } from '../../engine/audio'
import { useStore } from '../../engine/store'
import { BigButton } from '../../engine/ui/BigButton'
import { celebrate } from '../../engine/ui/celebrate'
import { findCreature } from './creatures'

type Props = { onReplay: () => void; onChangeDifficulty: () => void; onHome: () => void }

export function WinScreen({ onReplay, onChangeDifficulty, onHome }: Props) {
  const name = useStore((s) => s.unicornName)
  const addSticker = useStore((s) => s.addSticker)
  const done = useRef(false)
  const { Svg } = findCreature('unicorn')

  useEffect(() => {
    if (done.current) return // StrictMode runs effects twice in dev
    done.current = true
    celebrate()
    play('win')
    addSticker('memory-match')
  }, [addSticker])

  return (
    <div className="mm-win">
      <h1 className="mm-win__title">Yay{name ? `, ${name}` : ''}!</h1>
      <motion.div
        className="mm-win__unicorn"
        animate={{ y: [0, -28, 0] }}
        transition={{ repeat: Infinity, duration: 0.9, ease: 'easeInOut' }}
      >
        <Svg />
      </motion.div>
      <div className="mm-win__buttons">
        <BigButton onClick={onReplay} color="var(--mint)" label="Play again">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="var(--grape)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38 24a14 14 0 1 1-5-10.7" />
            <path d="M36 6v10H26" />
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
      <button type="button" className="mm-win__link" onClick={onChangeDifficulty}>
        change difficulty
      </button>
    </div>
  )
}
