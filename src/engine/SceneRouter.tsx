import { Suspense, useEffect, useState } from 'react'
import { PartyHub } from '../hub/PartyHub'
import { findGame } from '../games/registry'
import { NameScreen } from '../screens/NameScreen'
import { Transition, TRANSITION_MS } from './Transition'
import { useStore, type Scene } from './store'

function Loading() {
  return <div style={{ display: 'grid', placeItems: 'center', height: '100%', fontSize: '4rem' }}>⭐</div>
}

function CurrentScene({ scene }: { scene: Scene }) {
  const goTo = useStore((s) => s.goTo)

  switch (scene.kind) {
    case 'hub':
      return <PartyHub />
    case 'game': {
      const Game = findGame(scene.id)?.component
      if (!Game) return <PartyHub />
      return (
        <Suspense fallback={<Loading />}>
          <Game onExit={() => goTo({ kind: 'hub' })} />
        </Suspense>
      )
    }
    case 'name':
      return <NameScreen />
  }
}

// Shows `shown`, and when the store's scene changes, wipes to pink, swaps, and wipes back.
export function SceneRouter() {
  const target = useStore((s) => s.scene)
  const [shown, setShown] = useState<Scene>(target)
  const covering = target !== shown

  useEffect(() => {
    if (target === shown) return
    const swap = setTimeout(() => setShown(target), TRANSITION_MS)
    return () => clearTimeout(swap)
  }, [target, shown])

  return (
    <>
      <CurrentScene scene={shown} />
      <Transition covering={covering} />
    </>
  )
}
