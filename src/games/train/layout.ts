// Sizing for the train board. Pure. Same corner-button bands as Memory Match. The Go button and the
// "All aboard!" title form a header row just above the board, at its top left.

import { isCompact } from '../memory-match/layout'
import type { Level } from './logic'

export type Insets = { top: number; right: number; bottom: number; left: number }
export type TrainLayout = {
  portrait: boolean
  cell: number // px per grid cell: also the size of a switch's tap target
  paper: number // px of paper border around the cells (never more than fits on screen)
  go: number // px across the Go button
  header: number // px of height the header row takes above the board (Go button plus gap)
  margin: Insets
}

const ZERO: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
const MIN_CELL = 40
const MAX_CELL = 170 // phones and small screens
const MAX_CELL_DESKTOP = 280 // roomy screens: the board grows to use the spare canvas
const PAPER_CELLS = 0.22 // the paper border around the board, as a fraction of a cell

export const gridSize = (level: Level) => ({
  cols: Math.max(...level.grid.map((row) => row.length)),
  rows: level.grid.length,
})

export function trainLayout(
  viewport: { width: number; height: number },
  grid: { cols: number; rows: number },
  safe: Insets = ZERO,
): TrainLayout {
  const { width, height } = viewport
  const portrait = height > width
  const compact = isCompact(width, height)
  const corner = compact ? 72 : 88
  const edge = compact ? 10 : 16
  const go = height <= 500 ? 96 : 120
  const side = 6 // portrait: the board may run nearly edge to edge so cells stay thumb-sized

  const header = go + edge

  const margin: Insets = portrait
    ? { top: corner + edge * 2 + safe.top, right: side + safe.right, bottom: edge + safe.bottom, left: side + safe.left }
    : { top: edge + safe.top, right: corner + edge * 2 + safe.right, bottom: edge + safe.bottom, left: corner + edge * 2 + safe.left }

  const byWidth = (width - margin.left - margin.right) / grid.cols
  const byHeight = (height - margin.top - margin.bottom - header) / grid.rows
  const cell = Math.floor(Math.min(compact ? MAX_CELL : MAX_CELL_DESKTOP, Math.max(MIN_CELL, Math.min(byWidth, byHeight))))
  // The paper border sticks out into the margins. Cells (tap targets) keep their size; the border
  // gives way instead when the board nearly fills the screen.
  const room = Math.min(width - grid.cols * cell, height - header - grid.rows * cell) / 2
  const paper = Math.max(0, Math.min(PAPER_CELLS * cell, room))
  return { portrait, cell, paper, go, header, margin }
}
