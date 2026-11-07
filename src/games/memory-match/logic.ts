export type Difficulty = 'easy' | 'medium' | 'hard'

export const DIFFICULTY = {
  easy: { cols: 3, rows: 2, pairs: 3, peekMs: 2000 },
  medium: { cols: 4, rows: 3, pairs: 6, peekMs: 1200 },
  hard: { cols: 4, rows: 4, pairs: 8, peekMs: 0 },
} as const

export type Card = { uid: number; creatureId: string; matched: boolean }

export type GameState = {
  cards: Card[]
  faceUp: number[] // indices currently face up and not matched (0, 1 or 2)
  locked: boolean // true while two unmatched cards are showing
  moves: number // pairs attempted (grown-up info only)
}

// Fisher-Yates, returns a new array.
export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

export function buildDeck(creatureIds: string[], pairs: number, rng: () => number = Math.random): Card[] {
  const chosen = shuffle(creatureIds, rng).slice(0, pairs)
  const cards = shuffle(
    chosen.flatMap((creatureId) => [creatureId, creatureId]),
    rng,
  )
  return cards.map((creatureId, uid) => ({ uid, creatureId, matched: false }))
}

export function initialState(deck: Card[]): GameState {
  return { cards: deck, faceUp: [], locked: false, moves: 0 }
}

// Ignored flips return the same object so React skips the re-render.
export function flip(state: GameState, index: number): GameState {
  const card = state.cards[index]
  if (!card || card.matched || state.locked || state.faceUp.includes(index)) return state

  if (state.faceUp.length === 0) return { ...state, faceUp: [index] }

  const first = state.faceUp[0]
  const moves = state.moves + 1
  if (state.cards[first].creatureId === card.creatureId) {
    const cards = state.cards.map((c, i) => (i === first || i === index ? { ...c, matched: true } : c))
    return { ...state, cards, faceUp: [], moves }
  }
  return { ...state, faceUp: [first, index], locked: true, moves }
}

// After the no-match delay: flips both cards back and unlocks.
export function resolve(state: GameState): GameState {
  if (!state.locked) return state
  return { ...state, faceUp: [], locked: false }
}

export function isWin(state: GameState): boolean {
  return state.cards.length > 0 && state.cards.every((c) => c.matched)
}
