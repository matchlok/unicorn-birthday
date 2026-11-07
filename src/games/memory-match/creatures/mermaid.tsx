import { Cheeks, Eyes, Frame, LINE, Smile } from './parts'

export function Mermaid() {
  return (
    <Frame bg="#B5EFE8">
      <circle cx="100" cy="100" r="52" fill="#FF9B54" {...LINE} />
      <circle cx="100" cy="106" r="40" fill="#FFE3C8" {...LINE} />
      <path d="M100 148q-14 24 0 28 30 4 44-22-22 12-44-6z" fill="#2FC4B2" {...LINE} />
      <path d="M144 154q18-6 20-24-4 22-20 24z" fill="#2FC4B2" {...LINE} />
      <Eyes y={102} dx={16} r={10} />
      <Cheeks y={122} dx={27} />
      <Smile y={126} w={10} />
      <path d="M72 76q28-24 56 0q-28-8-56 0z" fill="#FF9B54" {...LINE} />
    </Frame>
  )
}
