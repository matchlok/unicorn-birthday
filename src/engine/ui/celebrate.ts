import confetti from 'canvas-confetti'

const COLORS = ['#FFB3D9', '#C8B6FF', '#B8F2E6', '#FFE66D', '#A0E7FF', '#FFC9A8']

// Three confetti bursts in the palette colors.
export function celebrate(): void {
  const burst = (x: number, delay: number) =>
    setTimeout(() => {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { x, y: 0.65 }, colors: COLORS })
      } catch {
        // confetti is decoration only
      }
    }, delay)
  burst(0.2, 0)
  burst(0.8, 250)
  burst(0.5, 500)
}
