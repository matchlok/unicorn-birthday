import { describe, expect, it } from 'vitest'
import { aimDeg, ARROW_BOUNCE, ARROW_REACH, dinoSpot, hintArrow } from './dino'
import { introFrame, introPlan, introTotalMs, zoomBox } from './intro'
import { ALL_LEVELS } from './levels'
import { hintSwitch, initialStates, solutionStates, toggle, trace, transpose, type Level } from './logic'
import { CELL } from './route'

const both = (l: Level): Level[] => [l, transpose(l)]
const cellOf = (p: { x: number; y: number }) => [Math.floor(p.y / CELL), Math.floor(p.x / CELL)]

describe('hintSwitch (the blame switch)', () => {
  it('is null when the settings already reach the exit', () => {
    for (const l of ALL_LEVELS) expect(hintSwitch(l, solutionStates(l))).toBeNull()
  })

  it('a scripted player who flips only what the dino points at finishes every level, either way up', () => {
    for (const base of ALL_LEVELS) {
      for (const level of both(base)) {
        let states = initialStates(level)
        let taps = 0
        for (let id = hintSwitch(level, states); id !== null; id = hintSwitch(level, states)) {
          expect(level.switches.find((s) => s.id === id)!.solution).not.toBe(states[id])
          states = toggle(states, id, level)
          expect(++taps).toBeLessThanOrEqual(level.switches.length)
        }
        expect(trace(level, states).end).toBe('exit')
      }
    }
  })

  it('points at the first wrong switch on the path, not one the train never reaches', () => {
    const level = ALL_LEVELS.find((l) => l.switches.length === 2)!
    const states = { ...solutionStates(level) }
    const last = level.switches[1]
    states[last.id] = last.solution === 0 ? 1 : 0
    expect(hintSwitch(level, states)).toBe(last.id)
  })
})

describe('dino placement', () => {
  it('stands in an empty cell: never on a switch, the track or the start', () => {
    for (const base of ALL_LEVELS) {
      for (const level of both(base)) {
        const [r, c] = cellOf(dinoSpot(level))
        expect(level.grid[r][c], JSON.stringify(level.grid)).toBe('.')
      }
    }
  })

  it('the arrow sits outside the switch cell, so it never lies over the tap area', () => {
    for (const base of ALL_LEVELS) {
      for (const level of both(base)) {
        for (const sw of level.switches) {
          const a = hintArrow(level, sw.id)
          // the tip of the arrow, at the top of its bounce toward the cell
          const rad = (a.deg * Math.PI) / 180
          const reach = ARROW_REACH + ARROW_BOUNCE
          const tip = { x: a.x + Math.cos(rad) * reach, y: a.y + Math.sin(rad) * reach }
          expect(cellOf(a)).not.toEqual(sw.cell)
          expect(cellOf(tip)).not.toEqual(sw.cell)
        }
      }
    }
  })

  it('aims along the line to the target', () => {
    expect(aimDeg({ x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(0)
    expect(aimDeg({ x: 0, y: 0 }, { x: 0, y: 10 })).toBeCloseTo(90)
    expect(Math.abs(aimDeg({ x: 5, y: 5 }, { x: -5, y: 5 }))).toBeGreaterThan(90)
  })
})

describe('intro timing', () => {
  it('first round is about 6s: scene, then toot, then zoom', () => {
    const p = introPlan(false)
    expect(introTotalMs(p)).toBe(6000)
    expect(p.tootMs).not.toBeNull()
    expect(p.tootMs!).toBeLessThan(p.sceneMs)
    expect(introFrame(p, 0).stage).toBe('scene')
    expect(introFrame(p, p.sceneMs + 1).stage).toBe('zoom')
    expect(introFrame(p, 6000).stage).toBe('done')
  })

  it('later rounds are a quick 1s zoom with no close-up', () => {
    const p = introPlan(true)
    expect(introTotalMs(p)).toBe(1000)
    expect(introFrame(p, 0).stage).toBe('zoom')
    expect(introFrame(p, 1000).stage).toBe('done')
  })

  it('the camera starts tight inside the board and ends on the whole board', () => {
    const full = { x: -20, y: -20, w: 500, h: 340 }
    const start = zoomBox(full, { x: 0, y: 0 }, 3, 0)
    expect(start.w).toBeCloseTo(full.w / 3)
    expect(start.x).toBeGreaterThanOrEqual(full.x)
    expect(start.y).toBeGreaterThanOrEqual(full.y)
    const end = zoomBox(full, { x: 250, y: 150 }, 3, 1)
    expect(end.x).toBeCloseTo(full.x)
    expect(end.w).toBeCloseTo(full.w)
    for (let t = 0; t <= 1; t += 0.1) {
      const b = zoomBox(full, { x: 400, y: 300 }, 3, t)
      expect(b.x).toBeGreaterThanOrEqual(full.x - 1e-6)
      expect(b.x + b.w).toBeLessThanOrEqual(full.x + full.w + 1e-6)
      expect(b.y + b.h).toBeLessThanOrEqual(full.y + full.h + 1e-6)
    }
  })
})
