// Pure drawing helpers for the train maze art (picture-book 2D). No React, no DOM.
// Ported from the UNI-9 art prototype so nothing in the game imports from src/protos/.

import { DELTA, OPPOSITE, tileAt, type Dir, type Level, type States } from './logic'
import { exitEntrySide, stubSide } from './route'
import { tileRails, type RailSpec, type Side } from './tiles'

export type V2 = [number, number]

export { exitEntrySide }

export const VEC: Record<Dir, V2> = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] }
export const DIRS: Dir[] = ['N', 'E', 'S', 'W']

/** Paper border around the grid, in board units (one cell is 100). */
export const PAPER_PAD = 22

export const gridDims = (level: Level) => ({
  cols: Math.max(...level.grid.map((row) => row.length)),
  rows: level.grid.length,
})

const PT: Record<Side, V2> = { N: [0.5, 0], E: [1, 0.5], S: [0.5, 1], W: [0, 0.5], C: [0.5, 0.5] }

/** One rail piece as a polyline in cell units (0..1 inside its tile). Curves bend through the middle, like route.ts. */
export function railPoints(a: Side, b: Side, n = 14): V2[] {
  const [ax, ay] = PT[a]
  const [bx, by] = PT[b]
  const straight = a === 'C' || b === 'C' || OPPOSITE[a as Dir] === b
  if (straight) return [[ax, ay], [bx, by]]
  const pts: V2[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const u = 1 - t
    pts.push([u * u * ax + 2 * u * t * 0.5 + t * t * bx, u * u * ay + 2 * u * t * 0.5 + t * t * by])
  }
  return pts
}

export interface Piece {
  /** Grid units: x = col + local x, y = row + local y. */
  pts: V2[]
  ghost: boolean
  row: number
  col: number
}

/** Every rail piece on the board (one per RailSpec, including switch branches and stubs). */
export function railPieces(level: Level, states: States | null): Piece[] {
  const out: Piece[] = []
  level.grid.forEach((line, row) =>
    [...line].forEach((_, col) => {
      for (const r of tileRails(level, row, col, states) as RailSpec[]) {
        out.push({
          pts: railPoints(r.a, r.b).map(([x, y]): V2 => [col + x, row + y]),
          ghost: !!r.ghost,
          row,
          col,
        })
      }
    }),
  )
  return out
}

const key = ([x, y]: V2) => `${x.toFixed(2)},${y.toFixed(2)}`

export interface Chain {
  pts: V2[]
  ghost: boolean
}

/** Joins pieces that meet end to end (and have the same ghost state) into continuous paths.
 *  A point where three pieces meet (a switch's stem) ends the chain. */
export function railChains(level: Level, states: States | null): Chain[] {
  const pieces = railPieces(level, states)
  const at = new Map<string, number[]>()
  pieces.forEach((p, i) => {
    for (const end of [p.pts[0], p.pts[p.pts.length - 1]]) {
      const k = key(end)
      at.set(k, [...(at.get(k) ?? []), i])
    }
  })
  const used = new Set<number>()
  const chains: Chain[] = []
  pieces.forEach((p, i) => {
    if (used.has(i)) return
    used.add(i)
    let pts = [...p.pts]
    for (const forward of [true, false]) {
      for (;;) {
        const end = forward ? pts[pts.length - 1] : pts[0]
        const here = at.get(key(end)) ?? []
        if (here.length !== 2) break
        const j = here.find((x) => !used.has(x))
        if (j === undefined || pieces[j].ghost !== p.ghost) break
        used.add(j)
        const q = pieces[j].pts
        const qStartsHere = key(q[0]) === key(end)
        const next = qStartsHere ? q.slice(1) : [...q].reverse().slice(1)
        pts = forward ? [...pts, ...next] : [...next.reverse(), ...pts]
      }
    }
    chains.push({ pts, ghost: p.ghost })
  })
  // Ghost chains first so the live rails paint over them.
  return chains.sort((a, b) => Number(b.ghost) - Number(a.ghost))
}

export function lengthOf(pts: V2[]): number {
  let len = 0
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return len
}

/** Points every `spacing` units of arc length, with the heading there. Used to place sleepers in code. */
export function resample(pts: V2[], spacing: number): { x: number; y: number; angle: number }[] {
  const out: { x: number; y: number; angle: number }[] = []
  const total = lengthOf(pts)
  const count = Math.max(1, Math.round(total / spacing))
  const step = total / count
  let seg = 0
  let segStart = 0
  for (let k = 0; k < count; k++) {
    const target = (k + 0.5) * step
    while (seg < pts.length - 2 && segStart + Math.hypot(pts[seg + 1][0] - pts[seg][0], pts[seg + 1][1] - pts[seg][1]) < target) {
      segStart += Math.hypot(pts[seg + 1][0] - pts[seg][0], pts[seg + 1][1] - pts[seg][1])
      seg++
    }
    const [ax, ay] = pts[seg]
    const [bx, by] = pts[seg + 1]
    const l = Math.hypot(bx - ax, by - ay) || 1
    const t = Math.min(Math.max((target - segStart) / l, 0), 1)
    out.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, angle: Math.atan2(by - ay, bx - ax) })
  }
  return out
}

/** The polyline moved sideways by `d` (positive d is to the right of travel on screen). */
export function offsetPolyline(pts: V2[], d: number): V2[] {
  return pts.map((p, i) => {
    const a = pts[Math.max(i - 1, 0)]
    const b = pts[Math.min(i + 1, pts.length - 1)]
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1
    const nx = -(b[1] - a[1]) / l
    const ny = (b[0] - a[0]) / l
    return [p[0] + nx * d, p[1] + ny * d]
  })
}

export const toPath = (pts: V2[], k = 1): string => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${(x * k).toFixed(2)} ${(y * k).toFixed(2)}`).join('')

export function exitCell(level: Level): [number, number] {
  let at: [number, number] = [0, 0]
  level.grid.forEach((line, r) => {
    const c = line.indexOf('E')
    if (c >= 0) at = [r, c]
  })
  return at
}

export function startCell(level: Level): [number, number] {
  let at: [number, number] = [0, 0]
  level.grid.forEach((line, r) => {
    const c = line.indexOf('S')
    if (c >= 0) at = [r, c]
  })
  return at
}

/** The cell where the little station house stands: an empty neighbour of the start (beside the
 *  track first), never a track tile. Falls back to the start cell itself. */
export function stationRC(level: Level): [number, number] {
  const [r, c] = startCell(level)
  const horizontal = level.startDir === 'E' || level.startDir === 'W'
  const order: [number, number][] = horizontal
    ? [[r + 1, c], [r - 1, c], [r, c + 1], [r, c - 1]]
    : [[r, c + 1], [r, c - 1], [r + 1, c], [r - 1, c]]
  const rows = level.grid.length
  const found = order.find(([rr, cc]) => rr >= 0 && rr < rows && cc >= 0 && cc < level.grid[rr].length && tileAt(level, rr, cc) === '.')
  return found ?? [r, c]
}

export function bufferCells(level: Level): { cell: [number, number]; side: Dir }[] {
  const out: { cell: [number, number]; side: Dir }[] = []
  level.grid.forEach((line, r) =>
    [...line].forEach((ch, c) => {
      if (ch === 'X') out.push({ cell: [r, c], side: stubSide(level, r, c) ?? 'W' })
    }),
  )
  return out
}

/** The one side of a 2-way switch tile that no rail uses: a good spot for its lever. A 3-way switch uses all four sides: null. */
export function freeSide(level: Level, id: number): Dir | null {
  const sw = level.switches.find((s) => s.id === id)!
  return DIRS.find((d) => d !== sw.stemDir && !sw.branches.includes(d)) ?? null
}

const hash = (r: number, c: number, salt = 0) => {
  let h = (Math.imul(r + 1, 73856093) ^ Math.imul(c + 1, 19349663) ^ Math.imul(salt + 1, 83492791)) >>> 0
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995) >>> 0
  return ((h ^ (h >>> 15)) >>> 0) / 4294967296
}
export const rand = hash

export interface Scenery {
  pond: [number, number] | null
  trees: { cell: [number, number]; dx: number; dy: number; s: number }[]
  flowers: { cell: [number, number]; dx: number; dy: number; hue: number }[]
}

/** Decoration for the empty (`.`) cells only, never the station's cell. */
export function scenery(level: Level): Scenery {
  const empty: [number, number][] = []
  const station = stationRC(level)
  const isEmpty = (r: number, c: number) => tileAt(level, r, c) === '.' && !(r === station[0] && c === station[1])
  level.grid.forEach((line, r) => [...line].forEach((_, c) => isEmpty(r, c) && empty.push([r, c])))
  let pond: [number, number] | null = null
  let best = -1
  for (const [r, c] of empty) {
    const n = (Object.values(DELTA) as V2[]).filter(([dr, dc]) => isEmpty(r + dr, c + dc)).length
    const score = n + hash(r, c, 9) * 0.5
    if (score > best) {
      best = score
      pond = [r, c]
    }
  }
  const trees: Scenery['trees'] = []
  const flowers: Scenery['flowers'] = []
  for (const [r, c] of empty) {
    if (pond && r === pond[0] && c === pond[1]) continue
    if (hash(r, c, 1) < 0.5) trees.push({ cell: [r, c], dx: (hash(r, c, 2) - 0.5) * 0.4, dy: (hash(r, c, 3) - 0.5) * 0.4, s: 0.8 + hash(r, c, 4) * 0.5 })
    for (let k = 0; k < 3; k++) flowers.push({ cell: [r, c], dx: (hash(r, c, 10 + k) - 0.5) * 0.8, dy: (hash(r, c, 20 + k) - 0.5) * 0.8, hue: Math.floor(hash(r, c, 30 + k) * 4) })
  }
  return { pond, trees, flowers }
}

export const FLOWER_COLORS = ['#FF7EB9', '#FFE66D', '#FFFFFF', '#C8B6FF']
