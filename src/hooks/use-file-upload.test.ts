import { describe, it, expect } from 'vitest'
import { extractPath } from './use-file-upload'

describe('extractPath', () => {
  it('extracts the object path from a public storage URL', () => {
    expect(
      extractPath('https://abc.supabase.co/storage/v1/object/public/media/covers/a-b-c.jpg')
    ).toBe('covers/a-b-c.jpg')
  })

  it('keeps nested folders intact', () => {
    expect(
      extractPath('https://abc.supabase.co/storage/v1/object/public/media/audio/2026/track.mp3')
    ).toBe('audio/2026/track.mp3')
  })

  it('returns null for a URL outside the media bucket', () => {
    expect(
      extractPath('https://abc.supabase.co/storage/v1/object/public/other/file.jpg')
    ).toBeNull()
  })

  it('returns null for an unrelated URL', () => {
    expect(extractPath('https://example.test/image.png')).toBeNull()
  })

  it('returns null for an empty string', () => {
    expect(extractPath('')).toBeNull()
  })
})
