import { resolveApiBaseUrl } from '@/utils/apiBaseUrl'

/**
 * Resolve API asset URLs (brand logos, category icons, product images, etc.).
 * Full URLs are returned as-is; relative paths get the media base URL prepended.
 */
const apiBaseUrl = resolveApiBaseUrl().replace(/\/api\/v1\/?$/, '')
/** Media base URL for relative paths. Set VITE_MEDIA_BASE_URL if media is served from a different origin/path. */
const mediaBaseUrl = (import.meta.env.VITE_MEDIA_BASE_URL ?? apiBaseUrl).toString().replace(/\/$/, '')

/** True when [value] is a file/URL path, not an emoji or short label. */
export function looksLikeMediaPath(value: string | null | undefined): boolean {
  if (!value || typeof value !== 'string') return false
  const u = value.trim()
  if (!u) return false
  if (u.startsWith('http://') || u.startsWith('https://')) return true
  if (u.startsWith('/media/') || u.startsWith('/uploads/')) return true
  if (u.startsWith('/') && /\.(jpe?g|png|gif|webp|svg|avif|bmp)(\?.*)?$/i.test(u)) return true
  return false
}

const KKOO_HOST = /(?:^|\.)kkooapp\.co\.tz$/i

/** Strip kkoo hosts to a relative /media path and upgrade leftover http:// on our domains. */
export function canonicalizePublicAssetUrl(raw: string): string {
  const u = raw.trim()
  if (!u.startsWith('http://') && !u.startsWith('https://')) return u
  try {
    const parsed = new URL(u)
    const host = parsed.hostname.toLowerCase()
    if (KKOO_HOST.test(host) && (parsed.pathname.startsWith('/media/') || parsed.pathname.startsWith('/img/'))) {
      return `${parsed.pathname}${parsed.search}`
    }
    if (KKOO_HOST.test(host) && parsed.protocol === 'http:') {
      parsed.protocol = 'https:'
      return parsed.toString()
    }
  } catch {
    return u
  }
  return u
}

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null
  const u = canonicalizePublicAssetUrl(url)
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const path = u.startsWith('/') ? u : `/${u}`
  return `${mediaBaseUrl}${path}`
}

/** Display sizes shared with Fiber `/img/{slot}/media/...` and Flutter. */
export type MediaImageSlot = 'thumb' | 'card' | 'detail' | 'original'

export const mediaSizes: Record<Exclude<MediaImageSlot, 'original'>, string> = {
  thumb: '96px',
  card: '(max-width: 640px) 45vw, 210px',
  detail: '(max-width: 768px) 100vw, 720px',
}

const SLOT_WIDTH: Record<Exclude<MediaImageSlot, 'original'>, number> = {
  thumb: 200,
  card: 410,
  detail: 1280,
}

function insertMediaSlot(url: string, slot: MediaImageSlot): string {
  if (slot === 'original' || /\/img\/(thumb|card|detail)\//.test(url)) return url
  const marker = '/media/'
  const idx = url.indexOf(marker)
  if (idx < 0) return url
  return `${url.slice(0, idx)}/img/${slot}${url.slice(idx)}`
}

/** Rewrite a resolved `/media/...` URL to the Fiber variant for [slot]. */
export function sizedAssetUrl(
  url: string | null | undefined,
  slot: MediaImageSlot = 'card',
): string | null {
  const resolved = resolveAssetUrl(url)
  if (!resolved || slot === 'original') return resolved
  return insertMediaSlot(resolved, slot)
}

/** `srcset` ladder for catalog photos (thumb/card/detail). */
export function mediaSrcset(url: string | null | undefined): string | undefined {
  const resolved = resolveAssetUrl(url)
  if (!resolved || resolved.indexOf('/media/') < 0) return undefined
  const parts: string[] = []
  ;(Object.keys(SLOT_WIDTH) as Array<keyof typeof SLOT_WIDTH>).forEach((slot) => {
    const sized = sizedAssetUrl(resolved, slot)
    if (sized) parts.push(`${sized} ${SLOT_WIDTH[slot]}w`)
  })
  return parts.length ? parts.join(', ') : undefined
}

/** Get first available image URL from product (cover_image, image, thumbnail, primary_media). */
export function productCoverUrl(product: Record<string, unknown>): string | null {
  const url =
    (product.cover_image as string) ||
    (product.image as string) ||
    (product.thumbnail as string) ||
    (product.primary_media as string) ||
    (product.cover as string)
  return resolveAssetUrl(url ?? '')
}

/** Collect all image URLs for a product: cover first, then images/gallery/media (no duplicates). */
export function productImageUrls(product: Record<string, unknown>): string[] {
  const cover = productCoverUrl(product)
  const seen = new Set<string>()
  const out: string[] = []
  if (cover) {
    seen.add(cover)
    out.push(cover)
  }
  const raw =
    (product.images as string[] | { url?: string; image?: string }[] | undefined) ||
    (product.gallery as string[] | { url?: string; image?: string }[] | undefined) ||
    (product.media as string[] | { url?: string; image?: string }[] | undefined) ||
    (product.additional_images as string[] | undefined)
  if (!Array.isArray(raw)) return out
  for (const item of raw) {
    const url =
      typeof item === 'string'
        ? resolveAssetUrl(item)
        : item && typeof item === 'object'
          ? resolveAssetUrl((item as { url?: string }).url ?? (item as { image?: string }).image ?? '')
          : null
    if (url && !seen.has(url)) {
      seen.add(url)
      out.push(url)
    }
  }
  return out
}

/** Get brand logo URL (logo or logo_url from API). */
export function brandLogoUrl(brand: Record<string, unknown>): string | null {
  const url = (brand.logo as string) || (brand.logo_url as string)
  return resolveAssetUrl(url ?? '')
}

/** Get category icon/image URL (icon, icon_url from API; fallback image, image_url, thumbnail). Handles string or { url } object. */
export function categoryImageUrl(category: Record<string, unknown>): string | null {
  const icon = category.icon
  const iconUrl = category.icon_url
  const candidates: string[] = []
  if (typeof iconUrl === 'string' && iconUrl.trim()) candidates.push(iconUrl.trim())
  if (typeof icon === 'string' && looksLikeMediaPath(icon)) candidates.push(icon.trim())
  if (typeof icon === 'object' && icon !== null && typeof (icon as { url?: string }).url === 'string') {
    candidates.push((icon as { url: string }).url)
  }
  for (const key of ['image', 'image_url', 'thumbnail'] as const) {
    const v = category[key]
    if (typeof v === 'string' && v.trim()) candidates.push(v.trim())
  }
  for (const c of candidates) {
    const resolved = resolveAssetUrl(c)
    if (resolved) return resolved
  }
  return null
}
