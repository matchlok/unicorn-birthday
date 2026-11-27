// Train maze rules. Pure: no React, no rendering.
//
// Tiles in a level grid (ASCII):
//   S start (the train leaves it heading `startDir`)   E exit   X buffer stop
//   - horizontal straight   | vertical straight   . empty
//   F curve joining S+E     7 curve joining S+W     L curve joining N+E     J curve joining N+W
//   1..6 a switch (7 is a curve); the digit is its id in the level's switch table

export type Dir = 'N' | 'E' | 'S' | 'W'
export type Setting = 0 | 1
export type States = Record<number, Setting>
export type Lamp = 'green' | 'red'

export interface Switch {
  id: number
  /** [row, col] */
  cell: [number, number]
  /** Side of the switch tile where the stem is. The train must enter from here. */
  stemDir: Dir
  /** Where the train leaves for setting 0 and setting 1. */
  branches: [Dir, Dir]
  /** The setting that lines this switch up with the exit. */
  solution: Setting
  /** Another switch that flips together with this one (not used by the 1 to 3 star levels). */
  link?: number
}

export interface Level {
  stars: number
  grid: string[]
  startDir: Dir
  switches: Switch[]
}

export interface TraceResult {
  /** Cells visited, [row, col], starting with the start cell. */
  path: [number, number][]
  end: 'exit' | 'deadEnd' | 'loop'
  /** First switch on the path that is set wrong. Only set when the end is not 'exit'. */
  blame?: number
}

export const DELTA: Record<Dir, [number, number]> = {
  N: [-1, 0],
  E: [0, 1],
  S: [1, 0],
  W: [0, -1],
}

export const OPPOSITE: Record<Dir, Dir> = { N: 'S', E: 'W', S: 'N', W: 'E' }

const CURVES: Record<string, [Dir, Dir]> = {
  F: ['S', 'E'],
  '7': ['S', 'W'],
  L: ['N', 'E'],
  J: ['N', 'W'],
}

export function tileAt(level: Level, row: number, col: number): string {
  return level.grid[row]?.[col] ?? '.'
}

export function findStart(level: Level): [number, number] {
  for (let r = 0; r < level.grid.length; r++) {
    const c = level.grid[r].indexOf('S')
    if (c >= 0) return [r, c]
  }
  throw new Error('level has no start')
}

export function switchById(level: Level, id: number): Switch {
  const sw = level.switches.find((s) => s.id === id)
  if (!sw) throw new Error(`no switch ${id}`)
  return sw
}

/** Every switch set wrong: she has to flip all of them, one per star. */
export function initialStates(level: Level): States {
  const states: States = {}
  for (const sw of level.switches) states[sw.id] = sw.solution === 0 ? 1 : 0
  return states
}

export function solutionStates(level: Level): States {
  const states: States = {}
  for (const sw of level.switches) states[sw.id] = sw.solution
  return states
}

/** Flip a switch, and any switch linked to it. */
export function toggle(states: States, id: number, level: Level): States {
  const next = { ...states }
  const sw = switchById(level, id)
  const flip = new Set<number>([id])
  if (sw.link !== undefined) flip.add(sw.link)
  for (const other of level.switches) if (other.link === id) flip.add(other.id)
  for (const f of flip) next[f] = next[f] === 0 ? 1 : 0
  return next
}

/** The two switch positions look like a green lamp and a red lamp. It never says which is right. */
export function lamp(_level: Level, states: States, id: number): Lamp {
  return states[id] === 0 ? 'green' : 'red'
}

export function trace(level: Level, states: States): TraceResult {
  const start = findStart(level)
  const path: [number, number][] = [start]
  const seen = new Set<string>()
  let [r, c] = start
  let dir = level.startDir

  const result = (end: TraceResult['end']): TraceResult => {
    if (end === 'exit') return { path, end }
    const wrong = path
      .map(([pr, pc]) => level.switches.find((s) => s.cell[0] === pr && s.cell[1] === pc))
      .find((s) => s && states[s.id] !== s.solution)
    return wrong ? { path, end, blame: wrong.id } : { path, end }
  }

  for (;;) {
    r += DELTA[dir][0]
    c += DELTA[dir][1]
    if (r < 0 || c < 0 || r >= level.grid.length || c >= level.grid[r].length) return result('deadEnd')
    const key = `${r},${c},${dir}`
    if (seen.has(key)) return result('loop')
    seen.add(key)
    path.push([r, c])

    const tile = tileAt(level, r, c)
    const from = OPPOSITE[dir]
    if (tile === 'E') return result('exit')
    if (tile === '-') {
      if (dir !== 'E' && dir !== 'W') return result('deadEnd')
    } else if (tile === '|') {
      if (dir !== 'N' && dir !== 'S') return result('deadEnd')
    } else if (tile in CURVES) {
      const [a, b] = CURVES[tile]
      if (from === a) dir = b
      else if (from === b) dir = a
      else return result('deadEnd')
    } else if (/[1-6]/.test(tile)) {
      const sw = switchById(level, Number(tile))
      if (from !== sw.stemDir) return result('deadEnd')
      dir = sw.branches[states[sw.id] ?? 0]
    } else {
      // X, S (back at the start), or empty ground
      return result('deadEnd')
    }
  }
}

/** The switch the dino points at: the first one on the train's path that is set wrong, or null when
 *  the path already reaches the exit. Same switch the dead end wiggles. */
export function hintSwitch(level: Level, states: States): number | null {
  return trace(level, states).blame ?? null
}

function allSettings(level: Level): States[] {
  const n = level.switches.length
  const out: States[] = []
  for (let bits = 0; bits < 1 << n; bits++) {
    const states: States = {}
    level.switches.forEach((sw, i) => {
      states[sw.id] = ((bits >> i) & 1) as Setting
    })
    out.push(states)
  }
  return out
}

/** Every setting (2^n, n <= 6) that rolls the train out through the exit. */
export function solve(level: Level): States[] {
  return allSettings(level).filter((states) => trace(level, states).end === 'exit')
}

const TRANSPOSE_DIR: Record<Dir, Dir> = { N: 'W', W: 'N', S: 'E', E: 'S' }
const TRANSPOSE_TILE: Record<string, string> = { '-': '|', '|': '-', '7': 'L', L: '7', F: 'F', J: 'J' }

/** Portrait layout: rows become columns. The start stays top-left. */
export function transpose(level: Level): Level {
  const rows = level.grid.length
  const cols = Math.max(...level.grid.map((row) => row.length))
  const grid: string[] = []
  for (let c = 0; c < cols; c++) {
    let line = ''
    for (let r = 0; r < rows; r++) {
      const tile = tileAt(level, r, c)
      line += TRANSPOSE_TILE[tile] ?? tile
    }
    grid.push(line)
  }
  return {
    stars: level.stars,
    grid,
    startDir: TRANSPOSE_DIR[level.startDir],
    switches: level.switches.map((sw) => ({
      ...sw,
      cell: [sw.cell[1], sw.cell[0]],
      stemDir: TRANSPOSE_DIR[sw.stemDir],
      branches: [TRANSPOSE_DIR[sw.branches[0]], TRANSPOSE_DIR[sw.branches[1]]],
    })),
  }
}
