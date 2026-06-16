/**
 * Normalize catalog product JSON from Fiber (flat list/detail shape vs nested GORM).
 */

export function categorySlugsFromProduct(d: Record<string, unknown>): string[] {
  const fromSlugs = d.category_slugs
  if (Array.isArray(fromSlugs) && fromSlugs.length) {
    return fromSlugs.map((s) => String(s).trim()).filter(Boolean)
  }
  const single = d.category_slug
  if (typeof single === 'string' && single.trim()) return [single.trim()]
  const cats = d.categories
  if (Array.isArray(cats)) {
    return cats
      .map((c) => {
        if (c && typeof c === 'object' && 'slug' in c) {
          return String((c as { slug?: string }).slug ?? '').trim()
        }
        return ''
      })
      .filter(Boolean)
  }
  const cat = d.category
  if (cat && typeof cat === 'object' && 'slug' in cat) {
    const slug = String((cat as { slug?: string }).slug ?? '').trim()
    if (slug) return [slug]
  }
  return []
}

export function brandSlugFromProduct(d: Record<string, unknown>): string {
  if (typeof d.brand === 'string' && d.brand.trim()) return d.brand.trim()
  if (typeof d.brand_slug === 'string' && d.brand_slug.trim()) return d.brand_slug.trim()
  const brand = d.brand
  if (brand && typeof brand === 'object' && 'slug' in brand) {
    return String((brand as { slug?: string }).slug ?? '').trim()
  }
  return ''
}

export function categoryDisplayFromProduct(d: Record<string, unknown>): string {
  const names = d.category_names
  if (Array.isArray(names) && names.length) {
    return names.map(String).filter(Boolean).join(', ')
  }
  if (typeof d.category_name === 'string' && d.category_name.trim()) {
    return d.category_name.trim()
  }
  const slugs = categorySlugsFromProduct(d)
  return slugs.length ? slugs.join(', ') : '—'
}

export function brandDisplayFromProduct(d: Record<string, unknown>): string {
  if (typeof d.brand_name === 'string' && d.brand_name.trim()) return d.brand_name.trim()
  const slug = brandSlugFromProduct(d)
  return slug || '—'
}
