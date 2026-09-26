/**
 * Helpers for Supabase Storage public media.
 * Self-hosted stack has ENABLE_IMAGE_TRANSFORMATION + imgproxy, so
 * /storage/v1/render/image/public/...?width=&resize=contain&quality=
 * returns resized bytes (verified live).
 */

const OBJECT_MARKER = '/storage/v1/object/public/'
const RENDER_MARKER = '/storage/v1/render/image/public/'

export type MediaVariant = 'cover' | 'gallery' | 'avatar' | 'logo' | 'lightbox'

const DEFAULT_WIDTH: Record<MediaVariant, number> = {
  cover: 1200,
  gallery: 1600,
  avatar: 800,
  logo: 800,
  lightbox: 1600,
}

const QUALITY = 70

/** Rewrite a public object URL to the imgproxy render endpoint. */
export function optimizedMediaUrl(
  url: string | null | undefined,
  opts: { width?: number; variant?: MediaVariant; quality?: number } = {},
): string {
  if (!url) return ''
  const width = opts.width ?? DEFAULT_WIDTH[opts.variant ?? 'cover']
  const quality = opts.quality ?? QUALITY

  const objectIdx = url.indexOf(OBJECT_MARKER)
  if (objectIdx !== -1) {
    const origin = url.slice(0, objectIdx)
    const pathAndQuery = url.slice(objectIdx + OBJECT_MARKER.length)
    const path = pathAndQuery.split('?')[0]
    return `${origin}${RENDER_MARKER}${path}?width=${width}&resize=contain&quality=${quality}`
  }

  // Already a render URL — refresh width/quality params.
  const renderIdx = url.indexOf(RENDER_MARKER)
  if (renderIdx !== -1) {
    const origin = url.slice(0, renderIdx)
    const rest = url.slice(renderIdx + RENDER_MARKER.length)
    const path = rest.split('?')[0]
    return `${origin}${RENDER_MARKER}${path}?width=${width}&resize=contain&quality=${quality}`
  }

  return url
}

/** srcset for responsive images (same aspect, multiple widths). */
export function optimizedSrcSet(
  url: string | null | undefined,
  widths: number[],
): string {
  if (!url) return ''
  return widths
    .map((w) => `${optimizedMediaUrl(url, { width: w })} ${w}w`)
    .join(', ')
}

/** Normalize known CMS TikTok profile typos: /sunfixer → /@sunfixer. */
export function normalizeOutboundUrl(platform: string, href: string): string {
  if (platform !== 'tiktok' || !href) return href
  try {
    const withScheme = href.startsWith('http') ? href : `https://${href}`
    const u = new URL(withScheme)
    if (!/(^|\.)tiktok\.com$/i.test(u.hostname)) return href
    const parts = u.pathname.replace(/\/+$/, '').split('/').filter(Boolean)
    if (parts.length === 1 && !parts[0].startsWith('@')) {
      u.hostname = 'www.tiktok.com'
      u.pathname = `/@${parts[0]}`
      return u.toString()
    }
  } catch {
    return href
  }
  return href
}
