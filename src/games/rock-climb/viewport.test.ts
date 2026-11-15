import { describe, expect, it } from 'vitest'
import { fitView } from './viewport'

describe('fitView', () => {
  it('returns null for a canvas with no size', () => {
    expect(fitView(0, 0)).toBeNull()
    expect(fitView(800, 0)).toBeNull()
    expect(fitView(0, 600)).toBeNull()
    expect(fitView(0.4, 600)).toBeNull()
  })

  it('returns null for non-finite sizes', () => {
    expect(fitView(NaN, 600)).toBeNull()
    expect(fitView(800, Infinity)).toBeNull()
  })

  it('gives a finite positive scale and view for a normal canvas', () => {
    const f = fitView(1366, 768)!
    expect(f.scale).toBeGreaterThan(0)
    expect(Number.isFinite(f.view.w)).toBe(true)
    expect(f.view.h).toBeCloseTo(768 / f.scale)
  })

  it('zooms out on a narrow portrait phone', () => {
    const f = fitView(390, 700)!
    expect(f.view.w).toBeGreaterThanOrEqual(640 - 1e-6)
  })
})
