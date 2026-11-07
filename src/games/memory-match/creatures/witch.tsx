import { Eyes, Frame, LINE, Smile, Star } from './parts'

export function Witch() {
  return (
    <Frame bg="#DCC8FF">
      <circle cx="100" cy="124" r="48" fill="#FFE3C8" {...LINE} />
      <path d="M48 96q52 22 104 0l-8-14q-44 16-88 0z" fill="#7B4FC9" {...LINE} />
      <path d="M62 90 100 18l38 72z" fill="#7B4FC9" {...LINE} />
      <Star x={100} y={64} r={11} />
      <Eyes y={118} dx={20} />
      <circle cx="66" cy="136" r="9" fill="#9BE39B" opacity="0.8" />
      <circle cx="134" cy="136" r="9" fill="#9BE39B" opacity="0.8" />
      <Smile y={146} />
    </Frame>
  )
}
