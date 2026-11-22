import type { Level } from './logic'

// Hand-made levels. Legend is at the top of logic.ts.
// Each wrong branch runs straight into a buffer stop (X). The train leaves the start heading east.

export const LEVELS: Record<1 | 2 | 3, Level[]> = {
  1: [
    {
      stars: 1,
      grid: ['S-1E', '..X.', '....'],
      startDir: 'E',
      switches: [{ id: 1, cell: [0, 2], stemDir: 'W', branches: ['S', 'E'], solution: 1 }],
    },
    {
      stars: 1,
      grid: ['S-17', '..X|', 'E--J'],
      startDir: 'E',
      switches: [{ id: 1, cell: [0, 2], stemDir: 'W', branches: ['E', 'S'], solution: 0 }],
    },
    {
      stars: 1,
      grid: ['S-7.', 'X-17', '...E'],
      startDir: 'E',
      switches: [{ id: 1, cell: [1, 2], stemDir: 'N', branches: ['W', 'E'], solution: 1 }],
    },
  ],
  2: [
    {
      stars: 2,
      grid: ['S-1-7', '..XE2', '....|', '....X'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 2], stemDir: 'W', branches: ['S', 'E'], solution: 1 },
        { id: 2, cell: [1, 4], stemDir: 'N', branches: ['W', 'S'], solution: 0 },
      ],
    },
    {
      stars: 2,
      grid: ['S-7..', 'X-1-7', 'E---2', '....X'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 2], stemDir: 'N', branches: ['W', 'E'], solution: 1 },
        { id: 2, cell: [2, 4], stemDir: 'N', branches: ['W', 'S'], solution: 0 },
      ],
    },
    {
      stars: 2,
      grid: ['S1X..', '.|...', 'X2--E', '.....'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['E', 'S'], solution: 1 },
        { id: 2, cell: [2, 1], stemDir: 'N', branches: ['E', 'W'], solution: 0 },
      ],
    },
  ],
  3: [
    {
      stars: 3,
      grid: ['S-1-27', '..X.X|', '..E--3', '.....X'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 2], stemDir: 'W', branches: ['S', 'E'], solution: 1 },
        { id: 2, cell: [0, 4], stemDir: 'W', branches: ['E', 'S'], solution: 0 },
        { id: 3, cell: [2, 5], stemDir: 'N', branches: ['W', 'S'], solution: 0 },
      ],
    },
    {
      stars: 3,
      grid: ['S-7...', 'X-1-7.', '..XX27', 'E-3--J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 2], stemDir: 'N', branches: ['W', 'E'], solution: 1 },
        { id: 2, cell: [2, 4], stemDir: 'N', branches: ['E', 'W'], solution: 0 },
        { id: 3, cell: [3, 2], stemDir: 'E', branches: ['N', 'W'], solution: 1 },
      ],
    },
    {
      stars: 3,
      grid: ['S1-7..', '.XX2-7', '...X.|', 'E--3-J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['E', 'S'], solution: 0 },
        { id: 2, cell: [1, 3], stemDir: 'N', branches: ['W', 'E'], solution: 1 },
        { id: 3, cell: [3, 3], stemDir: 'E', branches: ['W', 'N'], solution: 0 },
      ],
    },
  ],
}

/** Played in turn: all of the 1 star levels, and so on up the ladder. */
export const ALL_LEVELS: Level[] = [...LEVELS[1], ...LEVELS[2], ...LEVELS[3]]
