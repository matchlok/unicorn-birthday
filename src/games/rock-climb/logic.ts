// Pure game logic for Red Rocks Romp: no React, no canvas. `step` mutates the state in place
// (it runs 60+ times a second) and returns what happened, so the view can play sounds and sparkles.

import { groundTopAt, type Level, type Obstacle, type PowerKind, type Rect } from './level'

export type Input = { left: boolean; right: boolean; jump: boolean; down: boolean }
export const NO_INPUT: Input = { left: false, right: false, jump: false, down: false }

export const PHYS = {
  w: 48, // collision box, a bit narrower than the drawing so near misses count as misses
  h: 60,
  duckH: 34,
  gravity: 2200,
  jumpV: 860, // about 168px high
  superJumpV: 1100, // about 275px with wings
  jumpCutV: 560, // letting go early still clears a rock (about 71px)
  run: 270,
  speedMult: 1.75,
  duckMult: 0.55,
  accel: 2200,
  airAccel: 1500,
  friction: 2600,
  coyote: 0.12, // can still jump this long after running off a ledge
  buffer: 0.15, // a jump pressed just before landing still happens
  stepUp: 14,
  maxFall: 1100,
}

export const POWER_SECONDS: Record<Exclude<PowerKind, 'heart'>, number> = { speed: 6, jump: 10, magnet: 10 }
export const MAX_HEARTS = 3
export const INVULN_SECONDS = 1.5
export const MAGNET_RANGE = 230
export const DROP_LIFE = 5

export const POINTS = { coin: 10, gem: 100, power: 50, smash: 25, finish: 500, heartLeft: 100 }

export type Player = {
  x: number // centre
  y: number // feet
  vx: number
  vy: number
  h: number
  onGround: boolean
  ducking: boolean
  facing: 1 | -1
  coyote: number
  buffer: number
  jumpHeld: boolean
  jumping: boolean // rising from a jump (so letting go can cut it short)
  invuln: number
  runPhase: number
}

export type Dropped = { x: number; y: number; vx: number; vy: number; life: number }

export type GameState = {
  level: Level
  p: Player
  t: number
  score: number
  coins: number
  gemsGot: number
  hearts: number
  bumps: number
  timers: { speed: number; jump: number; magnet: number }
  coinsTaken: boolean[]
  coinPos: { x: number; y: number }[] // coins drift toward her under the magnet
  gemsTaken: boolean[]
  powersTaken: boolean[]
  alive: boolean[] // per obstacle; speed smashes them
  tumble: { x: number; dir: 1 | -1 }[] // per obstacle (only tumbleweeds use it)
  dropped: Dropped[]
  finished: boolean
  finishT: number
}

export type GameEvent =
  | { type: 'coin' | 'gem' | 'smash' | 'bump' | 'heartLost' | 'jump' | 'land' | 'finish'; x: number; y: number; points?: number }
  | { type: 'power'; kind: PowerKind; x: number; y: number; points: number }
  | { type: 'drop'; x: number; y: number; count: number }

export function newGame(level: Level, hearts = 1): GameState {
  return {
    level,
    p: {
      x: level.start.x,
      y: level.start.y,
      vx: 0,
      vy: 0,
      h: PHYS.h,
      onGround: true,
      ducking: false,
      facing: 1,
      coyote: 0,
      buffer: 0,
      jumpHeld: false,
      jumping: false,
      invuln: 0,
      runPhase: 0,
    },
    t: 0,
    score: 0,
    coins: 0,
    gemsGot: 0,
    hearts,
    bumps: 0,
    timers: { speed: 0, jump: 0, magnet: 0 },
    coinsTaken: level.coins.map(() => false),
    coinPos: level.coins.map((c) => ({ ...c })),
    gemsTaken: level.gems.map(() => false),
    powersTaken: level.powers.map(() => false),
    alive: level.obstacles.map(() => true),
    tumble: level.obstacles.map((o) => ({ x: o.x, dir: -1 as const })),
    dropped: [],
    finished: false,
    finishT: 0,
  }
}

export function playerRect(p: Player): Rect {
  return { x: p.x - PHYS.w / 2, y: p.y - p.h, w: PHYS.w, h: p.h }
}

export function overlaps(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
}

function shrink(r: Rect, by: number): Rect {
  return { x: r.x + by, y: r.y + by, w: r.w - by * 2, h: r.h - by * 2 }
}

// Where an obstacle is right now (tumbleweeds move).
export function obstacleRect(s: GameState, i: number): Rect {
  const o = s.level.obstacles[i]
  return o.kind === 'tumbleweed' ? { x: s.tumble[i].x, y: o.y, w: o.w, h: o.h } : o
}

function solids(s: GameState): Rect[] {
  const out: Rect[] = [...s.level.ground]
  s.level.obstacles.forEach((o, i) => {
    // At super speed rocks aren't walls: she smashes through them instead.
    if (o.kind === 'rock' && s.alive[i] && s.timers.speed <= 0) out.push(o)
  })
  return out
}

function hazardIndexes(s: GameState): number[] {
  const out: number[] = []
  s.level.obstacles.forEach((o: Obstacle, i) => {
    // Arches never hurt: she ducks under them on her own (see tick).
    if (o.kind !== 'rock' && o.kind !== 'arch' && s.alive[i]) out.push(i)
  })
  return out
}

// Is a standing unicorn blocked by an arch above her? Then she stays ducked.
function archAbove(s: GameState, p: Player): boolean {
  const standing: Rect = { x: p.x - PHYS.w / 2, y: p.y - PHYS.h, w: PHYS.w, h: PHYS.h - PHYS.duckH }
  return s.level.obstacles.some((o, i) => o.kind === 'arch' && s.alive[i] && overlaps(standing, o))
}

const near = (ax: number, ay: number, bx: number, by: number, r: number) => (ax - bx) ** 2 + (ay - by) ** 2 < r * r

function moveAndCollide(s: GameState, dt: number, events: GameEvent[]): void {
  const p = s.p
  const solid = solids(s)

  // Horizontal
  p.x += p.vx * dt
  for (const r of solid) {
    if (!overlaps(playerRect(p), r)) continue
    // Small lips are walked up instead of blocking.
    if (p.y - r.y <= PHYS.stepUp && p.vy >= 0) {
      p.y = r.y
      continue
    }
    if (p.vx > 0) p.x = r.x - PHYS.w / 2 - 0.01
    else if (p.vx < 0) p.x = r.x + r.w + PHYS.w / 2 + 0.01
    else p.x = p.x < r.x + r.w / 2 ? r.x - PHYS.w / 2 - 0.01 : r.x + r.w + PHYS.w / 2 + 0.01
    p.vx = 0
  }
  p.x = Math.max(PHYS.w / 2, Math.min(s.level.width - PHYS.w / 2, p.x))

  // Vertical
  const wasGround = p.onGround
  const prevFeet = p.y
  p.y += p.vy * dt
  p.onGround = false
  for (const r of solid) {
    if (!overlaps(playerRect(p), r)) continue
    if (p.vy >= 0) {
      p.y = r.y
      p.onGround = true
    } else {
      p.y = r.y + r.h + p.h
    }
    p.vy = 0
  }
  if (p.vy >= 0) {
    for (const r of s.level.platforms) {
      const left = p.x - PHYS.w / 2
      if (left < r.x + r.w && left + PHYS.w > r.x && prevFeet <= r.y + 0.5 && p.y >= r.y) {
        p.y = r.y
        p.vy = 0
        p.onGround = true
      }
    }
  }
  if (p.onGround) p.jumping = false
  if (p.onGround && !wasGround) events.push({ type: 'land', x: p.x, y: p.y })
}

function bump(s: GameState, i: number, events: GameEvent[]): void {
  const p = s.p
  const r = obstacleRect(s, i)
  if (s.timers.speed > 0) {
    // Super speed: rainbow-smash straight through.
    s.alive[i] = false
    s.score += POINTS.smash
    events.push({ type: 'smash', x: r.x + r.w / 2, y: r.y + r.h / 2, points: POINTS.smash })
    return
  }
  if (p.invuln > 0) return
  s.bumps++
  p.invuln = INVULN_SECONDS
  const away = p.x < r.x + r.w / 2 ? -1 : 1
  p.vx = away * 320
  p.vy = -420
  p.onGround = false
  p.jumping = false
  if (s.hearts > 0) {
    // A heart takes the bump: nothing else is lost.
    s.hearts--
    events.push({ type: 'heartLost', x: p.x, y: p.y - p.h })
    return
  }
  events.push({ type: 'bump', x: p.x, y: p.y - p.h / 2 })
  // Up to three coins pop out. She can grab them back for a few seconds.
  const count = Math.min(3, s.coins)
  if (count === 0) return
  s.coins -= count
  s.score = Math.max(0, s.score - count * POINTS.coin)
  for (let k = 0; k < count; k++) {
    s.dropped.push({ x: p.x, y: p.y - 40, vx: (k - (count - 1) / 2) * 220 + away * 60, vy: -520 - k * 40, life: DROP_LIFE })
  }
  events.push({ type: 'drop', x: p.x, y: p.y - 40, count })
}

function collect(s: GameState, dt: number, events: GameEvent[]): void {
  const p = s.p
  const cx = p.x
  const cy = p.y - p.h / 2
  const reach = 40 + p.h / 4 // generous: brushing a coin is enough
  const magnet = s.timers.magnet > 0

  s.coinPos.forEach((c, i) => {
    if (s.coinsTaken[i]) return
    if (magnet && near(c.x, c.y, cx, cy, MAGNET_RANGE)) {
      const d = Math.hypot(cx - c.x, cy - c.y) || 1
      const pull = Math.min(d, 700 * dt)
      c.x += ((cx - c.x) / d) * pull
      c.y += ((cy - c.y) / d) * pull
    }
    if (near(c.x, c.y, cx, cy, reach)) {
      s.coinsTaken[i] = true
      s.coins++
      s.score += POINTS.coin
      events.push({ type: 'coin', x: c.x, y: c.y, points: POINTS.coin })
    }
  })

  s.level.gems.forEach((g, i) => {
    if (s.gemsTaken[i] || !near(g.x, g.y, cx, cy, reach + 6)) return
    s.gemsTaken[i] = true
    s.gemsGot++
    s.score += POINTS.gem
    events.push({ type: 'gem', x: g.x, y: g.y, points: POINTS.gem })
  })

  s.level.powers.forEach((pw, i) => {
    if (s.powersTaken[i] || !near(pw.x, pw.y, cx, cy, reach + 10)) return
    s.powersTaken[i] = true
    s.score += POINTS.power
    if (pw.kind === 'heart') s.hearts = Math.min(MAX_HEARTS, s.hearts + 1)
    else s.timers[pw.kind] = POWER_SECONDS[pw.kind]
    events.push({ type: 'power', kind: pw.kind, x: pw.x, y: pw.y, points: POINTS.power })
  })

  s.dropped = s.dropped.filter((d) => {
    if (d.life < DROP_LIFE - 0.4 && near(d.x, d.y, cx, cy, reach)) {
      s.coins++
      s.score += POINTS.coin
      events.push({ type: 'coin', x: d.x, y: d.y, points: POINTS.coin })
      return false
    }
    return d.life > 0
  })
}

function moveWorld(s: GameState, dt: number): void {
  // Tumbleweeds roll back and forth along their stretch.
  s.level.obstacles.forEach((o, i) => {
    if (o.kind !== 'tumbleweed') return
    const tw = s.tumble[i]
    tw.x += tw.dir * 110 * dt
    if (tw.x <= (o.x0 ?? o.x)) {
      tw.x = o.x0 ?? o.x
      tw.dir = 1
    } else if (tw.x >= (o.x1 ?? o.x)) {
      tw.x = o.x1 ?? o.x
      tw.dir = -1
    }
  })
  // Dropped coins bounce and settle on the ground.
  for (const d of s.dropped) {
    d.life -= dt
    d.vy = Math.min(PHYS.maxFall, d.vy + PHYS.gravity * dt)
    d.x += d.vx * dt
    d.y += d.vy * dt
    const top = groundTopAt(s.level, d.x) - 16
    if (d.y > top) {
      d.y = top
      d.vy = Math.abs(d.vy) > 150 ? -Math.abs(d.vy) * 0.4 : 0
      d.vx *= 0.7
    }
  }
}

// Advance the game by dt seconds. Long frames are split so nothing tunnels through a rock.
export function step(s: GameState, input: Input, dt: number): GameEvent[] {
  const events: GameEvent[] = []
  let left = Math.min(dt, 0.1)
  while (left > 1e-6) {
    const h = Math.min(left, 1 / 120)
    tick(s, s.finished ? { ...NO_INPUT, right: s.finishT < 1.2 } : input, h, events)
    left -= h
  }
  return events
}

function tick(s: GameState, input: Input, dt: number, events: GameEvent[]): void {
  const p = s.p
  s.t += dt
  if (s.finished) s.finishT += dt
  for (const k of ['speed', 'jump', 'magnet'] as const) s.timers[k] = Math.max(0, s.timers[k] - dt)
  p.invuln = Math.max(0, p.invuln - dt)

  // Ducking. An arch overhead ducks her automatically and keeps her ducked until she is out, so a
  // 4-year-old who forgets the down key just slides under it and is never hurt.
  const wantDuck = input.down && p.onGround
  p.ducking = wantDuck || (p.onGround && archAbove(s, p))
  p.h = p.ducking ? PHYS.duckH : PHYS.h

  // Run
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0)
  const top = PHYS.run * (s.timers.speed > 0 ? PHYS.speedMult : 1) * (p.ducking ? PHYS.duckMult : 1)
  if (dir !== 0) {
    p.facing = dir as 1 | -1
    const a = p.onGround ? PHYS.accel : PHYS.airAccel
    p.vx += dir * a * dt
    if (Math.abs(p.vx) > top) p.vx = Math.sign(p.vx) * Math.max(top, Math.abs(p.vx) - PHYS.friction * dt)
  } else if (p.onGround) {
    const f = PHYS.friction * dt
    p.vx = Math.abs(p.vx) <= f ? 0 : p.vx - Math.sign(p.vx) * f
  }
  if (p.onGround && Math.abs(p.vx) > 5) p.runPhase += (Math.abs(p.vx) / 40) * dt * 2

  // Jump: coyote time and a buffered press make it forgiving.
  const pressed = input.jump && !p.jumpHeld
  p.jumpHeld = input.jump
  p.coyote = p.onGround ? PHYS.coyote : Math.max(0, p.coyote - dt)
  p.buffer = pressed ? PHYS.buffer : Math.max(0, p.buffer - dt)
  if (p.buffer > 0 && p.coyote > 0 && !archAbove(s, p)) {
    p.vy = -(s.timers.jump > 0 ? PHYS.superJumpV : PHYS.jumpV)
    p.onGround = false
    p.jumping = true
    p.ducking = false
    p.h = PHYS.h
    p.coyote = 0
    p.buffer = 0
    events.push({ type: 'jump', x: p.x, y: p.y })
  }
  if (p.jumping && !input.jump && p.vy < -PHYS.jumpCutV) p.vy = -PHYS.jumpCutV

  p.vy = Math.min(PHYS.maxFall, p.vy + PHYS.gravity * dt)
  moveAndCollide(s, dt, events)
  moveWorld(s, dt)

  // Hazards: hitboxes shrink a little so only clear hits count.
  const me = shrink(playerRect(p), 4)
  for (const i of hazardIndexes(s)) {
    if (overlaps(me, shrink(obstacleRect(s, i), 5))) bump(s, i, events)
  }
  // Rocks only bump at super speed (otherwise they're walls).
  if (s.timers.speed > 0) {
    s.level.obstacles.forEach((o, i) => {
      if (o.kind === 'rock' && s.alive[i] && overlaps(me, o)) bump(s, i, events)
    })
  }

  collect(s, dt, events)

  if (!s.finished && p.x >= s.level.finishX) {
    s.finished = true
    const bonus = POINTS.finish + s.hearts * POINTS.heartLeft
    s.score += bonus
    events.push({ type: 'finish', x: p.x, y: p.y, points: bonus })
  }
}
