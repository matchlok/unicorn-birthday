// The opening close-up: the unicorn in the engine cab, steam puffing, the dino on the platform
// waving. Pure drawing. All motion is CSS (train.css), so it stops cleanly when the scene unmounts.
import { Unicorn } from '../memory-match/creatures/unicorn'
import { Dino } from './DinoArt'

const SHADOW = 'rgba(70,40,110,0.28)'
const GRAPE = '#5B3A8C'
const PINK = '#FF7EB9'
const PINK_DARK = '#D95A9B'
const PINK_LIGHT = '#FFB3D9'
const LAV = '#C8B6FF'
const LAV_DARK = '#9C86E0'
const BUTTER = '#FFE66D'

const OUT = { stroke: GRAPE, strokeWidth: 5, strokeLinejoin: 'round' } as const

function Wheel({ x }: { x: number }) {
  return (
    <g className="tr-wheel" style={{ transformOrigin: `${x}px 226px`, transformBox: 'view-box' }}>
      <circle cx={x + 2} cy="230" r="25" fill={SHADOW} />
      <circle cx={x} cy="226" r="25" fill={LAV} {...OUT} />
      <circle cx={x} cy="226" r="9" fill={BUTTER} {...OUT} strokeWidth={4} />
      <path d={`M${x} 204V248M${x - 22} 226H${x + 22}`} stroke={LAV_DARK} strokeWidth="4" />
    </g>
  )
}

export function IntroScene({ toot }: { toot: boolean }) {
  return (
    <svg className="tr-intro__svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden>
      {/* ground and track */}
      <ellipse cx="200" cy="316" rx="330" ry="96" fill="#79c185" />
      <ellipse cx="200" cy="310" rx="330" ry="92" fill="#A6E3A1" />
      <rect x="-10" y="238" width="420" height="30" fill="#D9C79D" opacity="0.7" />
      {Array.from({ length: 22 }, (_, i) => (
        <rect key={i} x={i * 20 - 6} y="244" width="9" height="22" rx="2" fill="#B9854F" />
      ))}
      <rect x="-10" y="246" width="420" height="5" rx="2.5" fill="#C9CEE6" stroke="#6a6f8f" strokeWidth="1.5" />
      <rect x="-10" y="259" width="420" height="5" rx="2.5" fill="#C9CEE6" stroke="#6a6f8f" strokeWidth="1.5" />

      {/* the engine; it hops when the whistle toots */}
      <g className={toot ? 'tr-hop' : ''}>
        <rect x="14" y="160" width="204" height="62" rx="14" fill={SHADOW} transform="translate(4 8)" />
        {/* boiler */}
        <rect x="74" y="148" width="146" height="72" rx="22" fill={PINK} {...OUT} />
        <rect x="84" y="156" width="120" height="12" rx="6" fill={PINK_LIGHT} />
        <rect x="116" y="148" width="9" height="72" fill={PINK_DARK} />
        <rect x="160" y="148" width="9" height="72" fill={PINK_DARK} />
        <circle cx="218" cy="182" r="14" fill={BUTTER} {...OUT} />
        <circle cx="214" cy="178" r="4" fill="#fff" />
        {/* chimney */}
        <rect x="170" y="110" width="26" height="42" fill={GRAPE} {...OUT} />
        <rect x="162" y="100" width="42" height="14" rx="7" fill={BUTTER} {...OUT} />
        {/* cab */}
        <rect x="14" y="82" width="90" height="140" rx="16" fill={LAV} {...OUT} />
        <rect x="6" y="68" width="106" height="22" rx="11" fill={PINK_DARK} {...OUT} />
        <rect x="22" y="94" width="14" height="110" rx="7" fill="#E7DEFF" opacity="0.8" />
        <circle cx="62" cy="142" r="40" fill="#A0E7FF" {...OUT} />
        <clipPath id="tr-cab-window">
          <circle cx="62" cy="142" r="36" />
        </clipPath>
        <g clipPath="url(#tr-cab-window)">
          <svg x="24" y="104" width="76" height="76">
            <Unicorn />
          </svg>
        </g>
        <rect x="56" y="54" width="12" height="16" rx="5" fill={BUTTER} {...OUT} strokeWidth={4} />
        <Wheel x={52} />
        <Wheel x={118} />
        <Wheel x={184} />
      </g>

      {/* steam */}
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} className="tr-steam" cx={183 + (i % 2) * 6} cy="96" r="14" fill="#fff" stroke={GRAPE} strokeWidth="3" style={{ animationDelay: `${i * 0.55}s` }} />
      ))}
      {toot &&
        [0, 1, 2].map((i) => (
          <circle key={`t${i}`} className="tr-steam tr-steam--toot" cx={62 + (i - 1) * 10} cy="50" r="12" fill="#fff" stroke={GRAPE} strokeWidth="3" style={{ animationDelay: `${i * 0.08}s` }} />
        ))}

      {/* the platform and the dino conductor */}
      <rect x="226" y="198" width="190" height="44" rx="10" fill={SHADOW} transform="translate(4 6)" />
      <rect x="226" y="198" width="190" height="44" rx="10" fill={LAV_DARK} {...OUT} />
      <rect x="226" y="190" width="190" height="22" rx="10" fill={LAV} {...OUT} />
      <rect x="240" y="196" width="90" height="5" rx="2.5" fill="#E7DEFF" />
      <g transform="translate(220 38) scale(0.82)">
        <Dino mode="wave" />
      </g>
    </svg>
  )
}
