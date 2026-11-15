import { RoundedBox } from '@react-three/drei'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type * as THREE from 'three'
import type { GameEntry } from '../games/types'
import { PAD_RADIUS, boothPosition, padPosition } from './hubLogic'
import { CardsIcon, KartIcon, PadlockIcon, PresentIcon, Star } from './HubIcons3D'

// Resolve a `var(--x)` token from the registry to a hex colour three.js can use.
function cssColor(token: string): string {
  const name = /var\((--[\w-]+)\)/.exec(token)?.[1]
  if (!name) return token
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#FFB3D9'
}

const GREY = '#CFC8DA'

type Props = {
  game: GameEntry
  index: number
  count: number
  active: boolean
  onSelect: (index: number) => void
}

// One game's display: a glowing pad to stand on, a little booth behind it, and a spinning icon above.
export function GameDisplay({ game, index, count, active, onSelect }: Props) {
  const ready = game.status === 'ready'
  const color = useMemo(() => (game.status === 'locked' ? GREY : cssColor(game.padColor)), [game.padColor, game.status])
  const pos = padPosition(index, count)
  const booth = boothPosition(index, count)

  const icon = useRef<THREE.Group>(null)
  const ring = useRef<THREE.MeshStandardMaterial>(null)
  const jump = useRef({ y: 0, v: 0 })
  const wasActive = useRef(false)
  const spin = useRef(index * 2)

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    if (active && !wasActive.current) jump.current.v = 5 // the icon jumps when she steps on
    wasActive.current = active
    const j = jump.current
    j.v -= 16 * dt
    j.y = Math.max(0, j.y + j.v * dt)
    if (j.y === 0 && j.v < 0) j.v = 0
    spin.current += dt * (active ? 2.4 : 0.8)
    if (icon.current) {
      icon.current.position.y = 2.15 + Math.sin(t * 2 + index) * 0.12 + j.y
      icon.current.rotation.y = spin.current
      const s = active ? 1.12 : 1
      icon.current.scale.setScalar(icon.current.scale.x + (s - icon.current.scale.x) * (1 - Math.exp(-10 * dt)))
    }
    if (ring.current) {
      const base = ready ? 0.55 : game.status === 'coming-soon' ? 0.3 : 0.05
      const pulse = ready ? Math.sin(t * 3 + index) * 0.25 : Math.sin(t * 2 + index) * 0.08
      ring.current.emissiveIntensity = base + pulse + (active ? 1.1 : 0)
    }
  })

  const select = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onSelect(index)
  }

  return (
    <>
      <group position={[pos.x, 0, pos.z]} onClick={select}>
        <mesh position={[0, 0.07, 0]}>
          <cylinderGeometry args={[PAD_RADIUS, PAD_RADIUS + 0.05, 0.14, 40]} />
          <meshToonMaterial color={color} />
        </mesh>
        <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[PAD_RADIUS - 0.22, 0.07, 10, 48]} />
          <meshStandardMaterial ref={ring} color="#FFFFFF" emissive={color} emissiveIntensity={0.5} />
        </mesh>
        <group ref={icon} position={[0, 2.15, 0]}>
          {game.status === 'locked' ? <PadlockIcon /> : game.icon === 'cards' ? <CardsIcon /> : game.icon === 'kart' ? <KartIcon /> : <PresentIcon />}
        </group>
      </group>

      <group position={[booth.x, 0, booth.z]} onClick={select}>
        <RoundedBox args={[3, 2.3, 0.3]} radius={0.14} smoothness={3} position={[0, 1.15, 0]}>
          <meshToonMaterial color={color} />
        </RoundedBox>
        <RoundedBox args={[2.5, 1.6, 0.12]} radius={0.1} smoothness={3} position={[0, 1.2, 0.15]}>
          <meshToonMaterial color="#FFF8F0" />
        </RoundedBox>
        {[-0.7, 0, 0.7].map((x, i) => (
          <Star key={x} outer={0.26} position={[x, 1.2 + (i % 2 ? 0.18 : -0.1), 0.22]} color={i === 1 ? '#FF7EB9' : '#FFE66D'} />
        ))}
        {/* striped awning */}
        <mesh position={[0, 2.35, 0.2]} rotation={[0, 0, Math.PI / 2]} scale={[1, 1, 1]}>
          <cylinderGeometry args={[0.38, 0.38, 3.2, 14, 1, false, -Math.PI / 2, Math.PI]} />
          <meshToonMaterial color={color} />
        </mesh>
        <Star outer={0.32} position={[0, 2.95, 0.2]} color="#FFE66D" />
      </group>
    </>
  )
}
