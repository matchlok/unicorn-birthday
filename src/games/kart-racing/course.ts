import { BACKYARD_CONTROL, buildTrack, makeBalloons } from './logic'

// The one backyard course. Built once at module load; both the scenery and the race read it.
export const TRACK = buildTrack(BACKYARD_CONTROL)
export const BALLOONS = makeBalloons(TRACK)
export const BALLOON_COUNT = BALLOONS.length

// Infield features (drawn by Scenery, kept clear of trees and flowers).
export const POOL = { x: -6, z: 0, r: 5 }
export const SANDBOX = { x: 13, z: -2, size: 7 }
