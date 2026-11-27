// Train maze rules. Pure: no React, no rendering.
//
// Tiles in a level grid (ASCII):
//   S start (the train leaves it heading `startDir`)   E exit   X buffer stop
//   - horizontal straight   | vertical straight   . empty
//   F curve joining S+E     7 curve joining S+W     L curve joining N+E     J curve joining N+W
//   1..6 a switch (7 is a curve); the digit is its id in the level's switch table

export type Dir = 'N' | 'E' | 'S' | 'W'
export type Setting = 0 | 1 | 2
export type States = Record<number, Setting>
export type Lamp = 'green' | 'red' | 'yellow'

/** Setting 0, 1, 2 show as these lamps: round green, square red, triangle yellow. */
export const LAMPS: Lamp[] = ['green', 'red', 'yellow']

export interface Switch {
  id: number
  /** [row, col] */
  cell: [number, number]
  /** Side of the switch tile where the stem is. The train must enter from here. */
  stemDir: Dir
  /** Where the train leaves for setting 0, 1 and (on a 3-way switch) 2: two or three of the sides that are not the stem. */
  branches: Dir[]
  /** The setting that lines this switch up with the exit. A decoy (off the route) never matters. */
  solution: Setting
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

export const isThreeWay = (sw: Switch) => sw.branches.length === 3

/** Every switch on the route set wrong, so each needs at least one tap. A 3-way switch starts one
 *  step before or one step after the right setting (by id), so some need one tap and some two. */
export function initialStates(level: Level): States {
  const states: States = {}
  for (const sw of level.switches) {
    const n = sw.branches.length
    const behind = n === 2 || sw.id % 2 === 0 ? n - 1 : 1 // n - 1 steps on is one step back
    states[sw.id] = ((sw.solution + behind) % n) as Setting
  }
  return states
}

export function solutionStates(level: Level): States {
  const states: States = {}
  for (const sw of level.switches) states[sw.id] = sw.solution
  return states
}

/** Tap a switch: it moves on to its next setting, and after the last it comes round to the first. */
export function toggle(states: States, id: number, level: Level): States {
  const sw = switchById(level, id)
  return { ...states, [id]: (((states[id] ?? 0) + 1) % sw.branches.length) as Setting }
}

/** Setting 0, 1, 2 look like a green, red, yellow lamp. It never says which is right. */
export function lamp(_level: Level, states: States, id: number): Lamp {
  return LAMPS[states[id] ?? 0]
}

/** Switches the solved route never reaches: they send the train to a buffer whichever way they point. */
export function decoyIds(level: Level): number[] {
  const { path } = trace(level, solutionStates(level))
  return level.switches
    .filter((sw) => !path.some(([r, c]) => r === sw.cell[0] && c === sw.cell[1]))
    .map((sw) => sw.id)
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

/** Every combination of settings: 2 or 3 per switch, so 2^a * 3^b (at most a few hundred to a few thousand here). */
function allSettings(level: Level): States[] {
  let out: States[] = [{}]
  for (const sw of level.switches) {
    out = out.flatMap((states) => sw.branches.map((_, i) => ({ ...states, [sw.id]: i as Setting })))
  }
  return out
}

/** Every setting that rolls the train out through the exit. A decoy can point any way, so a level
 *  with decoys has several of these that differ only in the decoys. */
export function solve(level: Level): States[] {
  return allSettings(level).filter((states) => trace(level, states).end === 'exit')
}

/** The solutions told apart by the switches on the route only: one for a well-made level. */
export function routeSolutions(level: Level): States[] {
  const decoys = new Set(decoyIds(level))
  const seen = new Map<string, States>()
  for (const states of solve(level)) {
    const onRoute = level.switches.filter((sw) => !decoys.has(sw.id))
    seen.set(onRoute.map((sw) => states[sw.id]).join(), Object.fromEntries(onRoute.map((sw) => [sw.id, states[sw.id]])))
  }
  return [...seen.values()]
}

/** Every combination of settings, for tests. */
export const everySetting = allSettings

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
      branches: sw.branches.map((d) => TRANSPOSE_DIR[d]),
    })),
  }
}
