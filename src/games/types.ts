import type { ComponentType, LazyExoticComponent } from 'react'

export type GameResult = { completed: boolean }

export type GameProps = {
  onExit: (result: GameResult) => void
}

export type GameId = 'memory-match' | 'kart-racing' | 'mystery'

export type GameEntry = {
  id: GameId
  padColor: string // CSS token value
  icon: 'cards' | 'kart' | 'present'
  status: 'ready' | 'locked' | 'coming-soon'
  component?: LazyExoticComponent<ComponentType<GameProps>>
}
