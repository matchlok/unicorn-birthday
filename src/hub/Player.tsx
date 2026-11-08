import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import type * as THREE from 'three'
import { play } from '../engine/audio'
import { UnicornModel } from './UnicornModel'
import { activePad, obstacles, stepPlayer, wishToward, type PlayerState, type Vec2 } from './hubLogic'

type Props = {
  spawn: Vec2
  padCount: number
  target: RefObject<Vec2 | null>
  getKeys: RefObject<() => Vec2>
  onActivePad: (index: number | null) => void
  onFirstMove: () => void
}

const CAMERA_OFFSET = { x: 0, y: 8, z: 10.5 }
const UNICORN_SCALE = 1.4
const STEP_EVERY = 0.28
const STUCK_AFTER = 0.7

export function Player({ spawn, padCount, target, getKeys, onActivePad, onFirstMove }: Props) {
  const group = useRef<THREE.Group>(null)
  const state = useRef<PlayerState>({ x: spawn.x, z: spawn.z, vx: 0, vz: 0, heading: 0 })
  const circles = useMemo(() => obstacles(padCount), [padCount])
  const pad = useRef<number | null>(null)
  const walkingRef = useRef(false)
  const [walking, setWalking] = useState(false)
  const stepT = useRef(0)
  const stuckT = useRef(0)
  const moved = useRef(false)
  const first = useRef(true)

  const handlers = useRef({ onActivePad, onFirstMove })
  useEffect(() => {
    handlers.current = { onActivePad, onFirstMove }
  })

  useFrame(({ camera, size }, delta) => {
    const dt = Math.min(delta, 0.05)
    const s = state.current
    const keys = getKeys.current()
    let wish: Vec2 = keys
    if (keys.x !== 0 || keys.z !== 0) {
      target.current = null // any arrow key cancels click-to-walk
    } else if (target.current) {
      const w = wishToward(s, target.current)
      if (w) wish = w
      else target.current = null
    }

    const before = { x: s.x, z: s.z }
    const next = stepPlayer(s, wish, dt, circles)
    state.current = next

    // Click-to-walk gives up if she is wedged against something.
    const speed = Math.hypot(next.x - before.x, next.z - before.z) / Math.max(dt, 1e-4)
    if (target.current && Math.hypot(wish.x, wish.z) > 0.5 && speed < 0.5) {
      stuckT.current += dt
      if (stuckT.current > STUCK_AFTER) target.current = null
    } else stuckT.current = 0

    const isWalking = Math.hypot(next.vx, next.vz) > 0.5
    if (isWalking !== walkingRef.current) {
      walkingRef.current = isWalking
      setWalking(isWalking)
    }
    if (isWalking && !moved.current) {
      moved.current = true
      handlers.current.onFirstMove()
    }
    if (isWalking) {
      stepT.current += dt
      if (stepT.current >= STEP_EVERY) {
        stepT.current = 0
        play('step')
      }
    } else stepT.current = STEP_EVERY * 0.7

    if (group.current) {
      group.current.position.set(next.x, 0, next.z)
      group.current.rotation.y = next.heading
    }

    const nextPad = activePad(next, padCount, pad.current)
    if (nextPad !== pad.current) {
      pad.current = nextPad
      handlers.current.onActivePad(nextPad)
    }

    // Fixed angled board view that follows her. Pull back on tall (portrait) screens.
    const aspect = size.width / size.height
    const k = aspect < 1 ? 1 + (1 - aspect) * 2.6 : 1
    const want = { x: next.x + CAMERA_OFFSET.x * k, y: CAMERA_OFFSET.y * k, z: next.z + CAMERA_OFFSET.z * k }
    if (first.current) {
      camera.position.set(want.x, want.y, want.z)
      first.current = false
    } else {
      const f = 1 - Math.exp(-4 * dt)
      camera.position.x += (want.x - camera.position.x) * f
      camera.position.y += (want.y - camera.position.y) * f
      camera.position.z += (want.z - camera.position.z) * f
    }
    camera.lookAt(camera.position.x - CAMERA_OFFSET.x * k, 1.8, camera.position.z - CAMERA_OFFSET.z * k)
  })

  return (
    <group ref={group} position={[spawn.x, 0, spawn.z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
        <circleGeometry args={[0.7, 20]} />
        <meshBasicMaterial color="#5B3A8C" transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <group scale={UNICORN_SCALE}>
        <UnicornModel walking={walking} />
      </group>
    </group>
  )
}
