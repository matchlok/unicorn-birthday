import { Frame, LINE } from './parts'

export function Owl() {
  return (
    <Frame bg="#FFD9A8">
      <path d="M56 60 52 28l30 22zM144 60l4-32-30 22z" fill="#A5642B" {...LINE} />
      <ellipse cx="100" cy="118" rx="56" ry="62" fill="#C07A3A" {...LINE} />
      <ellipse cx="100" cy="148" rx="30" ry="26" fill="#FFD9A8" {...LINE} strokeWidth={4} />
      {[70, 130].map((x) => (
        <g key={x}>
          <circle cx={x} cy="100" r="22" fill="white" {...LINE} />
          <circle cx={x} cy="102" r="11" fill="var(--grape)" />
          <circle cx={x - 4} cy="97" r="4" fill="white" />
        </g>
      ))}
      <path d="M90 118h20l-10 16z" fill="#FF9B3D" {...LINE} strokeWidth={4} />
      <circle cx="50" cy="130" r="8" fill="#FF7EB9" opacity="0.6" />
      <circle cx="150" cy="130" r="8" fill="#FF7EB9" opacity="0.6" />
    </Frame>
  )
}
