import { describe, it, expect } from 'vitest'
import { resolveAssetUrl, productCoverUrl } from './assetUrl'

describe('assetUrl', () => {
  describe('resolveAssetUrl', () => {
    it('returns null for empty or whitespace', () => {
      expect(resolveAssetUrl('')).toBeNull()
      expect(resolveAssetUrl(null)).toBeNull()
      expect(resolveAssetUrl(undefined)).toBeNull()
      expect(resolveAssetUrl('   ')).toBeNull()
    })

    it('returns full URL as-is for http/https', () => {
      const url = 'https://cdn.example.com/image.png'
      expect(resolveAssetUrl(url)).toBe(url)
      expect(resolveAssetUrl('http://example.com/a')).toBe('http://example.com/a')
    })

    it('prepends media base URL for relative path', () => {
      const out = resolveAssetUrl('media/uploads/x.png')
      expect(out).toBeTruthy()
      expect(out).toContain('media/uploads/x.png')
      const out2 = resolveAssetUrl('/media/x.png')
      expect(out2).toBeTruthy()
      expect(out2).toContain('/media/x.png')
    })
  })

  describe('productCoverUrl', () => {
    it('returns first available image field', () => {
      const product = {
        cover_image: 'https://example.com/cover.png',
        image: 'https://example.com/fallback.png',
      }
      expect(productCoverUrl(product)).toBe('https://example.com/cover.png')
    })

    it('falls back to image when cover_image missing', () => {
      const product = { image: 'https://example.com/img.png' }
      expect(productCoverUrl(product)).toBe('https://example.com/img.png')
    })

    it('returns null when no image fields', () => {
      expect(productCoverUrl({})).toBeNull()
      expect(productCoverUrl({ title: 'No image' })).toBeNull()
    })
  })
})
