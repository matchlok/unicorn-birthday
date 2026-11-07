export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert' | 'wild'

// shuffle: hidden cards swap places. peek: 1-2 hidden cards show for a moment. wand: one pair matches itself.
export type Power = 'shuffle' | 'peek' | 'wand'

type Config = { cols: number; rows: number; pairs: number; peekMs: number; powers: readonly Power[] }

// Expert (4 stars) is a bigger board. Wild (5 stars) is the same board with power cards mixed in.
export const DIFFICULTY: Record<Difficulty, Config> = {
  easy: { cols: 3, rows: 2, pairs: 3, peekMs: 2000, powers: [] },
  medium: { cols: 4, rows: 3, pairs: 6, peekMs: 1200, powers: [] },
  hard: { cols: 4, rows: 4, pairs: 8, peekMs: 0, powers: [] },
  expert: { cols: 5, rows: 4, pairs: 10, peekMs: 0, powers: [] },
  wild: { cols: 5, rows: 4, pairs: 10, peekMs: 0, powers: ['shuffle', 'shuffle', 'peek', 'peek', 'wand'] },
}

export type Card = {
  uid: number
  creatureId: string
  matched: boolean
  power?: Power // badge on the card, triggers once when it is flipped
  spent?: boolean // power already used
}

export type GameState = {
  cards: Card[]
  faceUp: number[] // indices currently face up and not matched (0, 1 or 2)
  locked: boolean // true while two unmatched cards are showing
  moves: number // pairs attempted (grown-up info only)
  pending: Power[] // powers earned by the last pair, applied one at a time with `applyPower`
  revealed: number[] // hidden cards shown by a peek until `endPeek`
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

// Puts each power on a different card, never two on the same creature, so a pair can't carry two.
export function addPowers(deck: Card[], powers: readonly Power[], rng: () => number = Math.random): Card[] {
  const cards = [...deck]
  const used = new Set<string>()
  for (const power of powers) {
    const i = shuffle([...cards.keys()], rng).find((k) => !used.has(cards[k].creatureId))
    if (i === undefined) break
    used.add(cards[i].creatureId)
    cards[i] = { ...cards[i], power }
  }
  return cards
}

export function initialState(deck: Card[]): GameState {
  return { cards: deck, faceUp: [], locked: false, moves: 0, pending: [], revealed: [] }
}

// Cards that are still face down and in play.
const hiddenIndices = (state: GameState) =>
  state.cards.flatMap((c, i) => (c.matched || state.faceUp.includes(i) ? [] : [i]))

// Ignored flips return the same object so React skips the re-render.
export function flip(state: GameState, index: number): GameState {
  const card = state.cards[index]
  const busy = state.locked || state.pending.length > 0 || state.revealed.length > 0
  if (!card || card.matched || busy || state.faceUp.includes(index)) return state

  if (state.faceUp.length === 0) return { ...state, faceUp: [index] }

  const first = state.faceUp[0]
  const moves = state.moves + 1
  const matched = state.cards[first].creatureId === card.creatureId

  // Powers on either card of the pair fire once, after the pair is settled.
  const pending: Power[] = []
  const cards = state.cards.map((c, i) => {
    if (i !== first && i !== index) return c
    const next = matched ? { ...c, matched: true } : c
    if (!c.power || c.spent) return next
    pending.push(c.power)
    return { ...next, spent: true }
  })

  if (matched) return { ...state, cards, faceUp: [], moves, pending }
  return { ...state, cards, faceUp: [first, index], locked: true, moves, pending }
}

// After the no-match delay: flips both cards back and unlocks.
export function resolve(state: GameState): GameState {
  if (!state.locked) return state
  return { ...state, faceUp: [], locked: false }
}

// Applies the next earned power. Call once the pair is settled (not locked).
export function applyPower(state: GameState, rng: () => number = Math.random): GameState {
  const [power, ...pending] = state.pending
  if (!power || state.locked) return state
  const next = { ...state, pending }
  const hidden = hiddenIndices(state)

  if (power === 'shuffle') {
    if (hidden.length < 3) return next
    let order = shuffle(hidden, rng)
    if (order.every((from, k) => from === hidden[k])) order = [...order.slice(1), order[0]] // make sure something moves
    const cards = [...state.cards]
    hidden.forEach((slot, k) => (cards[slot] = state.cards[order[k]]))
    return { ...next, cards }
  }

  if (power === 'peek') {
    const count = Math.min(hidden.length, 1 + Math.floor(rng() * 2))
    return { ...next, revealed: shuffle(hidden, rng).slice(0, count) }
  }

  // wand: pick a hidden card and match it with its twin
  const pick = hidden[Math.floor(rng() * hidden.length)]
  if (pick === undefined) return next
  const twin = hidden.find((i) => i !== pick && state.cards[i].creatureId === state.cards[pick].creatureId)
  if (twin === undefined) return next
  const cards = state.cards.map((c, i) => (i === pick || i === twin ? { ...c, matched: true } : c))
  return { ...next, cards }
}

export function endPeek(state: GameState): GameState {
  return state.revealed.length ? { ...state, revealed: [] } : state
}

export function isWin(state: GameState): boolean {
  return state.cards.length > 0 && state.cards.every((c) => c.matched)
}
