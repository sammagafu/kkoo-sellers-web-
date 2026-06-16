import { ref, computed, watch, type Ref } from 'vue'

/** Allowed page sizes for catalog product tables (matches API max 200). */
export const CATALOG_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200] as const

export type CatalogPageSize = (typeof CATALOG_PAGE_SIZE_OPTIONS)[number]

const DEFAULT_PAGE_SIZE: CatalogPageSize = 20

function readStoredPageSize(storageKey: string): CatalogPageSize | null {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return null
    const n = Number.parseInt(raw, 10)
    return (CATALOG_PAGE_SIZE_OPTIONS as readonly number[]).includes(n) ? (n as CatalogPageSize) : null
  } catch {
    return null
  }
}

export function useCatalogListPagination(storageKey: string) {
  const page = ref(1)
  const pageSize = ref<CatalogPageSize>(readStoredPageSize(storageKey) ?? DEFAULT_PAGE_SIZE)
  const total = ref(0)

  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.max(1, Math.ceil(total.value / pageSize.value)) : 1,
  )
  const hasPagination = computed(() => total.value > pageSize.value)
  const rangeStart = computed(() => (total.value === 0 ? 0 : (page.value - 1) * pageSize.value + 1))
  const rangeEnd = computed(() => Math.min(page.value * pageSize.value, total.value))

  const pageSizeSelectOptions = computed(() =>
    CATALOG_PAGE_SIZE_OPTIONS.map((n) => ({ value: n, text: String(n) })),
  )

  function setPage(p: number) {
    const next = Math.max(1, Math.min(p, totalPages.value || 1))
    if (next === page.value) return
    page.value = next
  }

  function setPageSize(size: number) {
    const allowed = (CATALOG_PAGE_SIZE_OPTIONS as readonly number[]).includes(size)
    if (!allowed) return
    pageSize.value = size as CatalogPageSize
    page.value = 1
    try {
      localStorage.setItem(storageKey, String(size))
    } catch {
      /* ignore quota / private mode */
    }
  }

  function resetPage() {
    page.value = 1
  }

  function applyListMeta(meta: { total?: number; page?: number }) {
    if (typeof meta.total === 'number' && meta.total >= 0) {
      total.value = meta.total
    }
    if (typeof meta.page === 'number' && meta.page > 0) {
      page.value = meta.page
    }
  }

  return {
    page,
    pageSize,
    total,
    totalPages,
    hasPagination,
    rangeStart,
    rangeEnd,
    pageSizeSelectOptions,
    setPage,
    setPageSize,
    resetPage,
    applyListMeta,
  }
}

/** Re-run load when page or page size changes (skip initial mount if load runs in onMounted). */
export function watchCatalogPagination(
  page: Ref<number>,
  pageSize: Ref<number>,
  load: () => void | Promise<void>,
) {
  watch([page, pageSize], () => {
    void load()
  })
}
