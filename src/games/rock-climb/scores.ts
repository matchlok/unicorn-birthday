import { readJson, writeJson } from '../../engine/persist'

export type ScoreEntry = { name: string; score: number; at: number }

export const MAX_SCORES = 5
const KEY = 'rockClimbScores'

// Keep only well-formed rows; storage may hold anything.
export function cleanTable(raw: unknown): ScoreEntry[] {
  if (!Array.isArray(raw)) return []
  return raw
    .filter(
      (e): e is ScoreEntry =>
        !!e && typeof e === 'object' && typeof e.name === 'string' && Number.isFinite(e.score) && Number.isFinite(e.at),
    )
    .map((e) => ({ name: e.name.slice(0, 16), score: Math.max(0, Math.round(e.score)), at: e.at }))
    .sort((a, b) => b.score - a.score || a.at - b.at)
    .slice(0, MAX_SCORES)
}

// Insert a run. A tie goes below the older score. rank is 0-based, or null if it didn't make the table.
export function addScore(table: ScoreEntry[], entry: ScoreEntry): { table: ScoreEntry[]; rank: number | null } {
  const sorted = cleanTable(table)
  let rank = sorted.findIndex((e) => entry.score > e.score)
  if (rank === -1) rank = sorted.length
  if (rank >= MAX_SCORES) return { table: sorted, rank: null }
  const next = [...sorted.slice(0, rank), entry, ...sorted.slice(rank)].slice(0, MAX_SCORES)
  return { table: next, rank }
}

export function loadScores(): ScoreEntry[] {
  return cleanTable(readJson<unknown>(KEY, []))
}

export function saveScores(table: ScoreEntry[]): void {
  writeJson(KEY, table)
}
