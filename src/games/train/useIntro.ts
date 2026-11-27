import { useCallback, useEffect, useRef, useState } from 'react'
import { play } from '../../engine/audio'
import { introFrame, introTotalMs, type IntroFrame, type IntroPlan } from './intro'

/** Runs the opening on a clock that holds while `paused`. Any key skips it; `skip()` does the same for a tap. */
export function useIntro(plan: IntroPlan, paused: boolean): { frame: IntroFrame; toot: boolean; skip: () => void } {
  const [frame, setFrame] = useState<IntroFrame>(() => introFrame(plan, 0))
  const [toot, setToot] = useState(false)
  const elapsed = useRef(0)
  const pausedRef = useRef(paused)
  const tooted = useRef(false)
  useEffect(() => {
    pausedRef.current = paused
  })

  const skip = useCallback(() => {
    elapsed.current = introTotalMs(plan)
  }, [plan])

  useEffect(() => {
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 100)
      last = now
      if (!pausedRef.current) elapsed.current += dt
      const f = introFrame(plan, elapsed.current)
      setFrame(f)
      if (!tooted.current && plan.tootMs !== null && f.stage !== 'done' && elapsed.current >= plan.tootMs) {
        tooted.current = true
        play('whistle')
        setToot(true)
      }
      if (f.stage !== 'done') raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    const onKey = (e: KeyboardEvent) => {
      if (!e.repeat) skip() // a key still held down from the star picker must not skip it
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
    }
  }, [plan, skip])

  return { frame, toot, skip }
}
