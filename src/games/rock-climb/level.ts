// The red rocks course, as data. World units are pixels at a 540-tall view; y grows downward,
// so climbing means smaller y. Built by walking a cursor left to right, one section at a time.

export type Rect = { x: number; y: number; w: number; h: number }
export type Pt = { x: number; y: number }

export type PowerKind = 'heart' | 'speed' | 'jump' | 'magnet'

// rock: solid boulder to jump over (or stand on). Bumping it just stops her.
// cactus, tumbleweed, arch: hazards that bump her back. Duck under an arch.
export type ObstacleKind = 'rock' | 'cactus' | 'tumbleweed' | 'arch'

export type Obstacle = Rect & {
  kind: ObstacleKind
  // tumbleweeds roll back and forth between x0 and x1 (their left edge)
  x0?: number
  x1?: number
}

export type Level = {
  width: number
  start: Pt
  ground: Rect[] // solid red rock, deep enough to never see the bottom
  platforms: Rect[] // floating rocks: land from above, jump up through from below
  coins: Pt[]
  gems: Pt[]
  powers: (Pt & { kind: PowerKind })[]
  obstacles: Obstacle[]
  finishX: number // the cake on the summit
}

export const START_Y = 440
const DEEP = 3000

export const ROCK = { w: 60, h: 50 }
export const CACTUS = { w: 46, h: 34 }
export const TUMBLE = { size: 44, speed: 110 }
export const ARCH = { gap: 42, h: 70 } // underside sits `gap` above the ground: duck height fits, standing doesn't

export function buildLevel(): Level {
  const L: Level = {
    width: 0,
    start: { x: 120, y: START_Y },
    ground: [],
    platforms: [],
    coins: [],
    gems: [],
    powers: [],
    obstacles: [],
    finishX: 0,
  }

  let s = 0 // start x of the current section
  let gy = START_Y // ground top of the current section

  const section = (len: number, rise = 0) => {
    s = L.width
    gy -= rise
    L.ground.push({ x: s, y: gy, w: len, h: DEEP })
    L.width += len
  }
  const coinRow = (dx: number, n: number, up = 40, gap = 48) => {
    for (let i = 0; i < n; i++) L.coins.push({ x: s + dx + i * gap, y: gy - up })
  }
  // A rainbow-shaped arc of coins over something to jump.
  const coinArc = (dx: number, n: number, height = 110, span = 200) => {
    for (let i = 0; i < n; i++) {
      const f = n === 1 ? 0.5 : i / (n - 1)
      L.coins.push({ x: s + dx + f * span, y: gy - 40 - Math.sin(f * Math.PI) * height })
    }
  }
  const rock = (dx: number) => L.obstacles.push({ kind: 'rock', x: s + dx, y: gy - ROCK.h, ...ROCK })
  const cactus = (dx: number) => L.obstacles.push({ kind: 'cactus', x: s + dx, y: gy - CACTUS.h, ...CACTUS })
  const tumble = (dx0: number, dx1: number) =>
    L.obstacles.push({ kind: 'tumbleweed', x: s + dx1, y: gy - TUMBLE.size, w: TUMBLE.size, h: TUMBLE.size, x0: s + dx0, x1: s + dx1 })
  const arch = (dx: number, w: number) => L.obstacles.push({ kind: 'arch', x: s + dx, y: gy - ARCH.gap - ARCH.h, w, h: ARCH.h })
  const platform = (dx: number, up: number, w: number) => {
    L.platforms.push({ x: s + dx, y: gy - up, w, h: 30 })
    return { x: s + dx + w / 2, y: gy - up }
  }
  const power = (kind: PowerKind, x: number, y: number) => L.powers.push({ kind, x, y })
  const gem = (x: number, y: number) => L.gems.push({ x, y })

  // 1. Warm-up meadow: coins, then one small rock with a coin rainbow over it.
  section(950)
  coinRow(260, 5)
  rock(680)
  coinArc(610, 5)

  // 2. First step up, a prickly pear, and a heart to grab.
  section(750, 50)
  coinRow(80, 3)
  cactus(330)
  coinArc(270, 4, 90, 150)
  power('heart', s + 560, gy - 70)

  // 3. Floating rocks: a little stair to a gem. A tumbleweed rolls underneath.
  section(950, 60)
  {
    const a = platform(220, 110, 190)
    const b = platform(470, 220, 170)
    coinRow(a.x - s - 48, 3, 110 + 40)
    gem(b.x, b.y - 50)
    L.coins.push({ x: b.x - 50, y: b.y - 40 }, { x: b.x + 50, y: b.y - 40 })
    tumble(140, 760)
  }

  // 4. Duck under the red rock arch, then hop a rock.
  section(850, 40)
  coinRow(120, 2)
  arch(300, 170)
  coinRow(320, 4, 18, 42) // low coins only a ducking unicorn sweeps up
  rock(650)
  coinArc(590, 4, 100, 170)

  // 5. The big floating stair to SUPER SPEED, with rocks below for those who skip it.
  section(1050, 60)
  {
    platform(180, 110, 170)
    platform(400, 220, 150)
    const top = platform(640, 330, 210)
    power('speed', top.x + 30, top.y - 60)
    gem(top.x - 60, top.y - 50)
    rock(470)
    cactus(860)
    coinRow(260, 3, 40)
  }

  // 6. Speedway: a long run of coins and things to smash (or jump) at super speed.
  section(1350, 30)
  coinRow(60, 12, 40, 60)
  rock(300)
  cactus(560)
  rock(820)
  tumble(900, 1200)
  coinRow(800, 8, 130, 60)

  // 7. Magnet on a floating rock, then a long low arch, with high coins the magnet pulls in.
  section(900, 60)
  {
    const m = platform(120, 120, 170)
    power('magnet', m.x, m.y - 60)
    arch(420, 220)
    coinRow(440, 4, 160, 50)
    coinRow(440, 4, 18, 50)
    L.coins.push({ x: s + 780, y: gy - 40 })
  }

  // 8. Wings for super jumps, gems up high, and a tricky double rock.
  section(1000, 50)
  {
    power('jump', s + 110, gy - 60)
    rock(330)
    rock(480) // 90px between rocks: one big jump, or two little hops
    coinArc(300, 6, 140, 260)
    gem(s + 700, gy - 270) // only reachable with wings
    gem(s + 820, gy - 230)
    const h = platform(640, 120, 160)
    power('heart', h.x, h.y - 60)
  }

  // 9. Steep stairs up the last fins, with a tumbleweed and a cactus guarding them.
  section(500, 60)
  tumble(120, 420)
  coinRow(100, 4, 40, 70)
  section(450, 60)
  cactus(200)
  coinArc(140, 4, 90, 160)
  section(350, 60)
  {
    const p = platform(120, 140, 160)
    gem(p.x, p.y - 50)
  }

  // 10. The summit: a coin fountain and the birthday cake.
  section(1000, 30)
  coinRow(80, 6, 40, 50)
  coinArc(420, 7, 160, 260)
  L.finishX = s + 760

  return L
}

export const LEVEL = buildLevel()

// Top of the ground under x (the highest ground segment that covers it).
export function groundTopAt(level: Level, x: number): number {
  let top = Infinity
  for (const g of level.ground) if (x >= g.x && x < g.x + g.w) top = Math.min(top, g.y)
  return top === Infinity ? START_Y : top
}
