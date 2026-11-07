import type { ComponentType } from 'react'
import { Bee } from './bee'
import { Dragon } from './dragon'
import { Fairy } from './fairy'
import { Ghost } from './ghost'
import { Gnome } from './gnome'
import { Mermaid } from './mermaid'
import { Owl } from './owl'
import { Penguin } from './penguin'
import { Unicorn } from './unicorn'
import { Witch } from './witch'

export type Creature = { id: string; name: string; color: string; Svg: ComponentType }

// `name` is for alt text and grown-ups only.
export const CREATURES: Creature[] = [
  { id: 'unicorn', name: 'Unicorn', color: '#FFE0F0', Svg: Unicorn },
  { id: 'witch', name: 'Witch', color: '#DCC8FF', Svg: Witch },
  { id: 'dragon', name: 'Dragon', color: '#C9F2C7', Svg: Dragon },
  { id: 'fairy', name: 'Fairy', color: '#CBEFFF', Svg: Fairy },
  { id: 'mermaid', name: 'Mermaid', color: '#B5EFE8', Svg: Mermaid },
  { id: 'ghost', name: 'Ghost', color: '#D9CCFF', Svg: Ghost },
  { id: 'owl', name: 'Owl', color: '#FFD9A8', Svg: Owl },
  { id: 'gnome', name: 'Gnome', color: '#FFC9C9', Svg: Gnome },
  { id: 'bee', name: 'Bee', color: '#FFF2A8', Svg: Bee },
  { id: 'penguin', name: 'Penguin', color: '#C9D6FF', Svg: Penguin },
]

export const CREATURE_IDS = CREATURES.map((c) => c.id)

export function findCreature(id: string): Creature {
  return CREATURES.find((c) => c.id === id) ?? CREATURES[0]
}
