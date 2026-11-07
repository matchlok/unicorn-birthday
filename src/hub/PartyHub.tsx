import { BigButton } from '../engine/ui/BigButton'
import { useStore } from '../engine/store'

// Placeholder until Phase 3 replaces it with the 3D hub.
export function PartyHub() {
  const goTo = useStore((s) => s.goTo)

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100%' }}>
      <BigButton onClick={() => goTo({ kind: 'game', id: 'memory-match' })}>Memory Match</BigButton>
    </div>
  )
}
