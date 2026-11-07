import { useLayoutEffect, useMemo, useRef, type ReactNode } from 'react'
import * as THREE from 'three'
import { POOL, SANDBOX, TRACK } from './course'
import { headingOf, offsetLine, pointAt, scatter, type Vec2 } from './logic'

type Item = { x: number; y: number; z: number; ry?: number; sx?: number; sy?: number; sz?: number; color?: string }

// Many copies of one shape in a single draw call.
function Multi({ items, children }: { items: Item[]; children: ReactNode }) {
  const ref = useRef<THREE.InstancedMesh>(null)
  useLayoutEffect(() => {
    const mesh = ref.current
    if (!mesh) return
    const o = new THREE.Object3D()
    const c = new THREE.Color()
    items.forEach((it, i) => {
      o.position.set(it.x, it.y, it.z)
      o.rotation.set(0, it.ry ?? 0, 0)
      o.scale.set(it.sx ?? 1, it.sy ?? 1, it.sz ?? 1)
      o.updateMatrix()
      mesh.setMatrixAt(i, o.matrix)
      if (it.color) mesh.setColorAt(i, c.set(it.color))
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [items])
  return (
    <instancedMesh key={items.length} ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      {children}
    </instancedMesh>
  )
}

function ribbon(a: Vec2[], b: Vec2[], y: number): THREE.BufferGeometry {
  const n = a.length
  const pos = new Float32Array(n * 6)
  const idx: number[] = []
  for (let i = 0; i < n; i++) {
    pos.set([a[i].x, y, a[i].z, b[i].x, y, b[i].z], i * 6)
    const j = (i + 1) % n
    idx.push(2 * i, 2 * i + 1, 2 * j, 2 * i + 1, 2 * j + 1, 2 * j)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

// Rails run along each segment of a line; posts stand at every other vertex.
function fenceItems(line: Vec2[]): { rails: Item[]; posts: Item[] } {
  const rails: Item[] = []
  const posts: Item[] = []
  line.forEach((a, i) => {
    const b = line[(i + 1) % line.length]
    const dx = b.x - a.x
    const dz = b.z - a.z
    const len = Math.hypot(dx, dz)
    const ry = Math.atan2(-dz, dx)
    const mx = (a.x + b.x) / 2
    const mz = (a.z + b.z) / 2
    rails.push({ x: mx, y: 0.5, z: mz, ry, sx: len + 0.05 }, { x: mx, y: 0.9, z: mz, ry, sx: len + 0.05 })
    if (i % 2 === 0) posts.push({ x: a.x, y: 0.55, z: a.z })
  })
  return { rails, posts }
}

const LEAF = ['#8EDB8E', '#7CCB9B', '#A6E6A0', '#86D6B0']
const PETAL = ['#FF7EB9', '#FFE66D', '#FFFFFF', '#C8B6FF', '#FFC9A8', '#A0E7FF']

let checker: THREE.Texture | null = null
function checkerTexture(): THREE.Texture {
  if (checker) return checker
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 32
  const g = canvas.getContext('2d')
  if (g) {
    for (let x = 0; x < 8; x++)
      for (let y = 0; y < 2; y++) {
        g.fillStyle = (x + y) % 2 ? '#5B3A8C' : '#FFFFFF'
        g.fillRect(x * 16, y * 16, 16, 16)
      }
  }
  const t = new THREE.CanvasTexture(canvas)
  t.colorSpace = THREE.SRGBColorSpace
  t.magFilter = THREE.NearestFilter
  checker = t
  return t
}

const RAINBOW = ['#FF7EB9', '#FFC9A8', '#FFE66D', '#B8F2E6', '#A0E7FF', '#C8B6FF']

function FinishArch() {
  const p = pointAt(TRACK, 0)
  const map = checkerTexture()
  const hw = TRACK.halfWidth
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, headingOf(p.tx, p.tz), 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <planeGeometry args={[hw * 2, 2]} />
        <meshStandardMaterial map={map} />
      </mesh>
      {RAINBOW.map((color, i) => (
        <mesh key={color} position={[0, 0, i * 0.01]}>
          <torusGeometry args={[hw + 0.2 - i * 0.42, 0.21, 10, 36, Math.PI]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
    </group>
  )
}

function HoseArch() {
  const p = pointAt(TRACK, 0.5)
  return (
    <group position={[p.x, 0, p.z]} rotation={[0, headingOf(p.tx, p.tz), 0]}>
      <mesh>
        <torusGeometry args={[TRACK.halfWidth - 0.4, 0.3, 10, 36, Math.PI]} />
        <meshStandardMaterial color="#6FD08C" />
      </mesh>
      {/* a little spray of water drops along the hose */}
      {Array.from({ length: 7 }, (_, i) => {
        const a = (Math.PI * (i + 0.5)) / 7
        const r = TRACK.halfWidth - 0.4
        return (
          <mesh key={i} position={[Math.cos(a) * r, Math.sin(a) * r - 0.9, 0]}>
            <sphereGeometry args={[0.18, 8, 8]} />
            <meshStandardMaterial color="#A0E7FF" emissive="#A0E7FF" emissiveIntensity={0.4} />
          </mesh>
        )
      })}
    </group>
  )
}

export function Scenery() {
  const world = useMemo(() => {
    const hw = TRACK.halfWidth
    const fenceLines = [offsetLine(TRACK, hw + 0.8), offsetLine(TRACK, -(hw + 0.8))].map(fenceItems)
    const avoid = [
      { x: POOL.x, z: POOL.z, r: POOL.r + 3 },
      { x: SANDBOX.x, z: SANDBOX.z, r: SANDBOX.size },
    ]
    const trees = scatter(TRACK, 60, 11, { half: 90, clearance: 7, avoid })
    const flowers = scatter(TRACK, 160, 5, { half: 70, clearance: 2.6, avoid })
    const clouds = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2
      return { x: Math.cos(a) * 95, z: Math.sin(a) * 95, y: 30 + (i % 3) * 6 }
    })
    return {
      road: ribbon(offsetLine(TRACK, hw), offsetLine(TRACK, -hw), 0.03),
      edge: ribbon(offsetLine(TRACK, hw + 0.45), offsetLine(TRACK, -(hw + 0.45)), 0.015),
      rails: fenceLines.flatMap((f) => f.rails),
      posts: fenceLines.flatMap((f) => f.posts),
      trunks: trees.map((t, i) => ({ x: t.x, y: 1.2, z: t.z, sy: 0.8 + (i % 3) * 0.2 })),
      canopies: trees.map((t, i) => ({ x: t.x, y: 3.6 + (i % 3) * 0.3, z: t.z, sx: 2.2, sy: 2, sz: 2.2, color: LEAF[i % LEAF.length] })),
      flowers: flowers.map((f, i) => ({ x: f.x, y: 0.28, z: f.z, color: PETAL[i % PETAL.length] })),
      stems: flowers.map((f) => ({ x: f.x, y: 0.12, z: f.z })),
      clouds: clouds.flatMap((c, i) =>
        [-3, 0, 3].map((dx, j) => ({ x: c.x + dx, y: c.y + (j === 1 ? 1 : 0), z: c.z, sx: 4 - Math.abs(dx) * 0.3, sy: 2, sz: 3, color: i % 2 ? '#FFFFFF' : '#FFF4FB' })),
      ),
    }
  }, [])

  return (
    <group>
      {/* lawn */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[170, 48]} />
        <meshStandardMaterial color="#A8E6A0" />
      </mesh>
      {/* track: pale edge line, then the path itself */}
      <mesh geometry={world.edge}>
        <meshStandardMaterial color="#FFF8F0" side={THREE.DoubleSide} />
      </mesh>
      <mesh geometry={world.road}>
        <meshStandardMaterial color="#F6D8B4" side={THREE.DoubleSide} />
      </mesh>

      {/* white picket-style fence on both sides */}
      <Multi items={world.rails}>
        <boxGeometry args={[1, 0.14, 0.14]} />
        <meshStandardMaterial color="#FFFFFF" />
      </Multi>
      <Multi items={world.posts}>
        <boxGeometry args={[0.22, 1.1, 0.22]} />
        <meshStandardMaterial color="#FFF8F0" />
      </Multi>

      <FinishArch />
      <HoseArch />

      {/* kiddie pool */}
      <group position={[POOL.x, 0, POOL.z]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[POOL.r, POOL.r, 0.6, 32]} />
          <meshStandardMaterial color="#FF7EB9" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[POOL.r - 0.5, POOL.r - 0.5, 0.2, 32]} />
          <meshStandardMaterial color="#7FD8FF" emissive="#7FD8FF" emissiveIntensity={0.25} />
        </mesh>
        <mesh position={[1.2, 0.95, 0.5]}>
          <sphereGeometry args={[0.55, 14, 14]} />
          <meshStandardMaterial color="#FFE66D" />
        </mesh>
      </group>

      {/* sandbox */}
      <group position={[SANDBOX.x, 0, SANDBOX.z]}>
        <mesh position={[0, 0.3, 0]}>
          <boxGeometry args={[SANDBOX.size, 0.6, SANDBOX.size]} />
          <meshStandardMaterial color="#C99A6B" />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[SANDBOX.size - 0.7, 0.2, SANDBOX.size - 0.7]} />
          <meshStandardMaterial color="#FFE9A8" />
        </mesh>
        <mesh position={[-1, 0.95, 0.8]}>
          <coneGeometry args={[0.8, 1.2, 14]} />
          <meshStandardMaterial color="#FFD98A" />
        </mesh>
      </group>

      {/* trees, flowers, clouds */}
      <Multi items={world.trunks}>
        <cylinderGeometry args={[0.35, 0.5, 2.4, 8]} />
        <meshStandardMaterial color="#B98B66" />
      </Multi>
      <Multi items={world.canopies}>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#FFFFFF" flatShading />
      </Multi>
      <Multi items={world.stems}>
        <cylinderGeometry args={[0.04, 0.04, 0.26, 5]} />
        <meshStandardMaterial color="#6FD08C" />
      </Multi>
      <Multi items={world.flowers}>
        <sphereGeometry args={[0.2, 8, 6]} />
        <meshStandardMaterial color="#FFFFFF" />
      </Multi>
      <Multi items={world.clouds}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.35} />
      </Multi>
    </group>
  )
}
