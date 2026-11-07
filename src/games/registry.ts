import { lazy } from 'react'
import type { GameEntry } from './types'

export const GAMES: GameEntry[] = [
  {
    id: 'memory-match',
    padColor: 'var(--pink)',
    icon: 'cards',
    status: 'ready',
    component: lazy(() => import('./memory-match/MemoryMatch')),
  },
  {
    id: 'kart-racing',
    padColor: 'var(--mint)',
    icon: 'kart',
    status: 'ready',
    component: lazy(() => import('./kart-racing/KartRacing')),
  },
  { id: 'mystery', padColor: 'var(--butter)', icon: 'present', status: 'coming-soon' },
]

export function findGame(id: GameEntry['id']): GameEntry | undefined {
  return GAMES.find((game) => game.id === id)
}
