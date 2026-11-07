import { describe, expect, it } from 'vitest'
import { buildDeck, DIFFICULTY, flip, initialState, isWin, resolve, shuffle, type Difficulty, type GameState } from './logic'

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const IDS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

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
  it.each(['easy', 'medium', 'hard'] as Difficulty[])('reaches a win on %s', (d) => {
    let s = initialState(buildDeck(IDS, DIFFICULTY[d].pairs, mulberry32(3)))
    for (let i = 0; i < s.cards.length; i++) {
      if (s.cards[i].matched) continue
      const j = s.cards.findIndex((c, k) => k !== i && !c.matched && c.creatureId === s.cards[i].creatureId)
      s = flip(flip(s, i), j)
    }
    expect(isWin(s)).toBe(true)
  })
})
