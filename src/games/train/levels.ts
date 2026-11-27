import type { Level } from './logic'

// Levels made with a small generator and checked by brute force (see levels.test.ts): every wrong
// branch ends at a buffer stop (X), and only one setting of the switches on the route gets through.
// Legend is at the top of logic.ts. The train leaves the start heading east.
//   1 to 3 stars: 2-way switches (green / red), no decoys.
//   4 and 5 stars: some 3-way switches (green / red / yellow) and one decoy switch that is not on the route.

export const LEVELS: Record<1 | 2 | 3 | 4 | 5, Level[]> = {
  1: [
    {
      stars: 1,
      grid: ['S-1X', 'E.|.', 'L-J.'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 2], stemDir: 'W', branches: ['E', 'S'], solution: 1 },
      ],
    },
    {
      stars: 1,
      grid: ['S7..', '.1X.', '.L-E'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 1], stemDir: 'N', branches: ['E', 'S'], solution: 1 },
      ],
    },
    {
      stars: 1,
      grid: ['S7.X', '.L-1', '.E-J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 3], stemDir: 'W', branches: ['S', 'N'], solution: 0 },
      ],
    },
  ],
  2: [
    {
      stars: 2,
      grid: ['S---7', '..X.|', 'EF2-1', 'LJ..X'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [2, 4], stemDir: 'N', branches: ['S', 'W'], solution: 1 },
        { id: 2, cell: [2, 2], stemDir: 'E', branches: ['W', 'N'], solution: 0 },
      ],
    },
    {
      stars: 2,
      grid: ['S17.X', '.||E2', '.X|.|', '..L-J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['S', 'E'], solution: 1 },
        { id: 2, cell: [1, 4], stemDir: 'S', branches: ['W', 'N'], solution: 0 },
      ],
    },
    {
      stars: 2,
      grid: ['S7F2X', 'X1J|.', '...|.', '...LE'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 1], stemDir: 'N', branches: ['E', 'W'], solution: 0 },
        { id: 2, cell: [0, 3], stemDir: 'W', branches: ['E', 'S'], solution: 1 },
      ],
    },
  ],
  3: [
    {
      stars: 3,
      grid: ['S-7..E', '..|X-3', '.X1.X|', '..L-2J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [2, 2], stemDir: 'N', branches: ['W', 'S'], solution: 1 },
        { id: 2, cell: [3, 4], stemDir: 'W', branches: ['N', 'E'], solution: 1 },
        { id: 3, cell: [1, 5], stemDir: 'S', branches: ['N', 'W'], solution: 0 },
      ],
    },
    {
      stars: 3,
      grid: ['S1X...', 'FJ.X.E', '|.F2-3', 'L-J..X'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['E', 'S'], solution: 1 },
        { id: 2, cell: [2, 3], stemDir: 'W', branches: ['N', 'E'], solution: 1 },
        { id: 3, cell: [2, 5], stemDir: 'W', branches: ['N', 'S'], solution: 0 },
      ],
    },
    {
      stars: 3,
      grid: ['S7...X', '.1XF-3', '.|F2XE', '.LJ...'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 1], stemDir: 'N', branches: ['E', 'S'], solution: 1 },
        { id: 2, cell: [2, 3], stemDir: 'W', branches: ['E', 'N'], solution: 1 },
        { id: 3, cell: [1, 5], stemDir: 'W', branches: ['S', 'N'], solution: 0 },
      ],
    },
  ],
  4: [
    {
      stars: 4,
      grid: ['S7.X.E.', 'X1-5.|.', '.|.X.|.', 'X2XXX4.', '.L-3-J.'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 1], stemDir: 'N', branches: ['E', 'S', 'W'], solution: 1 },
        { id: 2, cell: [3, 1], stemDir: 'N', branches: ['W', 'E', 'S'], solution: 2 },
        { id: 3, cell: [4, 3], stemDir: 'W', branches: ['E', 'N'], solution: 0 },
        { id: 4, cell: [3, 5], stemDir: 'S', branches: ['W', 'N'], solution: 1 },
        { id: 5, cell: [1, 3], stemDir: 'W', branches: ['N', 'S'], solution: 0 },
      ],
    },
    {
      stars: 4,
      grid: ['S1-5X.E', '.|.X..|', 'X2X.X.|', '.|.X4-J', 'X3--J..'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['E', 'S'], solution: 1 },
        { id: 2, cell: [2, 1], stemDir: 'N', branches: ['W', 'E', 'S'], solution: 2 },
        { id: 3, cell: [4, 1], stemDir: 'N', branches: ['W', 'E'], solution: 1 },
        { id: 4, cell: [3, 4], stemDir: 'S', branches: ['E', 'W', 'N'], solution: 0 },
        { id: 5, cell: [0, 3], stemDir: 'W', branches: ['E', 'S'], solution: 0 },
      ],
    },
    {
      stars: 4,
      grid: ['S7....X', 'FJX.X.|', '|F2-3-4', '||XXX.|', 'L1-5XEJ'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [4, 1], stemDir: 'W', branches: ['E', 'N'], solution: 1 },
        { id: 2, cell: [2, 2], stemDir: 'W', branches: ['N', 'E', 'S'], solution: 1 },
        { id: 3, cell: [2, 4], stemDir: 'W', branches: ['S', 'N', 'E'], solution: 2 },
        { id: 4, cell: [2, 6], stemDir: 'W', branches: ['S', 'N'], solution: 0 },
        { id: 5, cell: [4, 3], stemDir: 'W', branches: ['N', 'E'], solution: 0 },
      ],
    },
  ],
  5: [
    {
      stars: 5,
      grid: ['S-7.X.F-7', '.X1-6X|X4', '..|.XE5.|', 'X-2-7.X.|', '..XX3X..|', '....L---J'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 2], stemDir: 'N', branches: ['W', 'E', 'S'], solution: 2 },
        { id: 2, cell: [3, 2], stemDir: 'N', branches: ['E', 'S', 'W'], solution: 0 },
        { id: 3, cell: [4, 4], stemDir: 'N', branches: ['W', 'E', 'S'], solution: 2 },
        { id: 4, cell: [1, 8], stemDir: 'S', branches: ['W', 'N'], solution: 1 },
        { id: 5, cell: [2, 6], stemDir: 'N', branches: ['S', 'W'], solution: 1 },
        { id: 6, cell: [1, 4], stemDir: 'W', branches: ['N', 'E', 'S'], solution: 0 },
      ],
    },
    {
      stars: 5,
      grid: ['S-------7', 'F-7...XX1', '|.5X.X6X|', 'E.|.X.|FJ', '.X4-3-2J.', '..X.X.X..'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [1, 8], stemDir: 'N', branches: ['S', 'W'], solution: 0 },
        { id: 2, cell: [4, 6], stemDir: 'E', branches: ['S', 'W', 'N'], solution: 1 },
        { id: 3, cell: [4, 4], stemDir: 'E', branches: ['W', 'N', 'S'], solution: 0 },
        { id: 4, cell: [4, 2], stemDir: 'E', branches: ['S', 'W', 'N'], solution: 2 },
        { id: 5, cell: [2, 2], stemDir: 'S', branches: ['N', 'E'], solution: 0 },
        { id: 6, cell: [2, 6], stemDir: 'S', branches: ['W', 'N', 'E'], solution: 0 },
      ],
    },
    {
      stars: 5,
      grid: ['S1------7', '.|...X.X|', 'X6XEX3-2J', '.X.5X|.X.', '...|X4X..', '...L-J...'],
      startDir: 'E',
      switches: [
        { id: 1, cell: [0, 1], stemDir: 'W', branches: ['E', 'S'], solution: 0 },
        { id: 2, cell: [2, 7], stemDir: 'E', branches: ['N', 'S', 'W'], solution: 2 },
        { id: 3, cell: [2, 5], stemDir: 'E', branches: ['N', 'S', 'W'], solution: 1 },
        { id: 4, cell: [4, 5], stemDir: 'N', branches: ['S', 'W', 'E'], solution: 0 },
        { id: 5, cell: [3, 3], stemDir: 'S', branches: ['E', 'N'], solution: 1 },
        { id: 6, cell: [2, 1], stemDir: 'N', branches: ['S', 'W', 'E'], solution: 0 },
      ],
    },
  ],
}

/** Played in turn: all of the 1 star levels, and so on up the ladder. */
export const ALL_LEVELS: Level[] = [...LEVELS[1], ...LEVELS[2], ...LEVELS[3], ...LEVELS[4], ...LEVELS[5]]
