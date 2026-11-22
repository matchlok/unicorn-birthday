import { useEffect, useMemo, useState } from 'react'
import { readSafeInsets } from '../memory-match/useBoardLayout'
import { gridSize, trainLayout, type TrainLayout } from './layout'
import { transpose, type Level } from './logic'

const measure = () => ({ width: window.innerWidth, height: window.innerHeight })

/** The level turned on its side on a portrait phone, plus the sizes for the current screen.
 *  Recomputes on resize and rotation. */
export function useTrainLayout(base: Level): { level: Level; layout: TrainLayout } {
  const [vp, setVp] = useState(measure)
  useEffect(() => {
    const update = () => setVp(measure())
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [])
  const portrait = vp.height > vp.width
  const level = useMemo(() => (portrait ? transpose(base) : base), [base, portrait])
  const layout = useMemo(() => trainLayout(vp, gridSize(level), readSafeInsets()), [vp, level])
  return { level, layout }
}
