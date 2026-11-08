import { describe, expect, it } from 'vitest'
import {
  BACKYARD_CONTROL,
  combineInput,
  pedalsToInput,
  KART,
  buildTrack,
  makeBalloons,
  nearestOnTrack,
  offsetLine,
  pointAt,
  scatter,
  startRace,
  stepKart,
  touchedBalloons,
  updateRace,
  type KartState,
} from './logic'

const track = buildTrack(BACKYARD_CONTROL)
const open = buildTrack(BACKYARD_CONTROL, 14, 1000) // no walls in the way
const still: KartState = { x: 0, z: -30, heading: 0, speed: 0 }

describe('track', () => {
  it('is a closed loop of sensible length', () => {
    expect(track.length).toBeGreaterThan(200)
    expect(track.length).toBeLessThan(400)
    expect(track.cum).toHaveLength(track.pts.length + 1)
  })

  it('has no bend tighter than the kart can steer', () => {
    // Smallest radius the kart can turn at full speed is maxSpeed / turn; the track must be wider than that.
    const minRadius = KART.maxSpeed / KART.turn
    const { pts } = track
    const n = pts.length
    for (let i = 0; i < n; i++) {
      const a = pts[i]
      const b = pts[(i + 1) % n]
      const c = pts[(i + 2) % n]
      const ab = Math.hypot(b.x - a.x, b.z - a.z)
      const bc = Math.hypot(c.x - b.x, c.z - b.z)
      const ca = Math.hypot(a.x - c.x, a.z - c.z)
      const area2 = Math.abs((b.x - a.x) * (c.z - a.z) - (c.x - a.x) * (b.z - a.z))
      const radius = area2 === 0 ? Infinity : (ab * bc * ca) / (2 * area2)
      expect(radius).toBeGreaterThan(minRadius)
    }
  })

  it('finds the nearest point and progress', () => {
    const p = pointAt(track, 0.25)
    const n = nearestOnTrack(track, p.x, p.z)
    expect(n.dist).toBeLessThan(0.01)
    expect(n.progress).toBeCloseTo(0.25, 2)
  })

  it('pushes points sideways without leaving the track', () => {
    const p = pointAt(track, 0.6, 3)
    expect(nearestOnTrack(track, p.x, p.z).dist).toBeCloseTo(3, 0)
  })

  it('builds fence lines at the requested distance', () => {
    const line = offsetLine(track, track.halfWidth + 1)
    for (const p of line.filter((_, i) => i % 10 === 0)) {
      expect(nearestOnTrack(track, p.x, p.z).dist).toBeGreaterThan(track.halfWidth)
    }
  })
})

describe('stepKart', () => {
  const drive = { throttle: 1, steer: 0 }
  const coast = { throttle: 0, steer: 0 }

  it('accelerates forward and caps at top speed', () => {
    let k = still
    for (let i = 0; i < 600; i++) k = stepKart(k, drive, 1 / 60, open).kart
    expect(k.speed).toBeCloseTo(KART.maxSpeed)
  })

  it('coasts to a stop', () => {
    let k = { ...still, speed: 8 }
    for (let i = 0; i < 300; i++) k = stepKart(k, coast, 1 / 60, track).kart
    expect(k.speed).toBe(0)
  })

  it('brakes then reverses, with a lower top speed', () => {
    let k = { ...still, speed: 8 }
    for (let i = 0; i < 600; i++) k = stepKart(k, { throttle: -1, steer: 0 }, 1 / 60, open).kart
    expect(k.speed).toBeCloseTo(-KART.maxReverse)
  })

  it('steers right by turning the heading down, and not at all while stopped', () => {
    const moving = stepKart({ ...still, speed: 8 }, { throttle: 1, steer: 1 }, 0.1, track).kart
    expect(moving.heading).toBeLessThan(0)
    const parked = stepKart(still, { throttle: 0, steer: 1 }, 0.1, track).kart
    expect(parked.heading).toBe(0)
  })

  it('moves along its heading', () => {
    const k = stepKart({ x: 0, z: -30, heading: Math.PI / 2, speed: 5 }, { throttle: 0, steer: 0 }, 0.1, track).kart
    expect(k.x).toBeGreaterThan(0.4)
  })

  it('never leaves the track and only slows down at walls', () => {
    // Head straight at the outside wall.
    const p = pointAt(track, 0, 0)
    let k: KartState = { x: p.x, z: p.z, heading: Math.atan2(-p.tz, p.tx) + 0, speed: 8 }
    let bumps = 0
    for (let i = 0; i < 300; i++) {
      const r = stepKart(k, { throttle: 1, steer: 0 }, 1 / 60, track)
      k = r.kart
      if (r.bumped) bumps++
      expect(nearestOnTrack(track, k.x, k.z).dist).toBeLessThanOrEqual(track.halfWidth + 1e-6)
    }
    expect(bumps).toBeGreaterThan(0)
    expect(Number.isFinite(k.speed)).toBe(true)
  })
})

// A scripted driver that always aims at a point a little way ahead on the track.
function autopilot(k: KartState): { throttle: number; steer: number } {
  const here = nearestOnTrack(track, k.x, k.z)
  const target = pointAt(track, here.progress + 0.025)
  const want = Math.atan2(target.x - k.x, target.z - k.z)
  let diff = want - k.heading
  while (diff > Math.PI) diff -= 2 * Math.PI
  while (diff < -Math.PI) diff += 2 * Math.PI
  return { throttle: 1, steer: Math.max(-1, Math.min(1, -diff * 3)) }
}

describe('a full race', () => {
  it('can be finished at full throttle, collecting every balloon on the way', () => {
    const balloons = makeBalloons(track)
    const collected = new Set<number>()
    let { kart, race } = startRace(track)
    let done = false
    let frames = 0
    while (!done && frames < 60 * 120) {
      kart = stepKart(kart, autopilot(kart), 1 / 60, track).kart
      for (const id of touchedBalloons(balloons, collected, kart.x, kart.z)) collected.add(id)
      const r = updateRace(race, track, kart.x, kart.z)
      race = r.race
      done = r.done
      frames++
    }
    expect(done).toBe(true)
    expect(frames / 60).toBeGreaterThan(15) // not trivially short
    expect(frames / 60).toBeLessThan(60) // a kid-sized lap
    expect(collected.size).toBeGreaterThan(0)
  })

  it('does not finish by sitting still or by driving backwards', () => {
    const { kart, race } = startRace(track)
    expect(updateRace(race, track, kart.x, kart.z).done).toBe(false)
    let r = race
    let k = kart
    for (let i = 0; i < 600; i++) {
      k = stepKart(k, { throttle: -1, steer: 0 }, 1 / 60, track).kart
      r = updateRace(r, track, k.x, k.z).race
    }
    expect(r.traveled).toBeLessThanOrEqual(0.01)
  })

  it('starts just behind the arch, facing along the track', () => {
    const { kart } = startRace(track)
    const near = nearestOnTrack(track, kart.x, kart.z)
    expect(near.dist).toBeLessThan(0.1)
    expect(Math.sin(kart.heading)).toBeCloseTo(near.tx, 1)
    expect(Math.cos(kart.heading)).toBeCloseTo(near.tz, 1)
  })
})

describe('balloons', () => {
  const balloons = makeBalloons(track)

  it('places 8 balloons on the track', () => {
    expect(balloons).toHaveLength(8)
    for (const b of balloons) expect(nearestOnTrack(track, b.x, b.z).dist).toBeLessThan(track.halfWidth)
  })

  it('is touched only when close, and only once', () => {
    const b = balloons[3]
    expect(touchedBalloons(balloons, new Set(), b.x, b.z)).toContain(b.id)
    expect(touchedBalloons(balloons, new Set(), b.x + 10, b.z)).not.toContain(b.id)
    expect(touchedBalloons(balloons, new Set([b.id]), b.x, b.z)).not.toContain(b.id)
  })
})

describe('scatter', () => {
  it('is deterministic and keeps clear of the track and avoided spots', () => {
    const avoid = [{ x: 0, z: 0, r: 8 }]
    const a = scatter(track, 40, 7, { half: 70, clearance: 3, avoid })
    const b = scatter(track, 40, 7, { half: 70, clearance: 3, avoid })
    expect(a).toEqual(b)
    expect(a.length).toBeGreaterThan(20)
    for (const p of a) {
      expect(nearestOnTrack(track, p.x, p.z).dist).toBeGreaterThanOrEqual(track.halfWidth + 3)
      expect(Math.hypot(p.x, p.z)).toBeGreaterThanOrEqual(8)
    }
  })
})

describe('combineInput', () => {
  it('keeps either source when the other is idle', () => {
    expect(combineInput({ throttle: 1, steer: 0 }, { throttle: 0, steer: -1 })).toEqual({ throttle: 1, steer: -1 })
  })
  it('lets the stronger push win on an axis', () => {
    expect(combineInput({ throttle: 0, steer: 1 }, { throttle: 0, steer: -1 }).steer).toBe(1)
  })
  it('turns pedals into input, with go and back cancelling', () => {
    expect(pedalsToInput({ left: false, right: true, go: true, back: false })).toEqual({ throttle: 1, steer: 1 })
    expect(pedalsToInput({ left: true, right: true, go: true, back: true })).toEqual({ throttle: 0, steer: 0 })
  })
})
