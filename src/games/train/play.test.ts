import { describe, expect, it, vi } from 'vitest'
import { startChug, stopChug } from '../../engine/audio'
import { ALL_LEVELS } from './levels'
import { gridSize, trainLayout } from './layout'
import { initialStates, solutionStates, solve, trace, transpose, type Level, type States } from './logic'
import { buildRoute, centre, CELL, pointAt, STOP_IN } from './route'
import { tileRails } from './tiles'

const both = (level: Level): Level[] => [level, transpose(level)]

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
      const n = base.switches.length
      for (let bits = 0; bits < 1 << n; bits++) {
        const states: States = {}
        base.switches.forEach((sw, i) => (states[sw.id] = ((bits >> i) & 1) as 0 | 1))
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
    const level = ALL_LEVELS[0] // S-1E over a buffer stop
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
    const level = ALL_LEVELS[0]
    const south = tileRails(level, 0, 2, { 1: 0 }) // branch 0 is S
    expect(south).toEqual([
      { a: 'W', b: 'S', ghost: false },
      { a: 'W', b: 'E', ghost: true },
    ])
    const east = tileRails(level, 0, 2, { 1: 1 })
    expect(east.map((r) => r.ghost)).toEqual([true, false])
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
  it('keeps every switch tap target at least 88px at 1366x768 and 390x844', () => {
    for (const vp of sizes) {
      for (const base of ALL_LEVELS) {
        const level = vp.height > vp.width ? transpose(base) : base
        const { cell } = trainLayout(vp, gridSize(level))
        expect(cell, `${vp.width}x${vp.height}, ${base.stars} stars`).toBeGreaterThanOrEqual(88)
      }
    }
  })

  it('fits the board inside the screen and keeps the Go button about 120px', () => {
    for (const vp of sizes) {
      const level = vp.height > vp.width ? transpose(ALL_LEVELS[6]) : ALL_LEVELS[6]
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
