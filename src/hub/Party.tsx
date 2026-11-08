import { RoundedBox, Sparkles } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { BUNTING_POLES, CAKE, ISLAND_RADIUS, PRESENTS } from './hubLogic'

const PASTEL = ['#FF7EB9', '#FFE66D', '#B8F2E6', '#A0E7FF', '#C8B6FF']

export function Island() {
  return (
    <group>
      {/* the island is a cake: peach layer, grass top, cream frosting rim, pink underside */}
      <mesh position={[0, -0.75, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, ISLAND_RADIUS, 1.5, 64]} />
        <meshToonMaterial attach="material-0" color="#FFC9A8" />
        <meshToonMaterial attach="material-1" color="#9BE39B" />
        <meshToonMaterial attach="material-2" color="#FFC9A8" />
      </mesh>
      <mesh position={[0, -0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[ISLAND_RADIUS - 0.05, 0.3, 10, 80]} />
        <meshToonMaterial color="#FFF8F0" />
      </mesh>
      <mesh position={[0, -3.2, 0]}>
        <cylinderGeometry args={[ISLAND_RADIUS, 6.5, 3.4, 48]} />
        <meshToonMaterial color="#FFB3D9" />
      </mesh>
    </group>
  )
}

const TIERS = [
  { r: 2.2, y: 0, h: 1.1, color: '#FFB3D9', dots: 16 },
  { r: 1.6, y: 1.1, h: 1.1, color: '#FFF8F0', dots: 12 },
  { r: 1.0, y: 2.2, h: 1.1, color: '#C8B6FF', dots: 9 },
]
const CANDLES = Array.from({ length: 5 }, (_, i) => {
  const a = (i / 5) * Math.PI * 2
  return { x: Math.cos(a) * 0.5, z: Math.sin(a) * 0.5, color: PASTEL[i], phase: i * 1.7 }
})

export function Cake() {
  const dots = useRef<THREE.InstancedMesh>(null)
  const flames = useRef<(THREE.Mesh | null)[]>([])
  const dotData = useMemo(
    () =>
      TIERS.flatMap((t, ti) =>
        Array.from({ length: t.dots }, (_, i) => {
          const a = (i / t.dots) * Math.PI * 2
          return { x: Math.cos(a) * t.r, y: t.y + t.h, z: Math.sin(a) * t.r, color: PASTEL[(i + ti) % PASTEL.length] }
        }),
      ),
    [],
  )

  useLayoutEffect(() => {
    const m = dots.current
    if (!m) return
    const mat = new THREE.Matrix4()
    const c = new THREE.Color()
    dotData.forEach((d, i) => {
      m.setMatrixAt(i, mat.makeTranslation(d.x, d.y, d.z))
      m.setColorAt(i, c.set(d.color))
    })
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [dotData])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    flames.current.forEach((f, i) => {
      if (!f) return
      const j = 1 + Math.sin(t * 11 + CANDLES[i].phase) * 0.12 + Math.sin(t * 17 + i) * 0.06
      f.scale.set(1 / j, j * 1.4, 1 / j)
    })
  })

  return (
    <group position={[CAKE.x, 0, CAKE.z]}>
      {TIERS.map((t) => (
        <mesh key={t.r} position={[0, t.y + t.h / 2, 0]}>
          <cylinderGeometry args={[t.r, t.r, t.h, 40]} />
          <meshToonMaterial color={t.color} />
        </mesh>
      ))}
      <instancedMesh ref={dots} args={[undefined, undefined, dotData.length]}>
        <sphereGeometry args={[0.13, 8, 8]} />
        <meshToonMaterial />
      </instancedMesh>
      {CANDLES.map((c, i) => (
        <group key={i} position={[c.x, 3.3, c.z]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 0.6, 8]} />
            <meshToonMaterial color={c.color} />
          </mesh>
          <mesh
            position={[0, 0.72, 0]}
            ref={(el) => {
              flames.current[i] = el
            }}
          >
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshBasicMaterial color="#FFD23F" />
          </mesh>
        </group>
      ))}
    </group>
  )
}

const BALLOON_COLORS = ['#FF7EB9', '#FFE66D', '#A0E7FF', '#B8F2E6', '#C8B6FF', '#FFB3D9', '#FFC9A8', '#9BE39B']

const BALLOON_DEGREES = [190, 215, 245, 295, 325, 350, 8, 172]

export function Balloons() {
  const refs = useRef<(THREE.Group | null)[]>([])
  const balloons = useMemo(
    () =>
      BALLOON_COLORS.map((color, i) => {
        // Round the back and sides only, so none float in front of the camera.
        const a = (BALLOON_DEGREES[i] * Math.PI) / 180
        return { color, x: Math.cos(a) * 10.6, z: Math.sin(a) * 10.6, phase: i * 1.3, height: 3.0 + (i % 3) * 0.5 }
      }),
    [],
  )
  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    balloons.forEach((b, i) => {
      const g = refs.current[i]
      if (g) {
        g.position.y = Math.sin(t * 1.2 + b.phase) * 0.25
        g.rotation.z = Math.sin(t * 0.9 + b.phase) * 0.06
      }
    })
  })
  return (
    <>
      {balloons.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <group
            ref={(el) => {
              refs.current[i] = el
            }}
          >
            <mesh position={[0, b.height, 0]} scale={[1, 1.2, 1]}>
              <sphereGeometry args={[0.5, 14, 12]} />
              <meshToonMaterial color={b.color} />
            </mesh>
            <mesh position={[0, b.height / 2 - 0.3, 0]}>
              <cylinderGeometry args={[0.012, 0.012, b.height - 0.9, 4]} />
              <meshBasicMaterial color="#5B3A8C" />
            </mesh>
          </group>
        </group>
      ))}
    </>
  )
}

export function Presents() {
  return (
    <>
      {PRESENTS.map((p, i) => {
        const color = PASTEL[(i + 2) % PASTEL.length]
        const ribbon = i % 2 ? '#FFF8F0' : '#FFE66D'
        return (
          <group key={i} position={[p.x, 0, p.z]} rotation={[0, i * 0.8, 0]}>
            <RoundedBox args={[p.size, p.size, p.size]} radius={0.07} smoothness={3} position={[0, p.size / 2, 0]}>
              <meshToonMaterial color={color} />
            </RoundedBox>
            <mesh position={[0, p.size / 2, 0]}>
              <boxGeometry args={[p.size * 0.18, p.size * 1.02, p.size * 1.02]} />
              <meshToonMaterial color={ribbon} />
            </mesh>
            <mesh position={[0, p.size / 2, 0]}>
              <boxGeometry args={[p.size * 1.02, p.size * 1.02, p.size * 0.18]} />
              <meshToonMaterial color={ribbon} />
            </mesh>
          </group>
        )
      })}
    </>
  )
}

const FLAGS = 15
export function Bunting() {
  const flags = useRef<THREE.InstancedMesh>(null)
  const [a, b] = BUNTING_POLES
  const top = 4.2
  const sag = 1.0
  const curve = useMemo(() => {
    const pts = Array.from({ length: 21 }, (_, i) => {
      const u = i / 20
      return new THREE.Vector3(a.x + (b.x - a.x) * u, top - Math.sin(u * Math.PI) * sag, a.z)
    })
    return new THREE.CatmullRomCurve3(pts)
  }, [a, b])

  useLayoutEffect(() => {
    const m = flags.current
    if (!m) return
    const mat = new THREE.Matrix4()
    const c = new THREE.Color()
    for (let i = 0; i < FLAGS; i++) {
      const p = curve.getPoint((i + 0.5) / FLAGS)
      m.setMatrixAt(i, mat.makeTranslation(p.x, p.y - 0.22, p.z))
      m.setColorAt(i, c.set(PASTEL[i % PASTEL.length]))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [curve])

  const flag = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(-0.28, 0.25)
    s.lineTo(0.28, 0.25)
    s.lineTo(0, -0.25)
    s.closePath()
    return new THREE.ShapeGeometry(s)
  }, [])
  const tube = useMemo(() => new THREE.TubeGeometry(curve, 30, 0.025, 4), [curve])

  return (
    <group>
      {[a, b].map((p) => (
        <mesh key={p.x} position={[p.x, top / 2, p.z]}>
          <cylinderGeometry args={[0.07, 0.1, top, 8]} />
          <meshToonMaterial color="#FFF8F0" />
        </mesh>
      ))}
      <mesh geometry={tube}>
        <meshBasicMaterial color="#5B3A8C" />
      </mesh>
      <instancedMesh ref={flags} args={[flag, undefined, FLAGS]}>
        <meshToonMaterial side={THREE.DoubleSide} />
      </instancedMesh>
    </group>
  )
}

export function PartySparkles() {
  return <Sparkles count={40} scale={[22, 7, 22]} position={[0, 4, 0]} size={5} speed={0.35} color="#FFB3D9" />
}
