import { Eyes, Frame, LINE, Smile } from './parts'

export function Dragon() {
  return (
    <Frame bg="#C9F2C7">
      <path d="M52 110q-34-26-26-52 22 4 38 30zM148 110q34-26 26-52-22 4-38 30z" fill="#6FCF6F" {...LINE} />
      <path d="M72 62 64 34l22 14zM128 62l8-28-22 14z" fill="#FFE66D" {...LINE} />
      <circle cx="100" cy="116" r="54" fill="#7ED87E" {...LINE} />
      <ellipse cx="100" cy="140" rx="28" ry="18" fill="#B8F2B0" {...LINE} strokeWidth={4} />
      <circle cx="90" cy="138" r="3.5" fill="var(--grape)" />
      <circle cx="110" cy="138" r="3.5" fill="var(--grape)" />
      <Eyes y={104} dx={24} />
      <Smile y={152} w={10} />
      <circle cx="158" cy="150" r="9" fill="white" opacity="0.9" />
      <circle cx="170" cy="138" r="6" fill="white" opacity="0.8" />
    </Frame>
  )
}
