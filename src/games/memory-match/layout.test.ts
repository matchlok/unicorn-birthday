import { describe, expect, it } from 'vitest'
import { boardLayout } from './layout'

const DIFFS = {
  easy: { cols: 3, rows: 2 },
  medium: { cols: 4, rows: 3 },
  hard: { cols: 4, rows: 4 },
  expert: { cols: 5, rows: 4 },
}
const IPHONE_SE = { width: 375, height: 667 }
const IPHONE_15 = { width: 393, height: 852 }
const LAPTOP = { width: 1366, height: 768 }
const IPAD_PORTRAIT = { width: 820, height: 1180 }

// A card must fit on screen: all columns and rows inside the viewport.
function fits(v: { width: number; height: number }, g: ReturnType<typeof boardLayout>) {
  const w = g.cols * g.cardW + (g.cols - 1) * g.gap + g.margin.left + g.margin.right
  const h = g.rows * ((g.cardW * 4) / 3) + (g.rows - 1) * g.gap + g.margin.top + g.margin.bottom
  return w <= v.width && h <= v.height
}

describe('boardLayout', () => {
  it('turns the grid on its side in portrait', () => {
    const g = boardLayout(IPHONE_15, DIFFS.expert)
    expect([g.cols, g.rows]).toEqual([4, 5])
    expect(boardLayout(IPHONE_15, DIFFS.easy)).toMatchObject({ cols: 2, rows: 3 })
  })

  it('keeps the configured shape on a landscape laptop', () => {
    expect(boardLayout(LAPTOP, DIFFS.expert)).toMatchObject({ cols: 5, rows: 4 })
    expect(boardLayout(LAPTOP, DIFFS.easy)).toMatchObject({ cols: 3, rows: 2 })
  })

  it('fits every difficulty on every device', () => {
    for (const v of [IPHONE_SE, IPHONE_15, LAPTOP, IPAD_PORTRAIT, { width: 844, height: 390 }]) {
      for (const d of Object.values(DIFFS)) expect(fits(v, boardLayout(v, d))).toBe(true)
    }
  })

  it('keeps 1 to 3 star cards at 88px or bigger on a phone', () => {
    for (const v of [IPHONE_SE, IPHONE_15]) {
      for (const d of [DIFFS.easy, DIFFS.medium]) expect(boardLayout(v, d).cardW).toBeGreaterThanOrEqual(88)
    }
  })

  it('keeps 4 star cards reasonably big on a phone', () => {
    expect(boardLayout(IPHONE_SE, DIFFS.expert).cardW).toBeGreaterThanOrEqual(75)
  })

  it('leaves room for the notch and home bar', () => {
    const plain = boardLayout(IPHONE_15, DIFFS.hard)
    const safe = boardLayout(IPHONE_15, DIFFS.hard, { top: 59, right: 0, bottom: 34, left: 0 })
    expect(safe.margin.top).toBe(plain.margin.top + 59)
    expect(safe.cardW).toBeLessThanOrEqual(plain.cardW)
  })

  it('uses big cards on iPad and caps them', () => {
    expect(boardLayout(IPAD_PORTRAIT, DIFFS.easy).cardW).toBeGreaterThanOrEqual(200)
    expect(boardLayout({ width: 3000, height: 2000 }, DIFFS.easy).cardW).toBe(300)
  })
})
