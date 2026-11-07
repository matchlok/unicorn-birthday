import { motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { play } from '../../engine/audio'
import { ConfirmLeave } from '../../engine/ui/ConfirmLeave'
import { HomeButton } from '../../engine/ui/HomeButton'
import type { GameProps } from '../types'
import { BALLOON_COUNT, BALLOONS } from './course'
import { KartWin } from './KartWin'
import { RaceScene } from './RaceScene'
import { useKeys } from './useKeys'
import './kart-racing.css'

type Phase = 'play' | 'win'

const FINISH_PAUSE_MS = 1600 // let her roll through the arch before the party starts

function KeyCap({ children, big }: { children: string; big?: boolean }) {
  return <span className={`kart-hint__key${big ? ' kart-hint__key--big' : ''}`}>{children}</span>
}

// Pictures only: which keys to press, until she presses one.
function DriveHint() {
  return (
    <motion.div
      className="kart-hint"
      aria-hidden
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ delay: 0.6 }}
    >
      <motion.div animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
        <KeyCap big>▲</KeyCap>
      </motion.div>
      <div className="kart-hint__row">
        <KeyCap>◀</KeyCap>
        <KeyCap>▼</KeyCap>
        <KeyCap>▶</KeyCap>
      </div>
    </motion.div>
  )
}

export default function KartRacing({ onExit }: GameProps) {
  const [phase, setPhase] = useState<Phase>('play')
  const [round, setRound] = useState(0) // new key = fresh course
  const [confirming, setConfirming] = useState(false)
  const [popped, setPopped] = useState(0)
  const [driving, setDriving] = useState(false)
  const winTimer = useRef<number | undefined>(undefined)

  const getInput = useKeys({
    onDriveKey: () => setDriving(true),
    onHonk: () => play('honk'),
  })

  useEffect(() => () => window.clearTimeout(winTimer.current), [])

  const onFinish = useCallback(() => {
    winTimer.current = window.setTimeout(() => setPhase('win'), FINISH_PAUSE_MS)
  }, [])

  return (
    <div className="kart">
      <HomeButton
        onClick={() => {
          // Mid-race, ask first so a stray tap doesn't throw the lap away.
          if (phase === 'play') setConfirming(true)
          else onExit({ completed: true })
        }}
      />
      {confirming && <ConfirmLeave onStay={() => setConfirming(false)} onLeave={() => onExit({ completed: false })} />}

      {phase === 'play' && (
        <>
          <RaceScene key={round} paused={confirming} getInput={getInput} onCollect={setPopped} onFinish={onFinish} />
          <div className="kart-balloons" aria-hidden>
            {BALLOONS.map((b) => (
              <motion.span
                key={b.id}
                className={`kart-balloons__dot${b.id < popped ? ' kart-balloons__dot--got' : ''}`}
                style={{ ['--c' as string]: b.color }}
                animate={b.id === popped - 1 ? { scale: [1, 1.6, 1] } : undefined}
                transition={{ duration: 0.4 }}
              />
            ))}
          </div>
          {!driving && <DriveHint />}
        </>
      )}

      {phase === 'win' && (
        <KartWin
          balloons={popped}
          total={BALLOON_COUNT}
          onReplay={() => {
            setRound((r) => r + 1)
            setPopped(0)
            setDriving(false)
            setPhase('play')
          }}
          onHome={() => onExit({ completed: true })}
        />
      )}
    </div>
  )
}
