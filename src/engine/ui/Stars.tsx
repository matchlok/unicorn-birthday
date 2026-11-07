export function Stars({ count, size = 44 }: { count: 1 | 2 | 3; size?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 4 }} aria-label={`${count} stars`}>
      {Array.from({ length: count }, (_, i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 48 48">
          <path
            d="M24 4l6.2 12.8 14 1.8-10.2 9.8 2.6 13.9L24 35.6 11.4 42.3 14 28.4 3.8 18.6l14-1.8z"
            fill="var(--butter)"
            stroke="var(--grape)"
            strokeWidth="4"
            strokeLinejoin="round"
          />
        </svg>
      ))}
    </span>
  )
}
