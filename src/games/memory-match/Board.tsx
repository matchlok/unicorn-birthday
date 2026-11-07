import { useEffect, useRef, useState } from 'react'
import { play } from '../../engine/audio'
import { Card } from './Card'
import { CREATURE_IDS } from './creatures'
import { buildDeck, DIFFICULTY, flip, initialState, isWin, resolve, type Difficulty, type GameState } from './logic'

const MISMATCH_MS = 900
const WIN_DELAY_MS = 600

type Props = { difficulty: Difficulty; onWin: () => void }

export function Board({ difficulty, onWin }: Props) {
  const { cols, rows, pairs, peekMs } = DIFFICULTY[difficulty]
  const [state, setState] = useState<GameState>(() => initialState(buildDeck(CREATURE_IDS, pairs)))
  const [peeking, setPeeking] = useState(peekMs > 0)
  const [focus, setFocus] = useState(0)
  const matchedCount = useRef(0)

  // Peek: all cards face up, then flip down together. Input is locked meanwhile.
  useEffect(() => {
    if (!peeking) return
    const t = setTimeout(() => setPeeking(false), peekMs)
    return () => clearTimeout(t)
  }, [peeking, peekMs])

  // Mismatch: soft sound, then flip both back after a beat.
  useEffect(() => {
    if (!state.locked) return
    play('nomatch')
    const t = setTimeout(() => setState(resolve), MISMATCH_MS)
    return () => clearTimeout(t)
  }, [state.locked])

  // Match sound and the win hand-off.
  useEffect(() => {
    const matched = state.cards.filter((c) => c.matched).length
    if (matched > matchedCount.current) play('match')
    matchedCount.current = matched
    if (!isWin(state)) return
    const t = setTimeout(onWin, WIN_DELAY_MS)
    return () => clearTimeout(t)
  }, [state, onWin])

  const flipAt = (index: number) => {
    if (peeking) return
    const next = flip(state, index)
    if (next === state) return
    play('flip')
    setState(next)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -cols, ArrowDown: cols }[e.key]
      if (move !== undefined) {
        e.preventDefault()
        setFocus((f) => Math.min(Math.max(f + move, 0), cols * rows - 1))
      } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault()
        flipAt(focus)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="mm-board" style={{ ['--cols' as string]: cols, ['--rows' as string]: rows }}>
      {state.cards.map((card, i) => (
        <Card
          key={card.uid}
          creatureId={card.creatureId}
          faceUp={peeking || card.matched || state.faceUp.includes(i)}
          matched={card.matched}
          wrong={state.locked && state.faceUp.includes(i)}
          focused={focus === i}
          onClick={() => {
            setFocus(i)
            flipAt(i)
          }}
        />
      ))}
      <span className="mm-moves">moves: {state.moves}</span>
    </div>
  )
}
