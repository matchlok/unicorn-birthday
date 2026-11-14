import { animate, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useStore } from '../../engine/store'
import { BigButton } from '../../engine/ui/BigButton'
import { celebrateBig } from '../../engine/ui/celebrate'
import type { Finished } from './RockClimb'

type Props = { result: Finished; onReplay: () => void; onHome: () => void }

const MEDALS = ['🥇', '🥈', '🥉', '⭐', '⭐']
const LETTER_COLORS = ['var(--pink-deep)', 'var(--lavender)', 'var(--sky)', 'var(--butter)', 'var(--mint)', 'var(--peach)']

function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0)
  useEffect(() => {
    const c = animate(0, to, { duration: 1.6, ease: 'easeOut', onUpdate: (v) => setN(Math.round(v)) })
    return () => c.stop()
  }, [to])
  return <>{n}</>
}

// Summit party: score, what she found, and the high score table.
export function RockEnd({ result, onReplay, onHome }: Props) {
  const name = useStore((s) => s.unicornName)
  const title = `Yay${name ? `, ${name}` : ''}!`
  const { rank } = result

  useEffect(() => celebrateBig(), [])

  return (
    <div className="rock-end">
      <h1 className="rock-end__title" aria-label={title}>
        {[...title].map((ch, i) => (
          <motion.span
            key={i}
            aria-hidden
            style={{ color: LETTER_COLORS[i % LETTER_COLORS.length], display: 'inline-block', whiteSpace: 'pre' }}
            initial={{ y: -200, scale: 0, opacity: 0 }}
            animate={{ y: [0, -14, 0], scale: 1, opacity: 1 }}
            transition={{
              y: { repeat: Infinity, duration: 0.9, delay: 0.6 + i * 0.07 },
              scale: { type: 'spring', stiffness: 300, damping: 10, delay: i * 0.06 },
              opacity: { duration: 0.1, delay: i * 0.06 },
            }}
          >
            {ch}
          </motion.span>
        ))}
      </h1>

      <div className="rock-end__panel">
        <div className="rock-end__left">
          {rank !== null && (
            <motion.div
              className={`rock-end__badge${rank === 0 ? ' rock-end__badge--best' : ''}`}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: [-4, 4, -4] }}
              transition={{ scale: { type: 'spring', stiffness: 220, damping: 9, delay: 1.7 }, rotate: { repeat: Infinity, duration: 1.4 } }}
            >
              {rank === 0 ? '🏆 New best!' : `${MEDALS[rank]} High score!`}
            </motion.div>
          )}
          <div className="rock-end__score" aria-label={`Score ${result.score}`}>
            <span className="rock-end__coin" aria-hidden>
              🪙
            </span>
            <CountUp to={result.score} />
          </div>
          <div className="rock-end__found">
            <span title="coins">🪙 {result.coins}</span>
            <span title="gems">💎 {result.gems}</span>
            <span title="hearts left">❤️ {result.hearts}</span>
          </div>
        </div>

        <ol className="rock-end__table" aria-label="High scores">
          {result.table.map((e, i) => (
            <motion.li
              key={`${e.at}-${i}`}
              className={e.at === result.at ? 'rock-end__row rock-end__row--me' : 'rock-end__row'}
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4 + i * 0.12, type: 'spring', stiffness: 260, damping: 20 }}
            >
              <span className="rock-end__medal" aria-hidden>
                {MEDALS[i]}
              </span>
              <span className="rock-end__name">{e.name}</span>
              <span className="rock-end__pts">{e.score}</span>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="rock-end__buttons">
        <BigButton onClick={onReplay} color="var(--mint)" label="Climb again">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="var(--grape)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M38 24a14 14 0 1 1-5-10.7" />
            <path d="M36 6v10H26" />
          </svg>
        </BigButton>
        <BigButton onClick={onHome} color="var(--butter)" label="Back to party">
          <svg viewBox="0 0 48 48" width="52" height="52" fill="none" stroke="var(--grape)" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
            <path d="M6 22 24 7l18 15" />
            <path d="M10 20v22h28V20" fill="var(--pink)" />
            <path d="M20 42V28h8v14" fill="var(--butter)" />
          </svg>
        </BigButton>
      </div>
    </div>
  )
}
