// The dino conductor: a butter stegosaurus with peach plates and a navy cap, drawn in the same
// picture-book style as the Memory Match creatures (grape outline, big shiny eyes, rosy cheeks).
// Drawn in a 200 x 200 box. He never talks and never shows text.
import { Cheeks, Eyes, LINE, Smile } from '../memory-match/creatures/parts'

export type DinoMode = 'idle' | 'wave' | 'point' | 'cheer'

const BUTTER = '#FFE48A'
const BUTTER_DARK = '#E7BE55'
const BUTTER_LIGHT = '#FFF4C6'
const PEACH = '#FFAE86'
const PEACH_LIGHT = '#FFD5BB'
const NAVY = '#2E3C78'
const NAVY_LIGHT = '#4A5CA3'

function Plate({ x, y, rot }: { x: number; y: number; rot: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <path d="M-15 4Q-12 -22 0 -38Q12 -22 15 4Z" fill={PEACH} {...LINE} strokeWidth={5} />
      <path d="M-7 -2Q-6 -16 0 -26" fill="none" stroke={PEACH_LIGHT} strokeWidth="4" strokeLinecap="round" />
    </g>
  )
}

/** One arm, drawn along +x from the shoulder at the origin. Rotate it to aim it. */
function Arm() {
  return (
    <g>
      <rect x="0" y="-9" width="38" height="18" rx="9" fill={BUTTER} {...LINE} strokeWidth={5} />
      <circle cx="38" cy="0" r="11" fill={BUTTER} {...LINE} strokeWidth={5} />
      <path d="M8 -3H26" stroke={BUTTER_LIGHT} strokeWidth="3" strokeLinecap="round" />
    </g>
  )
}

const RIGHT = { x: 146, y: 132 }
const LEFT = { x: 54, y: 132 }

/** `aim` is the direction to point in, in degrees (0 = right, 90 = down), used in 'point' mode. */
export function Dino({ mode, aim = 0 }: { mode: DinoMode; aim?: number }) {
  // Which arm does what. Static angles are SVG attributes; the wobble on top is CSS (see train.css).
  const pointRight = Math.cos((aim * Math.PI) / 180) >= 0
  const right =
    mode === 'wave' ? { rot: -50, anim: 'dino-arm--wave' }
    : mode === 'cheer' ? { rot: -65, anim: 'dino-arm--cheer' }
    : mode === 'point' && pointRight ? { rot: aim, anim: 'dino-arm--point' }
    : { rot: 65, anim: '' }
  const left =
    mode === 'cheer' ? { rot: -115, anim: 'dino-arm--cheer' }
    : mode === 'point' && !pointRight ? { rot: aim, anim: 'dino-arm--point' }
    : { rot: 115, anim: '' }

  return (
    <g className={`dino dino--${mode}`}>
      {/* plates and tail sit behind the body */}
      <path d="M140 160Q176 168 184 140Q188 150 176 168Q160 184 134 176Z" fill={BUTTER} {...LINE} strokeWidth={5} />
      <Plate x={184} y={146} rot={50} />
      <Plate x={44} y={74} rot={-52} />
      <Plate x={156} y={74} rot={52} />
      <Plate x={38} y={128} rot={-82} />
      <Plate x={162} y={128} rot={82} />
      {/* feet */}
      <ellipse cx="72" cy="182" rx="22" ry="11" fill={BUTTER_DARK} {...LINE} strokeWidth={5} />
      <ellipse cx="128" cy="182" rx="22" ry="11" fill={BUTTER_DARK} {...LINE} strokeWidth={5} />
      {/* body */}
      <ellipse cx="100" cy="140" rx="52" ry="42" fill={BUTTER} {...LINE} />
      <ellipse cx="100" cy="150" rx="32" ry="26" fill={BUTTER_LIGHT} />
      <path d="M62 120Q70 106 84 104" fill="none" stroke={BUTTER_LIGHT} strokeWidth="5" strokeLinecap="round" />
      {/* arms */}
      <g transform={`translate(${LEFT.x} ${LEFT.y})`}>
        <g className={left.anim}>
          <g transform={`rotate(${left.rot})`}>
            <Arm />
          </g>
        </g>
      </g>
      <g transform={`translate(${RIGHT.x} ${RIGHT.y})`}>
        <g className={right.anim}>
          <g transform={`rotate(${right.rot})`}>
            <Arm />
          </g>
        </g>
      </g>
      {/* head */}
      <ellipse cx="100" cy="88" rx="50" ry="42" fill={BUTTER} {...LINE} />
      <path d="M62 100Q64 112 76 120" fill="none" stroke={BUTTER_DARK} strokeWidth="5" strokeLinecap="round" />
      <Eyes y={92} dx={20} r={12} />
      <Cheeks y={110} dx={34} />
      <Smile y={112} w={13} />
      {/* conductor's cap */}
      <path d="M56 72Q58 28 100 26Q142 28 144 72Z" fill={NAVY} {...LINE} />
      <path d="M68 56Q76 38 96 36" fill="none" stroke={NAVY_LIGHT} strokeWidth="5" strokeLinecap="round" />
      <rect x="52" y="64" width="96" height="14" rx="7" fill={NAVY} {...LINE} strokeWidth={5} />
      <circle cx="100" cy="48" r="9" fill="#FFE66D" {...LINE} strokeWidth={4} />
      <path d="M100 42l2.2 4.6 5 .7-3.6 3.5.9 5-4.5-2.4-4.5 2.4.9-5-3.6-3.5 5-.7Z" fill={PEACH} />
    </g>
  )
}

/** The dino standing on his little platform in a board cell, 76 board units tall.
 *  `x, y` is the middle of the cell. */
export function BoardDino({ x, y, mode, aim }: { x: number; y: number; mode: DinoMode; aim?: number }) {
  return (
    <g>
      <rect x={x - 41} y={y + 21} width="86" height="20" rx="9" fill="rgba(70,40,110,0.28)" />
      <rect x={x - 44} y={y + 17} width="86" height="20" rx="9" fill="#9C86E0" />
      <rect x={x - 44} y={y + 14} width="86" height="20" rx="9" fill="#C8B6FF" />
      <rect x={x - 36} y={y + 17} width="50" height="4" rx="2" fill="#E7DEFF" />
      <g transform={`translate(${x - 38} ${y - 46}) scale(0.38)`}>
        <Dino mode={mode} aim={aim} />
      </g>
    </g>
  )
}
