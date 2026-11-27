// Where the dino stands and where his arrow goes. Pure: no React, no DOM.
import { freeSide, startCell, stationRC, VEC } from './geom'
import { switchById, tileAt, type Level } from './logic'
import { CELL } from './route'

/** Half the arrow's length, and how far it bounces toward the switch. */
export const ARROW_REACH = 24
export const ARROW_BOUNCE = 8

export interface Spot {
  x: number
  y: number
}

/** The dino's cell: the station's, an empty cell beside the start. When the start has no empty
 *  neighbour (the station sits on the track then), the nearest empty cell instead. */
export function dinoCell(level: Level): [number, number] {
  const [sr, sc] = startCell(level)
  const station = stationRC(level)
  if (station[0] !== sr || station[1] !== sc) return station
  let best: [number, number] = station
  let bestDist = Infinity
  level.grid.forEach((line, r) =>
    [...line].forEach((_, c) => {
      const d = Math.abs(r - sr) + Math.abs(c - sc)
      if (tileAt(level, r, c) === '.' && d < bestDist) {
        best = [r, c]
        bestDist = d
      }
    }),
  )
  return best
}

/** The centre of the dino's cell. */
export function dinoSpot(level: Level): Spot {
  const [r, c] = dinoCell(level)
  return { x: (c + 0.5) * CELL, y: (r + 0.5) * CELL }
}

/** The bouncing arrow for a switch. It sits just outside the switch's cell on the lever side and
 *  points back into it, so it never lies over the tap area. `deg` is the direction it points. */
export function hintArrow(level: Level, id: number): Spot & { deg: number } {
  const sw = switchById(level, id)
  const f = VEC[freeSide(level, id)]
  const d = CELL / 2 + ARROW_REACH + 10 // the tip is ARROW_REACH from the middle, with room to bounce
  return {
    x: (sw.cell[1] + 0.5) * CELL + f[0] * d,
    y: (sw.cell[0] + 0.5) * CELL + f[1] * d,
    deg: (Math.atan2(-f[1], -f[0]) * 180) / Math.PI,
  }
}

/** The angle (degrees, screen coordinates) from one spot to another. */
export const aimDeg = (from: Spot, to: Spot) => (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI
