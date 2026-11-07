import { motion } from 'motion/react'
import { useState } from 'react'
import { play } from '../engine/audio'
import { useStore } from '../engine/store'
import { BigButton } from '../engine/ui/BigButton'
import { HomeButton } from '../engine/ui/HomeButton'
import { findCreature } from '../games/memory-match/creatures'
import { cleanName, finalName, NAME_MAX } from './name'
import './name-screen.css'

const SUGGESTIONS = ['Sparkle', 'Rainbow', 'Stardust']

// First launch, and again from the pencil on the hub. The prompt is for the grown-up to read aloud.
export function NameScreen() {
  const current = useStore((s) => s.unicornName)
  const setName = useStore((s) => s.setName)
  const goTo = useStore((s) => s.goTo)
  const [value, setValue] = useState(current ?? '')
  const { Svg } = findCreature('unicorn')
  const name = finalName(value)

  const submit = () => {
    if (!name) return
    setName(name)
    goTo({ kind: 'hub' })
  }

  return (
    <main className="name">
      {current && <HomeButton onClick={() => goTo({ kind: 'hub' })} />}
      <form
        className="name__panel"
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <motion.div
          className="name__unicorn"
          animate={{ y: [0, -12, 0], rotate: [-3, 3, -3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Svg />
        </motion.div>
        <h1 className="name__prompt">What's the birthday unicorn's name?</h1>
        <input
          className="name__input"
          autoFocus
          value={value}
          maxLength={NAME_MAX}
          autoComplete="off"
          spellCheck={false}
          aria-label="Unicorn name"
          onChange={(e) => setValue(cleanName(e.target.value))}
        />
        <div className="name__chips">
          {SUGGESTIONS.map((s) => (
            <motion.button
              key={s}
              type="button"
              className="name__chip"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              onClick={() => {
                play('click')
                setValue(s)
              }}
            >
              {s}
            </motion.button>
          ))}
        </div>
        <BigButton onClick={submit} disabled={!name} color="var(--pink)">
          Let's party!
        </BigButton>
      </form>
    </main>
  )
}
