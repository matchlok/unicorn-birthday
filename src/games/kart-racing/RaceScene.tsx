import { RoundedBox } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import type * as THREE from 'three'
import { play } from '../../engine/audio'
import { popBurst } from '../../engine/ui/celebrate'
import { BALLOONS, TRACK } from './course'
import { startRace, stepKart, touchedBalloons, updateRace, type Balloon, type DriveInput } from './logic'
import { Scenery } from './Scenery'

type Sim = ReturnType<typeof startRace>
type GetInput = RefObject<() => DriveInput>

const SKY = '#BDEBFF'

function Wheel({ x, z, spin }: { x: number; z: number; spin: (el: THREE.Group | null) => void }) {
  return (
    <group position={[x, 0.42, z]}>
      <group ref={spin}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.42, 0.42, 0.34, 20]} />
          <meshStandardMaterial color="#5B3A8C" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 0.38, 14]} />
          <meshStandardMaterial color="#FFE66D" />
        </mesh>
        {/* a bright block on the tire so you can see it spin */}
        <mesh position={[0, 0.4, 0]}>
          <boxGeometry args={[0.36, 0.1, 0.14]} />
          <meshStandardMaterial color="#FF7EB9" />
        </mesh>
      </group>
    </group>
  )
}

const MANE = ['#FF7EB9', '#C8B6FF', '#A0E7FF', '#B8F2E6']
const TAIL = ['#FFE66D', '#FF7EB9', '#C8B6FF', '#A0E7FF']

// The unicorn in her rounded kart, built from primitives.
function UnicornKart({ sim, getInput }: { sim: RefObject<Sim>; getInput: GetInput }) {
  const outer = useRef<THREE.Group>(null)
  const tilt = useRef<THREE.Group>(null)
  const wheels = useRef<(THREE.Group | null)[]>([])
  const lean = useRef(0)

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05)
    const k = sim.current.kart
    if (outer.current) {
      outer.current.position.set(k.x, 0, k.z)
      outer.current.rotation.y = k.heading
    }
    // Lean into turns and bounce a little with speed.
    const want = -getInput.current().steer * Math.min(1, Math.abs(k.speed) / 6) * 0.14
    lean.current += (want - lean.current) * (1 - Math.exp(-8 * dt))
    if (tilt.current) {
      tilt.current.rotation.z = lean.current
      tilt.current.position.y = Math.sin(clock.elapsedTime * 16) * 0.035 * Math.min(1, Math.abs(k.speed) / 6)
    }
    for (const w of wheels.current) if (w) w.rotation.x += (k.speed * dt) / 0.42
  })

  const spin = (i: number) => (el: THREE.Group | null) => {
    wheels.current[i] = el
  }

  return (
    <group ref={outer}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <circleGeometry args={[1.6, 20]} />
        <meshBasicMaterial color="#5B3A8C" transparent opacity={0.18} />
      </mesh>
      <group ref={tilt}>
        <RoundedBox args={[1.7, 0.55, 2.5]} radius={0.22} smoothness={3} position={[0, 0.62, 0]}>
          <meshStandardMaterial color="#FF7EB9" />
        </RoundedBox>
        <RoundedBox args={[1.3, 0.4, 0.8]} radius={0.18} smoothness={3} position={[0, 0.55, 1.4]}>
          <meshStandardMaterial color="#FFB3D9" />
        </RoundedBox>
        <RoundedBox args={[1.5, 0.9, 0.3]} radius={0.12} smoothness={3} position={[0, 1.15, -1.05]}>
          <meshStandardMaterial color="#C8B6FF" />
        </RoundedBox>
        <Wheel x={-1} z={0.95} spin={spin(0)} />
        <Wheel x={1} z={0.95} spin={spin(1)} />
        <Wheel x={-1} z={-0.9} spin={spin(2)} />
        <Wheel x={1} z={-0.9} spin={spin(3)} />

        <group position={[0, 0.95, -0.1]}>
          <mesh position={[0, 0.5, 0]} scale={[0.9, 0.8, 1]}>
            <sphereGeometry args={[0.6, 20, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 1.15, 0.6]}>
            <sphereGeometry args={[0.42, 20, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 1.02, 0.98]} scale={[1, 0.8, 1.1]}>
            <sphereGeometry args={[0.22, 14, 12]} />
            <meshStandardMaterial color="#FFE3F1" />
          </mesh>
          {[-1, 1].map((s) => (
            <group key={s}>
              <mesh position={[s * 0.2, 1.27, 0.92]}>
                <sphereGeometry args={[0.07, 10, 10]} />
                <meshStandardMaterial color="#5B3A8C" />
              </mesh>
              <mesh position={[s * 0.3, 1.0, 0.85]}>
                <sphereGeometry args={[0.09, 10, 10]} />
                <meshStandardMaterial color="#FF7EB9" transparent opacity={0.7} />
              </mesh>
              <mesh position={[s * 0.22, 1.58, 0.5]} rotation={[0.2, 0, -s * 0.2]}>
                <coneGeometry args={[0.1, 0.28, 8]} />
                <meshStandardMaterial color="#FFFFFF" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 1.72, 0.78]} rotation={[0.45, 0, 0]}>
            <coneGeometry args={[0.09, 0.6, 10]} />
            <meshStandardMaterial color="#FFD23F" emissive="#FFD23F" emissiveIntensity={0.35} />
          </mesh>
          {MANE.map((color, i) => (
            <mesh key={color} position={[0, 1.38 - i * 0.28, 0.26 - i * 0.2]}>
              <sphereGeometry args={[0.18, 10, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
          {TAIL.map((color, i) => (
            <mesh key={color} position={[(i % 2 ? 0.1 : -0.1), 0.75 - i * 0.18, -0.7 - i * 0.1]}>
              <sphereGeometry args={[0.2, 10, 10]} />
              <meshStandardMaterial color={color} />
            </mesh>
          ))}
        </group>
      </group>
    </group>
  )
}

function BalloonMesh({ balloon, collected }: { balloon: Balloon; collected: RefObject<Set<number>> }) {
  const ref = useRef<THREE.Group>(null)
  useFrame(({ clock }) => {
    const g = ref.current
    if (!g) return
    g.visible = !collected.current.has(balloon.id)
    g.position.y = 2.6 + Math.sin(clock.elapsedTime * 2 + balloon.id) * 0.25
    g.rotation.y = clock.elapsedTime * 0.8
  })
  return (
    <group position={[balloon.x, 0, balloon.z]}>
      <group ref={ref}>
        <mesh scale={[1, 1.25, 1]}>
          <sphereGeometry args={[0.85, 20, 16]} />
          <meshStandardMaterial color={balloon.color} emissive={balloon.color} emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[-0.28, 0.35, 0.6]} scale={[0.5, 0.8, 0.3]}>
          <sphereGeometry args={[0.22, 10, 10]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.55} />
        </mesh>
        <mesh position={[0, -1.15, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.16, 0.22, 8]} />
          <meshStandardMaterial color={balloon.color} />
        </mesh>
        <mesh position={[0, -1.95, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 1.4, 4]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      </group>
    </group>
  )
}

// Eases behind the kart. The camera's own heading lags the kart's so corners feel floaty, not jerky.
function ChaseCam({ sim }: { sim: RefObject<Sim> }) {
  const heading = useRef<number | null>(null)
  useFrame(({ camera }, delta) => {
    const dt = Math.min(delta, 0.05)
    const k = sim.current.kart
    if (heading.current === null) heading.current = k.heading
    let diff = k.heading - heading.current
    while (diff > Math.PI) diff -= Math.PI * 2
    while (diff < -Math.PI) diff += Math.PI * 2
    heading.current += diff * (1 - Math.exp(-3 * dt))
    const fx = Math.sin(heading.current)
    const fz = Math.cos(heading.current)
    camera.position.set(k.x - fx * 8.5, 5, k.z - fz * 8.5)
    camera.lookAt(k.x + fx * 4, 1.2, k.z + fz * 4)
  })
  return null
}

type RaceProps = {
  paused: boolean
  getInput: GetInput
  onCollect: (count: number) => void
  onFinish: () => void
}

function Race({ paused, getInput, onCollect, onFinish }: RaceProps) {
  const sim = useRef<Sim>(startRace(TRACK))
  const collected = useRef(new Set<number>())
  const finished = useRef(false)
  const bumpCooldown = useRef(0)

  useFrame((_, delta) => {
    if (paused) return
    const dt = Math.min(delta, 0.05)
    const s = sim.current

    // After the finish she coasts to a stop on her own.
    const input = finished.current ? { throttle: 0, steer: 0 } : getInput.current()
    const { kart, bumped } = stepKart(s.kart, input, dt, TRACK)
    s.kart = kart

    bumpCooldown.current -= dt
    if (bumped && bumpCooldown.current <= 0) {
      play('bump')
      bumpCooldown.current = 0.5
    }

    for (const id of touchedBalloons(BALLOONS, collected.current, kart.x, kart.z)) {
      collected.current.add(id)
      play('pop')
      popBurst(BALLOONS[id].color)
      onCollect(collected.current.size)
    }

    if (!finished.current) {
      const r = updateRace(s.race, TRACK, kart.x, kart.z)
      s.race = r.race
      if (r.done) {
        finished.current = true
        onFinish()
      }
    }
  })

  return (
    <>
      <Scenery />
      {BALLOONS.map((b) => (
        <BalloonMesh key={b.id} balloon={b} collected={collected} />
      ))}
      <UnicornKart sim={sim} getInput={getInput} />
      <ChaseCam sim={sim} />
    </>
  )
}

export function RaceScene(props: RaceProps) {
  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 62, near: 0.1, far: 400 }}>
      <color attach="background" args={[SKY]} />
      <fog attach="fog" args={[SKY, 70, 190]} />
      <hemisphereLight args={['#FFFFFF', '#A8E6A0', 1.4]} />
      <directionalLight position={[30, 50, 20]} intensity={1.6} />
      <Race {...props} />
    </Canvas>
  )
}
