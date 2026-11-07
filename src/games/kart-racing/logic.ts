// Pure kart logic: track geometry, arcade movement, lap progress, balloons.
// World is the XZ plane. Heading 0 faces +Z; forward = (sin h, cos h). Rendering lives in RaceScene.tsx.

export type Vec2 = { x: number; z: number }

export type Track = {
  pts: Vec2[] // closed loop, sampled
  cum: number[] // cum[i] = arc length up to pts[i]; cum[n] = full length
  length: number
  halfWidth: number
}

export type KartState = { x: number; z: number; heading: number; speed: number }
export type DriveInput = { throttle: number; steer: number } // each -1..1; steer +1 = right

export const KART = {
  maxSpeed: 11,
  maxReverse: 4,
  accel: 7,
  brake: 14,
  drag: 4,
  turn: 2.0, // rad/s at full grip
  wallDrag: 3, // speed lost per second while scraping a wall
} as const

export const START_BACK = 5 // the kart starts this far behind the finish arch

// A gentle kidney-shaped backyard loop. Curves are wide so a 4-year-old can steer round them.
export const BACKYARD_CONTROL: Vec2[] = [
  { x: 0, z: -30 },
  { x: 25, z: -28 },
  { x: 42, z: -10 },
  { x: 38, z: 12 },
  { x: 18, z: 24 },
  { x: -4, z: 18 },
  { x: -20, z: 26 },
  { x: -40, z: 14 },
  { x: -42, z: -8 },
  { x: -26, z: -26 },
]

export function buildTrack(control: Vec2[], perSegment = 14, halfWidth = 5): Track {
  const n = control.length
  const pts: Vec2[] = []
  for (let i = 0; i < n; i++) {
    const p0 = control[(i + n - 1) % n]
    const p1 = control[i]
    const p2 = control[(i + 1) % n]
    const p3 = control[(i + 2) % n]
    for (let k = 0; k < perSegment; k++) {
      const t = k / perSegment
      const t2 = t * t
      const t3 = t2 * t
      const c = (a: number, b: number, d: number, e: number) =>
        0.5 * (2 * b + (-a + d) * t + (2 * a - 5 * b + 4 * d - e) * t2 + (-a + 3 * b - 3 * d + e) * t3)
      pts.push({ x: c(p0.x, p1.x, p2.x, p3.x), z: c(p0.z, p1.z, p2.z, p3.z) })
    }
  }
  const cum = [0]
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    cum.push(cum[i] + Math.hypot(b.x - a.x, b.z - a.z))
  }
  return { pts, cum, length: cum[pts.length], halfWidth }
}

export type Nearest = {
  x: number
  z: number // closest point on the centerline
  dist: number
  progress: number // 0..1 around the loop
  tx: number
  tz: number // unit tangent (direction of travel)
}

export function nearestOnTrack(track: Track, x: number, z: number): Nearest {
  const { pts, cum, length } = track
  const n = pts.length
  let best: Nearest | null = null
  let bestD2 = Infinity
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % n]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len2 = dx * dx + dz * dz
    const t = len2 === 0 ? 0 : Math.max(0, Math.min(1, ((x - a.x) * dx + (z - a.z) * dz) / len2))
    const px = a.x + dx * t
    const pz = a.z + dz * t
    const d2 = (x - px) ** 2 + (z - pz) ** 2
    if (d2 < bestD2) {
      bestD2 = d2
      const len = Math.sqrt(len2) || 1
      best = { x: px, z: pz, dist: 0, progress: (cum[i] + t * Math.sqrt(len2)) / length, tx: dx / len, tz: dz / len }
    }
  }
  const found = best as Nearest
  found.dist = Math.sqrt(bestD2)
  return found
}

// Point on the loop at `progress` (any real number, wraps), pushed sideways by `lateral`.
export function pointAt(track: Track, progress: number, lateral = 0): Vec2 & { tx: number; tz: number } {
  const { pts, cum, length } = track
  const s = (((progress % 1) + 1) % 1) * length
  let i = 0
  while (i < pts.length - 1 && cum[i + 1] <= s) i++
  const a = pts[i]
  const b = pts[(i + 1) % pts.length]
  const seg = cum[i + 1] - cum[i] || 1
  const t = (s - cum[i]) / seg
  const tx = (b.x - a.x) / seg
  const tz = (b.z - a.z) / seg
  return { x: a.x + (b.x - a.x) * t + tz * lateral, z: a.z + (b.z - a.z) * t - tx * lateral, tx, tz }
}

// The loop shifted sideways by `offset` (for fences and edge lines).
export function offsetLine(track: Track, offset: number): Vec2[] {
  const { pts } = track
  const n = pts.length
  return pts.map((p, i) => {
    const prev = pts[(i + n - 1) % n]
    const next = pts[(i + 1) % n]
    const dx = next.x - prev.x
    const dz = next.z - prev.z
    const len = Math.hypot(dx, dz) || 1
    return { x: p.x + (dz / len) * offset, z: p.z - (dx / len) * offset }
  })
}

export function headingOf(tx: number, tz: number): number {
  return Math.atan2(tx, tz)
}

export function stepKart(k: KartState, input: DriveInput, dt: number, track: Track): { kart: KartState; bumped: boolean } {
  const { throttle, steer } = input
  let speed = k.speed
  if (throttle > 0) {
    speed = Math.min(KART.maxSpeed, speed + (speed < 0 ? KART.brake : KART.accel) * dt)
  } else if (throttle < 0) {
    speed = Math.max(-KART.maxReverse, speed - (speed > 0 ? KART.brake : KART.accel * 0.6) * dt)
  } else {
    const slow = KART.drag * dt
    speed = Math.abs(speed) <= slow ? 0 : speed - Math.sign(speed) * slow
  }

  // Steering needs some speed (so she can't spin on the spot) and flips when reversing, like a real kart.
  const grip = Math.min(1, Math.abs(speed) / 3)
  const heading = k.heading - steer * KART.turn * grip * Math.sign(speed) * dt

  let x = k.x + Math.sin(heading) * speed * dt
  let z = k.z + Math.cos(heading) * speed * dt

  // Walls only slow the kart down: stay inside the track and bleed off speed.
  let bumped = false
  const near = nearestOnTrack(track, x, z)
  if (near.dist > track.halfWidth) {
    const ux = (x - near.x) / near.dist
    const uz = (z - near.z) / near.dist
    x = near.x + ux * track.halfWidth
    z = near.z + uz * track.halfWidth
    bumped = Math.abs(speed) > 2
    speed *= Math.max(0, 1 - KART.wallDrag * dt)
  }
  return { kart: { x, z, heading, speed }, bumped }
}

// Lap progress: total signed distance travelled round the loop, as a fraction of one lap.
export type Race = { prev: number; traveled: number; goal: number }

export function startRace(track: Track): { kart: KartState; race: Race } {
  const p = pointAt(track, 1 - START_BACK / track.length)
  const kart = { x: p.x, z: p.z, heading: headingOf(p.tx, p.tz), speed: 0 }
  const prev = nearestOnTrack(track, p.x, p.z).progress
  // Drive through the arch once to get going, then once more to finish.
  return { kart, race: { prev, traveled: 0, goal: 1 + START_BACK / track.length } }
}

export function updateRace(race: Race, track: Track, x: number, z: number): { race: Race; done: boolean } {
  const progress = nearestOnTrack(track, x, z).progress
  let delta = progress - race.prev
  if (delta > 0.5) delta -= 1
  else if (delta < -0.5) delta += 1
  const traveled = race.traveled + delta
  return { race: { ...race, prev: progress, traveled }, done: traveled >= race.goal }
}

export type Balloon = { id: number; x: number; z: number; color: string }

const BALLOON_COLORS = ['#FF7EB9', '#FFE66D', '#A0E7FF', '#C8B6FF', '#B8F2E6', '#FFC9A8']

export function makeBalloons(track: Track, count = 8): Balloon[] {
  return Array.from({ length: count }, (_, id) => {
    const progress = 0.08 + (id / (count - 1)) * 0.84
    const lateral = [0, 2.4, -2.4][id % 3]
    const { x, z } = pointAt(track, progress, lateral)
    return { id, x, z, color: BALLOON_COLORS[id % BALLOON_COLORS.length] }
  })
}

export const BALLOON_REACH = 2

// Ids of balloons within reach that aren't collected yet.
export function touchedBalloons(balloons: Balloon[], collected: ReadonlySet<number>, x: number, z: number): number[] {
  return balloons.filter((b) => !collected.has(b.id) && Math.hypot(b.x - x, b.z - z) <= BALLOON_REACH).map((b) => b.id)
}

function mulberry32(seed: number): () => number {
  let a = seed
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Deterministic scenery spots that keep clear of the track, its fences, and any `avoid` circles.
export function scatter(
  track: Track,
  count: number,
  seed: number,
  opts: { half: number; clearance: number; avoid?: (Vec2 & { r: number })[] },
): Vec2[] {
  const rand = mulberry32(seed)
  const out: Vec2[] = []
  for (let tries = 0; out.length < count && tries < count * 40; tries++) {
    const x = (rand() * 2 - 1) * opts.half
    const z = (rand() * 2 - 1) * opts.half
    if (nearestOnTrack(track, x, z).dist < track.halfWidth + opts.clearance) continue
    if (opts.avoid?.some((a) => Math.hypot(a.x - x, a.z - z) < a.r)) continue
    out.push({ x, z })
  }
  return out
}
