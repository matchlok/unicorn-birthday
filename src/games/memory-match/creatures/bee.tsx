import { Cheeks, Eyes, Frame, LINE, Smile } from './parts'

export function Bee() {
  return (
    <Frame bg="#FFF2A8">
      <ellipse cx="62" cy="62" rx="26" ry="18" fill="#E6F7FF" opacity="0.9" transform="rotate(-30 62 62)" {...LINE} strokeWidth={4} />
      <ellipse cx="138" cy="62" rx="26" ry="18" fill="#E6F7FF" opacity="0.9" transform="rotate(30 138 62)" {...LINE} strokeWidth={4} />
      <path d="M86 44Q80 28 70 24M114 44Q120 28 130 24" fill="none" {...LINE} />
      <circle cx="70" cy="24" r="6" fill="var(--grape)" />
      <circle cx="130" cy="24" r="6" fill="var(--grape)" />
      <ellipse cx="100" cy="112" rx="58" ry="54" fill="#FFD23F" {...LINE} />
      <path d="M52 92Q100 108 148 92M46 126Q100 146 154 126" fill="none" stroke="var(--grape)" strokeWidth="14" strokeLinecap="round" />
      <Eyes y={96} dx={22} />
      <Cheeks y={118} dx={38} />
      <Smile y={122} />
    </Frame>
  )
}
