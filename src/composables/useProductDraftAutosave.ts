import { ref, watch, type Ref } from 'vue'

const DRAFT_KEY = 'kkoo-product-create-draft'
const RECENT_CATEGORY_KEY = 'kkoo-seller-recent-category'
const CATEGORY_CACHE_KEY = 'kkoo-category-tree-cache'
const CATEGORY_CACHE_TTL_MS = 1000 * 60 * 60 * 6

export type ProductDraftPayload = {
  title: string
  description: string
  categories: string[]
  base_price: number | string
  optionsText: string
  stock: number
  weight_kg?: number | null
  step?: number
  savedAt?: number
}

export function useProductDraftAutosave(
  form: Omit<ProductDraftPayload, 'step' | 'savedAt'>,
  step: Ref<number>
) {
  const savedHint = ref('')
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  function persist() {
    try {
      const payload: ProductDraftPayload = {
        ...form,
        step: step.value,
        savedAt: Date.now(),
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
      savedHint.value = 'saved'
    } catch {
      savedHint.value = ''
    }
  }

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(persist, 400)
  }

  watch(
    () => ({ ...form, step: step.value }),
    () => scheduleSave(),
    { deep: true }
  )

  function loadDraft(): ProductDraftPayload | null {
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as ProductDraftPayload
      if (!parsed?.savedAt || Date.now() - parsed.savedAt > 1000 * 60 * 60 * 72) {
        clearDraft()
        return null
      }
      return parsed
    } catch {
      return null
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY)
    savedHint.value = ''
  }

  return { savedHint, loadDraft, clearDraft, persist }
}

export function recentCategoryKey(userId?: number | string | null): string {
  return userId ? `${RECENT_CATEGORY_KEY}-${userId}` : RECENT_CATEGORY_KEY
}

export function loadRecentCategorySlugs(userId?: number | string | null): string[] {
  try {
    const raw = localStorage.getItem(recentCategoryKey(userId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as string[]
    return Array.isArray(parsed) ? parsed.slice(0, 4) : []
  } catch {
    return []
  }
}

export function rememberCategorySlug(slug: string, userId?: number | string | null) {
  if (!slug.trim()) return
  const prev = loadRecentCategorySlugs(userId).filter((s) => s !== slug)
  const next = [slug, ...prev].slice(0, 4)
  localStorage.setItem(recentCategoryKey(userId), JSON.stringify(next))
}

export type CachedCategoryTree = {
  savedAt: number
  roots: unknown[]
  useAdmin: boolean
}

export function loadCachedCategoryTree(useAdmin: boolean): unknown[] | null {
  try {
    const raw = sessionStorage.getItem(CATEGORY_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedCategoryTree
    if (!parsed?.roots?.length) return null
    if (parsed.useAdmin !== useAdmin) return null
    if (Date.now() - parsed.savedAt > CATEGORY_CACHE_TTL_MS) return null
    return parsed.roots
  } catch {
    return null
  }
}

export function saveCachedCategoryTree(roots: unknown[], useAdmin: boolean) {
  try {
    const payload: CachedCategoryTree = { savedAt: Date.now(), roots, useAdmin }
    sessionStorage.setItem(CATEGORY_CACHE_KEY, JSON.stringify(payload))
  } catch {
    /* ignore quota */
  }
}
