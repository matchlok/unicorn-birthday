import { motion } from 'motion/react'
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react'
import { play } from '../engine/audio'
import { readJson, writeJson } from '../engine/persist'
import { useStore } from '../engine/store'
import { GAMES } from '../games/registry'
import { BirthdayBanner } from './BirthdayBanner'
import { spawnBesidePad } from './hubLogic'
import { PadPrompt } from './PadPrompt'
import './hub.css'

// The 3D scene (three.js, drei) is its own chunk, so the first paint is just the sky and the buttons.
const HubScene = lazy(() => import('./HubScene'))

const isTouch = () => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const MAX_STARS = 10

function StickerShelf({ total }: { total: number }) {
  if (total <= 0) return null
  return (
    <div className="hub-shelf" aria-hidden>
      {Array.from({ length: Math.min(total, MAX_STARS) }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24">
          <path d="M12 2l3 7 7.5.7-5.7 5 1.8 7.3L12 18l-6.6 4 1.8-7.3-5.7-5L9 9z" fill="var(--butter)" stroke="var(--grape)" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      ))}
      {total > MAX_STARS && <b>+</b>}
    </div>
  )
}

// The party hub: a floating cake island. Each game has a display on it; walk onto one to play.
export function PartyHub() {
  const goTo = useStore((s) => s.goTo)
  const name = useStore((s) => s.unicornName)
  const spawn = useStore((s) => s.hubSpawn)
  const setHubSpawn = useStore((s) => s.setHubSpawn)
  const stickers = useStore((s) => s.stickers)
  const bannerRef = useRef<HTMLDivElement>(null)
  const [activePad, setActivePad] = useState<number | null>(null)
  const [hint, setHint] = useState(() => !readJson('hubHintSeen', false))

  const game = activePad === null ? null : GAMES[activePad]
  const total = Object.values(stickers).reduce((a, b) => a + b, 0)

  // Entering a pad: a happy chime for a playable game, a soft "not yet" otherwise.
  useEffect(() => {
    if (!game) return
    play(game.status === 'ready' ? 'padEnter' : 'locked')
  }, [game])

  const playGame = useCallback(() => {
    if (activePad === null || GAMES[activePad].status !== 'ready') return
    play('click')
    setHubSpawn(spawnBesidePad(activePad, GAMES.length))
    goTo({ kind: 'game', id: GAMES[activePad].id })
  }, [activePad, goTo, setHubSpawn])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.code !== 'Enter') return
      e.preventDefault()
      if (!e.repeat) playGame()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [playGame])

  const onFirstMove = useCallback(() => {
    setHint(false)
    writeJson('hubHintSeen', true)
  }, [])

  return (
    <main className="hub">
      <Suspense fallback={<div className="hub__loading">⭐</div>}>
        <HubScene bannerRef={bannerRef} spawn={spawn} activePad={activePad} onActivePad={setActivePad} onFirstMove={onFirstMove} />
      </Suspense>

      <BirthdayBanner name={name} bannerRef={bannerRef} />

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

      <StickerShelf total={total} />
      <PadPrompt game={game} onPlay={playGame} />

      {hint && !game && (
        <div className="hub-hint" role="note">
          {isTouch() ? 'Tap the ground to walk to a game!' : 'Use the arrow keys or click to walk to a game!'}
        </div>
      )}
    </main>
  )
}
