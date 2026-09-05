import { describe, it, expect } from 'vitest'
import { buildTrackSaveRows, getLocalizedField, supersededPaths } from './use-data'

// `translations` is optional on the generic constraint, so a literal without it
// trips TypeScript's weak-type check; the annotation keeps the intent explicit.
type Translatable = { title: string; translations?: Record<string, Record<string, string>> }

describe('getLocalizedField', () => {
  const item: Translatable = {
    title: 'Base title',
    translations: {
      uk: { title: 'Заголовок' },
    },
  }

  it('returns the translation for the requested language', () => {
    expect(getLocalizedField(item, 'title', 'uk')).toBe('Заголовок')
  })

  it('falls back to the base field when the language is missing', () => {
    expect(getLocalizedField(item, 'title', 'en')).toBe('Base title')
  })

  it('falls back to the base field when the field is missing in that language', () => {
    expect(getLocalizedField(item, 'title', 'de')).toBe('Base title')
  })

  it('falls back to the base field when translations are absent entirely', () => {
    const untranslated: Translatable = { title: 'Only base' }
    expect(getLocalizedField(untranslated, 'title', 'uk')).toBe('Only base')
  })

  it('returns an empty string when neither translation nor base field exists', () => {
    const untranslated: Translatable = { title: 'x' }
    expect(getLocalizedField(untranslated, 'missing', 'uk')).toBe('')
  })

  it('treats an empty translation as absent and uses the base field', () => {
    const withEmpty = { title: 'Base', translations: { uk: { title: '' } } }
    expect(getLocalizedField(withEmpty, 'title', 'uk')).toBe('Base')
  })
})

describe('buildTrackSaveRows', () => {
  it('uses uploaded audio URLs when building the save payload', () => {
    const rows = buildTrackSaveRows('release-1', [{
      id: 'track-1',
      title: 'Intro',
      duration: 180,
      audio_url: null,
      track_number: 1,
    }], new Map([[0, 'https://cdn.example.com/intro.mp3']]))

    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      release_id: 'release-1',
      title: 'Intro',
      audio_url: 'https://cdn.example.com/intro.mp3',
      track_number: 1,
    })
  })

  it('preserves an existing audio URL when no new upload is provided', () => {
    const rows = buildTrackSaveRows('release-1', [{
      id: 'track-1',
      title: 'Intro',
      duration: 180,
      audio_url: 'https://cdn.example.com/existing.mp3',
      track_number: 1,
    }], new Map())

    expect(rows[0].audio_url).toBe('https://cdn.example.com/existing.mp3')
  })
})

describe('supersededPaths', () => {
  const url = (name: string) => `https://host/storage/v1/object/public/media/${name}`

  it('returns the old path when the file was replaced', () => {
    expect(
      supersededPaths(['image_url'], { image_url: url('photos/old.jpg') }, { image_url: url('photos/new.jpg') })
    ).toEqual(['photos/old.jpg'])
  })

  it('returns nothing when the value is unchanged', () => {
    const same = url('photos/keep.jpg')
    expect(supersededPaths(['image_url'], { image_url: same }, { image_url: same })).toEqual([])
  })

  it('returns nothing when the row had no file', () => {
    expect(supersededPaths(['image_url'], { image_url: null }, { image_url: url('photos/new.jpg') })).toEqual([])
  })

  it('treats clearing the field as a replacement', () => {
    // The record no longer points at the object, so nothing else will ever free it.
    expect(supersededPaths(['image_url'], { image_url: url('photos/old.jpg') }, { image_url: null }))
      .toEqual(['photos/old.jpg'])
  })

  it('ignores URLs outside the media bucket', () => {
    expect(
      supersededPaths(['logo_url'], { logo_url: 'https://cdn.example.test/x.png' }, { logo_url: null })
    ).toEqual([])
  })

  it('handles several columns at once and skips the untouched one', () => {
    expect(
      supersededPaths(
        ['cover_art_url', 'image_url'],
        { cover_art_url: url('releases/a.jpg'), image_url: url('photos/b.jpg') },
        { cover_art_url: url('releases/c.jpg'), image_url: url('photos/b.jpg') }
      )
    ).toEqual(['releases/a.jpg'])
  })
})
