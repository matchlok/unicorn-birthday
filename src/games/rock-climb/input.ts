import { useEffect, useRef } from 'react'
import type { Input } from './logic'

const KEYS: Record<keyof Input, string[]> = {
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  jump: ['ArrowUp', 'KeyW', 'Space'],
  down: ['ArrowDown', 'KeyS'],
}
const ALL = Object.values(KEYS).flat()

// Keyboard or touch: either one pressing a button counts.
export function mergeInput(a: Input, b: Input): Input {
  return { left: a.left || b.left, right: a.right || b.right, jump: a.jump || b.jump, down: a.down || b.down }
}

// Arrow keys or WASD; up, W or Space jumps; down or S ducks. Read `.current()` every frame.
export function useRockKeys(onFirstKey: () => void) {
  const down = useRef(new Set<string>())
  const first = useRef(onFirstKey)
  useEffect(() => {
    first.current = onFirstKey
  })

  useEffect(() => {
    const keys = down.current
    const onDown = (e: KeyboardEvent) => {
      if (!ALL.includes(e.code)) return
      e.preventDefault()
      keys.add(e.code)
      first.current()
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

  const held = (codes: string[]) => codes.some((c) => down.current.has(c))
  return useRef<() => Input>(() => ({
    left: held(KEYS.left),
    right: held(KEYS.right),
    jump: held(KEYS.jump),
    down: held(KEYS.down),
  }))
}
