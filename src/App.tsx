import { useEffect } from 'react'
import { isAudioRunning, setMuted, unlockAudio } from './engine/audio'
import { SceneRouter } from './engine/SceneRouter'
import { useStore } from './engine/store'
import { MuteButton } from './engine/ui/MuteButton'

export default function App() {
  const muted = useStore((s) => s.muted)

  useEffect(() => {
    setMuted(muted)
  }, [muted])

  useEffect(() => {
    // iOS Safari only unlocks audio from touchend/click (not pointerdown). Keep trying on every
    // gesture until the context is really running, so a first tap that iOS ignored isn't the last chance.
    const events = ['touchend', 'click', 'pointerup', 'keydown'] as const
    const unlock = () => {
      unlockAudio()
      if (isAudioRunning()) events.forEach((e) => window.removeEventListener(e, unlock, true))
    }
    events.forEach((e) => window.addEventListener(e, unlock, true))
    return () => events.forEach((e) => window.removeEventListener(e, unlock, true))
  }, [])

  return (
    <>
      <SceneRouter />
      <MuteButton />
    </>
  )
}
