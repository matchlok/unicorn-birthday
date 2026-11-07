import { Howl, Howler } from 'howler'

export type SfxName =
  | 'click'
  | 'flip'
  | 'match'
  | 'nomatch'
  | 'win'
  | 'padEnter'
  | 'step'
  | 'locked'

const sounds = new Map<SfxName, Howl>()
let muted = false

// Missing or undecodable files must never break the game.
function load(name: SfxName): Howl {
  let sound = sounds.get(name)
  if (!sound) {
    sound = new Howl({
      src: [`${import.meta.env.BASE_URL}sfx/${name}.mp3`],
      preload: true,
      onloaderror: () => {},
      onplayerror: () => {},
    })
    sounds.set(name, sound)
  }
  return sound
}

export function play(name: SfxName): void {
  if (muted) return
  try {
    load(name).play()
  } catch {
    // no sound is better than a crash
  }
}

export function setMuted(value: boolean): void {
  muted = value
  Howler.mute(value)
}

// Browsers block audio until a user gesture.
export function unlockAudio(): void {
  try {
    Howler.ctx?.resume().catch(() => {})
  } catch {
    // ignore
  }
}
