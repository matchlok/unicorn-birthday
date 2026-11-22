// Turns a traced route into a smooth path the train drives along. Pure: no React, no DOM.
// Units: one grid cell is CELL x CELL, row 0 col 0 at the top-left.

import { DELTA, OPPOSITE, solutionStates, tileAt, trace, type Dir, type Level, type TraceResult } from './logic'

export const CELL = 100

/** Kid-test variant (decision 2026-11-22): when true the train pauses before a red switch until
 *  she taps it. Off by default: she sets the switches, then presses Go. */
export const WAIT_AT_RED = false

/** How far the engine's middle stops past the edge of the cell where the track ends. */
export const STOP_IN = 8
/** Gap between a waiting engine's middle and the edge of its switch cell. */
export const WAIT_GAP = 46

export interface Pt {
  x: number
  y: number
}
export type Seg =
  | { kind: 'line'; a: Pt; b: Pt; len: number }
  | { kind: 'quad'; a: Pt; c: Pt; b: Pt; len: number }

export interface Route {
  segs: Seg[]
  length: number
  /** True when the route ends in the exit tunnel. */
  exit: boolean
  /** Distance along the route where the engine reaches the edge of each switch cell on the way. */
  switchStops: { id: number; s: number }[]
}

export const centre = ([r, c]: [number, number]): Pt => ({ x: c * CELL + CELL / 2, y: r * CELL + CELL / 2 })

const along = (p: Pt, dir: Dir, dist: number): Pt => ({ x: p.x + DELTA[dir][1] * dist, y: p.y + DELTA[dir][0] * dist })

export function stepDir(a: [number, number], b: [number, number]): Dir {
  const dr = b[0] - a[0]
  const dc = b[1] - a[1]
  if (dr === -1 && dc === 0) return 'N'
  if (dr === 1 && dc === 0) return 'S'
  if (dr === 0 && dc === 1) return 'E'
  if (dr === 0 && dc === -1) return 'W'
  throw new Error('cells are not neighbours')
}

const dist = (a: Pt, b: Pt) => Math.hypot(b.x - a.x, b.y - a.y)

function quadAt(a: Pt, c: Pt, b: Pt, t: number): Pt {
  const u = 1 - t
  return { x: u * u * a.x + 2 * u * t * c.x + t * t * b.x, y: u * u * a.y + 2 * u * t * c.y + t * t * b.y }
}

function quadLen(a: Pt, c: Pt, b: Pt): number {
  let len = 0
  let prev = a
  for (let i = 1; i <= 16; i++) {
    const p = quadAt(a, c, b, i / 16)
    len += dist(prev, p)
    prev = p
  }
  return len
}

/** Edge midpoints of the cell, going from the previous cell's edge to the next, with curves
 *  bending through the cell's middle. The last cell depends on how the trace ended. */
export function buildRoute(level: Level, tr: TraceResult): Route {
  const { path } = tr
  const segs: Seg[] = []
  const switchStops: Route['switchStops'] = []
  let length = 0
  const addLine = (a: Pt, b: Pt) => {
    const len = dist(a, b)
    segs.push({ kind: 'line', a, b, len })
    length += len
  }
  const addQuad = (a: Pt, c: Pt, b: Pt) => {
    const len = quadLen(a, c, b)
    segs.push({ kind: 'quad', a, c, b, len })
    length += len
  }

  const exit = tr.end === 'exit'
  const n = path.length
  if (n === 1) {
    // Ran straight off the board: stop a little way out of the station.
    const p = centre(path[0])
    addLine(p, along(p, level.startDir, CELL * 0.3))
    return { segs, length, exit: false, switchStops }
  }

  const dirs: Dir[] = []
  for (let i = 0; i < n - 1; i++) dirs.push(stepDir(path[i], path[i + 1]))

  let cur = along(centre(path[0]), dirs[0], 0) // start cell: the station's middle
  const first = along(cur, dirs[0], CELL / 2)
  addLine(cur, first)
  cur = first

  for (let k = 1; k < n; k++) {
    const din = dirs[k - 1]
    const here = centre(path[k])
    const tile = tileAt(level, path[k][0], path[k][1])
    if (/[1-6]/.test(tile)) switchStops.push({ id: Number(tile), s: length })
    if (k === n - 1) {
      if (exit) {
        addLine(cur, here)
        addLine(here, along(here, din, CELL * 0.3)) // on into the tunnel, out of sight
      } else {
        addLine(cur, along(cur, din, STOP_IN))
      }
      break
    }
    const dout = dirs[k]
    const out = along(here, dout, CELL / 2)
    if (din === dout) addLine(cur, out)
    else addQuad(cur, here, out)
    cur = out
  }
  return { segs, length, exit, switchStops }
}

export interface Pose extends Pt {
  /** Radians, 0 = heading right (east), clockwise on screen. */
  angle: number
}

/** Where the engine is, and which way it faces, `s` units along the route. */
export function pointAt(route: Route, s: number): Pose {
  let left = Math.min(Math.max(s, 0), route.length)
  for (const seg of route.segs) {
    if (left <= seg.len || seg === route.segs[route.segs.length - 1]) {
      const t = seg.len > 0 ? Math.min(left / seg.len, 1) : 0
      if (seg.kind === 'line') {
        return {
          x: seg.a.x + (seg.b.x - seg.a.x) * t,
          y: seg.a.y + (seg.b.y - seg.a.y) * t,
          angle: Math.atan2(seg.b.y - seg.a.y, seg.b.x - seg.a.x),
        }
      }
      const p = quadAt(seg.a, seg.c, seg.b, t)
      const dx = 2 * (1 - t) * (seg.c.x - seg.a.x) + 2 * t * (seg.b.x - seg.c.x)
      const dy = 2 * (1 - t) * (seg.c.y - seg.a.y) + 2 * t * (seg.b.y - seg.c.y)
      return { ...p, angle: Math.atan2(dy, dx) }
    }
    left -= seg.len
  }
  return { x: 0, y: 0, angle: 0 }
}

/** Side of the exit tile the track comes in on, from the solved route. */
export function exitEntrySide(level: Level): Dir {
  const { path } = trace(level, solutionStates(level))
  return OPPOSITE[stepDir(path[path.length - 2], path[path.length - 1])]
}

/** Side of a buffer-stop tile that faces the switch feeding it (where its short rail comes from). */
export function stubSide(level: Level, row: number, col: number): Dir | null {
  for (const sw of level.switches) {
    for (const d of sw.branches) {
      // Follow the branch over any straight rail until something else is in the way.
      let r = sw.cell[0] + DELTA[d][0]
      let c = sw.cell[1] + DELTA[d][1]
      while (tileAt(level, r, c) === (d === 'E' || d === 'W' ? '-' : '|')) {
        r += DELTA[d][0]
        c += DELTA[d][1]
      }
      if (r === row && c === col) return OPPOSITE[d]
    }
  }
  return null
}
