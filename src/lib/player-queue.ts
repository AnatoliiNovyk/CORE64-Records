import type { Track } from '@/types/database'

export type RepeatMode = 'off' | 'all' | 'one'

/**
 * The subset of player state that queue navigation depends on. Kept separate
 * from the React context so the ordering logic stays pure and testable.
 */
export interface QueueState {
  tracks: Track[]
  currentIndex: number
  shuffle: boolean
  repeat: RepeatMode
}

export function pickNextIndex(state: QueueState): number {
  const { tracks, currentIndex, shuffle, repeat } = state
  if (tracks.length === 0) return 0
  if (shuffle && tracks.length > 1) {
    let next = currentIndex
    while (next === currentIndex) {
      next = Math.floor(Math.random() * tracks.length)
    }
    return next
  }
  if (currentIndex < tracks.length - 1) return currentIndex + 1
  return repeat === 'all' ? 0 : -1
}

export function pickPrevIndex(state: QueueState): number {
  const { tracks, currentIndex, repeat } = state
  if (tracks.length === 0) return 0
  if (currentIndex > 0) return currentIndex - 1
  return repeat === 'all' ? tracks.length - 1 : 0
}
