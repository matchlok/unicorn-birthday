import { describe, expect, it, vi } from 'vitest'
import { startChug, stopChug } from '../../engine/audio'
import { ALL_LEVELS, LEVELS } from './levels'
import { gridSize, trainLayout } from './layout'
import { everySetting, initialStates, isThreeWay, solutionStates, solve, trace, transpose, type Level } from './logic'
import { buildRoute, centre, CELL, pointAt, STOP_IN } from './route'
import { tileRails } from './tiles'

const both = (level: Level): Level[] => [level, transpose(level)]

// One switch, the wrong way (setting 0) running south into a buffer stop.
const BASIC: Level = {
  stars: 1,
  grid: ['S-1E', '..X.', '....'],
  startDir: 'E',
  switches: [{ id: 1, cell: [0, 2], stemDir: 'W', branches: ['S', 'E'], solution: 1 }],
}

describe('route', () => {
  it('rolls to the exit for the right switches, on every level, either way up', () => {
    for (const base of ALL_LEVELS) {
      for (const level of both(base)) {
        const route = buildRoute(level, trace(level, solutionStates(level)))
        expect(route.exit).toBe(true)
        expect(route.length).toBeGreaterThan(CELL)
        const start = pointAt(route, 0)
        expect(start.x).toBeCloseTo(centre([0, 0]).x)
        expect(start.y).toBeCloseTo(centre([0, 0]).y)
      }
    }
  })

  it('every wrong setting stops short of the exit at the end of the track', () => {
    for (const base of ALL_LEVELS) {
      const right = solve(base).length
      expect(right).toBeGreaterThan(0)
      for (const states of everySetting(base)) {
        const tr = trace(base, states)
        const route = buildRoute(base, tr)
        expect(route.exit).toBe(tr.end === 'exit')
        if (tr.end !== 'exit') {
          const last = tr.path[tr.path.length - 1]
          const end = pointAt(route, route.length)
          // The engine stops inside the last cell it reached, never beyond it.
          const c = centre(last)
          expect(Math.abs(end.x - c.x)).toBeLessThanOrEqual(CELL / 2)
          expect(Math.abs(end.y - c.y)).toBeLessThanOrEqual(CELL / 2)
          expect(tr.blame).toBeDefined()
        }
      }
    }
  })

  it('the starting settings are all wrong, so the first press never wins', () => {
    for (const level of ALL_LEVELS) expect(trace(level, initialStates(level)).end).not.toBe('exit')
  })

  it('moves smoothly: no jumps along the path, and it turns only at corners', () => {
    for (const base of ALL_LEVELS) {
      for (const level of both(base)) {
        const route = buildRoute(level, trace(level, solutionStates(level)))
        let prev = pointAt(route, 0)
        for (let s = 2; s <= route.length; s += 2) {
          const p = pointAt(route, s)
          expect(Math.hypot(p.x - prev.x, p.y - prev.y)).toBeLessThan(2.5)
          prev = p
        }
      }
    }
  })

  it('records where each switch on the route is reached, in order', () => {
    for (const level of ALL_LEVELS) {
      const route = buildRoute(level, trace(level, solutionStates(level)))
      expect(route.switchStops.length).toBeGreaterThan(0)
      const ss = route.switchStops.map((s) => s.s)
      expect([...ss].sort((a, b) => a - b)).toEqual(ss)
      expect(ss.every((s) => s > 0 && s < route.length)).toBe(true)
    }
  })

  it('a dead end stops STOP_IN into the last cell it entered', () => {
    const level = BASIC // S-1E over a buffer stop
    const tr = trace(level, initialStates(level))
    expect(tr.end).toBe('deadEnd')
    const route = buildRoute(level, tr)
    const end = pointAt(route, route.length)
    const buffer = centre(tr.path[tr.path.length - 1])
    expect(end.x).toBeCloseTo(buffer.x)
    expect(end.y).toBeCloseTo(buffer.y - CELL / 2 + STOP_IN)
  })
})

describe('tile rails', () => {
  it('show the switch bending the way it points, and the other way faint', () => {
    const level = BASIC
    const south = tileRails(level, 0, 2, { 1: 0 }) // branch 0 is S
    expect(south).toEqual([
      { a: 'W', b: 'S', ghost: false },
      { a: 'W', b: 'E', ghost: true },
    ])
    const east = tileRails(level, 0, 2, { 1: 1 })
    expect(east.map((r) => r.ghost)).toEqual([true, false])
  })

  it('shows all three branches of a 3-way switch, the two it is not set to faint', () => {
    const level = LEVELS[4][0]
    const sw = level.switches.find(isThreeWay)!
    for (const setting of [0, 1, 2] as const) {
      const rails = tileRails(level, sw.cell[0], sw.cell[1], { ...solutionStates(level), [sw.id]: setting })
      expect(rails.map((r) => r.b)).toEqual(sw.branches)
      expect(rails.filter((r) => !r.ghost)).toHaveLength(1)
      expect(rails[setting].ghost).toBe(false)
    }
  })

  it('gives every non-empty tile of every level at least one rail', () => {
    for (const level of ALL_LEVELS) {
      level.grid.forEach((row, r) =>
        [...row].forEach((ch, c) => {
          if (ch !== '.') expect(tileRails(level, r, c, initialStates(level)).length, `${ch} at ${r},${c}`).toBeGreaterThan(0)
        }),
      )
    }
  })
})

describe('layout', () => {
  const sizes = [
    { width: 1366, height: 768 },
    { width: 390, height: 844 },
  ]
  const cellFor = (vp: { width: number; height: number }, base: Level) =>
    trainLayout(vp, gridSize(vp.height > vp.width ? transpose(base) : base)).cell

  it('keeps every switch tap target at least 88px on 1 to 3 stars at 1366x768 and 390x844', () => {
    for (const vp of sizes) {
      for (const base of ALL_LEVELS.filter((lv) => lv.stars <= 3)) {
        expect(cellFor(vp, base), `${vp.width}x${vp.height}, ${base.stars} stars`).toBeGreaterThanOrEqual(88)
      }
    }
  })

  it('keeps 4 and 5 star tap targets at least 88px on a laptop, and no smaller than 75 and 63px on a 390x844 phone', () => {
    for (const base of ALL_LEVELS.filter((lv) => lv.stars >= 4)) {
      expect(cellFor(sizes[0], base), `laptop, ${base.stars} stars`).toBeGreaterThanOrEqual(88)
      expect(cellFor(sizes[1], base), `phone, ${base.stars} stars`).toBeGreaterThanOrEqual(base.stars === 4 ? 75 : 63)
    }
  })

  it('grows the board past the phone cap on a big desktop screen', () => {
    const big = { width: 2560, height: 1440 }
    const three = cellFor(big, LEVELS[3][0])
    expect(three).toBeGreaterThan(170)
    expect(cellFor(big, LEVELS[5][0])).toBeGreaterThan(170)
    expect(cellFor(big, LEVELS[5][0])).toBeLessThanOrEqual(three)
    for (const base of ALL_LEVELS) {
      const level = base
      const grid = gridSize(level)
      const l = trainLayout(big, grid)
      expect(l.margin.left + l.margin.right + grid.cols * l.cell).toBeLessThanOrEqual(big.width)
      expect(l.margin.top + l.margin.bottom + l.header + grid.rows * l.cell).toBeLessThanOrEqual(big.height)
    }
  })

  it('fits the board inside the screen and keeps the Go button about 120px', () => {
    for (const vp of sizes) {
      const level = vp.height > vp.width ? transpose(ALL_LEVELS[14]) : ALL_LEVELS[14] // the biggest board
      const grid = gridSize(level)
      const l = trainLayout(vp, grid)
      expect(l.go).toBe(120)
      expect(l.margin.left + l.margin.right + grid.cols * l.cell).toBeLessThanOrEqual(vp.width)
      expect(l.margin.top + l.margin.bottom + l.header + grid.rows * l.cell).toBeLessThanOrEqual(vp.height)
    }
  })

  it('goes portrait only when taller than wide', () => {
    expect(trainLayout(sizes[0], { cols: 6, rows: 4 }).portrait).toBe(false)
    expect(trainLayout(sizes[1], { cols: 4, rows: 6 }).portrait).toBe(true)
  })
})

describe('chug sound', () => {
  it('is a timer that stopChug always clears (no looping buffer to leak)', () => {
    vi.useFakeTimers()
    try {
      expect(vi.getTimerCount()).toBe(0)
      startChug()
      startChug() // twice is still one timer
      expect(vi.getTimerCount()).toBe(1)
      stopChug()
      expect(vi.getTimerCount()).toBe(0)
      stopChug() // harmless when already stopped
    } finally {
      vi.useRealTimers()
    }
  })
})
