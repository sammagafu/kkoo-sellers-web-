import { describe, expect, it } from 'vitest'
import {
  buildCategoryTreeFromFlat,
  combineMainAndSubs,
  filterCategoriesByQuery,
  flattenCategories,
  getCategoryDescendants,
  splitSlugsToMainAndSubs,
} from './catalogCategoryTree'

const roots = buildCategoryTreeFromFlat([
  { id: 1, slug: 'electronics', name: 'Electronics', parent_id: null },
  { id: 2, slug: 'phones', name: 'Phones', parent_id: 1 },
  { id: 3, slug: 'android', name: 'Android', parent_id: 2 },
])

describe('catalogCategoryTree', () => {
  it('builds nested tree from flat rows', () => {
    expect(roots).toHaveLength(1)
    expect(roots[0].slug).toBe('electronics')
    expect(roots[0].children[0].slug).toBe('phones')
    expect(roots[0].children[0].children[0].slug).toBe('android')
  })

  it('lists descendants for subcategory picker', () => {
    const descendants = getCategoryDescendants(roots[0])
    expect(descendants.map((d) => d.slug)).toEqual(['phones', 'android'])
  })

  it('splits stored slugs into main and subs', () => {
    expect(splitSlugsToMainAndSubs(roots, ['android'])).toEqual({
      main: 'electronics',
      subs: ['android'],
    })
    expect(splitSlugsToMainAndSubs(roots, ['electronics'])).toEqual({
      main: 'electronics',
      subs: [],
    })
  })

  it('combines main and subs for API payload', () => {
    expect(combineMainAndSubs('electronics', ['android'])).toEqual(['electronics', 'android'])
    expect(combineMainAndSubs('electronics', [])).toEqual(['electronics'])
  })

  it('flattens tree with path labels for search', () => {
    const hits = flattenCategories(roots)
    expect(hits.map((h) => h.slug)).toEqual(['electronics', 'phones', 'android'])
    expect(hits.find((h) => h.slug === 'android')?.pathLabel).toBe('Electronics › Phones › Android')
    expect(hits.find((h) => h.slug === 'android')?.rootSlug).toBe('electronics')
  })

  it('filters by multi-term query across path', () => {
    const hits = flattenCategories(roots)
    expect(filterCategoriesByQuery(hits, 'pain').map((h) => h.slug)).toEqual([])
    expect(filterCategoriesByQuery(hits, 'and').map((h) => h.slug)).toEqual(['android'])
    expect(filterCategoriesByQuery(hits, 'electronics android').map((h) => h.slug)).toEqual(['android'])
  })
})
