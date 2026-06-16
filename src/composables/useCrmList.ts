/**
 * Composable for CRM list views: pagination, loading, error, 404/501 handling.
 * Pass a fetch function that accepts params (including page, page_size) and returns { data }.
 * Response can be { results: [] } or { results: [], total, next, previous }.
 */
import { ref, computed, watch } from 'vue'

const DEFAULT_PAGE_SIZE = 20

export interface CrmListParams {
  page?: number
  page_size?: number
  [key: string]: unknown
}

export interface CrmListResponse {
  results?: unknown[]
  total?: number
  next?: string | null
  previous?: string | null
}

type FetchFn = (params: CrmListParams) => Promise<{ data: CrmListResponse | unknown[] }>

export function useCrmList(
  fetchFn: FetchFn,
  initialParams: CrmListParams = {}
) {
  const page = ref(initialParams.page ?? 1)
  const pageSize = ref(initialParams.page_size ?? DEFAULT_PAGE_SIZE)
  const items = ref<Record<string, unknown>[]>([])
  const total = ref(0)
  const next = ref<string | null>(null)
  const previous = ref<string | null>(null)
  const loading = ref(false)
  const error = ref('')
  const apiUnavailable = ref(false)

  const totalPages = computed(() =>
    pageSize.value > 0 ? Math.ceil(total.value / pageSize.value) : 0
  )
  const hasPagination = computed(() => total.value > 0 && totalPages.value > 1)

  async function load() {
    loading.value = true
    error.value = ''
    apiUnavailable.value = false
    const params: CrmListParams = {
      ...initialParams,
      page: page.value,
      page_size: pageSize.value,
    }
    try {
      const { data } = await fetchFn(params)
      const res = Array.isArray(data) ? { results: data } : (data as CrmListResponse)
      const rawResults = res?.results
      items.value = Array.isArray(rawResults) ? rawResults as Record<string, unknown>[] : []
      total.value = res?.total ?? items.value.length
      next.value = res?.next ?? null
      previous.value = res?.previous ?? null
    } catch (e: unknown) {
      const err = e as { response?: { status?: number }; message?: string }
      if (err.response?.status === 404 || err.response?.status === 501) {
        apiUnavailable.value = true
        items.value = []
        total.value = 0
      } else {
        error.value = err.message ?? 'Failed to load'
      }
    } finally {
      loading.value = false
    }
  }

  function setPage(p: number) {
    if (p < 1) return
    if (totalPages.value > 0 && p > totalPages.value) return
    page.value = p
    load()
  }

  return {
    items,
    total,
    next,
    previous,
    totalPages,
    hasPagination,
    page,
    pageSize,
    loading,
    error,
    apiUnavailable,
    setPage,
    load,
  }
}
