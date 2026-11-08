import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import { play } from '../../engine/audio'
import type { PedalState } from './logic'

type Pedal = keyof PedalState

const LABELS: Record<Pedal, string> = { left: '◀', right: '▶', go: '▲', back: '▼' }

// Big on-screen pedals for touch screens. Each pointer id is tracked on its own, so
// steering and going work at the same time, and a finger that slides off never sticks.
export function TouchPedals({ state, onPress }: { state: RefObject<PedalState>; onPress: () => void }) {
  const fingers = useRef(new Map<number, Pedal>())

  const recompute = () => {
    const held = new Set(fingers.current.values())
    const s = state.current
    s.left = held.has('left')
    s.right = held.has('right')
    s.go = held.has('go')
    s.back = held.has('back')
  }
  const release = (id: number) => {
    fingers.current.delete(id)
    recompute()
  }

  useEffect(() => {
    const fs = fingers.current
    const clear = () => {
      fs.clear()
      recompute()
    }
    window.addEventListener('blur', clear)
    return () => window.removeEventListener('blur', clear)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const bind = (pedal: Pedal) => ({
    onPointerDown: (e: PointerEvent<HTMLButtonElement>) => {
      e.preventDefault()
      e.currentTarget.setPointerCapture(e.pointerId)
      fingers.current.set(e.pointerId, pedal)
      recompute()
      play('click')
      onPress()
    },
    onPointerUp: (e: PointerEvent<HTMLButtonElement>) => release(e.pointerId),
    onPointerCancel: (e: PointerEvent<HTMLButtonElement>) => release(e.pointerId),
    onLostPointerCapture: (e: PointerEvent<HTMLButtonElement>) => release(e.pointerId),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  })

  const pedal = (p: Pedal, extra = '') => (
    <button type="button" aria-label={p} className={`kart-pedal kart-pedal--${p} ${extra}`} {...bind(p)}>
      {LABELS[p]}
    </button>
  )

  return (
    <div className="kart-pedals">
      <div className="kart-pedals__side kart-pedals__side--left">
        {pedal('left')}
        {pedal('right')}
      </div>
      <div className="kart-pedals__side kart-pedals__side--right">
        {pedal('back')}
        {pedal('go')}
      </div>
    </div>
  )
}
