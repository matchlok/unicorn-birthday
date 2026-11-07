import { Cheeks, Eyes, Frame, LINE, Smile } from './parts'

export function Unicorn() {
  return (
    <Frame bg="#FFE0F0">
      <path d="M52 100q-22 30-8 62M62 82q-30 20-22 52M76 66q-30 6-30 36" fill="none" stroke="#C8B6FF" strokeWidth="16" strokeLinecap="round" />
      <path d="M62 88q-8 24 4 46" fill="none" stroke="#A0E7FF" strokeWidth="9" strokeLinecap="round" />
      <path d="M52 112q-4 20 6 36" fill="none" stroke="#FFE66D" strokeWidth="9" strokeLinecap="round" />
      <circle cx="104" cy="118" r="56" fill="white" {...LINE} />
      <path d="M80 70 76 36 104 66" fill="white" {...LINE} />
      <path d="M96 64 112 14q4-4 8 0l6 52z" fill="#FFD23F" {...LINE} />
      <path d="M102 46l20 6M100 56l24 6" stroke="var(--grape)" strokeWidth="4" strokeLinecap="round" />
      <Eyes y={112} dx={22} />
      <Cheeks y={138} dx={38} />
      <Smile y={144} />
    </Frame>
  )
}
