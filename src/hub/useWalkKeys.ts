import { useEffect, useRef, type RefObject } from 'react'
import type { Vec2 } from './hubLogic'

const UP = ['ArrowUp', 'KeyW']
const DOWN = ['ArrowDown', 'KeyS']
const LEFT = ['ArrowLeft', 'KeyA']
const RIGHT = ['ArrowRight', 'KeyD']
const WALK_KEYS = [...UP, ...DOWN, ...LEFT, ...RIGHT]

// Arrows or WASD as a world-space wish: up = away from the camera (-z), right = +x.
// Read `.current()` every frame. Zero vector when nothing is held.
export function useWalkKeys(): RefObject<() => Vec2> {
  const down = useRef(new Set<string>())

  useEffect(() => {
    const keys = down.current
    const onDown = (e: KeyboardEvent) => {
      if (WALK_KEYS.includes(e.code)) {
        e.preventDefault()
        keys.add(e.code)
      }
    }
    const onUp = (e: KeyboardEvent) => keys.delete(e.code)
    const clear = () => keys.clear()
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    window.addEventListener('blur', clear)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
      window.removeEventListener('blur', clear)
    }
  }, [])

  const any = (codes: string[]) => codes.some((c) => down.current.has(c))
  return useRef<() => Vec2>(() => ({
    x: (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0),
    z: (any(DOWN) ? 1 : 0) - (any(UP) ? 1 : 0),
  }))
}
