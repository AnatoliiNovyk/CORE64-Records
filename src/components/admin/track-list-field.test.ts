import { describe, it, expect } from 'vitest'
import { tracksToFormValues } from './track-list-field'
import type { Track } from '@/types/database'

function track(overrides: Partial<Track> = {}): Track {
  return {
    id: 'db-id-1',
    release_id: 'r1',
    title: 'Track',
    duration: 100,
    audio_url: 'https://example.test/1.mp3',
    track_number: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('tracksToFormValues', () => {
  it('returns an empty array for missing or empty input', () => {
    expect(tracksToFormValues(undefined)).toEqual([])
    expect(tracksToFormValues([])).toEqual([])
  })

  it('carries the database id into the form value', () => {
    // The save path decides between UPDATE and INSERT purely from this id, so
    // losing it here silently turns every edit into a no-op.
    const [value] = tracksToFormValues([track({ id: 'real-db-id' })])
    expect(value.id).toBe('real-db-id')
  })

  it('sorts by track number rather than input order', () => {
    const values = tracksToFormValues([
      track({ id: 'c', track_number: 3 }),
      track({ id: 'a', track_number: 1 }),
      track({ id: 'b', track_number: 2 }),
    ])
    expect(values.map((v) => v.id)).toEqual(['a', 'b', 'c'])
  })

  it('does not mutate the input array', () => {
    const input = [track({ id: 'c', track_number: 3 }), track({ id: 'a', track_number: 1 })]
    tracksToFormValues(input)
    expect(input.map((t) => t.id)).toEqual(['c', 'a'])
  })

  it('preserves a null audio_url instead of dropping the track', () => {
    const [value] = tracksToFormValues([track({ audio_url: null, duration: null })])
    expect(value.audio_url).toBeNull()
    expect(value.duration).toBeNull()
  })
})
