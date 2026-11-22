// Picture-book 2D art for the train maze: one top-down view, real rails on continuous paths,
// three tones and an offset shadow per shape. Pure drawing; the board owns the behaviour.
import { motion } from 'motion/react'
import { memo, useMemo } from 'react'
import { OPPOSITE as OPP, type Level, type States } from './logic'
import {
  FLOWER_COLORS,
  PAPER_PAD,
  VEC,
  bufferCells,
  exitCell,
  exitEntrySide,
  freeSide,
  gridDims,
  offsetPolyline,
  railChains,
  rand,
  resample,
  scenery,
  startCell,
  stationRC,
  toPath,
  type V2,
} from './geom'
import { CELL } from './route'

const K = CELL
const PINK = '#FF7EB9'
const PINK_DARK = '#D95A9B'
const PINK_LIGHT = '#FFB3D9'
const LAV = '#C8B6FF'
const LAV_DARK = '#9C86E0'
const LAV_LIGHT = '#E7DEFF'
const BUTTER = '#FFE66D'
const BUTTER_DARK = '#D6B52F'
const BUTTER_LIGHT = '#FFF6B0'
const GRAPE = '#5B3A8C'
const SHADOW = 'rgba(70,40,110,0.28)'
const RED = '#ff5d73'
const deg = (r: number) => (r * 180) / Math.PI

function Paper({ cols, rows, pad }: { cols: number; rows: number; pad: number }) {
  const x = -pad
  const y = -pad
  const w = cols * K + pad * 2
  const h = rows * K + pad * 2
  return (
    <g>
      <rect x={x + 2} y={y + 12} width={w} height={h} rx="40" fill={SHADOW} />
      <rect x={x} y={y + 7} width={w} height={h} rx="40" fill="#79c185" />
      <rect x={x} y={y} width={w} height={h} rx="40" fill="#A6E3A1" />
      <rect x={x + 7} y={y + 7} width={w - 14} height={h - 14} rx="34" fill="none" stroke="#C9F2C0" strokeWidth="3" opacity="0.8" />
    </g>
  )
}

const Tufts = memo(function Tufts({ level }: { level: Level }) {
  const { cols, rows } = gridDims(level)
  const d: string[] = []
  const l: string[] = []
  for (let i = 0; i < 160; i++) {
    const x = -14 + rand(i, 1, 3) * (cols * K + 28)
    const y = -14 + rand(i, 2, 3) * (rows * K + 28)
    const c = Math.floor(x / K)
    const r = Math.floor(y / K)
    const t = level.grid[r]?.[c]
    if (t !== undefined && t !== '.') continue
    d.push(`M${x.toFixed(1)} ${y.toFixed(1)}l-3 -7M${x.toFixed(1)} ${y.toFixed(1)}l1 -8M${x.toFixed(1)} ${y.toFixed(1)}l4 -6`)
    l.push(`M${(x + 1.2).toFixed(1)} ${(y - 0.5).toFixed(1)}l1 -7`)
  }
  return (
    <g fill="none" strokeLinecap="round">
      <path d={d.join('')} stroke="#6fb77c" strokeWidth="2.4" />
      <path d={l.join('')} stroke="#D3F7CB" strokeWidth="1.4" />
    </g>
  )
})

const Scenery = memo(function Scenery({ level }: { level: Level }) {
  const sc = useMemo(() => scenery(level), [level])
  return (
    <g>
      {sc.pond && (
        <g transform={`translate(${(sc.pond[1] + 0.5) * K} ${(sc.pond[0] + 0.5) * K})`}>
          <ellipse cx="2" cy="9" rx="42" ry="33" fill={SHADOW} />
          <ellipse cx="0" cy="5" rx="42" ry="33" fill="#4f9fbd" />
          <ellipse cx="0" cy="0" rx="42" ry="33" fill="#E9DDB6" />
          <ellipse cx="0" cy="0" rx="35" ry="27" fill="#7fd4f0" />
          <ellipse cx="-4" cy="-3" rx="24" ry="17" fill="#A0E7FF" />
          <path d="M-20 -12q10 -8 22 -7" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.9" />
          <circle cx="14" cy="9" r="7" fill="#5fc37a" />
          <circle cx="13" cy="8" r="4.5" fill="#86e09c" />
          <circle cx="14" cy="8" r="2.4" fill={PINK} />
        </g>
      )}
      {sc.flowers.map((f, i) => (
        <g key={i} transform={`translate(${(f.cell[1] + 0.5 + f.dx) * K} ${(f.cell[0] + 0.5 + f.dy) * K})`}>
          <circle cx="1" cy="2" r="4.6" fill={SHADOW} />
          <circle r="4.4" fill={FLOWER_COLORS[f.hue]} />
          <circle cx="-1" cy="-1" r="1.6" fill="#fff" opacity="0.8" />
          <circle r="1.4" fill={BUTTER_DARK} opacity="0.7" />
        </g>
      ))}
      {sc.trees.map((t, i) => (
        <g key={i} transform={`translate(${(t.cell[1] + 0.5 + t.dx * 0.5) * K} ${(t.cell[0] + 0.5 + t.dy * 0.5) * K}) scale(${t.s})`}>
          <circle cx="4" cy="9" r="20" fill={SHADOW} />
          <circle cx="0" cy="3" r="20" fill="#3F9A5C" />
          <circle cx="0" cy="0" r="20" fill="#5fbf73" />
          <circle cx="-4" cy="-4" r="12" fill="#86e098" />
          <circle cx="-7" cy="-7" r="4.5" fill="#C9F7D2" opacity="0.9" />
        </g>
      ))}
    </g>
  )
})

/** Two rails and sleepers along each continuous chain. The branch a switch isn't set to is ghosted. */
const Rails = memo(function Rails({ level, states }: { level: Level; states: States | null }) {
  const chains = useMemo(() => railChains(level, states), [level, states])
  return (
    <g>
      {chains.map((c, i) => {
        const pts = c.pts.map(([x, y]): V2 => [x * K, y * K])
        const bed = toPath(pts)
        const left = toPath(offsetPolyline(pts, -8.5))
        const right = toPath(offsetPolyline(pts, 8.5))
        const sleepers = resample(c.pts, 0.13)
        const poly = (grow: number) =>
          sleepers
            .map((s) => {
              const a = s.angle
              const ux = Math.cos(a) * (3.6 + grow)
              const uy = Math.sin(a) * (3.6 + grow)
              const vx = -Math.sin(a) * (17 + grow)
              const vy = Math.cos(a) * (17 + grow)
              const cx = s.x * K
              const cy = s.y * K
              return `M${cx - ux - vx} ${cy - uy - vy}L${cx + ux - vx} ${cy + uy - vy}L${cx + ux + vx} ${cy + uy + vy}L${cx - ux + vx} ${cy - uy + vy}Z`
            })
            .join('')
        return (
          <g key={i} opacity={c.ghost ? 0.3 : 1} fill="none" strokeLinejoin="round">
            <path d={bed} stroke="#D9C79D" strokeWidth="34" opacity="0.55" />
            {!c.ghost && <path d={poly(0)} transform="translate(2 3.5)" fill={SHADOW} stroke={SHADOW} strokeWidth="1" />}
            <path d={poly(0)} fill="#8D5F34" stroke="#8D5F34" strokeWidth="1.6" transform="translate(0 1.6)" />
            <path d={poly(0)} fill="#B9854F" stroke="#B9854F" strokeWidth="1.6" />
            <path d={poly(-1.6)} fill="#D2A06A" stroke="none" transform="translate(-0.6 -0.8)" />
            {[left, right].map((d, k) => (
              <g key={k}>
                {!c.ghost && <path d={d} stroke={SHADOW} strokeWidth="5" transform="translate(1.5 3.2)" />}
                <path d={d} stroke="#6a6f8f" strokeWidth="5.6" />
                <path d={d} stroke="#C9CEE6" strokeWidth="3.8" />
                <path d={d} stroke="#F6F8FF" strokeWidth="1.3" transform="translate(-0.5 -0.7)" />
              </g>
            ))}
          </g>
        )
      })}
    </g>
  )
})

const Station = memo(function Station({ level }: { level: Level }) {
  const [r, c] = stationRC(level)
  const [sr, sc] = startCell(level)
  const onTrack = r === sr && c === sc // no free neighbour: stand just above the rail
  const horizontal = level.startDir === 'E' || level.startDir === 'W'
  return (
    <g transform={`translate(${(c + 0.5) * K} ${(r + 0.5) * K}) rotate(${horizontal ? 0 : 90})`}>
      <g transform={`translate(0 ${onTrack ? -38 : -8})`}>
        <rect x="-23" y="-17" width="50" height="38" rx="6" fill={SHADOW} />
        <rect x="-25" y="-20" width="50" height="38" rx="6" fill={PINK_DARK} />
        <path d="M-25 -14a6 6 0 0 1 6 -6H0V18H-19a6 6 0 0 1 -6 -6Z" fill={PINK} />
        <path d="M0 -20H19a6 6 0 0 1 6 6V12a6 6 0 0 1 -6 6H0Z" fill={PINK_DARK} />
        <path d="M-22 -16H-3" stroke={PINK_LIGHT} strokeWidth="2.4" strokeLinecap="round" />
        <rect x="-2" y="-20" width="4" height="38" fill="#B8447F" />
        <rect x="9" y="-12" width="8" height="9" rx="1.5" fill={BUTTER} stroke={BUTTER_DARK} strokeWidth="1.4" />
      </g>
    </g>
  )
})

const Buffers = memo(function Buffers({ level }: { level: Level }) {
  return (
    <>
      {bufferCells(level).map(({ cell, side }) => {
        const v = VEC[side]
        return (
          <g key={cell.join()} transform={`translate(${(cell[1] + 0.5) * K + v[0] * 3} ${(cell[0] + 0.5) * K + v[1] * 3}) rotate(${deg(Math.atan2(v[1], v[0]))})`}>
            {[-15, 15].map((yy) => (
              <g key={yy}>
                <rect x="-16" y={yy - 4} width="14" height="9" rx="2" fill={SHADOW} transform="translate(2 4)" />
                <rect x="-16" y={yy - 4} width="14" height="9" rx="2" fill="#8D5F34" />
                <rect x="-16" y={yy - 4.8} width="14" height="7" rx="2" fill="#B9854F" />
              </g>
            ))}
            <rect x="-4" y="-21" width="10" height="44" rx="4" fill={SHADOW} transform="translate(2 4)" />
            <rect x="-4" y="-20" width="10" height="42" rx="4" fill="#C8394F" />
            <rect x="-4" y="-21.6" width="10" height="40" rx="4" fill={RED} />
            <rect x="-2" y="-19" width="3" height="36" rx="1.5" fill="#ff98a5" />
            {[-11, 9].map((yy) => (
              <rect key={yy} x="-4" y={yy} width="10" height="5" fill="#FFF8F0" opacity="0.9" />
            ))}
          </g>
        )
      })}
    </>
  )
})

/** A big arrow on the way out of a switch, pointing where the train will go. Three tones and a shadow. */
function Arrow({ dir }: { dir: Level['startDir'] }) {
  const [vx, vy] = VEC[dir]
  const rot = deg(Math.atan2(vy, vx))
  return (
    <g transform={`translate(${50 + vx * 33} ${50 + vy * 33}) rotate(${rot})`}>
      <path d="M-13 -15L13 0L-13 15Z" fill={SHADOW} transform="translate(2 4)" strokeLinejoin="round" stroke={SHADOW} strokeWidth="4" />
      <path d="M-13 -15L13 0L-13 15Z" fill={BUTTER_DARK} stroke={BUTTER_DARK} strokeWidth="4" strokeLinejoin="round" transform="translate(0 1.8)" />
      <path d="M-13 -15L13 0L-13 15Z" fill={BUTTER} stroke={BUTTER} strokeWidth="4" strokeLinejoin="round" />
      <path d="M-9 -9L5 -2" stroke={BUTTER_LIGHT} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

/** The turntable and lever seen from above, beside the rails. Round green lamp = first way, square red lamp = second. */
function Lever({ level, id, setting }: { level: Level; id: number; setting: number }) {
  const sw = level.switches.find((s) => s.id === id)!
  const f = VEC[freeSide(level, id)]
  const cx = 50 + f[0] * 37
  const cy = 50 + f[1] * 37
  const ang = (b: number) => deg(Math.atan2(VEC[sw.branches[b]][1], VEC[sw.branches[b]][0]))
  const a0 = ang(0)
  let d = ang(1) - a0
  d = ((d + 540) % 360) - 180 // shortest way round
  const rot = setting === 0 ? a0 : a0 + d
  return (
    <g>
      <circle cx={cx + 2} cy={cy + 5} r="15" fill={SHADOW} />
      <circle cx={cx} cy={cy + 2.5} r="15" fill={PINK_DARK} />
      <circle cx={cx} cy={cy} r="15" fill={PINK} />
      <circle cx={cx} cy={cy} r="10" fill={LAV} stroke={LAV_DARK} strokeWidth="1.6" />
      {sw.branches.map((b, i) => (
        <circle key={i} cx={cx + VEC[b][0] * 12.5} cy={cy + VEC[b][1] * 12.5} r="2" fill={BUTTER} />
      ))}
      <g style={{ transformOrigin: `${cx}px ${cy}px`, transform: `rotate(${rot}deg)`, transition: 'transform 0.22s cubic-bezier(.3,1.6,.5,1)' }}>
        <rect x={cx + 1} y={cy} width="30" height="8" rx="4" fill={SHADOW} />
        <rect x={cx - 1} y={cy - 2.2} width="30" height="8" rx="4" fill={BUTTER_DARK} />
        <rect x={cx - 1} y={cy - 4} width="30" height="8" rx="4" fill={BUTTER} />
        <rect x={cx + 2} y={cy - 2.6} width="20" height="2.4" rx="1.2" fill={BUTTER_LIGHT} />
        {setting === 0 ? (
          <g>
            <circle cx={cx + 31} cy={cy + 2.5} r="7.5" fill="#2f8f57" />
            <circle cx={cx + 31} cy={cy} r="7.5" fill="#5fd38a" />
            <circle cx={cx + 29} cy={cy - 2.5} r="2.4" fill="#C8F5D8" />
          </g>
        ) : (
          <g>
            <rect x={cx + 23.5} y={cy - 5} width="15" height="15" rx="3" fill="#9c2a3d" />
            <rect x={cx + 23.5} y={cy - 7.5} width="15" height="15" rx="3" fill={RED} />
            <rect x={cx + 25.5} y={cy - 5.5} width="5" height="4" rx="1.5" fill="#ffb3bd" />
          </g>
        )}
      </g>
    </g>
  )
}

type SwitchProps = { level: Level; states: States | null; id: number; flips: number; wiggle: boolean }

/** One switch tile's marks: a big arrow plus the little lever. Squashes when tapped, wiggles when it's the wrong one. */
function SwitchArt({ level, states, id, flips, wiggle }: SwitchProps) {
  const sw = level.switches.find((s) => s.id === id)!
  const [row, col] = sw.cell
  const setting = states?.[id] ?? 0
  return (
    <g transform={`translate(${col * K} ${row * K})`}>
      <motion.g
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        animate={wiggle ? { rotate: [0, -9, 9, -7, 7, -3, 0], transition: { duration: 0.7, repeat: 1 } } : { rotate: 0 }}
      >
        <motion.g
          key={flips}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          animate={flips > 0 ? { scaleX: [1.14, 0.96, 1], scaleY: [0.72, 1.08, 1], transition: { duration: 0.28 } } : {}}
        >
          <Arrow dir={sw.branches[setting]} />
          <Lever level={level} id={id} setting={setting} />
        </motion.g>
      </motion.g>
    </g>
  )
}

type StaticProps = { level: Level; states: States | null; flips: Record<number, number>; wiggle: number | null; pad?: number }

/** Everything on the board that does not move every frame. Memoised so train movement leaves it alone. */
export const StaticLayer = memo(function StaticLayer({ level, states, flips, wiggle, pad = PAPER_PAD }: StaticProps) {
  const { cols, rows } = gridDims(level)
  return (
    <g>
      <Paper cols={cols} rows={rows} pad={pad} />
      <Tufts level={level} />
      <Scenery level={level} />
      <Rails level={level} states={states} />
      <Station level={level} />
      <Buffers level={level} />
      {level.switches.map((sw) => (
        <SwitchArt key={sw.id} level={level} states={states} id={sw.id} flips={flips[sw.id] ?? 0} wiggle={wiggle === sw.id} />
      ))}
    </g>
  )
})

/** The hill over the end of the track. Drawn above the train so it rolls in underneath. */
export const TunnelArt = memo(function TunnelArt({ level }: { level: Level }) {
  const [r, c] = exitCell(level)
  const far = VEC[OPP[exitEntrySide(level)]]
  return (
    <g transform={`translate(${(c + 0.5) * K} ${(r + 0.5) * K}) rotate(${deg(Math.atan2(far[1], far[0]))})`}>
      <rect x="-32" y="-37" width="112" height="82" rx="34" fill={SHADOW} />
      <rect x="-34" y="-40" width="112" height="82" rx="32" fill="#4AA56B" />
      <rect x="-34" y="-41" width="112" height="80" rx="32" fill="#7fd884" />
      <rect x="-26" y="-35" width="92" height="62" rx="28" fill="#9BE39B" />
      <ellipse cx="18" cy="-22" rx="28" ry="9" fill="#C9F7C4" opacity="0.8" />
      <rect x="-40" y="-18" width="16" height="36" rx="8" fill="#2d1b4e" />
      <rect x="-40" y="-18" width="16" height="36" rx="8" fill="none" stroke="#E7E1F2" strokeWidth="5" />
      <rect x="-41" y="-19" width="14" height="38" rx="7" fill="none" stroke="#fff" strokeWidth="1.4" opacity="0.7" />
      {[
        [14, -16, BUTTER],
        [42, 6, PINK],
        [20, 16, '#B8F2E6'],
      ].map(([x, y, col], i) => (
        <g key={i}>
          <circle cx={Number(x) + 1} cy={Number(y) + 2} r="5" fill={SHADOW} />
          <circle cx={Number(x)} cy={Number(y)} r="5" fill={String(col)} />
          <circle cx={Number(x) - 1} cy={Number(y) - 1.2} r="1.6" fill="#fff" opacity="0.8" />
        </g>
      ))}
    </g>
  )
})

/** The engine from above, heading +x, middle at 0,0. Front tip at x = 47. */
export const Engine = memo(function Engine() {
  return (
    <g>
      <rect x="-30" y="-12" width="76" height="30" rx="12" fill={SHADOW} />
      {[-21, -4, 13, 29].map((x) =>
        [-1, 1].map((s) => (
          <g key={`${x}${s}`}>
            <rect x={x - 6} y={s * 14.4 - 3.4} width="12" height="6.8" rx="2.4" fill="#2c1b46" />
            <rect x={x - 6} y={s * 14.4 - 3.4 - 0.8} width="12" height="5.6" rx="2.4" fill="#4a3070" />
            <rect x={x - 2.5} y={s * 14.4 - 1.4} width="5" height="2.8" rx="1" fill={BUTTER} />
          </g>
        )),
      )}
      <rect x="-31" y="-12.5" width="68" height="25" rx="7" fill="#3f2766" />
      <rect x="-31" y="-13.5" width="68" height="25" rx="7" fill={GRAPE} />
      <path d="M36 -9L47 0L36 9Z" fill="#8C75B8" stroke="#3f2766" strokeWidth="1.4" strokeLinejoin="round" />
      <rect x="-2" y="-9" width="40" height="19" rx="9.5" fill={PINK_DARK} />
      <rect x="-2" y="-10.5" width="40" height="19" rx="9.5" fill={PINK} />
      <rect x="2" y="-9" width="32" height="5" rx="2.5" fill={PINK_LIGHT} />
      {[8, 22].map((x) => (
        <rect key={x} x={x} y="-10.5" width="3.2" height="19" fill="#B8447F" opacity="0.7" />
      ))}
      <circle cx="32" cy="-1.5" r="3.4" fill={BUTTER_DARK} />
      <circle cx="32" cy="-2.4" r="3" fill={BUTTER} />
      <circle cx="14" cy="-1" r="6.4" fill="#8C75B8" />
      <circle cx="14" cy="-2" r="5.6" fill={LAV} />
      <circle cx="12.6" cy="-3.4" r="2.2" fill={LAV_LIGHT} />
      <circle cx="24" cy="-1.5" r="7" fill={BUTTER_DARK} />
      <circle cx="24" cy="-2.5" r="6.2" fill={BUTTER} />
      <circle cx="24" cy="-2.5" r="3.6" fill={GRAPE} />
      <circle cx="22.8" cy="-3.8" r="1.2" fill="#8C75B8" />
      <rect x="-31" y="-15.5" width="30" height="31" rx="7" fill={LAV_DARK} />
      <rect x="-31" y="-17" width="30" height="31" rx="7" fill={LAV} />
      <rect x="-27" y="-14" width="22" height="3.4" rx="1.7" fill={LAV_LIGHT} />
      <rect x="-31" y="-3" width="30" height="2.6" fill={LAV_DARK} opacity="0.7" />
    </g>
  )
})

/** A small picture of a level for the picker cards: the board without the train, both ways of each switch at full strength. */
export function MiniTrack({ level, width }: { level: Level; width: number }) {
  const { cols, rows } = gridDims(level)
  const vw = cols * K + 52
  const vh = rows * K + 60
  return (
    <svg viewBox={`-26 -26 ${vw} ${vh}`} width={width} height={(width * vh) / vw} aria-hidden>
      <StaticLayer level={level} states={null} flips={{}} wiggle={null} />
      <TunnelArt level={level} />
    </svg>
  )
}
