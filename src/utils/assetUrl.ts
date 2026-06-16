/**
 * Resolve API asset URLs (brand logos, category icons, product images, etc.).
 * Full URLs are returned as-is; relative paths get the media base URL prepended.
 */
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1').replace(
  /\/api\/v1\/?$/,
  ''
)
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

export function resolveAssetUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string' || !url.trim()) return null
  const u = url.trim()
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  const path = u.startsWith('/') ? u : `/${u}`
  return `${mediaBaseUrl}${path}`
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
