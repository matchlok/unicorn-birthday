import { describe, expect, it } from 'vitest'
import { ARCH, CACTUS, LEVEL, ROCK, START_Y, groundTopAt, type Level, type Obstacle } from './level'
import { NO_INPUT, PHYS, POINTS, newGame, obstacleRect, step, type GameState, type Input } from './logic'
import { MAX_SCORES, addScore, cleanTable } from './scores'

const DT = 1 / 60
const R: Input = { ...NO_INPUT, right: true }

// A flat test field with whatever we put on it.
function field(extra: Partial<Level> = {}): Level {
  return {
    width: 3000,
    start: { x: 100, y: 400 },
    ground: [{ x: 0, y: 400, w: 3000, h: 3000 }],
    platforms: [],
    coins: [],
    gems: [],
    powers: [],
    obstacles: [],
    finishX: 99999,
    ...extra,
  }
}

function run(s: GameState, input: Input | ((s: GameState) => Input), seconds: number) {
  const events = []
  for (let t = 0; t < seconds; t += DT) events.push(...step(s, typeof input === 'function' ? input(s) : input, DT))
  return events
}

function peakOfJump(s: GameState, hold: boolean): number {
  const startY = s.p.y
  let peak = startY
  step(s, { ...NO_INPUT, jump: true }, DT)
  for (let i = 0; i < 120; i++) {
    step(s, { ...NO_INPUT, jump: hold }, DT)
    peak = Math.min(peak, s.p.y)
  }
  return startY - peak
}

const rockAt = (x: number, gy = 400): Obstacle => ({ kind: 'rock', x, y: gy - ROCK.h, ...ROCK })

describe('movement', () => {
  it('stands on the ground', () => {
    const s = newGame(field())
    run(s, NO_INPUT, 1)
    expect(s.p.onGround).toBe(true)
    expect(s.p.y).toBe(400)
  })

  it('a held jump goes about 168px, a tap still clears a rock', () => {
    const full = peakOfJump(newGame(field()), true)
    expect(full).toBeGreaterThan(155)
    expect(full).toBeLessThan(180)
    const tap = peakOfJump(newGame(field()), false)
    expect(tap).toBeGreaterThan(ROCK.h + 10)
    expect(tap).toBeLessThan(full)
  })

  it('wings make a much bigger jump', () => {
    const s = newGame(field())
    s.timers.jump = 5
    expect(peakOfJump(s, true)).toBeGreaterThan(250)
  })

  it('a rock is a wall until she jumps over it', () => {
    const s = newGame(field({ obstacles: [rockAt(300)] }))
    run(s, R, 2)
    expect(s.p.x).toBeLessThan(300)
    expect(s.bumps).toBe(0) // walls never bump
    run(s, { ...R, jump: true }, 1.2)
    expect(s.p.x).toBeGreaterThan(360)
  })

  it('walks up small lips but not a real step', () => {
    const lip = newGame(field({ ground: [{ x: 0, y: 400, w: 300, h: 3000 }, { x: 300, y: 390, w: 2700, h: 3000 }] }))
    run(lip, R, 1.5)
    expect(lip.p.x).toBeGreaterThan(320)
    const stepUp = newGame(field({ ground: [{ x: 0, y: 400, w: 300, h: 3000 }, { x: 300, y: 340, w: 2700, h: 3000 }] }))
    run(stepUp, R, 1.5)
    expect(stepUp.p.x).toBeLessThan(300)
  })

  it('jumps up through a floating rock and lands on top of it', () => {
    const s = newGame(field({ platforms: [{ x: 60, y: 290, w: 120, h: 30 }] }))
    step(s, { ...NO_INPUT, jump: true }, DT)
    run(s, { ...NO_INPUT, jump: true }, 1.5)
    expect(s.p.onGround).toBe(true)
    expect(s.p.y).toBe(290)
  })

  it('coyote time: a jump just after running off a ledge still works', () => {
    const s = newGame(field({ ground: [{ x: 0, y: 400, w: 200, h: 3000 }, { x: 200, y: 600, w: 2800, h: 3000 }] }))
    while (s.p.onGround) step(s, R, DT)
    step(s, R, DT) // a few ms late
    const ev = step(s, { ...R, jump: true }, DT)
    expect(ev.some((e) => e.type === 'jump')).toBe(true)
  })

  it('a jump pressed just before landing still happens', () => {
    const s = newGame(field())
    s.p.y = 380
    s.p.onGround = false
    const events = run(s, { ...NO_INPUT, jump: true }, 0.25)
    expect(events.some((e) => e.type === 'jump')).toBe(true)
  })
})

describe('arches and ducking', () => {
  const arch: Obstacle = { kind: 'arch', x: 300, y: 400 - ARCH.gap - ARCH.h, w: 200, h: ARCH.h }

  it('standing tall into an arch bumps her', () => {
    const s = newGame(field({ obstacles: [arch] }))
    run(s, R, 2)
    expect(s.bumps).toBeGreaterThan(0)
  })

  it('ducking slides under, and she stays ducked until she is out', () => {
    const s = newGame(field({ obstacles: [arch] }))
    run(s, { ...R, down: true }, 1.6)
    run(s, R, 2) // let go of down halfway: she can't stand up into the arch
    expect(s.bumps).toBe(0)
    expect(s.p.x).toBeGreaterThan(520)
    expect(s.p.ducking).toBe(false)
  })
})

describe('pickups and power-ups', () => {
  it('coins, gems and power-ups score points', () => {
    const s = newGame(field({ coins: [{ x: 200, y: 370 }], gems: [{ x: 260, y: 370 }], powers: [{ kind: 'magnet', x: 320, y: 370 }] }))
    run(s, R, 1.5)
    expect(s.coins).toBe(1)
    expect(s.gemsGot).toBe(1)
    expect(s.timers.magnet).toBeGreaterThan(0)
    expect(s.score).toBe(POINTS.coin + POINTS.gem + POINTS.power)
  })

  it('hearts stack up to three', () => {
    const powers = [200, 260, 320, 380].map((x) => ({ kind: 'heart' as const, x, y: 370 }))
    const s = newGame(field({ powers }), 0)
    run(s, R, 2)
    expect(s.hearts).toBe(3)
  })

  it('the magnet pulls in coins that are out of reach', () => {
    const coins = [{ x: 140, y: 230 }]
    const plain = newGame(field({ coins }))
    run(plain, NO_INPUT, 2)
    expect(plain.coins).toBe(0)
    const pulled = newGame(field({ coins }))
    pulled.timers.magnet = 5
    run(pulled, NO_INPUT, 2)
    expect(pulled.coins).toBe(1)
  })

  it('super speed is faster and smashes through rocks and cacti', () => {
    const cactus: Obstacle = { kind: 'cactus', x: 500, y: 400 - CACTUS.h, ...CACTUS }
    const s = newGame(field({ obstacles: [rockAt(300), cactus] }), 0)
    s.timers.speed = 6
    const events = run(s, R, 2)
    expect(s.p.x).toBeGreaterThan(600)
    expect(events.filter((e) => e.type === 'smash')).toHaveLength(2)
    expect(s.bumps).toBe(0)
    expect(s.score).toBe(2 * POINTS.smash)
  })

  it('power-ups wear off', () => {
    const s = newGame(field())
    s.timers.speed = 1
    run(s, NO_INPUT, 1.1)
    expect(s.timers.speed).toBe(0)
  })
})

describe('bumps', () => {
  const cactus: Obstacle = { kind: 'cactus', x: 300, y: 400 - CACTUS.h, ...CACTUS }

  it('a heart takes the bump and nothing else is lost', () => {
    const s = newGame(field({ obstacles: [cactus] }), 1)
    s.coins = 5
    s.score = 50
    const events = run(s, R, 0.8)
    expect(events.some((e) => e.type === 'heartLost')).toBe(true)
    expect(s.hearts).toBe(0)
    expect(s.coins).toBe(5)
    expect(s.score).toBe(50)
    expect(s.p.x).toBeLessThan(300) // knocked back
  })

  it('without a heart, three coins pop out and can be grabbed back', () => {
    const s = newGame(field({ obstacles: [cactus] }), 0)
    s.coins = 5
    s.score = 50
    run(s, R, 1)
    expect(s.coins).toBe(2)
    expect(s.score).toBe(20)
    expect(s.dropped).toHaveLength(3)
    run(s, NO_INPUT, 1.5)
    // walk around picking them up (a heart-less unicorn just stands near; one landed by her)
    const before = s.coins
    for (const d of [...s.dropped]) {
      s.p.x = d.x
      run(s, NO_INPUT, 0.1)
    }
    expect(s.coins).toBeGreaterThan(before)
  })

  it('never goes below zero, and a bump right after another is ignored', () => {
    const s = newGame(field({ obstacles: [cactus] }), 0)
    run(s, R, 1)
    expect(s.score).toBe(0)
    expect(s.bumps).toBe(1)
  })

  it('tumbleweeds roll back and forth', () => {
    const tw: Obstacle = { kind: 'tumbleweed', x: 900, y: 356, w: 44, h: 44, x0: 600, x1: 900 }
    const s = newGame(field({ obstacles: [tw] }))
    run(s, NO_INPUT, 1)
    const x1 = obstacleRect(s, 0).x
    expect(x1).toBeLessThan(900)
    run(s, NO_INPUT, 4)
    expect(obstacleRect(s, 0).x).toBeGreaterThanOrEqual(600)
    expect(obstacleRect(s, 0).x).toBeLessThanOrEqual(900)
  })
})

describe('the red rocks course', () => {
  it('every ledge is low enough to jump up', () => {
    for (let i = 1; i < LEVEL.ground.length; i++) {
      const rise = LEVEL.ground[i - 1].y - LEVEL.ground[i].y
      expect(rise).toBeLessThanOrEqual(70)
    }
    expect(LEVEL.ground[0].y).toBe(START_Y)
  })

  it('every floating rock can be reached from something below it', () => {
    const surfaces = [...LEVEL.ground, ...LEVEL.platforms]
    for (const p of LEVEL.platforms) {
      const below = surfaces.filter((s) => s !== p && s.y > p.y && s.x < p.x + p.w + 120 && s.x + s.w > p.x - 120)
      const rise = Math.min(...below.map((s) => s.y - p.y))
      expect(rise).toBeLessThanOrEqual(130)
    }
  })

  it('has hearts, super speed, wings and a magnet', () => {
    const kinds = new Set(LEVEL.powers.map((p) => p.kind))
    expect([...kinds].sort()).toEqual(['heart', 'jump', 'magnet', 'speed'])
    expect(LEVEL.powers.filter((p) => p.kind === 'heart').length).toBeGreaterThanOrEqual(2)
  })

  it('the speed power-up sits on the highest floating rock', () => {
    const speed = LEVEL.powers.find((p) => p.kind === 'speed')!
    const gy = groundTopAt(LEVEL, speed.x)
    expect(gy - speed.y).toBeGreaterThan(300)
  })

  it('a simple scripted player climbs to the cake', () => {
    const s = newGame(LEVEL)
    const half = PHYS.w / 2
    const bot = (g: GameState): Input => {
      const p = g.p
      let needJump = groundTopAt(g.level, p.x + half + 30) < p.y - PHYS.stepUp
      let duck = false
      g.level.obstacles.forEach((o, i) => {
        if (!g.alive[i]) return
        const r = obstacleRect(g, i)
        const gap = r.x - (p.x + half)
        if (o.kind === 'arch') {
          if (gap < 40 && r.x + r.w > p.x - half) duck = true
        } else {
          const lead = o.kind === 'tumbleweed' ? 120 : 70
          if (gap < lead && r.x + r.w > p.x - half) needJump = true
        }
      })
      if (duck) needJump = false
      const jump = needJump && !(p.onGround && p.jumpHeld)
      return { left: false, right: true, jump, down: duck }
    }
    run(s, bot, 120)
    expect(s.finished).toBe(true)
    expect(s.coins).toBeGreaterThan(30)
    expect(s.score).toBeGreaterThan(POINTS.finish)
  })
})

describe('high scores', () => {
  const e = (score: number, at = score) => ({ name: 'Sparkle', score, at })

  it('keeps the best five, highest first', () => {
    let table = cleanTable([])
    for (const sc of [300, 100, 500, 200, 400, 50]) table = addScore(table, e(sc)).table
    expect(table.map((x) => x.score)).toEqual([500, 400, 300, 200, 100])
    expect(table).toHaveLength(MAX_SCORES)
  })

  it('reports the rank, or null when it misses the table', () => {
    const table = [500, 400, 300, 200, 100].map((sc) => e(sc))
    expect(addScore(table, e(450, 999)).rank).toBe(1)
    expect(addScore(table, e(900, 999)).rank).toBe(0)
    expect(addScore(table, e(90, 999)).rank).toBeNull()
  })

  it('a tie goes below the older score', () => {
    const { table, rank } = addScore([e(300, 1)], { name: 'New', score: 300, at: 2 })
    expect(rank).toBe(1)
    expect(table[0].at).toBe(1)
  })

  it('throws away junk from storage', () => {
    expect(cleanTable('nope')).toEqual([])
    expect(cleanTable([{ name: 'A', score: 10, at: 1 }, { score: 'x' }, null])).toHaveLength(1)
  })
})
