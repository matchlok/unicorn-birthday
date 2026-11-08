import { useFrame } from '@react-three/fiber'
import { useRef, type RefObject } from 'react'
import * as THREE from 'three'

// "Happy Birthday, <name>!" arching over the cake. It is plain DOM text (so it uses the page's
// Fredoka font; drei's <Text> would fetch a font over the network) that follows a point in the scene.
export function BirthdayBanner({ name, bannerRef }: { name: string | null; bannerRef: RefObject<HTMLDivElement | null> }) {
  const text = name ? `Happy Birthday, ${name}!` : 'Happy Birthday!'
  return (
    <div ref={bannerRef} className="hub-banner" aria-hidden>
      <svg viewBox="0 0 600 160">
        <defs>
          <path id="hub-banner-arc" d="M30 140 Q300 -30 570 140" fill="none" />
        </defs>
        <text className="hub-banner__text" textAnchor="middle">
          <textPath href="#hub-banner-arc" startOffset="50%">
            {text}
          </textPath>
        </text>
      </svg>
    </div>
  )
}

const ANCHOR = new THREE.Vector3(0, 4.9, 0)

// Lives inside the Canvas: each frame, projects the point above the cake to the screen.
export function BannerAnchor({ bannerRef }: { bannerRef: RefObject<HTMLDivElement | null> }) {
  const v = useRef(new THREE.Vector3())
  useFrame(({ camera, size }) => {
    const el = bannerRef.current
    if (!el) return
    v.current.copy(ANCHOR).project(camera)
    const x = (v.current.x * 0.5 + 0.5) * size.width
    const y = (-v.current.y * 0.5 + 0.5) * size.height
    el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -75%)`
    el.style.opacity = v.current.z < 1 ? '1' : '0'
  })
  return null
}
