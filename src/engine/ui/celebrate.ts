import confetti from 'canvas-confetti'

const COLORS = ['#FFB3D9', '#C8B6FF', '#B8F2E6', '#FFE66D', '#A0E7FF', '#FFC9A8']

const safely = (fn: () => void) => {
  try {
    fn()
  } catch {
    // confetti is decoration only
  }
}

// Three confetti bursts in the palette colors.
export function celebrate(): void {
  const burst = (x: number, delay: number) =>
    setTimeout(() => {
      safely(() => confetti({ particleCount: 90, spread: 80, origin: { x, y: 0.65 }, colors: COLORS }))
    }, delay)
  burst(0.2, 0)
  burst(0.8, 250)
  burst(0.5, 500)
}

// Big opening salvo, then confetti cannons from both sides and star-shaped bursts until stopped.
export function celebrateBig(): () => void {
  const timers: number[] = []
  const salvo = (x: number, y: number, delay: number) =>
    timers.push(
      window.setTimeout(
        () =>
          safely(() =>
            confetti({ particleCount: 140, spread: 360, startVelocity: 45, ticks: 120, origin: { x, y }, colors: COLORS }),
          ),
        delay,
      ),
    )
  salvo(0.5, 0.5, 0)
  salvo(0.2, 0.4, 200)
  salvo(0.8, 0.4, 400)
  salvo(0.35, 0.3, 700)
  salvo(0.65, 0.3, 900)

  const cannons = window.setInterval(() => {
    safely(() => {
      confetti({ particleCount: 6, angle: 60, spread: 60, origin: { x: 0, y: 0.8 }, colors: COLORS })
      confetti({ particleCount: 6, angle: 120, spread: 60, origin: { x: 1, y: 0.8 }, colors: COLORS })
    })
  }, 120)
  const stars = window.setInterval(() => {
    safely(() =>
      confetti({
        particleCount: 14,
        spread: 90,
        scalar: 1.6,
        shapes: ['star'],
        origin: { x: 0.15 + Math.random() * 0.7, y: 0.2 + Math.random() * 0.3 },
        colors: ['#FFE66D', '#FFB3D9', '#A0E7FF'],
      }),
    )
  }, 700)
  // Stop the cannons after a while so the tab doesn't keep working forever.
  const stop = window.setTimeout(() => window.clearInterval(cannons), 6000)

  return () => {
    timers.forEach(window.clearTimeout)
    window.clearInterval(cannons)
    window.clearInterval(stars)
    window.clearTimeout(stop)
  }
}

// Small burst for a popped balloon, in the balloon's own color.
export function popBurst(color: string): void {
  safely(() =>
    confetti({ particleCount: 40, spread: 70, startVelocity: 28, ticks: 60, origin: { x: 0.5, y: 0.45 }, colors: [color, '#ffffff'] }),
  )
}
