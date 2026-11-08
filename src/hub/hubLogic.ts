// Pure hub logic: island geometry, obstacles, walking physics, pad proximity.
// World is the XZ plane. Heading 0 faces +Z (toward the camera); forward = (sin h, cos h).
// The camera never rotates, so up = -Z and right = +X.

export type Vec2 = { x: number; z: number }
export type Circle = Vec2 & { r: number }
export type PlayerState = { x: number; z: number; vx: number; vz: number; heading: number }

export const ISLAND_RADIUS = 12
export const WALK_RADIUS = ISLAND_RADIUS - 1
export const PLAYER_RADIUS = 0.6
export const WALK_SPEED = 4
export const ACCEL = 9 // higher = snappier; the damping keeps it from feeling twitchy
export const TURN = 10
export const ARRIVE = 0.12

export const PAD_RADIUS = 1.6
export const PAD_LEAVE_MARGIN = 0.25 // hysteresis so the prompt doesn't flicker on the pad edge
export const PAD_DISTANCE = 7
export const BOOTH_BEHIND = 2.7 // booths stand this far behind their pad, from the camera's point of view
export const BOOTH_RADIUS = 1.2

export const CAKE: Circle = { x: 0, z: 0, r: 2.2 }

// Presents are decoration and obstacles. `size` is the box edge; the collision circle is a bit larger.
export const PRESENTS = [
  { x: -3.8, z: -1.8, size: 1.2 },
  { x: 4.2, z: -2.0, size: 1.0 },
  { x: -2.6, z: 5.2, size: 1.0 },
  { x: 2.9, z: 5.7, size: 1.3 },
  { x: 8.8, z: -1.0, size: 1.1 },
] as const

export const BUNTING_POLES: Circle[] = [
  { x: -5, z: -4.2, r: 0.3 },
  { x: 5, z: -4.2, r: 0.3 },
]

// Pads sit 120° apart (for three games), starting at 30° so none is dead centre in front of the camera.
export function padAngle(index: number, count: number): number {
  return ((30 + (360 / count) * index) * Math.PI) / 180
}

export function padPosition(index: number, count: number, dist = PAD_DISTANCE): Vec2 {
  const a = padAngle(index, count)
  return { x: Math.cos(a) * dist, z: Math.sin(a) * dist }
}

// Where she stands when she comes back from a game: beside the pad, toward the cake, off the pad itself.
export function spawnBesidePad(index: number, count: number): Vec2 {
  return padPosition(index, count, PAD_DISTANCE - 2.7)
}

export const DEFAULT_SPAWN: Vec2 = { x: 0, z: 5.5 }

// The booth sits straight behind its pad (away from the fixed camera) and faces the camera, so its sign is always readable.
export function boothPosition(index: number, count: number): Vec2 {
  const p = padPosition(index, count)
  return { x: p.x, z: p.z - BOOTH_BEHIND }
}

export function obstacles(padCount: number): Circle[] {
  const booths = Array.from({ length: padCount }, (_, i) => ({ ...boothPosition(i, padCount), r: BOOTH_RADIUS }))
  return [CAKE, ...PRESENTS.map((p) => ({ x: p.x, z: p.z, r: p.size * 0.75 })), ...BUNTING_POLES, ...booths]
}

export function shortestAngle(from: number, to: number): number {
  let d = (to - from) % (Math.PI * 2)
  if (d > Math.PI) d -= Math.PI * 2
  if (d < -Math.PI) d += Math.PI * 2
  return d
}

// Push a point of radius `radius` out of every circle it overlaps.
export function pushOut(p: Vec2, circles: Circle[], radius: number): Vec2 {
  let { x, z } = p
  for (let pass = 0; pass < 2; pass++) {
    for (const c of circles) {
      const dx = x - c.x
      const dz = z - c.z
      const d = Math.hypot(dx, dz)
      const min = c.r + radius
      if (d >= min) continue
      if (d < 1e-6) {
        x = c.x + min
        continue
      }
      x = c.x + (dx / d) * min
      z = c.z + (dz / d) * min
    }
  }
  return { x, z }
}

export function clampToIsland(p: Vec2): Vec2 {
  const d = Math.hypot(p.x, p.z)
  if (d <= WALK_RADIUS) return p
  return { x: (p.x / d) * WALK_RADIUS, z: (p.z / d) * WALK_RADIUS }
}

// One physics step. `wish` is a direction with length 0..1 (longer is scaled down).
export function stepPlayer(s: PlayerState, wish: Vec2, dt: number, circles: Circle[]): PlayerState {
  const len = Math.hypot(wish.x, wish.z)
  const scale = len > 1 ? 1 / len : 1
  const k = 1 - Math.exp(-ACCEL * dt)
  const vx = s.vx + (wish.x * scale * WALK_SPEED - s.vx) * k
  const vz = s.vz + (wish.z * scale * WALK_SPEED - s.vz) * k
  const moved = pushOut({ x: s.x + vx * dt, z: s.z + vz * dt }, circles, PLAYER_RADIUS)
  const { x, z } = clampToIsland(moved)
  let heading = s.heading
  if (Math.hypot(vx, vz) > 0.4) {
    heading += shortestAngle(heading, Math.atan2(vx, vz)) * (1 - Math.exp(-TURN * dt))
  }
  return { x, z, vx, vz, heading }
}

// Walk-to-target wish: full speed far away, easing to a stop. null once she has arrived.
export function wishToward(pos: Vec2, target: Vec2): Vec2 | null {
  const dx = target.x - pos.x
  const dz = target.z - pos.z
  const d = Math.hypot(dx, dz)
  if (d < ARRIVE) return null
  const m = Math.min(1, d)
  return { x: (dx / d) * m, z: (dz / d) * m }
}

// Which pad she is standing on (center inside the pad), with hysteresis for the one she is already on.
export function activePad(p: Vec2, count: number, current: number | null): number | null {
  if (current !== null) {
    const c = padPosition(current, count)
    if (Math.hypot(p.x - c.x, p.z - c.z) <= PAD_RADIUS + PAD_LEAVE_MARGIN) return current
  }
  for (let i = 0; i < count; i++) {
    const c = padPosition(i, count)
    if (Math.hypot(p.x - c.x, p.z - c.z) <= PAD_RADIUS) return i
  }
  return null
}

// Clamp a clicked point to somewhere she can actually stand.
export function clampTarget(p: Vec2): Vec2 {
  return clampToIsland(p)
}
