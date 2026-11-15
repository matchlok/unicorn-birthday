// Canvas drawing for Red Rocks Romp. Everything is drawn from shapes: no image files.
// World layers (sky, peaks, red fins, pines) scroll at different speeds for depth.

import { ARCH, groundTopAt, type Level, type PowerKind, type Rect } from './level'
import { MAX_HEARTS, POWER_SECONDS, obstacleRect, type GameState } from './logic'

export type View = { w: number; h: number }
export type Camera = { x: number; y: number }
export type Fx = {
  kind: 'spark' | 'text' | 'puff' | 'heart' | 'chunk'
  x: number
  y: number
  vx: number
  vy: number
  life: number
  max: number
  color: string
  size: number
  text?: string
}

const C = {
  grape: '#5B3A8C',
  rock: '#D9694F',
  rockDark: '#B4503D',
  rockLight: '#EE8B6A',
  stripe: '#C75C46',
  tan: '#F5CC9E',
  grass: '#8FD694',
  pine: '#3F8F5F',
  pineDark: '#2E7350',
  trunk: '#8A5A3C',
  coin: '#FFD84D',
  coinDark: '#E3A400',
  pink: '#FF7EB9',
  cream: '#FFF8F0',
}
const RAINBOW = ['#FF6B8B', '#FFA94D', '#FFE66D', '#8FE3A0', '#7CC8FF', '#B79CFF']

const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function cameraTarget(s: GameState, view: View): Camera {
  const x = Math.max(0, Math.min(s.level.width - view.w, s.p.x - view.w * 0.38))
  // Follow her, but up on a high floating rock keep the ground below in view too,
  // as long as that still leaves her head room.
  const follow = s.p.y - view.h * 0.68
  const keepGround = groundTopAt(s.level, s.p.x) - view.h * 0.9
  const headRoom = s.p.y - view.h * 0.28
  return { x, y: Math.min(Math.max(follow, keepGround), headRoom) }
}

// ---------- background layers ----------

function sky(ctx: CanvasRenderingContext2D, view: View, t: number) {
  const g = ctx.createLinearGradient(0, 0, 0, view.h)
  g.addColorStop(0, '#79C3F0')
  g.addColorStop(0.55, '#B8E5FA')
  g.addColorStop(1, '#FFE2C8')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, view.w, view.h)

  // Sun with a soft glow
  const sx = view.w - 130
  const sy = 92
  const glow = ctx.createRadialGradient(sx, sy, 20, sx, sy, 110)
  glow.addColorStop(0, 'rgba(255,240,170,0.9)')
  glow.addColorStop(1, 'rgba(255,240,170,0)')
  ctx.fillStyle = glow
  ctx.fillRect(sx - 120, sy - 120, 240, 240)
  ctx.fillStyle = '#FFE66D'
  circle(ctx, sx, sy, 40)
  ctx.fill()

  // Puffy clouds drifting
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  for (let i = 0; i < 4; i++) {
    const span = view.w + 300
    const x = ((i * 330 + t * (10 + i * 3)) % span) - 150
    const y = 60 + i * 38 + hash(i) * 30
    for (const [dx, dy, r] of [[0, 0, 26], [28, -12, 32], [60, 0, 24], [30, 8, 24]]) {
      circle(ctx, x + dx, y + dy, r)
      ctx.fill()
    }
  }
}

function circle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
}

// A row of snowy peaks (the Front Range), scrolling at `factor` of the camera.
function peaks(ctx: CanvasRenderingContext2D, view: View, cam: Camera, camDY: number, o: { factor: number; base: number; color: string; spacing: number; hMin: number; hMax: number; seed: number }) {
  const ox = cam.x * o.factor
  const base = view.h * o.base - camDY * o.factor * 0.6
  const i0 = Math.floor(ox / o.spacing) - 1
  const i1 = Math.ceil((ox + view.w) / o.spacing) + 1
  const pts: { x: number; y: number; peak: boolean }[] = []
  for (let i = i0; i <= i1; i++) {
    const px = i * o.spacing + hash(i + o.seed) * o.spacing * 0.35 - ox
    const ph = o.hMin + hash(i * 3 + o.seed) * (o.hMax - o.hMin)
    pts.push({ x: px, y: base - ph, peak: true })
    pts.push({ x: px + o.spacing * 0.5, y: base - ph * (0.3 + hash(i * 7 + o.seed) * 0.2), peak: false })
  }
  ctx.fillStyle = o.color
  ctx.beginPath()
  ctx.moveTo(pts[0].x, view.h)
  for (const p of pts) ctx.lineTo(p.x, p.y)
  ctx.lineTo(pts[pts.length - 1].x, view.h)
  ctx.closePath()
  ctx.fill()

  // Snowcaps: the top quarter of each peak, with a zigzag edge.
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  for (let k = 1; k < pts.length - 1; k++) {
    const p = pts[k]
    if (!p.peak) continue
    const l = pts[k - 1]
    const r = pts[k + 1]
    const f = 0.28
    const lx = p.x + (l.x - p.x) * f
    const ly = p.y + (l.y - p.y) * f
    const rx = p.x + (r.x - p.x) * f
    const ry = p.y + (r.y - p.y) * f
    ctx.beginPath()
    ctx.moveTo(p.x, p.y)
    ctx.lineTo(rx, ry)
    ctx.lineTo((p.x + rx) / 2, Math.max(ly, ry) - 4)
    ctx.lineTo(p.x, Math.max(ly, ry) + 4)
    ctx.lineTo((p.x + lx) / 2, Math.max(ly, ry) - 4)
    ctx.lineTo(lx, ly)
    ctx.closePath()
    ctx.fill()
  }
}

// The tilted red sandstone fins (like Red Rocks and South Valley), leaning up to the right.
function fins(ctx: CanvasRenderingContext2D, view: View, cam: Camera, camDY: number) {
  const factor = 0.3
  const spacing = 430
  const ox = cam.x * factor
  const base = view.h * 0.8 - camDY * factor * 0.6
  const i0 = Math.floor(ox / spacing) - 2
  const i1 = Math.ceil((ox + view.w) / spacing) + 1
  for (let i = i0; i <= i1; i++) {
    const fh = 130 + hash(i * 5 + 2) * 190
    const fw = fh * (1 + hash(i * 11) * 0.5)
    const fx = i * spacing + hash(i + 9) * 160 - ox
    const top = { x: fx + fw * 0.62, y: base - fh }
    const shoulder = { x: fx + fw * 0.74, y: base - fh * 0.9 }
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(fx, base)
    ctx.quadraticCurveTo(fx + fw * 0.3, base - fh * 0.45, top.x, top.y)
    ctx.quadraticCurveTo(top.x + 10, top.y - 4, shoulder.x, shoulder.y)
    ctx.lineTo(fx + fw, base)
    ctx.closePath()
    const g = ctx.createLinearGradient(fx, base - fh, fx + fw, base)
    g.addColorStop(0, C.rockLight)
    g.addColorStop(1, C.rock)
    ctx.fillStyle = g
    ctx.fill()
    ctx.clip()
    // Sandstone layers run along the tilt.
    ctx.strokeStyle = 'rgba(255,220,190,0.35)'
    ctx.lineWidth = 5
    for (let k = -4; k < 10; k++) {
      ctx.beginPath()
      ctx.moveTo(fx + k * 26, base + 10)
      ctx.lineTo(fx + k * 26 + fw * 0.66, base - fh - 10)
      ctx.stroke()
    }
    // Shady back face
    ctx.fillStyle = 'rgba(140,50,40,0.35)'
    ctx.beginPath()
    ctx.moveTo(shoulder.x, shoulder.y)
    ctx.lineTo(fx + fw, base)
    ctx.lineTo(fx + fw * 0.8, base)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }
  // Foothills in front of the fins' feet
  ctx.fillStyle = '#E8A67C'
  ctx.fillRect(0, base - 2, view.w, view.h - base + 2)
  ctx.fillStyle = 'rgba(120,170,100,0.55)'
  for (let i = i0 * 4; i <= i1 * 4; i++) {
    const x = i * (spacing / 4) + hash(i * 13) * 80 - ox
    circle(ctx, x, base + 8 + hash(i) * 14, 10 + hash(i * 2) * 10)
    ctx.fill()
  }
}

function pine(ctx: CanvasRenderingContext2D, x: number, base: number, h: number) {
  ctx.fillStyle = C.trunk
  ctx.fillRect(x - 5, base - h * 0.25, 10, h * 0.25)
  for (let k = 0; k < 3; k++) {
    const w = h * (0.42 - k * 0.1)
    const y = base - h * 0.2 - k * h * 0.24
    ctx.fillStyle = k % 2 ? C.pine : C.pineDark
    ctx.beginPath()
    ctx.moveTo(x - w, y)
    ctx.quadraticCurveTo(x, y - h * 0.5, x, y - h * 0.42)
    ctx.quadraticCurveTo(x, y - h * 0.5, x + w, y)
    ctx.closePath()
    ctx.fill()
  }
}

// Ponderosa pines and scrub oak, closer to us.
function trees(ctx: CanvasRenderingContext2D, view: View, cam: Camera, camDY: number) {
  const factor = 0.6
  const spacing = 210
  const ox = cam.x * factor
  const base = view.h * 0.74 - camDY * factor * 0.6
  const i0 = Math.floor(ox / spacing) - 1
  const i1 = Math.ceil((ox + view.w) / spacing) + 1
  ctx.fillStyle = '#DD946A'
  ctx.fillRect(0, base - 6, view.w, view.h)
  for (let i = i0; i <= i1; i++) {
    const x = i * spacing + hash(i * 3 + 1) * 120 - ox
    if (hash(i * 17) < 0.6) pine(ctx, x, base, 90 + hash(i * 19) * 70)
    else {
      ctx.fillStyle = '#7DBA6B'
      for (const [dx, r] of [[-14, 16], [6, 20], [24, 14]]) {
        circle(ctx, x + dx, base - r * 0.7, r)
        ctx.fill()
      }
    }
  }
}

// ---------- the course ----------

function strata(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, bottom: number) {
  for (let yy = y + 20, k = 0; yy < bottom; yy += 26, k++) {
    ctx.fillStyle = k % 2 ? C.stripe : 'rgba(255,190,150,0.35)'
    ctx.fillRect(x, yy, w, 9)
  }
}

function groundSeg(ctx: CanvasRenderingContext2D, g: Rect, bottom: number, seed: number) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(g.x, g.y, g.w, bottom - g.y, [16, 16, 0, 0])
  ctx.fillStyle = C.rock
  ctx.fill()
  ctx.clip()
  strata(ctx, g.x, g.y, g.w, bottom)
  ctx.restore()
  // sandy top with grass tufts
  ctx.fillStyle = C.tan
  ctx.beginPath()
  ctx.roundRect(g.x, g.y, g.w, 12, [16, 16, 4, 4])
  ctx.fill()
  ctx.fillStyle = C.grass
  for (let x = g.x + 14; x < g.x + g.w - 10; x += 34) {
    if (hash(x + seed) < 0.45) continue
    ctx.beginPath()
    ctx.ellipse(x, g.y + 1, 9, 5, 0, Math.PI, 0)
    ctx.fill()
  }
  ctx.strokeStyle = 'rgba(91,58,140,0.55)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.roundRect(g.x, g.y, g.w, bottom - g.y + 20, [16, 16, 0, 0])
  ctx.stroke()
}

function floatingRock(ctx: CanvasRenderingContext2D, r: Rect) {
  const { x, y, w } = r
  ctx.save()
  ctx.beginPath()
  ctx.moveTo(x + 12, y)
  ctx.lineTo(x + w - 12, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + 12)
  ctx.bezierCurveTo(x + w, y + 32, x + w * 0.7, y + 54, x + w * 0.5, y + 56)
  ctx.bezierCurveTo(x + w * 0.3, y + 54, x, y + 32, x, y + 12)
  ctx.quadraticCurveTo(x, y, x + 12, y)
  ctx.closePath()
  ctx.fillStyle = C.rock
  ctx.fill()
  ctx.strokeStyle = 'rgba(91,58,140,0.7)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.clip()
  strata(ctx, x, y, w, y + 60)
  ctx.fillStyle = C.tan
  ctx.fillRect(x, y, w, 9)
  ctx.restore()
}

function boulder(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.beginPath()
  ctx.roundRect(r.x, r.y, r.w, r.h + 4, [26, 22, 8, 8])
  ctx.fillStyle = C.rockDark
  ctx.fill()
  ctx.strokeStyle = 'rgba(91,58,140,0.75)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.fillStyle = 'rgba(255,200,170,0.5)'
  ctx.beginPath()
  ctx.ellipse(r.x + r.w * 0.35, r.y + 12, 12, 6, -0.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'rgba(91,40,40,0.4)'
  ctx.beginPath()
  ctx.moveTo(r.x + r.w * 0.6, r.y + 8)
  ctx.lineTo(r.x + r.w * 0.52, r.y + 24)
  ctx.lineTo(r.x + r.w * 0.66, r.y + 34)
  ctx.stroke()
}

function cactus(ctx: CanvasRenderingContext2D, r: Rect, t: number) {
  const pads: [number, number, number, number, number][] = [
    [r.x + r.w * 0.5, r.y + r.h * 0.62, 15, 20, 0],
    [r.x + r.w * 0.22, r.y + r.h * 0.45, 11, 14, -0.5],
    [r.x + r.w * 0.78, r.y + r.h * 0.4, 11, 15, 0.5],
  ]
  for (const [x, y, rx, ry, rot] of pads) {
    ctx.beginPath()
    ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2)
    ctx.fillStyle = '#6CBF74'
    ctx.fill()
    ctx.strokeStyle = '#2F7350'
    ctx.lineWidth = 2.5
    ctx.stroke()
    ctx.fillStyle = '#FFF8F0'
    for (let k = 0; k < 4; k++) {
      circle(ctx, x + Math.cos(k * 1.7) * rx * 0.5, y + Math.sin(k * 1.7) * ry * 0.5, 1.6)
      ctx.fill()
    }
  }
  // a pink flower that bobs
  ctx.fillStyle = C.pink
  circle(ctx, r.x + r.w * 0.78, r.y + r.h * 0.4 - 15 + Math.sin(t * 3) * 1.5, 6)
  ctx.fill()
}

function tumbleweed(ctx: CanvasRenderingContext2D, r: Rect, t: number) {
  const cx = r.x + r.w / 2
  const cy = r.y + r.h / 2 - Math.abs(Math.sin(t * 6)) * 6
  const rot = -r.x / (r.w / 2)
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(rot)
  ctx.fillStyle = 'rgba(214,170,110,0.45)'
  circle(ctx, 0, 0, r.w / 2)
  ctx.fill()
  ctx.strokeStyle = '#A97A45'
  ctx.lineWidth = 2.5
  for (let k = 0; k < 7; k++) {
    ctx.beginPath()
    ctx.arc(Math.cos(k) * 8, Math.sin(k * 2) * 8, 10 + (k % 3) * 4, k, k + 3.6)
    ctx.stroke()
  }
  // friendly eyes so it reads as a silly critter, not a threat
  ctx.rotate(-rot)
  ctx.fillStyle = C.grape
  circle(ctx, -6, -3, 3)
  ctx.fill()
  circle(ctx, 6, -3, 3)
  ctx.fill()
  ctx.restore()
}

function archBack(ctx: CanvasRenderingContext2D, r: Rect, ground: number) {
  // Pillars set back behind the path, so they read as background.
  ctx.fillStyle = '#B85F4B'
  ctx.beginPath()
  ctx.roundRect(r.x - 34, r.y + 10, 40, ground - r.y - 10, 12)
  ctx.roundRect(r.x + r.w - 6, r.y + 10, 40, ground - r.y - 10, 12)
  ctx.fill()
}

function archTop(ctx: CanvasRenderingContext2D, r: Rect) {
  ctx.save()
  ctx.beginPath()
  ctx.roundRect(r.x - 34, r.y, r.w + 68, r.h, [24, 24, 30, 30])
  ctx.fillStyle = C.rock
  ctx.fill()
  ctx.strokeStyle = 'rgba(91,58,140,0.75)'
  ctx.lineWidth = 3
  ctx.stroke()
  ctx.clip()
  strata(ctx, r.x - 34, r.y, r.w + 68, r.y + r.h)
  ctx.fillStyle = C.tan
  ctx.fillRect(r.x - 34, r.y, r.w + 68, 9)
  ctx.restore()
  // little vines hanging down, a hint to duck
  ctx.strokeStyle = '#4FA36A'
  ctx.lineWidth = 3
  for (let x = r.x + 20; x < r.x + r.w - 10; x += 38) {
    ctx.beginPath()
    ctx.moveTo(x, r.y + r.h - 4)
    ctx.quadraticCurveTo(x + 6, r.y + r.h + 6, x, r.y + r.h + 12)
    ctx.stroke()
  }
}

function coin(ctx: CanvasRenderingContext2D, x: number, y: number, t: number, alpha = 1, flat = false) {
  const spin = flat ? 1 : Math.max(0.2, Math.abs(Math.cos(t * 4 + x * 0.013)))
  ctx.globalAlpha = alpha
  ctx.beginPath()
  ctx.ellipse(x, y, 14 * spin, 14, 0, 0, Math.PI * 2)
  ctx.fillStyle = C.coin
  ctx.fill()
  ctx.lineWidth = 3
  ctx.strokeStyle = C.coinDark
  ctx.stroke()
  if (spin > 0.55) {
    ctx.fillStyle = '#FFF4B8'
    star(ctx, x, y, 6 * spin, 3 * spin)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function star(ctx: CanvasRenderingContext2D, x: number, y: number, outer: number, inner: number) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = (i * Math.PI) / 5 - Math.PI / 2
    if (i === 0) ctx.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
    else ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r)
  }
  ctx.closePath()
}

function gem(ctx: CanvasRenderingContext2D, x: number, y: number, t: number) {
  ctx.save()
  ctx.translate(x, y + Math.sin(t * 3 + x) * 4)
  ctx.beginPath()
  ctx.moveTo(0, -16)
  ctx.lineTo(15, -4)
  ctx.lineTo(0, 19)
  ctx.lineTo(-15, -4)
  ctx.closePath()
  ctx.fillStyle = C.pink
  ctx.fill()
  ctx.strokeStyle = C.grape
  ctx.lineWidth = 2.5
  ctx.stroke()
  ctx.fillStyle = '#FFD0E6'
  ctx.beginPath()
  ctx.moveTo(0, -16)
  ctx.lineTo(7, -4)
  ctx.lineTo(0, 6)
  ctx.lineTo(-7, -4)
  ctx.closePath()
  ctx.fill()
  const tw = (Math.sin(t * 5 + x) + 1) / 2
  ctx.fillStyle = `rgba(255,255,255,${tw})`
  star(ctx, 12, -14, 6, 2)
  ctx.fill()
  ctx.restore()
}

export function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, s: number) {
  ctx.beginPath()
  ctx.moveTo(x, y + s * 0.9)
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.7, y - s * 1.2, x, y - s * 0.45)
  ctx.bezierCurveTo(x + s * 0.7, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9)
  ctx.closePath()
}

const POWER_RIM: Record<PowerKind, string> = { heart: '#FF8FB5', speed: '#FFB347', jump: '#9FD8FF', magnet: '#C8B6FF' }

export function powerIcon(ctx: CanvasRenderingContext2D, kind: PowerKind, x: number, y: number, s: number) {
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  if (kind === 'heart') {
    heartPath(ctx, x, y + s * 0.05, s * 0.8)
    ctx.fillStyle = '#FF5C8D'
    ctx.fill()
    ctx.strokeStyle = C.grape
    ctx.lineWidth = s * 0.12
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,0.7)'
    circle(ctx, x - s * 0.35, y - s * 0.2, s * 0.13)
    ctx.fill()
  } else if (kind === 'speed') {
    // rainbow lightning bolt
    ctx.beginPath()
    ctx.moveTo(x + s * 0.2, y - s)
    ctx.lineTo(x - s * 0.55, y + s * 0.1)
    ctx.lineTo(x - s * 0.02, y + s * 0.1)
    ctx.lineTo(x - s * 0.25, y + s)
    ctx.lineTo(x + s * 0.6, y - s * 0.2)
    ctx.lineTo(x + s * 0.05, y - s * 0.2)
    ctx.closePath()
    const g = ctx.createLinearGradient(x, y - s, x, y + s)
    RAINBOW.forEach((c, i) => g.addColorStop(i / (RAINBOW.length - 1), c))
    ctx.fillStyle = g
    ctx.fill()
    ctx.strokeStyle = C.grape
    ctx.lineWidth = s * 0.12
    ctx.stroke()
  } else if (kind === 'jump') {
    // a little wing
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = C.grape
    ctx.lineWidth = s * 0.1
    for (let k = 0; k < 3; k++) {
      ctx.beginPath()
      ctx.ellipse(x - s * 0.1 + k * s * 0.18, y - s * 0.1 + k * s * 0.22, s * (0.85 - k * 0.18), s * 0.24, -0.5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
  } else {
    // magnet
    ctx.lineWidth = s * 0.42
    ctx.strokeStyle = C.grape
    ctx.beginPath()
    ctx.arc(x, y - s * 0.05, s * 0.5, Math.PI, 0, true)
    ctx.stroke()
    ctx.lineWidth = s * 0.3
    ctx.strokeStyle = '#FF5C6C'
    ctx.stroke()
    ctx.fillStyle = '#E6E6F0'
    ctx.strokeStyle = C.grape
    ctx.lineWidth = s * 0.08
    for (const dx of [-0.5, 0.5]) {
      ctx.beginPath()
      ctx.rect(x + dx * s - s * 0.2, y - s * 0.45, s * 0.4, s * 0.3)
      ctx.fill()
      ctx.stroke()
    }
  }
}

function powerBubble(ctx: CanvasRenderingContext2D, kind: PowerKind, x: number, y: number, t: number) {
  const by = y + Math.sin(t * 2.5 + x) * 6
  const pulse = 1 + Math.sin(t * 5) * 0.05
  const r = 27 * pulse
  const g = ctx.createRadialGradient(x - 8, by - 10, 4, x, by, r)
  g.addColorStop(0, 'rgba(255,255,255,0.95)')
  g.addColorStop(1, POWER_RIM[kind])
  ctx.fillStyle = g
  circle(ctx, x, by, r)
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth = 3
  ctx.stroke()
  powerIcon(ctx, kind, x, by + 1, 15)
  // orbiting sparkle
  ctx.fillStyle = '#FFFFFF'
  star(ctx, x + Math.cos(t * 3) * (r + 6), by + Math.sin(t * 3) * (r + 6), 5, 2)
  ctx.fill()
}

function cake(ctx: CanvasRenderingContext2D, x: number, ground: number, t: number) {
  const tiers: [number, number, string][] = [
    [160, 50, '#FFB3D9'],
    [118, 42, '#FFF8F0'],
    [78, 36, '#C8B6FF'],
  ]
  let y = ground
  for (const [w, h, color] of tiers) {
    y -= h
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y, w, h, 10)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = C.grape
    ctx.lineWidth = 3
    ctx.stroke()
    ctx.fillStyle = '#FFFFFF'
    for (let dx = -w / 2 + 10; dx < w / 2; dx += 16) {
      circle(ctx, x + dx, y + 2, 5)
      ctx.fill()
    }
  }
  for (let k = -2; k <= 2; k++) {
    const cx = x + k * 14
    ctx.fillStyle = RAINBOW[k + 2]
    ctx.fillRect(cx - 3, y - 22, 6, 22)
    ctx.fillStyle = '#FFB347'
    ctx.beginPath()
    ctx.ellipse(cx, y - 29, 4, 7 + Math.sin(t * 14 + k) * 1.5, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  // rainbow flag on the summit
  ctx.fillStyle = C.grape
  ctx.fillRect(x + 110, ground - 170, 6, 170)
  RAINBOW.forEach((c, i) => {
    ctx.fillStyle = c
    const wave = Math.sin(t * 4 + i * 0.4) * 4
    ctx.fillRect(x + 116, ground - 168 + i * 9 + wave * 0.3, 70 + wave, 9)
  })
}

// ---------- the unicorn ----------

function unicorn(ctx: CanvasRenderingContext2D, s: GameState, t: number) {
  const p = s.p
  const moving = Math.abs(p.vx) > 5
  const air = !p.onGround
  const duck = p.ducking
  const bob = p.onGround && moving ? -Math.abs(Math.sin(p.runPhase)) * 3 : Math.sin(t * 2) * 0.8
  const bodyY = (duck ? -20 : -34) + bob
  const headX = duck ? 36 : 28
  const headY = duck ? bodyY - 2 : bodyY - 26

  ctx.save()
  ctx.translate(p.x, p.y)

  // Super speed: a rainbow streak behind her.
  if (s.timers.speed > 0) {
    const len = 170
    RAINBOW.forEach((c, i) => {
      const g = ctx.createLinearGradient(-p.facing * len, 0, 0, 0)
      g.addColorStop(0, 'rgba(255,255,255,0)')
      g.addColorStop(1, c)
      ctx.fillStyle = g
      ctx.fillRect(p.facing > 0 ? -len : 0, bodyY - 14 + i * 5, len, 5)
    })
  }
  if (s.timers.magnet > 0) {
    ctx.strokeStyle = 'rgba(200,182,255,0.8)'
    ctx.lineWidth = 3
    ctx.setLineDash([8, 10])
    ctx.lineDashOffset = -t * 40
    circle(ctx, 0, bodyY, 58)
    ctx.stroke()
    ctx.setLineDash([])
  }

  if (p.invuln > 0 && Math.floor(t * 12) % 2 === 0) ctx.globalAlpha = 0.4
  ctx.scale(p.facing, 1)
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'

  // Tail: a wavy chain of rainbow puffs
  RAINBOW.forEach((c, i) => {
    const k = i / RAINBOW.length
    const tx = -30 - i * 5
    const ty = bodyY - 6 + i * 4 + Math.sin(t * 8 - i * 0.8) * (2 + i)
    ctx.fillStyle = c
    circle(ctx, tx, ty, 8 - k * 3)
    ctx.fill()
  })

  // Legs
  const legLen = -bodyY - 8
  const legs: [number, number][] = [[-20, 0], [-9, Math.PI], [12, Math.PI], [22, 0]]
  legs.forEach(([lx, off], i) => {
    let a = 0
    if (air) a = i < 2 ? 0.7 : -0.7
    else if (moving) a = Math.sin(p.runPhase * 2 + off) * 0.6
    ctx.save()
    ctx.translate(lx, bodyY + 6)
    ctx.rotate(a)
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = C.grape
    ctx.lineWidth = 2.5
    ctx.beginPath()
    ctx.roundRect(-4.5, 0, 9, legLen, 4)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#C8B6FF'
    ctx.beginPath()
    ctx.roundRect(-5, legLen - 6, 10, 7, 3)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  })

  // Wings while the jump power is on
  if (s.timers.jump > 0) {
    const flap = Math.sin(t * 14) * 0.4
    ctx.save()
    ctx.translate(-6, bodyY - 12)
    ctx.rotate(-0.6 + flap)
    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = C.grape
    ctx.lineWidth = 2
    for (let k = 0; k < 3; k++) {
      ctx.beginPath()
      ctx.ellipse(-8 + k * 5, -10 - k * 6, 20 - k * 4, 7, -0.4, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }
    ctx.restore()
  }

  // Body
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = C.grape
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.ellipse(0, bodyY, 32, duck ? 15 : 19, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()

  // Neck
  ctx.lineWidth = 21
  ctx.strokeStyle = C.grape
  ctx.beginPath()
  ctx.moveTo(16, bodyY - 6)
  ctx.lineTo(headX - 4, headY + 4)
  ctx.stroke()
  ctx.lineWidth = 15
  ctx.strokeStyle = '#FFFFFF'
  ctx.stroke()

  // Mane: rainbow puffs down the back of the neck
  RAINBOW.forEach((c, i) => {
    const f = i / (RAINBOW.length - 1)
    const mx = headX - 10 + (10 - (headX - 10)) * f
    const my = headY - 10 + (bodyY - 14 - (headY - 10)) * f
    ctx.fillStyle = c
    circle(ctx, mx - 4, my + Math.sin(t * 6 + i) * 1.5, 7)
    ctx.fill()
  })

  // Head and snout
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = C.grape
  ctx.lineWidth = 3
  circle(ctx, headX, headY, 15)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = '#FFE4F1'
  ctx.beginPath()
  ctx.ellipse(headX + 12, headY + 6, 11, 8, 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.fillStyle = C.grape
  circle(ctx, headX + 17, headY + 4, 1.6)
  ctx.fill()

  // Eye and cheek
  circle(ctx, headX + 4, headY - 3, 3.6)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  circle(ctx, headX + 5.2, headY - 4.4, 1.3)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,126,185,0.6)'
  ctx.beginPath()
  ctx.ellipse(headX + 4, headY + 6, 4.5, 3, 0, 0, Math.PI * 2)
  ctx.fill()

  // Ear
  ctx.fillStyle = '#FFFFFF'
  ctx.strokeStyle = C.grape
  ctx.lineWidth = 2.5
  ctx.beginPath()
  ctx.moveTo(headX - 8, headY - 10)
  ctx.lineTo(headX - 5, headY - 23)
  ctx.lineTo(headX + 1, headY - 12)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // Horn (tucked forward when ducking)
  const tipX = duck ? headX + 26 : headX + 12
  const tipY = duck ? headY - 18 : headY - 36
  ctx.fillStyle = '#FFD84D'
  ctx.beginPath()
  ctx.moveTo(headX - 1, headY - 12)
  ctx.lineTo(headX + 8, headY - 10)
  ctx.lineTo(tipX, tipY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()
  ctx.strokeStyle = '#E3A400'
  ctx.lineWidth = 1.8
  for (const f of [0.3, 0.55]) {
    ctx.beginPath()
    ctx.moveTo(headX - 1 + (tipX - headX + 1) * f, headY - 12 + (tipY - headY + 12) * f)
    ctx.lineTo(headX + 8 + (tipX - headX - 8) * f, headY - 10 + (tipY - headY + 10) * f)
    ctx.stroke()
  }
  ctx.restore()
}

// ---------- effects and HUD ----------

function drawFx(ctx: CanvasRenderingContext2D, fx: Fx[]) {
  for (const f of fx) {
    const a = Math.max(0, f.life / f.max)
    ctx.globalAlpha = a
    if (f.kind === 'spark') {
      ctx.fillStyle = f.color
      star(ctx, f.x, f.y, f.size, f.size * 0.45)
      ctx.fill()
    } else if (f.kind === 'chunk') {
      ctx.fillStyle = f.color
      ctx.fillRect(f.x - f.size / 2, f.y - f.size / 2, f.size, f.size)
    } else if (f.kind === 'puff') {
      ctx.fillStyle = f.color
      circle(ctx, f.x, f.y, f.size * (1.6 - a * 0.6))
      ctx.fill()
    } else if (f.kind === 'heart') {
      heartPath(ctx, f.x, f.y, f.size)
      ctx.fillStyle = f.color
      ctx.fill()
      ctx.strokeStyle = C.grape
      ctx.lineWidth = 2
      ctx.stroke()
    } else if (f.text) {
      ctx.font = `700 ${f.size}px Fredoka, sans-serif`
      ctx.textAlign = 'center'
      ctx.lineWidth = 5
      ctx.strokeStyle = C.grape
      ctx.strokeText(f.text, f.x, f.y)
      ctx.fillStyle = f.color
      ctx.fillText(f.text, f.x, f.y)
    }
  }
  ctx.globalAlpha = 1
}

export function updateFx(fx: Fx[], dt: number): Fx[] {
  for (const f of fx) {
    f.life -= dt
    f.x += f.vx * dt
    f.y += f.vy * dt
    if (f.kind === 'spark' || f.kind === 'chunk') f.vy += 900 * dt
  }
  return fx.filter((f) => f.life > 0)
}

// Score, hearts and power-up timers, in screen pixels.
function hud(ctx: CanvasRenderingContext2D, s: GameState, w: number, top: number, bump: number) {
  const pillW = Math.min(230, w - 190)
  const pillH = 54
  const x = (w - pillW) / 2
  const y = top + 18
  const sc = 1 + bump * 0.12
  ctx.save()
  ctx.translate(w / 2, y + pillH / 2)
  ctx.scale(sc, sc)
  ctx.translate(-w / 2, -(y + pillH / 2))
  ctx.beginPath()
  ctx.roundRect(x, y, pillW, pillH, 27)
  ctx.fillStyle = 'rgba(255,248,240,0.94)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(91,58,140,0.85)'
  ctx.lineWidth = 3
  ctx.stroke()
  coin(ctx, x + 30, y + pillH / 2, 0, 1, true)
  ctx.font = '700 32px Fredoka, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = C.grape
  ctx.fillText(String(s.score), x + pillW / 2 + 14, y + pillH / 2 + 2)
  ctx.restore()

  // Hearts under the score
  const hy = y + pillH + 26
  for (let i = 0; i < MAX_HEARTS; i++) {
    const hx = w / 2 + (i - (MAX_HEARTS - 1) / 2) * 38
    heartPath(ctx, hx, hy, 14)
    if (i < s.hearts) {
      ctx.fillStyle = '#FF5C8D'
      ctx.fill()
    } else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.fill()
    }
    ctx.strokeStyle = C.grape
    ctx.lineWidth = 2.5
    ctx.stroke()
  }

  // Active power-ups with a shrinking ring
  const active = (['speed', 'jump', 'magnet'] as const).filter((k) => s.timers[k] > 0)
  active.forEach((k, i) => {
    const cx = w / 2 + (i - (active.length - 1) / 2) * 56
    const cy = hy + 46
    const frac = s.timers[k] / POWER_SECONDS[k]
    ctx.fillStyle = 'rgba(255,248,240,0.94)'
    circle(ctx, cx, cy, 22)
    ctx.fill()
    ctx.strokeStyle = 'rgba(91,58,140,0.25)'
    ctx.lineWidth = 5
    ctx.stroke()
    ctx.strokeStyle = POWER_RIM[k]
    ctx.beginPath()
    ctx.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2)
    ctx.stroke()
    powerIcon(ctx, k, cx, cy, 11)
  })
  ctx.textBaseline = 'alphabetic'
}

export type Frame = {
  ctx: CanvasRenderingContext2D
  s: GameState
  view: View
  cam: Camera
  cam0: number
  scale: number // screen pixels per world unit
  cssW: number
  safeTop: number
  fx: Fx[]
  scoreBump: number
}

export function render({ ctx, s, view, cam, cam0, scale, cssW, safeTop, fx, scoreBump }: Frame) {
  // Belt and braces: the background loops below never end on an Infinity or NaN view.
  if (!(scale > 0) || !Number.isFinite(view.w) || !Number.isFinite(view.h)) return
  const t = s.t
  const level: Level = s.level
  const camDY = cam.y - cam0
  ctx.save()
  ctx.scale(scale, scale)

  sky(ctx, view, t)
  peaks(ctx, view, cam, camDY, { factor: 0.06, base: 0.62, color: '#B7A6E6', spacing: 190, hMin: 110, hMax: 210, seed: 1 })
  peaks(ctx, view, cam, camDY, { factor: 0.13, base: 0.7, color: '#9C8BD8', spacing: 240, hMin: 70, hMax: 150, seed: 7 })
  fins(ctx, view, cam, camDY)
  trees(ctx, view, cam, camDY)

  ctx.save()
  ctx.translate(-cam.x, -cam.y)
  const left = cam.x - 80
  const right = cam.x + view.w + 80
  const bottom = cam.y + view.h + 20
  const visible = (x: number, w: number) => x + w > left && x < right

  // Arch pillars sit behind everything on the path.
  level.obstacles.forEach((o, i) => {
    if (o.kind === 'arch' && s.alive[i] && visible(o.x - 40, o.w + 80)) archBack(ctx, o, o.y + o.h + ARCH.gap)
  })
  level.ground.forEach((g, i) => {
    if (visible(g.x, g.w)) groundSeg(ctx, g, bottom, i * 97)
  })
  if (visible(level.finishX - 100, 300)) cake(ctx, level.finishX + 70, groundTopAt(level, level.finishX + 70), t)
  for (const pf of level.platforms) if (visible(pf.x, pf.w)) floatingRock(ctx, pf)

  level.obstacles.forEach((o, i) => {
    if (!s.alive[i]) return
    const r = obstacleRect(s, i)
    if (!visible(r.x - 40, r.w + 80)) return
    if (o.kind === 'rock') boulder(ctx, r)
    else if (o.kind === 'cactus') cactus(ctx, r, t)
    else if (o.kind === 'tumbleweed') tumbleweed(ctx, r, t)
  })

  s.coinPos.forEach((c, i) => {
    if (!s.coinsTaken[i] && c.x > left && c.x < right) coin(ctx, c.x, c.y + Math.sin(t * 3 + c.x) * 3, t)
  })
  for (const d of s.dropped) coin(ctx, d.x, d.y, t, d.life < 1.5 && Math.floor(t * 10) % 2 ? 0.3 : 1)
  level.gems.forEach((g, i) => {
    if (!s.gemsTaken[i] && g.x > left && g.x < right) gem(ctx, g.x, g.y, t)
  })
  level.powers.forEach((pw, i) => {
    if (!s.powersTaken[i] && pw.x > left && pw.x < right) powerBubble(ctx, pw.kind, pw.x, pw.y, t)
  })

  unicorn(ctx, s, t)

  // Arch tops go over her, so ducking under reads clearly.
  level.obstacles.forEach((o, i) => {
    if (o.kind === 'arch' && s.alive[i] && visible(o.x - 40, o.w + 80)) archTop(ctx, o)
  })
  drawFx(ctx, fx)
  ctx.restore()
  ctx.restore()

  hud(ctx, s, cssW, safeTop, scoreBump)
}
