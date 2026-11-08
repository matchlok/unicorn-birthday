import { useEffect, useRef, useState } from 'react'
import { play } from '../../engine/audio'
import { Card } from './Card'
import { useBoardLayout } from './useBoardLayout'
import { CREATURE_IDS } from './creatures'
import { addPowers, buildDeck, DIFFICULTY, endPeek, flip, initialState, isWin, resolve, applyPower, type Difficulty, type GameState } from './logic'

const MISMATCH_MS = 900
const WIN_DELAY_MS = 600
const POWER_DELAY_MS = 650 // beat between a settled pair and its power firing
const PEEK_MS = 1700
const SWIRL_MS = 900

type Props = { difficulty: Difficulty; onWin: () => void; paused?: boolean }

export function Board({ difficulty, onWin, paused = false }: Props) {
  const { cols: baseCols, rows: baseRows, pairs, peekMs, powers } = DIFFICULTY[difficulty]
  // On a portrait phone the same deck is laid out turned on its side (5x4 becomes 4x5).
  const { cols, rows, cardW, gap, margin } = useBoardLayout(baseCols, baseRows)
  const [state, setState] = useState<GameState>(() => initialState(addPowers(buildDeck(CREATURE_IDS, pairs), powers)))
  const [swirling, setSwirling] = useState(false)
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

  // Power cards: once a pair is settled, apply what it earned one power at a time.
  const nextPower = state.pending[0]
  useEffect(() => {
    if (!nextPower || state.locked || isWin(state)) return
    const t = setTimeout(() => {
      play(nextPower === 'shuffle' ? 'shuffle' : 'peek')
      if (nextPower === 'shuffle') {
        setSwirling(true)
        setTimeout(() => setSwirling(false), SWIRL_MS)
      }
      setState((s) => applyPower(s))
    }, POWER_DELAY_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-run only when the next power or the lock changes
  }, [nextPower, state.pending.length, state.locked])

  // Peek: the revealed cards flip back down after a moment.
  const showingPeek = state.revealed.length > 0
  useEffect(() => {
    if (!showingPeek) return
    const t = setTimeout(() => setState(endPeek), PEEK_MS)
    return () => clearTimeout(t)
  }, [showingPeek])

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
    if (peeking || paused || swirling) return
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
    <div
      className="mm-board"
      style={{
        ['--cols' as string]: cols,
        ['--w' as string]: `${cardW}px`,
        ['--gap' as string]: `${gap}px`,
        margin: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
      }}
    >
      {state.cards.map((card, i) => (
        <Card
          key={card.uid}
          creatureId={card.creatureId}
          faceUp={peeking || card.matched || state.faceUp.includes(i) || state.revealed.includes(i)}
          matched={card.matched}
          wrong={state.locked && state.faceUp.includes(i)}
          focused={focus === i}
          peeked={state.revealed.includes(i)}
          swirling={swirling && !card.matched}
          power={card.power}
          spent={card.spent}
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
