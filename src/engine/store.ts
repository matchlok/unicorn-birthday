import { create } from 'zustand'
import type { GameId } from '../games/types'
import { readJson, writeJson } from './persist'

export type Scene = { kind: 'name' } | { kind: 'hub' } | { kind: 'game'; id: GameId }

type State = {
  scene: Scene
  unicornName: string | null // persisted
  muted: boolean // persisted
  stickers: Record<string, number> // gameId -> wins, persisted
  hubSpawn: { x: number; z: number } | null // return-to-pad position
  goTo: (scene: Scene) => void
  setName: (name: string) => void
  toggleMute: () => void
  addSticker: (gameId: string) => void
  setHubSpawn: (spawn: State['hubSpawn']) => void
}

export const useStore = create<State>((set, get) => ({
  // Phase 0 has no NameScreen yet, so always start at the hub.
  // Phase 1: start at `{ kind: 'name' }` when `unicornName` is null.
  scene: { kind: 'hub' },
  unicornName: readJson<string | null>('unicornName', null),
  muted: readJson('muted', false),
  stickers: readJson<Record<string, number>>('stickers', {}),
  hubSpawn: null,
  goTo: (scene) => set({ scene }),
  setName: (name) => {
    writeJson('unicornName', name)
    set({ unicornName: name })
  },
  toggleMute: () => {
    const muted = !get().muted
    writeJson('muted', muted)
    set({ muted })
  },
  addSticker: (gameId) => {
    const stickers = { ...get().stickers, [gameId]: (get().stickers[gameId] ?? 0) + 1 }
    writeJson('stickers', stickers)
    set({ stickers })
  },
  setHubSpawn: (hubSpawn) => set({ hubSpawn }),
}))
