import { useCallback, useState } from 'react'
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
  const onWin = useCallback(() => setPhase('win'), [])

  return (
    <div className="mm">
      <HomeButton onClick={() => onExit({ completed: phase === 'win' })} />
      {phase === 'pick' && (
        <DifficultyPicker
          onPick={(d) => {
            setDifficulty(d)
            setRound((r) => r + 1)
            setPhase('play')
          }}
        />
      )}
      {phase === 'play' && <Board key={round} difficulty={difficulty} onWin={onWin} />}
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
