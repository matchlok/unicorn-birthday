import { describe, expect, it } from 'vitest'
import { LEVELS } from './levels'
import {
  decoyIds,
  everySetting,
  initialStates,
  isThreeWay,
  lamp,
  routeSolutions,
  solutionStates,
  solve,
  tileAt,
  toggle,
  trace,
  transpose,
  type Level,
  type Setting,
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

const SIZES: Record<number, [number, number]> = { 1: [4, 3], 2: [5, 4], 3: [6, 4], 4: [7, 5], 5: [9, 6] } // [cols, rows]
const stars = [1, 2, 3, 4, 5] as const
const ALL = stars.flatMap((s) => LEVELS[s])
const cases = stars.flatMap((s) => LEVELS[s].map((level, i) => [`${s} star level ${i + 1}`, level] as const))
const threeWay = (lv: Level) => lv.switches.filter(isThreeWay).length

describe('level set', () => {
  it('has 3 levels per difficulty', () => {
    for (const s of stars) expect(LEVELS[s]).toHaveLength(3)
  })

  it('grows the board and the switch count with the stars', () => {
    const area = (s: number) => SIZES[s][0] * SIZES[s][1]
    for (const s of [2, 3, 4, 5]) expect(area(s)).toBeGreaterThan(area(s - 1))
    for (const lv of LEVELS[4]) expect(lv.switches.length).toBeGreaterThan(3)
    for (const lv of LEVELS[5]) expect(lv.switches.length).toBeGreaterThan(5)
  })

  it('keeps 3-way switches and decoys out of 1 to 3 stars', () => {
    for (const s of [1, 2, 3] as const) {
      for (const lv of LEVELS[s]) {
        expect(threeWay(lv)).toBe(0)
        expect(decoyIds(lv)).toEqual([])
      }
    }
  })

  it('puts some 3-way switches and a decoy on every 4 star level, and more 3-way ones on 5 stars', () => {
    for (const lv of LEVELS[4]) {
      expect(threeWay(lv)).toBeGreaterThanOrEqual(2)
      expect(decoyIds(lv).length).toBeGreaterThanOrEqual(1)
    }
    for (const lv of LEVELS[5]) {
      expect(decoyIds(lv).length).toBeGreaterThanOrEqual(1)
      for (const four of LEVELS[4]) expect(threeWay(lv)).toBeGreaterThan(threeWay(four))
    }
  })

  it('has a different layout for every level', () => {
    const grids = ALL.map((lv) => lv.grid.join('/'))
    expect(new Set(grids).size).toBe(grids.length)
  })
})

describe.each(cases)('%s', (_name, level: Level) => {
  const decoys = new Set(decoyIds(level))
  const onRoute = level.switches.filter((sw) => !decoys.has(sw.id))

  it('has the right size and switch count', () => {
    const [cols, rows] = SIZES[level.stars]
    expect(level.grid).toHaveLength(rows)
    for (const row of level.grid) expect(row).toHaveLength(cols)
    expect(onRoute).toHaveLength(level.stars) // one switch on the route per star; decoys come on top
  })

  it('has switch table entries matching the grid', () => {
    for (const sw of level.switches) {
      expect(tileAt(level, sw.cell[0], sw.cell[1])).toBe(String(sw.id))
    }
    const digits = level.grid.join('').match(/[1-6]/g) ?? []
    expect(digits).toHaveLength(level.switches.length)
  })

  it('has switches with 2 or 3 different branches, none on the stem side', () => {
    for (const sw of level.switches) {
      expect([2, 3]).toContain(sw.branches.length)
      expect(sw.branches).not.toContain(sw.stemDir)
      expect(new Set(sw.branches).size).toBe(sw.branches.length)
      expect(sw.solution).toBeLessThan(sw.branches.length)
    }
  })

  it('has exactly one solution for the switches on the route, and it is the one in the table', () => {
    const table = Object.fromEntries(onRoute.map((sw) => [sw.id, sw.solution]))
    expect(routeSolutions(level)).toEqual([table])
    // a decoy can point any way, so the full list is that one solution times every decoy setting
    const decoyWays = level.switches.filter((s) => decoys.has(s.id)).reduce((t, s) => t * s.branches.length, 1)
    expect(solve(level)).toHaveLength(decoyWays)
  })

  it('does not start solved, and every switch on the route needs a tap', () => {
    const start = initialStates(level)
    expect(trace(level, start).end).not.toBe('exit')
    const sol = solutionStates(level)
    expect(onRoute.filter((sw) => start[sw.id] !== sol[sw.id])).toHaveLength(level.stars)
  })

  it('mixes the lamp colours in the solution: green and red on 2 and 3 stars, all three on 4 and 5', () => {
    if (level.stars < 2) return
    const colours = new Set(onRoute.map((sw) => lamp(level, solutionStates(level), sw.id)))
    expect(colours).toEqual(new Set(level.stars >= 4 ? ['green', 'red', 'yellow'] : ['green', 'red']))
  })

  it('never loops, whatever the settings', () => {
    for (const states of everySetting(level)) expect(trace(level, states).end).not.toBe('loop')
  })

  it('has the train enter every switch on the route from its stem', () => {
    const path = trace(level, solutionStates(level)).path
    for (const sw of onRoute) {
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
    for (const states of everySetting(level)) {
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
    expect(routeSolutions(t)).toEqual(routeSolutions(level))
    expect(trace(t, solutionStates(t)).path).toEqual(trace(level, solutionStates(level)).path.map(([r, c]) => [c, r]))
    expect(transpose(t)).toEqual(level)
  })

  it('is solved by a scripted player that taps the blamed switch until it is right', () => {
    for (const lv of [level, transpose(level)]) {
      let states = initialStates(lv)
      let taps = 0
      for (let result = trace(lv, states); result.end !== 'exit'; result = trace(lv, states)) {
        expect(result.blame).toBeDefined()
        states = toggle(states, result.blame!, lv)
        // a 3-way switch can need two taps, so never more than two per star
        expect(++taps).toBeLessThanOrEqual(lv.stars * 2)
      }
      expect(taps).toBeGreaterThanOrEqual(lv.stars)
    }
  })

  it('is solved by solve(): every setting it returns rolls to the exit, either way up', () => {
    for (const lv of [level, transpose(level)]) {
      const solutions = solve(lv)
      expect(solutions.length).toBeGreaterThan(0)
      for (const states of solutions) expect(trace(lv, states).end).toBe('exit')
    }
  })

  it('is solved by a seeded random tapper', () => {
    const rng = mulberry32(level.stars * 101)
    let states = initialStates(level)
    let taps = 0
    while (trace(level, states).end !== 'exit' && taps < 20000) {
      states = toggle(states, level.switches[Math.floor(rng() * level.switches.length)].id, level)
      taps++
    }
    expect(trace(level, states).end).toBe('exit')
  })
})

describe('toggle and lamp', () => {
  const level = LEVELS[2][0]
  const three = LEVELS[4][0]
  const sw3 = three.switches.find(isThreeWay)!

  it('flips one switch and leaves the input alone', () => {
    const before = initialStates(level)
    const after = toggle(before, 1, level)
    expect(after[1]).not.toBe(before[1])
    expect(after[2]).toBe(before[2])
    expect(toggle(after, 1, level)).toEqual(before)
  })

  it('cycles a 3-way switch through green, red and yellow and back, each setting a different branch', () => {
    const seen: Setting[] = []
    const lamps: string[] = []
    const branches = new Set<string>()
    let states: States = { ...initialStates(three), [sw3.id]: 0 }
    for (let i = 0; i < 3; i++) {
      seen.push(states[sw3.id])
      lamps.push(lamp(three, states, sw3.id))
      branches.add(sw3.branches[states[sw3.id]])
      states = toggle(states, sw3.id, three)
    }
    expect(seen).toEqual([0, 1, 2])
    expect(lamps).toEqual(['green', 'red', 'yellow'])
    expect(branches.size).toBe(3)
    expect(states[sw3.id]).toBe(0) // round again to where it began
  })

  it('sends the train down each of the three branches of a 3-way switch', () => {
    const sol = solutionStates(three)
    const leaves = new Set<string>()
    for (const setting of [0, 1, 2] as Setting[]) {
      const { path } = trace(three, { ...sol, [sw3.id]: setting })
      const i = path.findIndex(([r, c]) => r === sw3.cell[0] && c === sw3.cell[1])
      leaves.add(`${path[i + 1][0] - sw3.cell[0]},${path[i + 1][1] - sw3.cell[1]}`)
    }
    expect(leaves.size).toBe(3)
  })

  it('shows green for setting 0, red for 1 and yellow for 2, with no hint of the answer', () => {
    expect(lamp(level, { 1: 0, 2: 1 }, 1)).toBe('green')
    expect(lamp(level, { 1: 0, 2: 1 }, 2)).toBe('red')
    expect(lamp(level, { 1: 2, 2: 1 }, 1)).toBe('yellow')
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
