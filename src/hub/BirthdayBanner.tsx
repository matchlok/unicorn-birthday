import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'

// Usable text length along the arc, in viewBox units (the arc is ~600 long; leave a margin for the outline).
const ARC_FIT = 520

// "Happy Birthday, <name>!" arching over the cake. It is plain DOM text (so it uses the page's
// Fredoka font; drei's <Text> would fetch a font over the network) that follows a point in the scene.
export function BirthdayBanner({ name, bannerRef }: { name: string | null; bannerRef: RefObject<HTMLDivElement | null> }) {
  const text = name ? `Happy Birthday, ${name}!` : 'Happy Birthday!'
  const textRef = useRef<SVGTextElement>(null)

  // The text is centred on a fixed-length arc, so a long or wide name ("Rainbow") ran off the
  // start of the path and lost its first letters. Shrink the font until the whole line fits.
  useLayoutEffect(() => {
    const el = textRef.current
    if (!el) return
    const fit = () => {
      el.style.fontSize = ''
      const natural = el.getComputedTextLength()
      const size = parseFloat(getComputedStyle(el).fontSize)
      if (natural > ARC_FIT && natural > 0) el.style.fontSize = `${Math.floor((size * ARC_FIT) / natural)}px`
    }
    fit()
    void document.fonts?.ready.then(fit)
  }, [text])

  return (
    <div ref={bannerRef} className="hub-banner" aria-hidden>
      <svg viewBox="0 0 600 160">
        <defs>
          <path id="hub-banner-arc" d="M30 140 Q300 -30 570 140" fill="none" />
        </defs>
        <text ref={textRef} className="hub-banner__text" textAnchor="middle">
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
