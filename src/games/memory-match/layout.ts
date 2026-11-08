// Pure board sizing: how many columns/rows to draw and how wide each card is for a given screen.
// The deck is a flat list, so turning the grid on its side in portrait never touches game logic.

export type Insets = { top: number; right: number; bottom: number; left: number }
export type BoardLayout = {
  cols: number
  rows: number
  cardW: number // px; card height is cardW * 4 / 3
  gap: number
  margin: Insets // space kept clear around the board (corner buttons, notch, home bar)
}

const ZERO: Insets = { top: 0, right: 0, bottom: 0, left: 0 }
const MIN_CARD = 40
const MAX_CARD = 300

// Same breakpoint as --corner / --edge in tokens.css.
export const isCompact = (width: number, height: number) => width <= 600 || height <= 500

export function boardLayout(
  viewport: { width: number; height: number },
  grid: { cols: number; rows: number },
  safe: Insets = ZERO,
): BoardLayout {
  const { width, height } = viewport
  const portrait = height > width
  const compact = isCompact(width, height)
  const corner = compact ? 72 : 88
  const edge = compact ? 10 : 16
  const gap = compact ? 10 : 16

  // Portrait: fewer columns, more rows (5x4 becomes 4x5). Otherwise keep the configured shape.
  const cols = portrait ? Math.min(grid.cols, grid.rows) : Math.max(grid.cols, grid.rows)
  const rows = portrait ? Math.max(grid.cols, grid.rows) : Math.min(grid.cols, grid.rows)

  // Corner buttons sit beside the board on wide screens, above it in portrait.
  const band = corner + edge * 2
  const margin: Insets = portrait
    ? { top: band + safe.top, right: edge + safe.right, bottom: edge + safe.bottom, left: edge + safe.left }
    : { top: edge + safe.top, right: band + safe.right, bottom: edge + safe.bottom, left: band + safe.left }

  const byWidth = (width - margin.left - margin.right - (cols - 1) * gap) / cols
  const byHeight = ((height - margin.top - margin.bottom - (rows - 1) * gap) * 0.75) / rows
  const cardW = Math.floor(Math.min(MAX_CARD, Math.max(MIN_CARD, Math.min(byWidth, byHeight))))
  return { cols, rows, cardW, gap, margin }
}
