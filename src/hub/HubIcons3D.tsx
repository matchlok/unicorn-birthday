import { RoundedBox } from '@react-three/drei'
import { useMemo } from 'react'
import * as THREE from 'three'

function starGeometry(outer: number, inner: number) {
  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 ? inner : outer
    const a = (i * Math.PI) / 5 + Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  return new THREE.ShapeGeometry(shape)
}

export function Star({ outer = 0.3, color = '#FFE66D', ...props }: { outer?: number; color?: string } & React.ComponentProps<'mesh'>) {
  const geo = useMemo(() => starGeometry(outer, outer * 0.48), [outer])
  return (
    <mesh geometry={geo} {...props}>
      <meshToonMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  )
}

// All icons are about 1.5 units across, centred on the origin, built from primitives.

export function CardsIcon() {
  return (
    <group>
      <RoundedBox args={[0.95, 1.3, 0.08]} radius={0.1} smoothness={3} position={[-0.32, 0, 0]} rotation={[0, 0, 0.25]}>
        <meshToonMaterial color="#C8B6FF" />
      </RoundedBox>
      <group position={[0.3, 0, 0.07]} rotation={[0, 0, -0.2]}>
        <RoundedBox args={[0.95, 1.3, 0.08]} radius={0.1} smoothness={3}>
          <meshToonMaterial color="#FFF8F0" />
        </RoundedBox>
        <Star outer={0.3} position={[0, 0, 0.05]} />
        <Star outer={0.3} position={[0, 0, -0.05]} rotation={[0, Math.PI, 0]} />
      </group>
    </group>
  )
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.22, z]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.24, 0.24, 0.2, 14]} />
        <meshToonMaterial color="#5B3A8C" />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.11, 0.23, 10]} />
        <meshToonMaterial color="#FFE66D" />
      </mesh>
    </group>
  )
}

export function KartIcon() {
  return (
    <group position={[0, -0.25, 0]}>
      <RoundedBox args={[1.6, 0.5, 0.95]} radius={0.18} smoothness={3} position={[0, 0.4, 0]}>
        <meshToonMaterial color="#FF7EB9" />
      </RoundedBox>
      <RoundedBox args={[0.75, 0.42, 0.8]} radius={0.15} smoothness={3} position={[-0.15, 0.85, 0]}>
        <meshToonMaterial color="#A0E7FF" />
      </RoundedBox>
      {[-0.55, 0.55].flatMap((x) => [-0.5, 0.5].map((z) => <Wheel key={`${x}${z}`} x={x} z={z} />))}
    </group>
  )
}

function Question({ z, flip }: { z: number; flip?: boolean }) {
  return (
    <group position={[0, 0, z]} rotation={[0, flip ? Math.PI : 0, 0]} scale={1.25}>
      <mesh position={[0, 0.12, 0]} rotation={[0, Math.PI, 0]}>
        <torusGeometry args={[0.15, 0.045, 8, 16, Math.PI * 1.5]} />
        <meshToonMaterial color="#5B3A8C" />
      </mesh>
      <mesh position={[0, -0.1, 0]}>
        <cylinderGeometry args={[0.045, 0.045, 0.1, 8]} />
        <meshToonMaterial color="#5B3A8C" />
      </mesh>
      <mesh position={[0, -0.24, 0]}>
        <sphereGeometry args={[0.058, 8, 8]} />
        <meshToonMaterial color="#5B3A8C" />
      </mesh>
    </group>
  )
}

export function PresentIcon() {
  return (
    <group position={[0, -0.2, 0]}>
      <RoundedBox args={[1.1, 0.8, 1.1]} radius={0.08} smoothness={3} position={[0, 0.4, 0]}>
        <meshToonMaterial color="#A0E7FF" />
      </RoundedBox>
      <RoundedBox args={[1.2, 0.26, 1.2]} radius={0.08} smoothness={3} position={[0, 0.9, 0]}>
        <meshToonMaterial color="#C8B6FF" />
      </RoundedBox>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[0.2, 1.12, 1.14]} />
        <meshToonMaterial color="#FFE66D" />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <boxGeometry args={[1.14, 1.12, 0.2]} />
        <meshToonMaterial color="#FFE66D" />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.2, 1.17, 0]} rotation={[0, 0, s * 0.5]} scale={[1, 1.2, 0.5]}>
          <torusGeometry args={[0.17, 0.06, 8, 14]} />
          <meshToonMaterial color="#FFE66D" />
        </mesh>
      ))}
      <group position={[0, 0.4, 0]}>
        <Question z={0.6} />
        <Question z={-0.6} flip />
      </group>
    </group>
  )
}

export function PadlockIcon() {
  return (
    <group>
      <RoundedBox args={[1, 0.8, 0.4]} radius={0.12} smoothness={3} position={[0, -0.15, 0]}>
        <meshToonMaterial color="#FFE66D" />
      </RoundedBox>
      <mesh position={[0, 0.25, 0]}>
        <torusGeometry args={[0.3, 0.08, 8, 18, Math.PI]} />
        <meshToonMaterial color="#B9AACB" />
      </mesh>
      <mesh position={[0, -0.12, 0.21]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshToonMaterial color="#5B3A8C" />
      </mesh>
    </group>
  )
}
