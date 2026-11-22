import { motion } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { play, startChug, stopChug } from '../../engine/audio'
import { celebrate } from '../../engine/ui/celebrate'
import { gridSize } from './layout'
import { initialStates, toggle, trace, type Level, type States } from './logic'
import { buildRoute, CELL, pointAt, WAIT_AT_RED, WAIT_GAP } from './route'
import { Engine, StaticLayer, TunnelArt } from './TrackArt'
import { useTrainLayout } from './useTrainLayout'

// set: she arranges the switches. roll: the train follows the track. wait: (kid-test variant)
// the train waits at a red switch. bump: stuck at a buffer. back: reversing to the station.
// arrive: through the tunnel.
type Phase = 'set' | 'roll' | 'wait' | 'bump' | 'back' | 'arrive'

const SPEED = 300 // units per second; one cell is 100
const BACK_SPEED = 420
const BUMP_PAUSE_MS = 1000
const ARRIVE_MS = 1700
const PUFF_EVERY_S = 0.17

type Puff = { id: number; x: number; y: number }

type Props = { base: Level; onWin: () => void; paused: boolean }

export function TrainBoard({ base, onWin, paused }: Props) {
  const { level, layout } = useTrainLayout(base)
  const { cell, go, margin, portrait } = layout
  const { cols, rows } = gridSize(level)

  const [states, setStates] = useState<States>(() => initialStates(base))
  const [phase, setPhase] = useState<Phase>('set')
  const [pos, setPos] = useState(0)
  const [flips, setFlips] = useState<Record<number, number>>({})
  const [wiggle, setWiggle] = useState<number | null>(null)
  const [puffs, setPuffs] = useState<Puff[]>([])

  const tr = useMemo(() => trace(level, states), [level, states])
  const route = useMemo(() => buildRoute(level, tr), [level, tr])

  // The animation loop reads the latest values from here instead of restarting on every change.
  const live = useRef({ route, states, tr, paused, onWin })
  useEffect(() => {
    live.current = { route, states, tr, paused, onWin }
  })
  const posRef = useRef(0)
  const waitId = useRef<number | null>(null)
  const puffId = useRef(0)

  // The chug must never outlive the game.
  useEffect(() => stopChug, [])

  useEffect(() => {
    if (phase !== 'roll' && phase !== 'back') return
    const forward = phase === 'roll'
    startChug()
    let raf = 0
    let last = performance.now()
    let sincePuff = 0
    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      const { route: r, states: st } = live.current
      if (live.current.paused) {
        raf = requestAnimationFrame(frame)
        return
      }
      const prev = posRef.current
      let next: number
      if (forward) {
        const speed = Math.min(SPEED, 45 + (r.length - prev) * 4) // eases into the buffer
        next = Math.min(prev + speed * dt, r.length)
        if (WAIT_AT_RED) {
          const stop = r.switchStops.find((s) => st[s.id] === 1 && prev < s.s - WAIT_GAP && s.s - WAIT_GAP <= next)
          if (stop) {
            posRef.current = stop.s - WAIT_GAP
            setPos(posRef.current)
            waitId.current = stop.id
            setPhase('wait')
            return
          }
        }
      } else {
        next = Math.max(prev - BACK_SPEED * dt, 0)
      }
      posRef.current = next
      setPos(next)

      sincePuff += dt
      if (sincePuff > PUFF_EVERY_S) {
        sincePuff = 0
        const p = pointAt(r, next)
        const id = ++puffId.current
        const x = p.x + Math.cos(p.angle) * 24
        const y = p.y + Math.sin(p.angle) * 24
        setPuffs((all) => [...all.slice(-6), { id, x, y }])
      }

      if (forward && next >= r.length) {
        setPhase(r.exit ? 'arrive' : 'bump')
      } else if (!forward && next <= 0) {
        setWiggle(null)
        setPhase('set')
      } else {
        raf = requestAnimationFrame(frame)
      }
    }
    raf = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(raf)
      stopChug()
    }
  }, [phase])

  // Pausing (the leave dialog) silences the chug and holds the timers below.
  useEffect(() => {
    if (paused) stopChug()
    else if (phase === 'roll' || phase === 'back') startChug()
  }, [paused, phase])

  // Dead end: a soft bump and the wrong switch wiggles...
  useEffect(() => {
    if (phase !== 'bump') return
    play('bump')
    setWiggle(live.current.tr.blame ?? null)
  }, [phase])

  // ...then she backs up on her own.
  useEffect(() => {
    if (phase !== 'bump' || paused) return
    const t = setTimeout(() => setPhase('back'), BUMP_PAUSE_MS)
    return () => clearTimeout(t)
  }, [phase, paused])

  // Exit: whistle and confetti...
  useEffect(() => {
    if (phase !== 'arrive') return
    play('whistle')
    celebrate()
  }, [phase])

  // ...then the win screen, never while the leave dialog is open.
  useEffect(() => {
    if (phase !== 'arrive' || paused) return
    const t = setTimeout(() => live.current.onWin(), ARRIVE_MS)
    return () => clearTimeout(t)
  }, [phase, paused])

  const pressGo = () => {
    if (phase !== 'set' || paused) return
    play('whistle')
    posRef.current = 0
    setPos(0)
    setWiggle(null)
    setPhase('roll')
  }

  const tap = (id: number) => {
    if (paused) return
    const open = phase === 'set' || (phase === 'wait' && waitId.current === id)
    if (!open) {
      play('locked')
      return
    }
    play('clack')
    setStates((s) => toggle(s, id, level))
    setFlips((f) => ({ ...f, [id]: (f[id] ?? 0) + 1 }))
    setWiggle(null)
    if (phase === 'wait') {
      waitId.current = null
      setPhase('roll')
    }
  }

  const pad = layout.paper // the paper border around the cells, in px
  const padU = (pad * CELL) / cell // the same, in board units
  const viewBox = `${-padU} ${-padU} ${cols * CELL + padU * 2} ${rows * CELL + padU * 2}`
  const pose = pointAt(route, pos)
  const locked = phase !== 'set'

  return (
    <div
      className={`tr-play ${portrait ? 'tr-play--portrait' : 'tr-play--land'}`}
      style={{
        ['--go' as string]: `${go}px`,
        padding: `${margin.top}px ${margin.right}px ${margin.bottom}px ${margin.left}px`,
      }}
    >
      <div className="tr-col">
      <div className="tr-header" style={{ height: layout.header - 0, paddingBottom: layout.header - go }}>
        <motion.button
          type="button"
          className={`tr-go ${locked ? '' : 'tr-go--ready'}`}
          aria-label="Go"
          disabled={locked}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          onClick={pressGo}
        >
          <svg viewBox="0 0 64 64" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            <circle cx="26" cy="38" r="17" fill="var(--sky)" />
            <path d="M26 21h30v8H40" fill="var(--sky)" />
            <circle cx="26" cy="38" r="5" fill="var(--cream)" />
            <path d="M44 8v6M54 11l-4 5M34 8l4 6" />
          </svg>
        </motion.button>
        <h2 className="tr-title">All aboard!</h2>
      </div>
      <div className="tr-stage" style={{ width: cols * cell + pad * 2, height: rows * cell + pad * 2 }}>
        {/* Two stacked SVGs share one viewBox: the still scenery is painted once, only the top one repaints per frame. */}
        <svg viewBox={viewBox} width={cols * cell + pad * 2} height={rows * cell + pad * 2} className="tr-svg">
          <StaticLayer level={level} states={states} flips={flips} wiggle={wiggle} pad={padU} />
        </svg>
        <svg viewBox={viewBox} width={cols * cell + pad * 2} height={rows * cell + pad * 2} className="tr-svg tr-svg--top">
          <g transform={`translate(${pose.x} ${pose.y}) rotate(${(pose.angle * 180) / Math.PI})`}>
            <Engine />
          </g>
          {puffs.map((p) => (
            <PuffDot key={p.id} puff={p} onDone={() => setPuffs((all) => all.filter((q) => q.id !== p.id))} />
          ))}
          <TunnelArt level={level} />
        </svg>
        {level.switches.map((sw) => (
          <button
            key={sw.id}
            type="button"
            className="tr-switch"
            aria-label="Switch"
            style={{ left: pad + sw.cell[1] * cell, top: pad + sw.cell[0] * cell, width: cell, height: cell }}
            onClick={() => tap(sw.id)}
          />
        ))}
      </div>
      </div>
    </div>
  )
}

function PuffDot({ puff, onDone }: { puff: Puff; onDone: () => void }) {
  return (
    <motion.circle
      cx={puff.x}
      cy={puff.y}
      r="9"
      fill="white"
      stroke="var(--grape)"
      strokeWidth="2.5"
      initial={{ opacity: 0.95, scale: 0.5, y: 0 }}
      animate={{ opacity: 0, scale: 1.7, y: -48 }}
      transition={{ duration: 0.9, ease: 'easeOut' }}
      onAnimationComplete={onDone}
    />
  )
}
