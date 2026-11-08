import { useEffect, useState } from 'react'
import { boardLayout, type BoardLayout, type Insets } from './layout'

// iOS safe-area insets are only readable through CSS, so measure them with a probe element.
function readSafeInsets(): Insets {
  const probe = document.createElement('div')
  probe.style.cssText =
    'position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)'
  document.body.appendChild(probe)
  const s = getComputedStyle(probe)
  const px = (v: string) => Number.parseFloat(v) || 0
  const insets = { top: px(s.paddingTop), right: px(s.paddingRight), bottom: px(s.paddingBottom), left: px(s.paddingLeft) }
  probe.remove()
  return insets
}

const measure = (grid: { cols: number; rows: number }) =>
  boardLayout({ width: window.innerWidth, height: window.innerHeight }, grid, readSafeInsets())

// Recomputes on resize and rotation, so turning the phone re-flows the board.
export function useBoardLayout(cols: number, rows: number): BoardLayout {
  const [layout, setLayout] = useState(() => measure({ cols, rows }))
  useEffect(() => {
    const update = () => setLayout(measure({ cols, rows }))
    update()
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('orientationchange', update)
    }
  }, [cols, rows])
  return layout
}
