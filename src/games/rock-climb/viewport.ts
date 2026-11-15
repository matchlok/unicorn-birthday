import type { View } from './draw'

export const VIEW_H = 540
export const MIN_VIEW_W = 640 // narrow portrait phones zoom out so she can see what's coming

// Screen pixels per world unit, and the world-unit size of the visible area.
// Returns null when the canvas has no usable size (0 wide or tall while hidden, mid-resize or
// before layout). Without this, scale is 0, the view size becomes Infinity or NaN, and the
// background loops in draw.ts (peaks, fins, trees, strata) would never end while pushing into arrays.
export function fitView(cssW: number, cssH: number): { scale: number; view: View } | null {
  if (!Number.isFinite(cssW) || !Number.isFinite(cssH) || cssW < 1 || cssH < 1) return null
  const scale = Math.min(cssH / VIEW_H, cssW / MIN_VIEW_W)
  const view = { w: cssW / scale, h: cssH / scale }
  if (!(scale > 0) || !Number.isFinite(view.w) || !Number.isFinite(view.h)) return null
  return { scale, view }
}
