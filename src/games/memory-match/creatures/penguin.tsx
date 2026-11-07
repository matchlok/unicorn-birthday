import { Cheeks, Eyes, Frame, LINE, Smile } from './parts'

export function Penguin() {
  return (
    <Frame bg="#C9D6FF">
      <ellipse cx="46" cy="124" rx="14" ry="32" fill="#3B4A8C" transform="rotate(14 46 124)" {...LINE} />
      <ellipse cx="154" cy="124" rx="14" ry="32" fill="#3B4A8C" transform="rotate(-14 154 124)" {...LINE} />
      <ellipse cx="100" cy="112" rx="54" ry="64" fill="#3B4A8C" {...LINE} />
      <ellipse cx="100" cy="128" rx="36" ry="46" fill="white" {...LINE} strokeWidth={4} />
      <Eyes y={92} dx={20} />
      <path d="M86 108h28l-14 18z" fill="#FF9B3D" {...LINE} strokeWidth={4} />
      <Cheeks y={112} dx={42} />
      <Smile y={140} w={10} />
      <ellipse cx="80" cy="176" rx="18" ry="8" fill="#FF9B3D" {...LINE} strokeWidth={4} />
      <ellipse cx="120" cy="176" rx="18" ry="8" fill="#FF9B3D" {...LINE} strokeWidth={4} />
    </Frame>
  )
}
