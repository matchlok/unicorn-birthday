import { useEffect } from 'react'
import { setMuted, unlockAudio } from './engine/audio'
import { SceneRouter } from './engine/SceneRouter'
import { useStore } from './engine/store'
import { MuteButton } from './engine/ui/MuteButton'

export default function App() {
  const muted = useStore((s) => s.muted)

  useEffect(() => {
    setMuted(muted)
  }, [muted])

  useEffect(() => {
    const unlock = () => unlockAudio()
    window.addEventListener('pointerdown', unlock)
    window.addEventListener('keydown', unlock)
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [])

  return (
    <>
      <SceneRouter />
      <MuteButton />
    </>
  )
}
