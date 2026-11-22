// Which rails to draw in each tile. Pure, so it can be tested without a screen.

import { switchById, tileAt, type Dir, type Level, type States } from './logic'
import { exitEntrySide, stubSide } from './route'

export type Side = Dir | 'C' // C = the middle of the tile
export interface RailSpec {
  a: Side
  b: Side
  /** The switch's other way: drawn faint. */
  ghost?: boolean
}

const FIXED: Record<string, [Dir, Dir]> = {
  '-': ['W', 'E'],
  '|': ['N', 'S'],
  F: ['S', 'E'],
  '7': ['S', 'W'],
  L: ['N', 'E'],
  J: ['N', 'W'],
}

/** `states` null means "show both ways of every switch at full strength" (the picker preview). */
export function tileRails(level: Level, row: number, col: number, states: States | null): RailSpec[] {
  const tile = tileAt(level, row, col)
  if (tile in FIXED) return [{ a: FIXED[tile][0], b: FIXED[tile][1] }]
  if (tile === 'S') return [{ a: 'C', b: level.startDir }]
  if (tile === 'E') return [{ a: 'C', b: exitEntrySide(level) }]
  if (tile === 'X') {
    const side = stubSide(level, row, col)
    return side ? [{ a: 'C', b: side }] : []
  }
  if (/[1-6]/.test(tile)) {
    const sw = switchById(level, Number(tile))
    return sw.branches.map((branch, i) => ({
      a: sw.stemDir,
      b: branch,
      ghost: states !== null && states[sw.id] !== i,
    }))
  }
  return []
}
