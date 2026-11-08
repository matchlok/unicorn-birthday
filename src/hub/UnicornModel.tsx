import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import type * as THREE from 'three'

const MANE = ['#FF7EB9', '#FFE66D', '#B8F2E6', '#A0E7FF', '#C8B6FF']
const WHITE = '#FFFFFF'
const HOOF = '#C8B6FF'

// Leg pivots at the hip so a sine swing looks like walking. Diagonal pairs move together.
const LEGS = [
  { x: -0.17, z: 0.3, phase: 0 },
  { x: 0.17, z: 0.3, phase: Math.PI },
  { x: -0.17, z: -0.3, phase: Math.PI },
  { x: 0.17, z: -0.3, phase: 0 },
]

// The unicorn, built from primitives (about 1.2 tall without the hat). Faces +Z.
export function UnicornModel({ walking }: { walking: boolean }) {
  const body = useRef<THREE.Group>(null)
  const legs = useRef<(THREE.Group | null)[]>([])
  const tail = useRef<THREE.Group>(null)
  const swing = useRef(0)

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const t = clock.elapsedTime
    // Ease the walk amount in and out so legs settle instead of snapping.
    swing.current += ((walking ? 1 : 0) - swing.current) * (1 - Math.exp(-10 * dt))
    const s = swing.current
    const walkT = t * 9
    legs.current.forEach((leg, i) => {
      if (leg) leg.rotation.x = Math.sin(walkT + LEGS[i].phase) * 0.7 * s
    })
    if (body.current) {
      body.current.position.y = Math.abs(Math.sin(walkT)) * 0.07 * s
      const breathe = 1 + Math.sin(t * 2) * 0.015 * (1 - s)
      body.current.scale.set(1, breathe, 1)
    }
    if (tail.current) tail.current.rotation.y = Math.sin(t * (walking ? 9 : 2.2)) * (0.15 + 0.35 * s)
  })

  return (
    <group ref={body}>
      {/* body */}
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.27, 0.5, 6, 14]} />
        <meshToonMaterial color={WHITE} />
      </mesh>

      {/* legs with lavender hooves */}
      {LEGS.map((l, i) => (
        <group
          key={i}
          position={[l.x, 0.5, l.z]}
          ref={(el) => {
            legs.current[i] = el
          }}
        >
          <mesh position={[0, -0.2, 0]}>
            <capsuleGeometry args={[0.065, 0.2, 4, 8]} />
            <meshToonMaterial color={WHITE} />
          </mesh>
          <mesh position={[0, -0.4, 0.01]}>
            <sphereGeometry args={[0.085, 10, 8]} />
            <meshToonMaterial color={HOOF} />
          </mesh>
        </group>
      ))}

      {/* neck */}
      <mesh position={[0, 0.9, 0.36]} rotation={[0.55, 0, 0]}>
        <capsuleGeometry args={[0.13, 0.28, 4, 10]} />
        <meshToonMaterial color={WHITE} />
      </mesh>

      {/* head */}
      <group position={[0, 1.08, 0.55]}>
        <mesh>
          <sphereGeometry args={[0.22, 16, 14]} />
          <meshToonMaterial color={WHITE} />
        </mesh>
        <mesh position={[0, -0.07, 0.17]} scale={[1, 0.8, 1.1]}>
          <sphereGeometry args={[0.13, 12, 10]} />
          <meshToonMaterial color="#FFE3F1" />
        </mesh>
        {[-1, 1].map((s) => (
          <group key={s}>
            <mesh position={[s * 0.1, 0.04, 0.17]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshToonMaterial color="#2B1B45" />
            </mesh>
            <mesh position={[s * 0.1 - s * 0.012, 0.062, 0.205]}>
              <sphereGeometry args={[0.016, 6, 6]} />
              <meshBasicMaterial color={WHITE} />
            </mesh>
            <mesh position={[s * 0.16, -0.04, 0.12]} scale={[1, 0.7, 0.5]}>
              <sphereGeometry args={[0.055, 8, 8]} />
              <meshToonMaterial color="#FF9CCB" />
            </mesh>
            <mesh position={[s * 0.13, 0.22, -0.02]} rotation={[0.1, 0, -s * 0.25]}>
              <coneGeometry args={[0.06, 0.15, 6]} />
              <meshToonMaterial color={WHITE} />
            </mesh>
          </group>
        ))}

        {/* gold horn: a cone with spiral rings and a rounded tip */}
        <group position={[0, 0.2, 0.1]} rotation={[0.35, 0, 0]}>
          <mesh position={[0, 0.17, 0]}>
            <coneGeometry args={[0.055, 0.36, 10]} />
            <meshToonMaterial color="#FFD23F" emissive="#FFD23F" emissiveIntensity={0.3} />
          </mesh>
          {[0.06, 0.15, 0.24].map((y, i) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2 + 0.25, 0, i]}>
              <torusGeometry args={[0.048 - i * 0.01, 0.011, 6, 12]} />
              <meshToonMaterial color="#FFF2A8" />
            </mesh>
          ))}
          <mesh position={[0, 0.36, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshToonMaterial color="#FFD23F" emissive="#FFD23F" emissiveIntensity={0.5} />
          </mesh>
        </group>

        {/* birthday hat */}
        <group position={[0.02, 0.2, -0.07]} rotation={[-0.25, 0, 0.3]}>
          <mesh position={[0, 0.13, 0]}>
            <coneGeometry args={[0.11, 0.27, 12]} />
            <meshToonMaterial color="#FF7EB9" />
          </mesh>
          {[0.07, 0.16].map((y) => (
            <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.1 - (y - 0.07) * 0.5, 0.012, 6, 14]} />
              <meshToonMaterial color="#FFE66D" />
            </mesh>
          ))}
          <mesh position={[0, 0.27, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshToonMaterial color="#FFE66D" />
          </mesh>
        </group>
      </group>

      {/* mane down the neck */}
      {MANE.map((c, i) => (
        <mesh key={c} position={[0, 1.2 - i * 0.12, 0.42 - i * 0.075]}>
          <sphereGeometry args={[0.095 - i * 0.004, 8, 8]} />
          <meshToonMaterial color={c} />
        </mesh>
      ))}

      {/* tail */}
      <group ref={tail} position={[0, 0.7, -0.5]}>
        {MANE.map((c, i) => (
          <mesh key={c} position={[0, -i * 0.045, -i * 0.085]}>
            <sphereGeometry args={[0.1 - i * 0.008, 8, 8]} />
            <meshToonMaterial color={c} />
          </mesh>
        ))}
      </group>
    </group>
  )
}
