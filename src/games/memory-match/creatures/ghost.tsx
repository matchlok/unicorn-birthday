import { Cheeks, Eyes, Frame, LINE, Smile } from './parts'

export function Ghost() {
  return (
    <Frame bg="#D9CCFF">
      <path d="M52 170V96q0-56 48-56t48 56v74l-16-14-16 14-16-14-16 14-16-14z" fill="white" {...LINE} />
      <Eyes y={100} dx={20} />
      <Cheeks y={122} dx={34} />
      <Smile y={126} />
    </Frame>
  )
}
