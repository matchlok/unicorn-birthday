import { describe, expect, it } from 'vitest'
import { GAMES } from '../games/registry'
import {
  BUNTING_POLES,
  CAKE,
  ISLAND_RADIUS,
  PAD_DISTANCE,
  PAD_RADIUS,
  PLAYER_RADIUS,
  PRESENTS,
  WALK_RADIUS,
  activePad,
  boothPosition,
  clampToIsland,
  obstacles,
  padPosition,
  pushOut,
  shortestAngle,
  spawnBesidePad,
  stepPlayer,
  wishToward,
  type PlayerState,
} from './hubLogic'

const still = (x: number, z: number): PlayerState => ({ x, z, vx: 0, vz: 0, heading: 0 })

function run(s: PlayerState, wish: { x: number; z: number }, seconds: number, circles = obstacles(3)) {
  for (let t = 0; t < seconds; t += 1 / 60) s = stepPlayer(s, wish, 1 / 60, circles)
  return s
}

describe('pads', () => {
  it('sit 120 degrees apart at the pad distance', () => {
    const p = [0, 1, 2].map((i) => padPosition(i, 3))
    for (const v of p) expect(Math.hypot(v.x, v.z)).toBeCloseTo(PAD_DISTANCE)
    const dist = (a: (typeof p)[0], b: (typeof p)[0]) => Math.hypot(a.x - b.x, a.z - b.z)
    expect(dist(p[0], p[1])).toBeCloseTo(dist(p[1], p[2]))
    expect(dist(p[1], p[2])).toBeCloseTo(dist(p[0], p[2]))
  })

  it('sit 90 degrees apart with four games', () => {
    const p = [0, 1, 2, 3].map((i) => padPosition(i, 4))
    for (const v of p) expect(Math.hypot(v.x, v.z)).toBeCloseTo(PAD_DISTANCE)
    for (let i = 0; i < 4; i++) {
      const a = p[i]
      const b = p[(i + 1) % 4]
      expect(Math.hypot(a.x - b.x, a.z - b.z)).toBeCloseTo(PAD_DISTANCE * Math.SQRT2)
    }
  })

  it('has the train as a ready 4th game', () => {
    expect(GAMES).toHaveLength(4)
    expect(GAMES[3]).toMatchObject({ id: 'train', padColor: 'var(--sky)', icon: 'train', status: 'ready' })
    expect(GAMES[3].component).toBeDefined()
  })

  it('spawn beside a pad is off the pad and clear of the cake, for 3 and 4 pads', () => {
    for (const count of [3, 4]) {
      for (let i = 0; i < count; i++) {
        const s = spawnBesidePad(i, count)
        const c = padPosition(i, count)
        expect(Math.hypot(s.x - c.x, s.z - c.z)).toBeGreaterThan(PAD_RADIUS + 0.25)
        expect(Math.hypot(s.x, s.z)).toBeGreaterThan(CAKE.r + PLAYER_RADIUS)
        expect(activePad(s, count, null)).toBeNull()
        // beside pad i, not beside any other pad, and not inside anything solid
        for (const o of obstacles(count)) expect(Math.hypot(s.x - o.x, s.z - o.z)).toBeGreaterThan(o.r + PLAYER_RADIUS)
        for (let j = 0; j < count; j++) {
          if (j === i) continue
          const other = padPosition(j, count)
          expect(Math.hypot(s.x - c.x, s.z - c.z)).toBeLessThan(Math.hypot(s.x - other.x, s.z - other.z))
        }
      }
    }
  })

  it('activates on the pad and keeps a little hysteresis on the edge', () => {
    const c = padPosition(1, 3)
    expect(activePad(c, 3, null)).toBe(1)
    const edge = { x: c.x + PAD_RADIUS + 0.1, z: c.z }
    expect(activePad(edge, 3, null)).toBeNull()
    expect(activePad(edge, 3, 1)).toBe(1)
    expect(activePad({ x: c.x + 3, z: c.z }, 3, 1)).toBeNull()
  })
})

describe('collision', () => {
  it('pushes a point out of a circle', () => {
    const p = pushOut({ x: 0.5, z: 0 }, [CAKE], PLAYER_RADIUS)
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(CAKE.r + PLAYER_RADIUS)
  })

  it('handles standing exactly on a circle centre', () => {
    const p = pushOut({ x: 0, z: 0 }, [CAKE], PLAYER_RADIUS)
    expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(CAKE.r + PLAYER_RADIUS - 1e-9)
  })

  it('clamps to the island edge', () => {
    const p = clampToIsland({ x: 30, z: 0 })
    expect(Math.hypot(p.x, p.z)).toBeCloseTo(WALK_RADIUS)
    expect(clampToIsland({ x: 1, z: 1 })).toEqual({ x: 1, z: 1 })
  })
})

describe('walking', () => {
  it('walks away from the camera when pushed to -z', () => {
    const s = run(still(0, 9), { x: 0, z: -1 }, 0.5)
    expect(s.z).toBeLessThan(9)
    expect(Math.abs(s.x)).toBeLessThan(1e-6)
  })

  it('accelerates smoothly instead of jumping to full speed', () => {
    const s = stepPlayer(still(0, 9), { x: 0, z: -1 }, 1 / 60, obstacles(3))
    expect(Math.abs(s.vz)).toBeGreaterThan(0)
    expect(Math.abs(s.vz)).toBeLessThan(1)
  })

  it('never walks through the cake or off the island', () => {
    const s = run(still(0, 6), { x: 0, z: -1 }, 5)
    expect(Math.hypot(s.x, s.z)).toBeGreaterThanOrEqual(CAKE.r + PLAYER_RADIUS - 1e-6)
    const out = run(still(0, 9), { x: 1, z: 1 }, 10)
    expect(Math.hypot(out.x, out.z)).toBeLessThanOrEqual(WALK_RADIUS + 1e-6)
  })

  it('turns to face where she walks, by the short way', () => {
    const s = run(still(0, 9), { x: 1, z: 0 }, 1)
    expect(s.heading).toBeCloseTo(Math.PI / 2, 1)
    expect(shortestAngle(3, -3)).toBeCloseTo(2 * Math.PI - 6)
    expect(shortestAngle(0, Math.PI * 2 + 0.5)).toBeCloseTo(0.5, 5)
  })

  it('walks to a clicked target and stops there', () => {
    const target = padPosition(0, 3)
    let s = still(0, 5.5)
    for (let i = 0; i < 600; i++) {
      const wish = wishToward(s, target)
      if (!wish) break
      s = stepPlayer(s, wish, 1 / 60, obstacles(3))
    }
    expect(Math.hypot(s.x - target.x, s.z - target.z)).toBeLessThan(0.3)
    expect(activePad(s, 3, null)).toBe(0)
  })

  it('leaves a roomy walkway round the cake so pad 3 (behind it) is easy to reach', () => {
    // Pad 3 sits behind the cake from spawn, so she has to walk round it. A present parked
    // next to the cake used to leave a gap narrower than she is.
    const roomy = 2 * PLAYER_RADIUS + 0.6
    for (const o of obstacles(3)) {
      if (o === CAKE) continue
      const gap = Math.hypot(o.x - CAKE.x, o.z - CAKE.z) - CAKE.r - o.r
      expect(gap, `obstacle at (${o.x.toFixed(1)}, ${o.z.toFixed(1)})`).toBeGreaterThanOrEqual(roomy)
    }
  })

  it('keeps presents and bunting clear of every pad and leaves a 1.8-wide walkway, with 3 and 4 pads', () => {
    const walkway = 1.8
    const decor = [
      ...PRESENTS.map((p) => ({ x: p.x, z: p.z, r: p.size * 0.75 })),
      ...BUNTING_POLES,
    ]
    for (const count of [3, 4]) {
      const pads = Array.from({ length: count }, (_, i) => ({ ...padPosition(i, count), r: PAD_RADIUS }))
      const booths = Array.from({ length: count }, (_, i) => ({ ...boothPosition(i, count), r: 1.2 }))
      decor.forEach((d, n) => {
        const name = `decor #${n} at (${d.x}, ${d.z}) with ${count} pads`
        expect(Math.hypot(d.x, d.z) + d.r, name + ' on the island').toBeLessThanOrEqual(ISLAND_RADIUS - 0.5)
        for (const p of pads) expect(Math.hypot(d.x - p.x, d.z - p.z) - p.r - d.r, name + ' vs pad').toBeGreaterThanOrEqual(0.3)
        for (const o of [CAKE, ...booths]) {
          expect(Math.hypot(d.x - o.x, d.z - o.z) - o.r - d.r, name + ' walkway').toBeGreaterThanOrEqual(walkway)
        }
        decor.slice(n + 1).forEach((e) => {
          expect(Math.hypot(d.x - e.x, d.z - e.z) - e.r - d.r, name + ' vs decor').toBeGreaterThanOrEqual(0.8)
        })
      })
    }
  })

  it('wishToward is null on arrival and eases near the target', () => {
    expect(wishToward({ x: 1, z: 1 }, { x: 1.05, z: 1 })).toBeNull()
    const near = wishToward({ x: 0, z: 0 }, { x: 0.5, z: 0 })!
    expect(Math.hypot(near.x, near.z)).toBeCloseTo(0.5)
  })
})
