import { Eyes, Frame, LINE, Smile } from './parts'

export function Gnome() {
  return (
    <Frame bg="#FFC9C9">
      <path d="M100 170q-46 4-44-30 4-24 20-46 14-4 24-4t24 4q16 22 20 46 2 34-44 30z" fill="white" {...LINE} />
      <path d="M52 92q48 14 96 0L112 14q-12-6-24 0z" fill="#E8403F" {...LINE} />
      <Eyes y={106} dx={18} r={9} />
      <circle cx="100" cy="126" r="14" fill="#FFB4A0" {...LINE} strokeWidth={4} />
      <Smile y={152} w={10} />
    </Frame>
  )
}
