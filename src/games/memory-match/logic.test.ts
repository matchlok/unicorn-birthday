import { describe, expect, it } from 'vitest'
import {
  addPowers,
  applyPower,
  buildDeck,
  DIFFICULTY,
  endPeek,
  flip,
  initialState,
  isWin,
  resolve,
  shuffle,
  type Difficulty,
  type GameState,
  type Power,
} from './logic'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

// Two-card deck-state helpers: cards laid out a a b b.
function fixed(): GameState {
  return initialState(
    ['a', 'a', 'b', 'b'].map((creatureId, uid) => ({ uid, creatureId, matched: false })),
  )
}

describe('buildDeck', () => {
  it('has pairs * 2 cards, each creature exactly twice, unique uids', () => {
    const deck = buildDeck(IDS, 6, mulberry32(1))
    expect(deck).toHaveLength(12)
    const counts = new Map<string, number>()
    for (const c of deck) counts.set(c.creatureId, (counts.get(c.creatureId) ?? 0) + 1)
    expect(counts.size).toBe(6)
    expect([...counts.values()].every((n) => n === 2)).toBe(true)
    expect(new Set(deck.map((c) => c.uid)).size).toBe(12)
  })

  it('is deterministic for a seeded rng', () => {
    const a = buildDeck(IDS, 8, mulberry32(42)).map((c) => c.creatureId)
    const b = buildDeck(IDS, 8, mulberry32(42)).map((c) => c.creatureId)
    expect(a).toEqual(b)
  })
})

describe('shuffle', () => {
  it('keeps the same items and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    const out = shuffle(input, mulberry32(7))
    expect([...out].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('flip', () => {
  it('ignores a face-up card', () => {
    const s = flip(fixed(), 0)
    expect(flip(s, 0)).toBe(s)
  })

  it('ignores a matched card', () => {
    const s = flip(flip(fixed(), 0), 1)
    expect(flip(s, 0)).toBe(s)
  })

  it('ignores any flip while locked', () => {
    const s = flip(flip(fixed(), 0), 2)
    expect(s.locked).toBe(true)
    expect(flip(s, 3)).toBe(s)
  })

  it('ignores an out-of-range index', () => {
    const s = fixed()
    expect(flip(s, 9)).toBe(s)
  })

  it('marks both cards matched on a match and leaves faceUp empty', () => {
    const s = flip(flip(fixed(), 0), 1)
    expect(s.cards[0].matched && s.cards[1].matched).toBe(true)
    expect(s.faceUp).toEqual([])
    expect(s.locked).toBe(false)
    expect(s.moves).toBe(1)
  })

  it('locks on a mismatch, and resolve flips both back and unlocks', () => {
    const s = flip(flip(fixed(), 0), 2)
    expect(s.locked).toBe(true)
    expect(s.faceUp).toEqual([0, 2])
    const r = resolve(s)
    expect(r.locked).toBe(false)
    expect(r.faceUp).toEqual([])
    expect(r.cards.some((c) => c.matched)).toBe(false)
  })

  it('resolve is a no-op when not locked', () => {
    const s = fixed()
    expect(resolve(s)).toBe(s)
  })
})

describe('isWin', () => {
  it('is true only when every card is matched', () => {
    let s = fixed()
    expect(isWin(s)).toBe(false)
    s = flip(flip(s, 0), 1)
    expect(isWin(s)).toBe(false)
    s = flip(flip(s, 2), 3)
    expect(isWin(s)).toBe(true)
  })
})

describe('full game', () => {
  it.each(Object.keys(DIFFICULTY) as Difficulty[])('reaches a win on %s', (d) => {
    let s = initialState(buildDeck(IDS, DIFFICULTY[d].pairs, mulberry32(3)))
    for (let i = 0; i < s.cards.length; i++) {
      if (s.cards[i].matched) continue
      const j = s.cards.findIndex((c, k) => k !== i && !c.matched && c.creatureId === s.cards[i].creatureId)
      s = flip(flip(s, i), j)
    }
    expect(isWin(s)).toBe(true)
  })
})

// Eight cards a a b b c c d d, with the given powers on the listed indices.
function withPowers(powers: Record<number, Power>): GameState {
  return initialState(
    ['a', 'a', 'b', 'b', 'c', 'c', 'd', 'd'].map((creatureId, uid) => ({ uid, creatureId, matched: false, power: powers[uid] })),
  )
}

describe('difficulty', () => {
  it('expert and wild share a bigger board; only wild has powers', () => {
    expect(DIFFICULTY.expert.pairs).toBeGreaterThan(DIFFICULTY.hard.pairs)
    expect(DIFFICULTY.wild.pairs).toBe(DIFFICULTY.expert.pairs)
    expect(DIFFICULTY.wild.cols * DIFFICULTY.wild.rows).toBe(DIFFICULTY.wild.pairs * 2)
    expect(DIFFICULTY.expert.powers).toHaveLength(0)
    expect(DIFFICULTY.wild.powers.length).toBeGreaterThan(0)
  })
})

describe('addPowers', () => {
  it('puts every power on a different creature and keeps the deck otherwise intact', () => {
    const deck = buildDeck(IDS, 10, mulberry32(5))
    const out = addPowers(deck, DIFFICULTY.wild.powers, mulberry32(6))
    const powered = out.filter((c) => c.power)
    expect(powered).toHaveLength(DIFFICULTY.wild.powers.length)
    expect(new Set(powered.map((c) => c.creatureId)).size).toBe(powered.length)
    expect(out.map((c) => c.creatureId)).toEqual(deck.map((c) => c.creatureId))
  })
})

describe('powers', () => {
  it('queue after the pair, spend the power, and block flips until applied', () => {
    const s = flip(flip(withPowers({ 0: 'peek' }), 0), 1)
    expect(s.pending).toEqual(['peek'])
    expect(s.cards[0].spent).toBe(true)
    expect(flip(s, 2)).toBe(s)
  })

  it('does not fire again once spent', () => {
    let s = flip(flip(withPowers({ 0: 'peek' }), 0), 2) // mismatch
    s = applyPower(resolve(s))
    expect(s.pending).toEqual([])
    s = flip(flip(s, 0), 3)
    expect(s.pending).toEqual([])
  })

  it('waits for a mismatch to resolve before applying', () => {
    const s = flip(flip(withPowers({ 0: 'wand' }), 0), 2)
    expect(s.locked).toBe(true)
    expect(applyPower(s)).toBe(s)
  })

  it('shuffle moves hidden cards only, keeping matched cards and every card', () => {
    let s = flip(flip(withPowers({ 2: 'shuffle' }), 2), 3) // match b, shuffle pending
    s = applyPower(s, mulberry32(9))
    expect(s.pending).toEqual([])
    expect(s.cards[2].creatureId).toBe('b')
    expect(s.cards[3].creatureId).toBe('b')
    expect(s.cards.map((c) => c.uid).sort()).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    expect(s.cards.slice(0, 2).map((c) => c.uid)).not.toEqual([0, 1])
  })

  it('shuffle never leaves the order unchanged', () => {
    for (let seed = 0; seed < 30; seed++) {
      let s = flip(flip(withPowers({ 0: 'shuffle' }), 0), 1)
      const before = s.cards.map((c) => c.uid)
      s = applyPower(s, mulberry32(seed))
      expect(s.cards.map((c) => c.uid)).not.toEqual(before)
    }
  })

  it('peek reveals one or two hidden cards, then endPeek hides them', () => {
    const seen = new Set<number>()
    for (let seed = 0; seed < 30; seed++) {
      let s = flip(flip(withPowers({ 0: 'peek' }), 0), 1)
      s = applyPower(s, mulberry32(seed))
      seen.add(s.revealed.length)
      expect(s.revealed.every((i) => !s.cards[i].matched)).toBe(true)
      expect(flip(s, 7)).toBe(s)
      expect(endPeek(s).revealed).toEqual([])
    }
    expect([...seen].sort()).toEqual([1, 2])
  })

  it('wand matches one hidden pair on its own', () => {
    let s = flip(flip(withPowers({ 0: 'wand' }), 0), 1)
    s = applyPower(s, mulberry32(4))
    expect(s.cards.filter((c) => c.matched)).toHaveLength(4)
  })

  it('wand can finish the game', () => {
    let s = withPowers({ 0: 'wand' })
    for (const i of [2, 4]) s = flip(flip(s, i), i + 1)
    s = applyPower(flip(flip(s, 0), 1)) // only d is left hidden
    expect(s.cards.filter((c) => c.matched)).toHaveLength(8)
    expect(isWin(s)).toBe(true)
  })
})
