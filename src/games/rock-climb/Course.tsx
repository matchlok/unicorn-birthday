import { useEffect, useRef, type RefObject } from 'react'
import { play, type SfxName } from '../../engine/audio'
import { celebrate } from '../../engine/ui/celebrate'
import { cameraTarget, render, updateFx, type Camera, type Fx, type View } from './draw'
import { LEVEL } from './level'
import { newGame, step, type GameEvent, type GameState, type Input } from './logic'

export type RunResult = { score: number; coins: number; gems: number; hearts: number; bumps: number }

type Props = {
  paused: boolean
  getInput: RefObject<() => Input>
  onDone: (result: RunResult) => void
}

const VIEW_H = 540
const MIN_VIEW_W = 640 // narrow portrait phones zoom out so she can see what's coming
const END_DELAY = 2.4 // seconds of cake party before the score screen

const SOUND: Partial<Record<GameEvent['type'], SfxName>> = {
  coin: 'coin',
  gem: 'gem',
  jump: 'jump',
  bump: 'bump',
  heartLost: 'nomatch',
  smash: 'smash',
  finish: 'win',
}

const GOLD = ['#FFD84D', '#FFF4B8', '#FFFFFF']
const RAINBOW = ['#FF6B8B', '#FFA94D', '#FFE66D', '#8FE3A0', '#7CC8FF', '#B79CFF']

function sparks(fx: Fx[], x: number, y: number, n: number, colors: string[], size = 7) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const v = 160 + Math.random() * 140
    fx.push({ kind: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 200, life: 0.7, max: 0.7, color: colors[i % colors.length], size })
  }
}

function floatText(fx: Fx[], x: number, y: number, text: string, color = '#FFE66D', size = 24) {
  fx.push({ kind: 'text', x, y: y - 20, vx: 0, vy: -70, life: 1, max: 1, color, size, text })
}

function effects(fx: Fx[], e: GameEvent) {
  switch (e.type) {
    case 'coin':
      sparks(fx, e.x, e.y, 6, GOLD, 6)
      floatText(fx, e.x, e.y, `+${e.points}`)
      break
    case 'gem':
      sparks(fx, e.x, e.y, 12, ['#FF7EB9', '#FFD0E6', '#FFFFFF'], 8)
      floatText(fx, e.x, e.y, `+${e.points}`, '#FFB3D9', 30)
      break
    case 'power':
      sparks(fx, e.x, e.y, 16, RAINBOW, 9)
      floatText(fx, e.x, e.y, `+${e.points}`, '#B8F2E6', 28)
      if (e.kind === 'heart') fx.push({ kind: 'heart', x: e.x, y: e.y, vx: 0, vy: -90, life: 1, max: 1, color: '#FF5C8D', size: 22 })
      break
    case 'smash':
      for (let i = 0; i < 10; i++) {
        fx.push({ kind: 'chunk', x: e.x, y: e.y, vx: (Math.random() - 0.3) * 500, vy: -300 - Math.random() * 300, life: 0.8, max: 0.8, color: i % 2 ? '#D9694F' : '#B4503D', size: 8 + Math.random() * 6 })
      }
      sparks(fx, e.x, e.y, 8, RAINBOW)
      floatText(fx, e.x, e.y, `+${e.points}`, '#FFE66D', 26)
      break
    case 'heartLost':
      fx.push({ kind: 'heart', x: e.x, y: e.y, vx: 30, vy: -120, life: 1.2, max: 1.2, color: '#FF8FB5', size: 18 })
      break
    case 'bump':
      sparks(fx, e.x, e.y - 20, 5, ['#FFFFFF', '#FFE66D'], 8)
      break
    case 'land':
      for (const dir of [-1, 1]) fx.push({ kind: 'puff', x: e.x + dir * 18, y: e.y - 4, vx: dir * 60, vy: -20, life: 0.35, max: 0.35, color: 'rgba(245,204,158,0.8)', size: 8 })
      break
    case 'finish':
      floatText(fx, e.x, e.y - 60, `+${e.points}`, '#FFE66D', 40)
      sparks(fx, e.x, e.y - 40, 24, RAINBOW, 10)
      break
  }
}

// The canvas and the game loop. Everything per-frame lives in refs; React only hears about the end.
export function Course({ paused, getInput, onDone }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pausedRef = useRef(paused)
  const doneRef = useRef(onDone)
  useEffect(() => {
    pausedRef.current = paused
    doneRef.current = onDone
  })

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const s: GameState = newGame(LEVEL)
    let fx: Fx[] = []
    let cam: Camera | null = null
    let cssW = 0
    let cssH = 0
    let dpr = 1
    let scoreBump = 0
    let reported = false
    let topInset = 0

    // env(safe-area-inset-top) only resolves on a real element, so measure a hidden probe.
    const probe = document.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;left:0;width:0;height:env(safe-area-inset-top,0px);visibility:hidden;pointer-events:none'
    document.body.appendChild(probe)

    const resize = () => {
      const r = canvas.getBoundingClientRect()
      cssW = r.width
      cssH = r.height
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.round(cssW * dpr)
      canvas.height = Math.round(cssH * dpr)
      topInset = probe.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let last = performance.now()
    let raf = 0
    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!pausedRef.current) {
        const events = step(s, getInput.current(), dt)
        for (const e of events) {
          const sfx = e.type === 'power' ? (e.kind === 'heart' ? 'heart' : 'power') : SOUND[e.type]
          if (sfx) play(sfx)
          effects(fx, e)
          if ('points' in e && e.points) scoreBump = 1
          if (e.type === 'finish') celebrate()
        }
        fx = updateFx(fx, dt)
        scoreBump = Math.max(0, scoreBump - dt * 5)
      }

      const scale = Math.min(cssH / VIEW_H, cssW / MIN_VIEW_W)
      const view: View = { w: cssW / scale, h: cssH / scale }
      const target = cameraTarget(s, view)
      const cam0 = LEVEL.start.y - view.h * 0.68
      if (!cam) cam = { ...target }
      const k = 1 - Math.exp(-6 * dt)
      cam.x += (target.x - cam.x) * k
      cam.y += (target.y - cam.y) * (1 - Math.exp(-3 * dt))

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      render({ ctx, s, view, cam, cam0, scale, cssW, safeTop: topInset, fx, scoreBump })

      if (s.finished && s.finishT > END_DELAY && !reported) {
        reported = true
        doneRef.current({ score: s.score, coins: s.coins, gems: s.gemsGot, hearts: s.hearts, bumps: s.bumps })
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      probe.remove()
    }
  }, [getInput])

  return <canvas ref={canvasRef} className="rock-canvas" aria-label="Unicorn climbing the red rocks" />
}
