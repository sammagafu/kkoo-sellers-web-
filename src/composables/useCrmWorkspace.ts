/**
 * Unified CRM workspace state: companies, active company, role, permissions.
 * One load for users with multiple companies — shared across CRM pages and top bar.
 */
import { ref, computed } from 'vue'
import { crmApi } from '@/api'
import {
  type CrmRolePermissions,
  crmRoleLabel,
  defaultCrmPermissions,
  normalizeCrmRole,
} from '@/config/crmRoles'

const STORAGE_KEY = 'kkoo_crm_selected_business_id'

export type CrmBusinessWorkspace = {
  id: number
  name?: string
  role?: string
  role_label?: string
  owner_id?: number
  plan?: string
  max_users?: number
  member_count?: number
  permissions?: CrmRolePermissions
  crm_enabled?: boolean
  [key: string]: unknown
}

const businesses = ref<CrmBusinessWorkspace[]>([])
const activeBusinessId = ref<number | null>(readStoredId())
const loaded = ref(false)
const loading = ref(false)
const error = ref('')
let loadPromise: Promise<void> | null = null

function readStoredId(): number | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const n = Number(raw)
    return Number.isNaN(n) ? null : n
  } catch {
    return null
  }
}

function persistId(id: number | null) {
  try {
    if (id != null) sessionStorage.setItem(STORAGE_KEY, String(id))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

const activeBusiness = computed(
  () => businesses.value.find((b) => b.id === activeBusinessId.value) ?? businesses.value[0] ?? null,
)

const hasMultipleBusinesses = computed(() => businesses.value.length > 1)
const hasCompanies = computed(() => businesses.value.length > 0)

const crmRole = computed(() => activeBusiness.value?.role ?? null)
const crmRoleNormalized = computed(() => normalizeCrmRole(crmRole.value))
const crmRoleDisplay = computed(
  () => activeBusiness.value?.role_label ?? crmRoleLabel(crmRole.value),
)
const crmPermissions = computed<CrmRolePermissions>(
  () => activeBusiness.value?.permissions ?? defaultCrmPermissions(crmRole.value),
)

const companyOptions = computed(() =>
  businesses.value.map((b) => ({
    value: b.id,
    text: b.name?.trim() || `Company ${b.id}`,
    role: crmRoleLabel(b.role),
  })),
)

async function loadWorkspace(force = false) {
  if (loaded.value && !force) return
  if (loadPromise && !force) return loadPromise

  loading.value = true
  error.value = ''
  loadPromise = (async () => {
    try {
      const { data } = await crmApi.getSession()
      const list = ((data as { businesses?: CrmBusinessWorkspace[] }).businesses ?? []).map(
        (b) => ({ ...b, id: Number(b.id) }),
      )
      businesses.value = list

      const serverLast = (data as { last_selected_business_id?: number }).last_selected_business_id
      const stored = readStoredId()
      const pick =
        (stored && list.some((b) => b.id === stored) ? stored : null) ??
        (serverLast && list.some((b) => b.id === serverLast) ? serverLast : null) ??
        list[0]?.id ??
        null

      activeBusinessId.value = pick
      persistId(pick)
      loaded.value = true
    } catch (e: unknown) {
      error.value = (e as { message?: string }).message ?? 'Failed to load companies'
      businesses.value = []
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()

  return loadPromise
}

async function selectCompany(id: number | null) {
  if (id == null || !businesses.value.some((b) => b.id === id)) {
    activeBusinessId.value = id
    persistId(id)
    return
  }
  activeBusinessId.value = id
  persistId(id)
  try {
    await crmApi.selectBusiness(id)
  } catch {
    // local selection still works
  }
}

function canEditCrmData(): boolean {
  return crmPermissions.value.can_edit_data !== false
}

function canManageCrmTeam(): boolean {
  return crmPermissions.value.can_manage_members === true
}

/** @deprecated use selectCompany */
function setSelectedBusinessId(id: number | null) {
  void selectCompany(id)
}

export function useCrmWorkspace() {
  return {
    businesses,
    activeBusinessId,
    activeBusiness,
    selectedBusinessId: activeBusinessId,
    selectedBusiness: activeBusiness,
    hasMultipleBusinesses,
    hasCompanies,
    companyOptions,
    crmRole,
    crmRoleNormalized,
    crmRoleDisplay,
    crmPermissions,
    loaded,
    loading,
    error,
    loadWorkspace,
    loadCrmSession: loadWorkspace,
    selectCompany,
    setSelectedBusinessId,
    canEditCrmData,
    canManageCrmTeam,
  }
}
