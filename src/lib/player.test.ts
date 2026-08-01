import { describe, it, expect } from 'vitest'
import { pickNextIndex, pickPrevIndex, type QueueState } from './player-queue'
import type { Track } from '@/types/database'

function track(n: number): Track {
  return {
    id: `t${n}`,
    release_id: 'r1',
    title: `Track ${n}`,
    duration: 100,
    audio_url: `https://example.test/${n}.mp3`,
    track_number: n,
    created_at: '2026-01-01T00:00:00.000Z',
  }
}

function state(overrides: Partial<QueueState> = {}): QueueState {
  return {
    tracks: [track(1), track(2), track(3)],
    currentIndex: 0,
    shuffle: false,
    repeat: 'off',
    ...overrides,
  }
}

describe('pickNextIndex', () => {
  it('advances to the following track', () => {
    expect(pickNextIndex(state({ currentIndex: 0 }))).toBe(1)
    expect(pickNextIndex(state({ currentIndex: 1 }))).toBe(2)
  })

  it('returns -1 at the end of the list when repeat is off', () => {
    expect(pickNextIndex(state({ currentIndex: 2 }))).toBe(-1)
  })

  it('wraps to the start at the end of the list when repeat is all', () => {
    expect(pickNextIndex(state({ currentIndex: 2, repeat: 'all' }))).toBe(0)
  })

  it('returns 0 for an empty track list', () => {
    expect(pickNextIndex(state({ tracks: [], currentIndex: 0 }))).toBe(0)
  })

  it('never picks the current track when shuffling', () => {
    const s = state({ shuffle: true, currentIndex: 1 })
    for (let i = 0; i < 100; i++) {
      const next = pickNextIndex(s)
      expect(next).not.toBe(1)
      expect(next).toBeGreaterThanOrEqual(0)
      expect(next).toBeLessThan(3)
    }
  })

  it('advances normally when shuffling a single-track release', () => {
    // With one track the "pick something else" loop would never terminate, so
    // shuffle must fall through to the sequential path.
    expect(pickNextIndex(state({ tracks: [track(1)], shuffle: true, currentIndex: 0 }))).toBe(-1)
  })
})

describe('pickPrevIndex', () => {
  it('steps back one track', () => {
    expect(pickPrevIndex(state({ currentIndex: 2 }))).toBe(1)
  })

  it('stays on the first track when repeat is off', () => {
    expect(pickPrevIndex(state({ currentIndex: 0 }))).toBe(0)
  })

  it('wraps to the last track when repeat is all', () => {
    expect(pickPrevIndex(state({ currentIndex: 0, repeat: 'all' }))).toBe(2)
  })

  it('returns 0 for an empty track list', () => {
    expect(pickPrevIndex(state({ tracks: [], currentIndex: 0 }))).toBe(0)
  })
})
