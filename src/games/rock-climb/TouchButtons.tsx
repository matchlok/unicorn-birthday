import { useEffect, useRef, type PointerEvent, type RefObject } from 'react'
import type { Input } from './logic'

type Btn = keyof Input
const LABELS: Record<Btn, string> = { left: '◀', right: '▶', jump: '▲', down: '▼' }
const NAMES: Record<Btn, string> = { left: 'Left', right: 'Right', jump: 'Jump', down: 'Duck' }

// Big thumb buttons. Each finger is tracked by pointer id, so run + jump work together
// and a finger sliding off never leaves a button stuck down.
export function TouchButtons({ state, onPress }: { state: RefObject<Input>; onPress: () => void }) {
  const fingers = useRef(new Map<number, Btn>())

  const recompute = () => {
    const held = new Set(fingers.current.values())
    const s = state.current
    s.left = held.has('left')
    s.right = held.has('right')
    s.jump = held.has('jump')
    s.down = held.has('down')
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

  const button = (b: Btn) => (
    <button
      type="button"
      aria-label={NAMES[b]}
      className={`rock-btn rock-btn--${b}`}
      onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture(e.pointerId)
        fingers.current.set(e.pointerId, b)
        recompute()
        onPress()
      }}
      onPointerUp={(e) => release(e.pointerId)}
      onPointerCancel={(e) => release(e.pointerId)}
      onLostPointerCapture={(e) => release(e.pointerId)}
      onContextMenu={(e) => e.preventDefault()}
    >
      {LABELS[b]}
    </button>
  )

  return (
    <div className="rock-btns">
      <div className="rock-btns__side rock-btns__side--left">
        {button('left')}
        {button('right')}
      </div>
      <div className="rock-btns__side rock-btns__side--right">
        {button('down')}
        {button('jump')}
      </div>
    </div>
  )
}
