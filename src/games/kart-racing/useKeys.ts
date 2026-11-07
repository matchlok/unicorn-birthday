import { useEffect, useRef } from 'react'
import type { DriveInput } from './logic'

const UP = ['ArrowUp', 'KeyW']
const DOWN = ['ArrowDown', 'KeyS']
const LEFT = ['ArrowLeft', 'KeyA']
const RIGHT = ['ArrowRight', 'KeyD']
const DRIVE_KEYS = [...UP, ...DOWN, ...LEFT, ...RIGHT]

type Options = { onDriveKey?: () => void; onHonk?: () => void }

// Keyboard state for driving: arrows or WASD. Space honks. Read `.current()` every frame.
export function useKeys({ onDriveKey, onHonk }: Options = {}) {
  const down = useRef(new Set<string>())
  const handlers = useRef({ onDriveKey, onHonk })
  useEffect(() => {
    handlers.current = { onDriveKey, onHonk }
  })

  useEffect(() => {
    const keys = down.current
    const onDown = (e: KeyboardEvent) => {
      if (DRIVE_KEYS.includes(e.code) || e.code === 'Space') e.preventDefault()
      if (e.repeat) return
      if (e.code === 'Space') handlers.current.onHonk?.()
      else if (DRIVE_KEYS.includes(e.code)) handlers.current.onDriveKey?.()
      keys.add(e.code)
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
  return useRef<() => DriveInput>(() => ({
    throttle: (any(UP) ? 1 : 0) - (any(DOWN) ? 1 : 0),
    steer: (any(RIGHT) ? 1 : 0) - (any(LEFT) ? 1 : 0),
  }))
}
