import { describe, it, expect } from 'vitest'
import { resolveAssetUrl, productCoverUrl, sizedAssetUrl, mediaSrcset } from './assetUrl'

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

    it('avoids an HTTP→HTTPS hop for kkoo media URLs', () => {
      const out = resolveAssetUrl('http://kkooapp.co.tz/media/products/a.jpg')
      expect(out).toBeTruthy()
      expect(out).toContain('/media/products/a.jpg')
      expect(out).not.toContain('http://kkooapp.co.tz')
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

  describe('sizedAssetUrl', () => {
    it('rewrites /media paths into /img/{slot}/media', () => {
      const out = sizedAssetUrl('/media/products/a.jpg', 'card')
      expect(out).toContain('/img/card/media/products/a.jpg')
    })

    it('leaves external URLs unchanged', () => {
      expect(sizedAssetUrl('https://cdn.example.com/a.jpg', 'card')).toBe('https://cdn.example.com/a.jpg')
    })

    it('builds a srcset ladder', () => {
      const set = mediaSrcset('/media/products/a.jpg')
      expect(set).toContain('/img/thumb/media/products/a.jpg 200w')
      expect(set).toContain('/img/card/media/products/a.jpg 410w')
      expect(set).toContain('/img/detail/media/products/a.jpg 1280w')
    })
  })
})
