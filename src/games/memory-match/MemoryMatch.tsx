import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmLeave } from '../../engine/ui/ConfirmLeave'
import { HomeButton } from '../../engine/ui/HomeButton'
import type { GameProps } from '../types'
import { Board } from './Board'
import { DifficultyPicker } from './DifficultyPicker'
import type { Difficulty } from './logic'
import { WinScreen } from './WinScreen'
import './memory-match.css'

type Phase = 'pick' | 'play' | 'win'

export default function MemoryMatch({ onExit }: GameProps) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [round, setRound] = useState(0) // new key = new shuffled deck
  const [confirming, setConfirming] = useState(false)
  const ownBack = useRef(false) // true while our own history.back() is in flight

  // Browser back during a game asks first, same as the home button.
  // A spare history entry absorbs the back press; it's put back after each one.
  useEffect(() => {
    if (phase !== 'play') return
    history.pushState({ mm: true }, '')
    const onPop = () => {
      if (ownBack.current) {
        ownBack.current = false
        return
      }
      history.pushState({ mm: true }, '')
      setConfirming(true)
    }
    window.addEventListener('popstate', onPop)
    return () => {
      window.removeEventListener('popstate', onPop)
      // Drop the spare entry so back from the hub isn't a dead press.
      if (history.state?.mm) {
        ownBack.current = true
        history.back()
        setTimeout(() => (ownBack.current = false), 300) // in case no listener saw it
      }
    }
  }, [phase])

  const onWin = useCallback(() => setPhase('win'), [])

  return (
    <div className="mm">
      <HomeButton
        onClick={() => {
          // Mid-game, ask first so a stray tap doesn't throw the board away.
          if (phase === 'play') setConfirming(true)
          else onExit({ completed: phase === 'win' })
        }}
      />
      {confirming && <ConfirmLeave onStay={() => setConfirming(false)} onLeave={() => onExit({ completed: false })} />}
      {phase === 'pick' && (
        <DifficultyPicker
          onPick={(d) => {
            setDifficulty(d)
            setRound((r) => r + 1)
            setPhase('play')
          }}
        />
      )}
      {phase === 'play' && <Board key={round} difficulty={difficulty} onWin={onWin} paused={confirming} />}
      {phase === 'win' && (
        <WinScreen
          onReplay={() => {
            setRound((r) => r + 1)
            setPhase('play')
          }}
          onChangeDifficulty={() => setPhase('pick')}
          onHome={() => onExit({ completed: true })}
        />
      )}
    </div>
  )
}
