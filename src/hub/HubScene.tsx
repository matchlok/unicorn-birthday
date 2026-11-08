import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, type RefObject } from 'react'
import type * as THREE from 'three'
import { play } from '../engine/audio'
import { GAMES } from '../games/registry'
import { BannerAnchor } from './BirthdayBanner'
import { GameDisplay } from './GameDisplay'
import { DEFAULT_SPAWN, ISLAND_RADIUS, clampTarget, padPosition, type Vec2 } from './hubLogic'
import { Balloons, Bunting, Cake, Island, PartySparkles, Presents } from './Party'
import { Player } from './Player'
import { useWalkKeys } from './useWalkKeys'

type Props = {
  bannerRef: RefObject<HTMLDivElement | null>
  spawn: Vec2 | null
  activePad: number | null
  onActivePad: (index: number | null) => void
  onFirstMove: () => void
}

// A little ring where she is heading, so a tap visibly "does something".
function TargetMarker({ target }: { target: RefObject<Vec2 | null> }) {
  const ring = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    const m = ring.current
    if (!m) return
    const t = target.current
    m.visible = !!t
    if (t) {
      m.position.set(t.x, 0.05, t.z)
      m.scale.setScalar(1 + Math.sin(clock.elapsedTime * 8) * 0.12)
    }
  })
  return (
    <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
      <ringGeometry args={[0.35, 0.5, 24]} />
      <meshBasicMaterial color="#FF7EB9" transparent opacity={0.85} depthWrite={false} />
    </mesh>
  )
}

// Dev-only: log draw calls once so we can keep them under budget.
function DrawCallLog() {
  const gl = useThree((s) => s.gl)
  useEffect(() => {
    if (!import.meta.env.DEV) return
    const id = setTimeout(() => console.log('[hub] draw calls:', gl.info.render.calls, 'triangles:', gl.info.render.triangles), 2500)
    return () => clearTimeout(id)
  }, [gl])
  return null
}

export default function HubScene({ bannerRef, spawn, activePad, onActivePad, onFirstMove }: Props) {
  const target = useRef<Vec2 | null>(null)
  const getKeys = useWalkKeys()
  const count = GAMES.length

  return (
    <Canvas flat dpr={[1, 2]} camera={{ fov: 50, position: [0, 7, 9], near: 0.5, far: 80 }} gl={{ alpha: true, antialias: true }} className="hub__canvas">
      <ambientLight intensity={1.0} />
      <directionalLight position={[6, 12, 8]} intensity={1.3} />

      <Island />
      <Cake />
      <Balloons />
      <Presents />
      <Bunting />
      <PartySparkles />
      <BannerAnchor bannerRef={bannerRef} />

      {/* invisible ground for click-to-walk */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onClick={(e) => {
          target.current = clampTarget({ x: e.point.x, z: e.point.z })
        }}
      >
        <circleGeometry args={[ISLAND_RADIUS, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <TargetMarker target={target} />

      {GAMES.map((game, i) => (
        <GameDisplay
          key={game.id}
          game={game}
          index={i}
          count={count}
          active={activePad === i}
          onSelect={(index) => {
            play('click')
            target.current = padPosition(index, count)
          }}
        />
      ))}

      <Player spawn={spawn ?? DEFAULT_SPAWN} padCount={count} target={target} getKeys={getKeys} onActivePad={onActivePad} onFirstMove={onFirstMove} />
      <DrawCallLog />
    </Canvas>
  )
}
