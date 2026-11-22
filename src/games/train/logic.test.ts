import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import {
  initialStates,
  lamp,
  solutionStates,
  solve,
  tileAt,
  toggle,
  trace,
  transpose,
  type Level,
  type States,
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

const SIZES: Record<number, [number, number]> = { 1: [4, 3], 2: [5, 4], 3: [6, 4] } // [cols, rows]
const stars = [1, 2, 3] as const
const cases = stars.flatMap((s) => LEVELS[s].map((level, i) => [`${s} star level ${i + 1}`, level] as const))

describe('level set', () => {
  it('has 3 levels per difficulty', () => {
    for (const s of stars) expect(LEVELS[s]).toHaveLength(3)
  })
})

describe.each(cases)('%s', (_name, level: Level) => {
  const n = level.switches.length

  it('has the right size and switch count', () => {
    const [cols, rows] = SIZES[level.stars]
    expect(level.grid).toHaveLength(rows)
    for (const row of level.grid) expect(row).toHaveLength(cols)
    expect(n).toBe(level.stars)
  })

  it('has switch table entries matching the grid', () => {
    for (const sw of level.switches) {
      expect(tileAt(level, sw.cell[0], sw.cell[1])).toBe(String(sw.id))
    }
    const digits = level.grid.join('').match(/[1-6]/g) ?? []
    expect(digits).toHaveLength(n)
  })

  it('has exactly one solution, and it is the one in the table', () => {
    const solutions = solve(level)
    expect(solutions).toHaveLength(1)
    expect(solutions[0]).toEqual(solutionStates(level))
  })

  it('does not start solved, and needs one flip per star', () => {
    const start = initialStates(level)
    expect(trace(level, start).end).not.toBe('exit')
    const sol = solutionStates(level)
    const flips = level.switches.filter((sw) => start[sw.id] !== sol[sw.id]).length
    expect(flips).toBe(level.stars)
  })

  it('mixes both colours in the solution on 2 and 3 stars', () => {
    if (level.stars < 2) return
    const colours = new Set(level.switches.map((sw) => lamp(level, solutionStates(level), sw.id)))
    expect(colours).toEqual(new Set(['green', 'red']))
  })

  it('never loops, whatever the settings', () => {
    const sol = solutionStates(level)
    for (let bits = 0; bits < 1 << n; bits++) {
      const states: States = {}
      level.switches.forEach((sw, i) => (states[sw.id] = ((bits >> i) & 1) as 0 | 1))
      expect(trace(level, states).end).not.toBe('loop')
      expect(trace(level, sol).path.length).toBeGreaterThan(0)
    }
  })

  it('has the train enter every switch from its stem on the solution path', () => {
    const path = trace(level, solutionStates(level)).path
    for (const sw of level.switches) {
      const i = path.findIndex(([r, c]) => r === sw.cell[0] && c === sw.cell[1])
      expect(i).toBeGreaterThan(0)
      const [pr, pc] = path[i - 1]
      const side = pr < sw.cell[0] ? 'N' : pr > sw.cell[0] ? 'S' : pc < sw.cell[1] ? 'W' : 'E'
      expect(side).toBe(sw.stemDir)
    }
  })

  it('keeps switches apart, so each has room for a tap target', () => {
    for (const a of level.switches) {
      for (const b of level.switches) {
        if (a.id === b.id) continue
        const dist = Math.max(Math.abs(a.cell[0] - b.cell[0]), Math.abs(a.cell[1] - b.cell[1]))
        expect(dist).toBeGreaterThanOrEqual(2)
      }
    }
  })

  it('starts top-left', () => {
    expect(level.grid[0][0]).toBe('S')
  })

  it('blames the first wrong switch on a dead end', () => {
    for (let bits = 0; bits < 1 << n; bits++) {
      const states: States = {}
      level.switches.forEach((sw, i) => (states[sw.id] = ((bits >> i) & 1) as 0 | 1))
      const result = trace(level, states)
      if (result.end === 'exit') {
        expect(result.blame).toBeUndefined()
        continue
      }
      expect(result.end).toBe('deadEnd')
      const firstWrong = result.path
        .map(([r, c]) => level.switches.find((s) => s.cell[0] === r && s.cell[1] === c))
        .find((s) => s && states[s.id] !== s.solution)
      expect(result.blame).toBe(firstWrong!.id)
    }
  })

  it('stays solvable, with the same solution, when transposed', () => {
    const t = transpose(level)
    expect(t.grid).toHaveLength(level.grid[0].length)
    expect(t.grid[0][0]).toBe('S')
    expect(solve(t)).toEqual([solutionStates(level)])
    expect(trace(t, solutionStates(t)).path).toEqual(trace(level, solutionStates(level)).path.map(([r, c]) => [c, r]))
    expect(transpose(t)).toEqual(level)
  })

  it('is solved by a scripted player that fixes the blamed switch', () => {
    for (const lv of [level, transpose(level)]) {
      let states = initialStates(lv)
      let taps = 0
      for (let result = trace(lv, states); result.end !== 'exit'; result = trace(lv, states)) {
        expect(result.blame).toBeDefined()
        states = toggle(states, result.blame!, lv)
        expect(++taps).toBeLessThanOrEqual(lv.stars)
      }
      expect(taps).toBe(lv.stars)
    }
  })

  it('is solved by a seeded random tapper', () => {
    const rng = mulberry32(level.stars * 101)
    let states = initialStates(level)
    let taps = 0
    while (trace(level, states).end !== 'exit' && taps < 500) {
      states = toggle(states, level.switches[Math.floor(rng() * n)].id, level)
      taps++
    }
    expect(trace(level, states).end).toBe('exit')
  })
})

describe('toggle and lamp', () => {
  const level = LEVELS[2][0]

  it('flips one switch and leaves the input alone', () => {
    const before = initialStates(level)
    const after = toggle(before, 1, level)
    expect(after[1]).not.toBe(before[1])
    expect(after[2]).toBe(before[2])
    expect(toggle(after, 1, level)).toEqual(before)
  })

  it('flips linked switches together', () => {
    const linked: Level = {
      ...level,
      switches: [{ ...level.switches[0], link: 2 }, level.switches[1]],
    }
    const after = toggle({ 1: 0, 2: 0 }, 2, linked)
    expect(after).toEqual({ 1: 1, 2: 1 })
  })

  it('shows green for setting 0 and red for setting 1, with no hint of the answer', () => {
    expect(lamp(level, { 1: 0, 2: 1 }, 1)).toBe('green')
    expect(lamp(level, { 1: 0, 2: 1 }, 2)).toBe('red')
  })
})

describe('trace', () => {
  it('ends in a dead end when the track runs back into the start tile', () => {
    const circuit: Level = { stars: 0, grid: ['S7', 'LJ'], startDir: 'E', switches: [] }
    // S -> 7 (heads south) -> J (heads west) -> L (heads north) -> S tile
    expect(trace(circuit, {}).end).toBe('deadEnd')
  })

  it('ends in a dead end on empty ground and at the edge of the board', () => {
    expect(trace({ stars: 0, grid: ['S-.'], startDir: 'E', switches: [] }, {}).end).toBe('deadEnd')
    expect(trace({ stars: 0, grid: ['S-'], startDir: 'E', switches: [] }, {}).end).toBe('deadEnd')
  })
})
