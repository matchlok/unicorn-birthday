import { Cheeks, Eyes, Frame, LINE, Smile, Star } from './parts'

export function Fairy() {
  return (
    <Frame bg="#CBEFFF">
      <ellipse cx="52" cy="96" rx="30" ry="48" transform="rotate(-20 52 96)" fill="#A0E7FF" opacity="0.8" {...LINE} />
      <ellipse cx="148" cy="96" rx="30" ry="48" transform="rotate(20 148 96)" fill="#A0E7FF" opacity="0.8" {...LINE} />
      <circle cx="100" cy="116" r="42" fill="#FFE3C8" {...LINE} />
      <path d="M58 112q0-48 42-48t42 48q-20-26-42-26t-42 26z" fill="#FFC857" {...LINE} />
      <Eyes y={118} dx={17} r={10} />
      <Cheeks y={136} dx={28} />
      <Smile y={142} w={10} />
      <path d="M150 168 172 126" stroke="var(--grape)" strokeWidth="6" strokeLinecap="round" />
      <Star x={174} y={118} r={16} />
    </Frame>
  )
}
