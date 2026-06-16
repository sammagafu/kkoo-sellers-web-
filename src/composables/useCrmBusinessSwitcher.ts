/**
 * Composable for seller CRM: list of businesses (user owns or is member of),
 * selected business id, and persistence in sessionStorage for multi-business users.
 */
import { ref, computed, onMounted } from 'vue'
import { crmApi } from '@/api'

const STORAGE_KEY = 'kkoo_crm_selected_business_id'

export interface CrmBusiness {
  id: number
  name?: string
  owner_id?: number
  plan?: string
  max_users?: number
  member_count?: number
  [key: string]: unknown
}

export function useCrmBusinessSwitcher() {
  const businesses = ref<CrmBusiness[]>([])
  const loading = ref(false)
  const error = ref('')

  function getStoredBusinessId(): number | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (raw === null || raw === '') return null
      const n = Number(raw)
      return Number.isNaN(n) ? null : n
    } catch {
      return null
    }
  }

  const selectedBusinessId = ref<number | null>(getStoredBusinessId())

  const selectedBusiness = computed(() => {
    const id = selectedBusinessId.value
    if (id == null) return null
    return businesses.value.find((b) => Number(b.id) === id) ?? null
  })

  const hasMultipleBusinesses = computed(() => businesses.value.length > 1)

  function setSelectedBusinessId(id: number | null) {
    selectedBusinessId.value = id
    try {
      if (id != null) {
        sessionStorage.setItem(STORAGE_KEY, String(id))
      } else {
        sessionStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // ignore
    }
  }

  async function loadBusinesses() {
    loading.value = true
    error.value = ''
    try {
      const { data } = await crmApi.getBusinesses()
      const raw = data as { results?: CrmBusiness[] } | CrmBusiness[]
      const list = Array.isArray(raw) ? raw : raw?.results ?? []
      businesses.value = list.map((b) => ({ ...b, id: Number(b.id) }))
      const currentId = selectedBusinessId.value
      if (currentId != null && !list.some((b) => Number(b.id) === currentId)) {
        setSelectedBusinessId(list[0]?.id != null ? Number(list[0].id) : null)
      } else if (currentId == null && list.length > 0 && list[0]?.id != null) {
        setSelectedBusinessId(Number(list[0].id))
      }
    } catch (e: unknown) {
      error.value = (e as { message?: string }).message ?? 'Failed to load businesses'
      businesses.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(loadBusinesses)

  return {
    businesses,
    loading,
    error,
    selectedBusinessId,
    selectedBusiness,
    hasMultipleBusinesses,
    setSelectedBusinessId,
    loadBusinesses,
  }
}
