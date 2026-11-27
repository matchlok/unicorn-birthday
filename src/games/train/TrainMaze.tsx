import { useCallback, useEffect, useRef, useState } from 'react'
import { ConfirmLeave } from '../../engine/ui/ConfirmLeave'
import { HomeButton } from '../../engine/ui/HomeButton'
import { WinScreen } from '../memory-match/WinScreen'
import type { GameProps } from '../types'
import { LEVELS } from './levels'
import { StarPicker, type StarCount } from './StarPicker'
import { TrainBoard } from './TrainBoard'
import '../memory-match/memory-match.css' // the win screen is Memory Match's
import './train.css'

type Phase = 'pick' | 'play' | 'win'

export default function TrainMaze({ onExit }: GameProps) {
  const [phase, setPhase] = useState<Phase>('pick')
  const [stars, setStars] = useState<StarCount>(1)
  const [round, setRound] = useState(0) // new key = fresh switches
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }) // wins so far per star count: picks the next level
  const ownBack = useRef(false) // true while our own history.back() is in flight

  // Browser back during a game asks first, same as the home button (see MemoryMatch).
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
      if (history.state?.mm) {
        ownBack.current = true
        history.back()
        setTimeout(() => (ownBack.current = false), 300)
      }
    }
  }, [phase])

  const onWin = useCallback(() => {
    setDone((d) => ({ ...d, [stars]: d[stars] + 1 }))
    setPhase('win')
  }, [stars])

  const levels = LEVELS[stars]
  // After a win the count has moved on, so "play again" is the next level at the same stars.
  const base = levels[done[stars] % levels.length]

  return (
    <div className="tr">
      <HomeButton
        onClick={() => {
          if (phase === 'play') setConfirming(true)
          else onExit({ completed: phase === 'win' })
        }}
      />
      {confirming && <ConfirmLeave onStay={() => setConfirming(false)} onLeave={() => onExit({ completed: false })} />}
      {phase === 'pick' && (
        <StarPicker
          onPick={(s) => {
            setStars(s)
            setRound((r) => r + 1)
            setPhase('play')
          }}
        />
      )}
      {phase === 'play' && <TrainBoard key={round} base={base} onWin={onWin} paused={confirming} />}
      {phase === 'win' && (
        <WinScreen
          stickerId="train"
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
