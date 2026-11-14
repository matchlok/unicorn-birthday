import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../../engine/store'
import { ConfirmLeave } from '../../engine/ui/ConfirmLeave'
import { HomeButton } from '../../engine/ui/HomeButton'
import type { GameProps } from '../types'
import { Course, type RunResult } from './Course'
import { mergeInput, useRockKeys } from './input'
import { NO_INPUT, type Input } from './logic'
import { RockEnd } from './RockEnd'
import { addScore, loadScores, saveScores, type ScoreEntry } from './scores'
import { TouchButtons } from './TouchButtons'
import './rock-climb.css'

type Phase = 'play' | 'end'
export type Finished = RunResult & { table: ScoreEntry[]; rank: number | null; at: number }

function useIsTouch() {
  const [touch, setTouch] = useState(() => typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches)
  useEffect(() => {
    const on = () => setTouch(true)
    window.addEventListener('touchstart', on, { once: true, passive: true })
    return () => window.removeEventListener('touchstart', on)
  }, [])
  return touch
}

// Pictures only: run right, hop up. Fades once she moves.
function Hint({ touch }: { touch: boolean }) {
  return (
    <motion.div className={`rock-hint${touch ? ' rock-hint--touch' : ''}`} aria-hidden initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.8 }}>
      {touch ? (
        <motion.span style={{ fontSize: '4rem' }} animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
          👇
        </motion.span>
      ) : (
        <div className="rock-hint__keys">
          <motion.span className="rock-hint__key" animate={{ y: [0, -10, 0] }} transition={{ repeat: Infinity, duration: 1 }}>
            ▲
          </motion.span>
          <span className="rock-hint__plus">+</span>
          <motion.span className="rock-hint__key rock-hint__key--big" animate={{ scale: [1, 1.12, 1] }} transition={{ repeat: Infinity, duration: 1.2 }}>
            ▶
          </motion.span>
        </div>
      )}
    </motion.div>
  )
}

export default function RockClimb({ onExit }: GameProps) {
  const name = useStore((s) => s.unicornName)
  const addSticker = useStore((s) => s.addSticker)
  const [phase, setPhase] = useState<Phase>('play')
  const [round, setRound] = useState(0)
  const [confirming, setConfirming] = useState(false)
  const [moved, setMoved] = useState(false)
  const [finished, setFinished] = useState<Finished | null>(null)

  const isTouch = useIsTouch()
  const touch = useRef<Input>({ ...NO_INPUT })
  const keys = useRockKeys(() => setMoved(true))
  const getInput = useRef(() => mergeInput(keys.current(), touch.current))

  // Runs once per climb, from the game loop (not an effect), so StrictMode can't save it twice.
  const onDone = useCallback(
    (r: RunResult) => {
      const at = Date.now()
      const { table, rank } = addScore(loadScores(), { name: name?.trim() || 'Unicorn', score: r.score, at })
      saveScores(table)
      addSticker('rock-climb')
      setFinished({ ...r, table, rank, at })
      setPhase('end')
    },
    [name, addSticker],
  )

  return (
    <div className="rock">
      <HomeButton
        onClick={() => {
          // Mid-climb, ask first so a stray tap doesn't throw the run away.
          if (phase === 'play') setConfirming(true)
          else onExit({ completed: true })
        }}
      />
      {confirming && <ConfirmLeave onStay={() => setConfirming(false)} onLeave={() => onExit({ completed: false })} />}

      {phase === 'play' && (
        <>
          <Course key={round} paused={confirming} getInput={getInput} onDone={onDone} />
          {isTouch && <TouchButtons state={touch} onPress={() => setMoved(true)} />}
          <AnimatePresence>{!moved && <Hint touch={isTouch} />}</AnimatePresence>
        </>
      )}

      {phase === 'end' && finished && (
        <RockEnd
          result={finished}
          onReplay={() => {
            setRound((r) => r + 1)
            setFinished(null)
            setMoved(false)
            setPhase('play')
          }}
          onHome={() => onExit({ completed: true })}
        />
      )}
    </div>
  )
}
