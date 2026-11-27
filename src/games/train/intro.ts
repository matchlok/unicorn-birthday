// Timing and camera maths for the opening zoom. Pure: no React, no DOM.

export type Box = { x: number; y: number; w: number; h: number }

export interface IntroPlan {
  /** Close-up scene (steam, wave, toot) before the zoom. 0 on later rounds. */
  sceneMs: number
  /** Zoom out from the station to the whole board. */
  zoomMs: number
  /** When the whistle toots, from the start. null = no toot. */
  tootMs: number | null
}

/** First round of a visit: about 6s with the close-up. Later rounds: just a quick 1s zoom. */
export function introPlan(seen: boolean): IntroPlan {
  return seen ? { sceneMs: 0, zoomMs: 1000, tootMs: null } : { sceneMs: 4400, zoomMs: 1600, tootMs: 3700 }
}

export const introTotalMs = (p: IntroPlan) => p.sceneMs + p.zoomMs

export interface IntroFrame {
  stage: 'scene' | 'zoom' | 'done'
  /** 0 = zoomed in on the station, 1 = the whole board. Eased. */
  zoom: number
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

export function introFrame(plan: IntroPlan, elapsedMs: number): IntroFrame {
  if (elapsedMs < plan.sceneMs) return { stage: 'scene', zoom: 0 }
  if (elapsedMs >= introTotalMs(plan)) return { stage: 'done', zoom: 1 }
  return { stage: 'zoom', zoom: ease((elapsedMs - plan.sceneMs) / plan.zoomMs) }
}

/** The camera at zoom t (0 = tight around `centre`, 1 = `full`). Width moves geometrically so the zoom
 *  feels even; the tight box keeps the full box's shape and never leaves it. */
export function zoomBox(full: Box, centre: { x: number; y: number }, factor: number, t: number): Box {
  const tw = full.w / factor
  const th = full.h / factor
  const tx = Math.min(Math.max(centre.x - tw / 2, full.x), full.x + full.w - tw)
  const ty = Math.min(Math.max(centre.y - th / 2, full.y), full.y + full.h - th)
  const k = factor ** -(1 - t) // 1/factor at t=0, 1 at t=1
  const w = full.w * k
  const h = full.h * k
  // Slide the top-left corner so the tight box lands exactly on `tx, ty` at t=0 and `full` at t=1.
  const s = (w - tw) / (full.w - tw || 1)
  return { x: tx + (full.x - tx) * s, y: ty + (full.y - ty) * s, w, h }
}

// "Once per visit": the long opening plays the first time the train maze opens after the page loads.
let seen = false
export const hasSeenIntro = () => seen
export const markIntroSeen = () => {
  seen = true
}
