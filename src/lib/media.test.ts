import { describe, expect, it } from 'vitest'
import { optimizedMediaUrl, optimizedSrcSet, normalizeOutboundUrl, proxiedObjectUrl } from './media'

const sample =
  'https://supabasekong.169.58.250.236.sslip.io/storage/v1/object/public/media/releases/abc.png'

describe('optimizedMediaUrl', () => {
  it('rewrites sslip object URLs to same-origin /media/render proxy', () => {
    const out = optimizedMediaUrl(sample, { width: 800 })
    expect(out).toBe('/media/render/releases/abc.png?width=800&resize=contain&quality=70')
  })

  it('passes through non-supabase URLs', () => {
    expect(optimizedMediaUrl('https://example.com/x.png', { width: 100 })).toBe(
      'https://example.com/x.png',
    )
  })

  it('handles null', () => {
    expect(optimizedMediaUrl(null)).toBe('')
  })

  it('keeps non-sslip supabase-style hosts on absolute render URL', () => {
    const other =
      'https://other.example/storage/v1/object/public/media/releases/abc.png'
    const out = optimizedMediaUrl(other, { width: 400 })
    expect(out).toContain('https://other.example/storage/v1/render/image/public/media/releases/abc.png')
    expect(out).toContain('width=400')
  })
})

describe('proxiedObjectUrl', () => {
  it('maps sslip object URL to /media/object', () => {
    expect(proxiedObjectUrl(sample)).toBe('/media/object/releases/abc.png')
  })
})

describe('optimizedSrcSet', () => {
  it('builds width descriptors', () => {
    const set = optimizedSrcSet(sample, [400, 800])
    expect(set.split(', ')).toHaveLength(2)
    expect(set).toContain('400w')
    expect(set).toContain('800w')
    expect(set).toContain('/media/render/releases/abc.png')
  })
})

describe('normalizeOutboundUrl', () => {
  it('fixes TikTok /user → /@user', () => {
    expect(normalizeOutboundUrl('tiktok', 'https://tiktok.com/sunfixer')).toBe(
      'https://www.tiktok.com/@sunfixer',
    )
  })

  it('leaves already-correct TikTok alone', () => {
    expect(normalizeOutboundUrl('tiktok', 'https://www.tiktok.com/@sunfixer')).toBe(
      'https://www.tiktok.com/@sunfixer',
    )
  })

  it('ignores other platforms', () => {
    expect(normalizeOutboundUrl('youtube', 'https://youtube.com/sunfixer')).toBe(
      'https://youtube.com/sunfixer',
    )
  })
})
