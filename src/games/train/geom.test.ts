import { describe, expect, it } from 'vitest'
import { bufferCells, railChains, scenery, startCell, stationRC, type V2 } from './geom'
import { ALL_LEVELS } from './levels'
import { solutionStates, tileAt, transpose, type Level } from './logic'

// A one-switch level with a curved wrong branch, kept here so the chain tests don't depend on the level list.
const BASIC: Level = {
  stars: 1,
  grid: ['S-1E', '..X.', '....'],
  startDir: 'E',
  switches: [{ id: 1, cell: [0, 2], stemDir: 'W', branches: ['S', 'E'], solution: 1 }],
}

const key = ([x, y]: V2) => `${x.toFixed(2)},${y.toFixed(2)}`
const both = (l: Level) => [l, transpose(l)]

describe('railChains', () => {
  it('joins level 1-1 into continuous chains that break only at the switch stem', () => {
    const chains = railChains(BASIC, null)
    // start + straight to the stem | stem to the exit | stem round the curve to the buffer stop
    expect(chains).toHaveLength(3)
    const ends = chains.map((c) => [key(c.pts[0]), key(c.pts[c.pts.length - 1])].sort().join(' > ')).sort()
    expect(ends).toEqual(['0.50,0.50 > 2.00,0.50', '2.00,0.50 > 2.50,1.50', '2.00,0.50 > 3.50,0.50'].sort())
  })

  it('ghosts the branch the switch is not set to', () => {
    const level = BASIC
    const chains = railChains(level, solutionStates(level))
    expect(chains.filter((c) => c.ghost)).toHaveLength(1)
    // ghost chains come first so live rails paint over them
    expect(chains[0].ghost).toBe(true)
  })

  it('leaves no seams: chain ends only meet at a switch stem (three or four ends) or are open ends', () => {
    for (const level of ALL_LEVELS.flatMap(both)) {
      const count = new Map<string, number>()
      for (const c of railChains(level, null)) {
        for (const p of [c.pts[0], c.pts[c.pts.length - 1]]) count.set(key(p), (count.get(key(p)) ?? 0) + 1)
      }
      for (const n of count.values()) expect(n === 1 || n === 3 || n === 4).toBe(true)
    }
  })
})

describe('station and scenery', () => {
  it('never put the station on track, in either orientation', () => {
    for (const level of ALL_LEVELS.flatMap(both)) {
      const [r, c] = stationRC(level)
      const [sr, sc] = startCell(level)
      const tile = tileAt(level, r, c)
      expect(tile === '.' || (r === sr && c === sc)).toBe(true)
    }
  })

  it('keep the buffer-stop levels clear', () => {
    for (const level of ALL_LEVELS.flatMap(both)) {
      const [r, c] = stationRC(level)
      expect(tileAt(level, r, c)).not.toBe('X')
    }
  })

  it('only decorate empty cells, never the station cell', () => {
    for (const level of ALL_LEVELS.flatMap(both)) {
      const station = stationRC(level)
      const sc = scenery(level)
      const cells = [...sc.trees.map((t) => t.cell), ...sc.flowers.map((f) => f.cell), ...(sc.pond ? [sc.pond] : [])]
      for (const [r, c] of cells) {
        expect(tileAt(level, r, c)).toBe('.')
        expect(r === station[0] && c === station[1]).toBe(false)
      }
    }
  })

  it('give every buffer stop a side', () => {
    for (const level of ALL_LEVELS) expect(bufferCells(level).length).toBeGreaterThan(0)
  })
})
