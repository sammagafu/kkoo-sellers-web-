<template>
  <VerticalLayout>
    <b-card title="Users">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">List users, ban, suspend or activate.</p>
        <b-form-input v-model="search" placeholder="Search..." class="w-auto" style="max-width: 180px;" @input="debouncedLoad" />
        <b-form-select v-model="filterStatus" :options="statusOptions" class="w-auto" @change="onFilterChange" />
        <b-form-select v-model="filterIsSeller" :options="sellerOptions" class="w-auto" @change="onFilterChange" />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
        <b-dropdown variant="outline-secondary" size="sm" text="Import templates" menu-class="shadow-sm">
          <b-dropdown-item @click="downloadApiImportTemplate">Official template (API)</b-dropdown-item>
          <b-dropdown-item @click="downloadMinimalImportExample">Minimal example CSV</b-dropdown-item>
        </b-dropdown>
        <b-button variant="outline-primary" size="sm" @click="triggerUserImport">Import users</b-button>
        <input
          ref="importUsersInputRef"
          type="file"
          accept=".csv,.xlsx"
          multiple
          title="Select one or more CSV/XLSX files"
          class="d-none"
          @change="onImportUsers"
        />
        <b-dropdown
          v-if="selected.length"
          variant="primary"
          size="sm"
          :text="`Bulk (${selected.length})`"
          menu-class="shadow-sm"
        >
          <b-dropdown-item @click="bulkActivateSelected">Activate selected</b-dropdown-item>
          <b-dropdown-item @click="openBulkModal('suspend')">Suspend selected…</b-dropdown-item>
          <b-dropdown-item @click="openBulkModal('ban')">Ban selected…</b-dropdown-item>
        </b-dropdown>
      </div>
      <b-alert v-if="importResult" variant="info" show dismissible class="mb-2" @dismissed="importResult = ''">{{ importResult }}</b-alert>
      <ImportBatchProgressBar
        :visible="!!importProgress"
        :subtitle="importProgressSubtitle"
        :overall-percent="importProgress?.overallPercent ?? 0"
        :pulse-striped="importProgressPulse"
      />
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table
        v-if="displayItems.length"
        :items="displayItems"
        :fields="fields"
        striped
        responsive
        selectable
        v-model:selectedItems="selected"
      >
        <template #cell(id)="data">
          <router-link :to="{ name: 'admin.users.detail', params: { id: String(data.item.id) } }" class="text-primary text-decoration-none fw-medium">{{ data.item.id }}</router-link>
        </template>
        <template #cell(full_name)="data">
          <router-link :to="{ name: 'admin.users.detail', params: { id: String(data.item.id) } }" class="text-primary text-decoration-none">{{ userDisplayName(data.item) }}</router-link>
        </template>
        <template #cell(roles_display)="data">
          <span class="text-nowrap">{{ rolesDisplay(data.item) }}</span>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.users.detail', params: { id: String(data.item.id) } }">View profile</b-button>
          <b-button v-if="data.item.account_status !== 'active'" size="sm" variant="outline-success" class="me-1" @click="action(data.item, 'activate')">Activate</b-button>
          <b-button v-if="data.item.account_status !== 'suspended'" size="sm" variant="outline-warning" class="me-1" @click="openActionModal(data.item, 'suspend')">Suspend</b-button>
          <b-button v-if="data.item.account_status !== 'banned'" size="sm" variant="outline-danger" @click="openActionModal(data.item, 'ban')">Ban</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
      <b-pagination
        v-if="totalRows > pageSize"
        :model-value="page"
        :total-rows="totalRows"
        :per-page="pageSize"
        size="sm"
        class="mt-3"
        @update:model-value="(v: number) => { page = v; load(); }"
      />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} of {{ totalRows }} user(s)</p>
    </b-card>

    <b-modal v-model="actionModalShow" :title="actionModalTitle" @ok="onActionOk" @hidden="clearActionModal">
      <p class="text-muted small">Optionally provide a reason (e.g. for notifications).</p>
      <b-form-textarea v-model="actionReason" placeholder="Reason (optional)..." rows="3" />
    </b-modal>

    <b-modal v-model="bulkModalShow" :title="bulkModalTitle" @ok="onBulkModalOk" @hidden="clearBulkModal">
      <p class="text-muted small">Optional reason (stored per user where the API supports it).</p>
      <b-form-textarea v-model="bulkModalReason" placeholder="Reason (optional)..." rows="3" />
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import ImportBatchProgressBar from '@/components/ImportBatchProgressBar.vue'
import { ref, computed, onMounted } from 'vue'
import { usersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import { formatApiError } from '@/utils/formatApiError'
import { useImportBatchProgress } from '@/composables/useImportBatchProgress'
import { formatImportBatchSummary, runSequentialImports } from '@/utils/sequentialFileImport'
import { toastError, toastSuccess } from '@/utils/toast'

interface UserRow {
  id: number
  phone_number?: string
  email?: string
  first_name?: string
  last_name?: string
  full_name?: string
  account_status?: string
  is_seller?: boolean
  is_staff?: boolean
  is_superuser?: boolean
  roles?: string[]
}

const PAGE_SIZE = 20
const items = ref<UserRow[]>([])
const selected = ref<UserRow[]>([])
const totalRows = ref(0)
const page = ref(1)
const pageSize = ref(PAGE_SIZE)
const loading = ref(false)
const error = ref('')
const importResult = ref('')
const importUsersInputRef = ref<HTMLInputElement | null>(null)
const { importProgress, importProgressSubtitle, importProgressPulse } = useImportBatchProgress()
const search = ref('')
const filterStatus = ref('')
const filterIsSeller = ref<'' | 0 | 1>('')
const actionModalShow = ref(false)
const actionTarget = ref<UserRow | null>(null)
const actionType = ref<'ban' | 'suspend' | null>(null)
const actionReason = ref('')
const bulkModalShow = ref(false)
const bulkModalType = ref<'ban' | 'suspend' | null>(null)
const bulkModalReason = ref('')
let loadDebounce: ReturnType<typeof setTimeout> | null = null

const actionModalTitle = computed(() =>
  actionType.value === 'ban' ? 'Ban user' : actionType.value === 'suspend' ? 'Suspend user' : 'User action'
)

const bulkModalTitle = computed(() => {
  const n = selected.value.length
  return bulkModalType.value === 'ban' ? `Ban ${n} user(s)` : `Suspend ${n} user(s)`
})

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'active', text: 'Active' },
  { value: 'suspended', text: 'Suspended' },
  { value: 'banned', text: 'Banned' },
]
const sellerOptions = [
  { value: '', text: 'All' },
  { value: 0, text: 'Not seller' },
  { value: 1, text: 'Seller' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Name' },
  { key: 'roles_display', label: 'Roles' },
  { key: 'account_status', label: 'Status' },
  { key: 'is_seller', label: 'Seller' },
  { key: 'actions', label: 'Actions' },
]

const csvColumns = [
  { key: 'id', label: 'ID' },
  { key: 'phone_number', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'full_name', label: 'Name' },
  { key: 'account_status', label: 'Status' },
  { key: 'is_seller', label: 'Is seller' },
  { key: 'roles_csv', label: 'Roles' },
]

function userDisplayName(u: UserRow): string {
  if (u.full_name && String(u.full_name).trim()) return String(u.full_name).trim()
  const parts = [u.first_name, u.last_name].filter(Boolean).map(String)
  return parts.length ? parts.join(' ') : '—'
}

/** Display order: Seller, Staff, Superuser, Rider, Buyer. */
function rolesDisplay(u: UserRow): string {
  const seen = new Set<string>()
  const parts: string[] = []
  function add(label: string) {
    if (seen.has(label)) return
    seen.add(label)
    parts.push(label)
  }
  if (u.is_seller) add('Seller')
  if (u.is_staff) add('Staff')
  if (u.is_superuser) add('Superuser')
  const roles = u.roles
  if (Array.isArray(roles) && roles.length) {
    for (const r of roles) {
      const s = String(r).toLowerCase()
      if (s === 'seller') add('Seller')
      else if (s === 'staff') add('Staff')
      else if (s === 'admin' || s === 'superuser' || s === 'all') add('Superuser')
      else if (s === 'buyer') add('Buyer')
      else if (s === 'rider') add('Rider')
      else if (r) add(String(r))
    }
  }
  if (parts.length === 0) return '—'
  const order = ['Seller', 'Staff', 'Superuser', 'Rider', 'Buyer']
  const ordered = order.filter((l) => parts.includes(l))
  const rest = parts.filter((p) => !order.includes(p))
  return [...ordered, ...rest].join(', ')
}

/** When search/filters are sent to API, we show API results; otherwise client-side filter for backwards compatibility. */
const displayItems = computed(() => {
  let list = items.value
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (u) =>
        String(u.phone_number ?? '').toLowerCase().includes(q) ||
        String(u.email ?? '').toLowerCase().includes(q) ||
        String(u.full_name ?? '').toLowerCase().includes(q) ||
        [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase().includes(q) ||
        String(u.id ?? '').toLowerCase().includes(q)
    )
  }
  if (filterStatus.value) {
    list = list.filter((u) => String(u.account_status ?? '').toLowerCase() === filterStatus.value.toLowerCase())
  }
  if (filterIsSeller.value !== '') {
    const wantSeller = filterIsSeller.value === 1
    list = list.filter((u) => !!u.is_seller === wantSeller)
  }
  return list
})

function onFilterChange() {
  page.value = 1
  load()
}

function debouncedLoad() {
  if (loadDebounce) clearTimeout(loadDebounce)
  loadDebounce = setTimeout(() => {
    page.value = 1
    load()
  }, 350)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: { page?: number; page_size?: number; status?: string; account_status?: string; is_seller?: 0 | 1; search?: string } = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filterStatus.value) {
      params.account_status = filterStatus.value
      params.status = filterStatus.value
    }
    if (filterIsSeller.value !== '') params.is_seller = filterIsSeller.value as 0 | 1
    if (search.value.trim()) params.search = search.value.trim()
    const { data } = await usersAdminApi.list(params)
    const raw = data as { results?: UserRow[]; total?: number } | UserRow[]
    const list = Array.isArray(raw) ? raw : raw?.results ?? []
    items.value = list as UserRow[]
    totalRows.value = Array.isArray(raw) ? list.length : (typeof (raw as { total?: number }).total === 'number' ? (raw as { total: number }).total : list.length)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load users')
    toastError(error.value)
  } finally {
    loading.value = false
  }
}

onMounted(load)

function exportCsv() {
  const rows = items.value.map((u) => ({
    ...u,
    is_seller: u.is_seller ? 'Yes' : 'No',
    roles_csv: rolesDisplay(u),
  }))
  exportToCsv(rows as unknown as Record<string, unknown>[], csvColumns, 'users-export.csv')
}

async function downloadApiImportTemplate() {
  try {
    const { data } = await usersAdminApi.getImportTemplate('users')
    const url = URL.createObjectURL(data as Blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'users_template.csv'
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    toastError(e instanceof Error ? e.message : 'Could not download API template')
  }
}

function downloadMinimalImportExample() {
  downloadCsvTemplate(csvColumns, 'users-import-example.csv', {
    phone_number: '+255700000000',
    email: 'user@example.com',
    full_name: 'John Doe',
    account_status: 'active',
    is_seller: 'No',
    roles_csv: 'buyer',
  })
}

function triggerUserImport() {
  importUsersInputRef.value?.click()
}

async function onImportUsers(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = Array.from(input.files ?? [])
  input.value = ''
  if (!files.length) return
  importResult.value = ''
  error.value = ''
  try {
    const { lines, totalCreated } = await runSequentialImports(
      files,
      async (file, { onUploadProgress }) => {
        const { data } = await usersAdminApi.importUsers(file, { onUploadProgress })
        return data
      },
      (p) => {
        importProgress.value = p
      },
    )
    importResult.value = formatImportBatchSummary(files.length, lines)
    await load()
    toastSuccess(`User import finished (${totalCreated} created from ${files.length} file(s))`)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Import failed')
    toastError(error.value)
  }
}

function openBulkModal(type: 'suspend' | 'ban') {
  if (!selected.value.length) return
  bulkModalType.value = type
  bulkModalReason.value = ''
  bulkModalShow.value = true
}

function clearBulkModal() {
  bulkModalType.value = null
  bulkModalReason.value = ''
}

function onBulkModalOk(ev: Event) {
  ev.preventDefault()
  runBulkSuspendBan()
}

async function runBulkSuspendBan() {
  const type = bulkModalType.value
  if (!type || !selected.value.length) return
  const ids = selected.value.map((u) => u.id)
  const reason = bulkModalReason.value.trim() || undefined
  bulkModalShow.value = false
  clearBulkModal()
  error.value = ''
  let failed = 0
  for (const id of ids) {
    try {
      await usersAdminApi.userAction(id, { action: type, reason })
    } catch {
      failed++
    }
  }
  selected.value = []
  await load()
  if (failed) {
    error.value = `${failed} of ${ids.length} action(s) failed.`
    toastError(error.value)
  } else {
    toastSuccess(type === 'ban' ? 'Selected users banned' : 'Selected users suspended')
  }
}

async function bulkActivateSelected() {
  if (!selected.value.length) return
  const ok = await confirmDestructiveAction({
    title: `Activate ${selected.value.length} user(s)?`,
    text: 'Account status will be set to active for each selected user.',
  })
  if (!ok) return
  const ids = selected.value.map((u) => u.id)
  error.value = ''
  let failed = 0
  for (const id of ids) {
    try {
      await usersAdminApi.userAction(id, { action: 'activate' })
    } catch {
      failed++
    }
  }
  selected.value = []
  await load()
  if (failed) {
    error.value = `${failed} of ${ids.length} activate(s) failed.`
    toastError(error.value)
  } else {
    toastSuccess('Selected users activated')
  }
}

function openActionModal(item: UserRow, type: 'ban' | 'suspend') {
  actionTarget.value = item
  actionType.value = type
  actionReason.value = ''
  actionModalShow.value = true
}

function clearActionModal() {
  actionTarget.value = null
  actionType.value = null
  actionReason.value = ''
}

function onActionOk(ev: Event) {
  ev.preventDefault()
  runAction()
}

async function runAction() {
  const item = actionTarget.value
  const type = actionType.value
  if (!item || !type) return
  try {
    await usersAdminApi.userAction(item.id, { action: type, reason: actionReason.value.trim() || undefined })
    actionModalShow.value = false
    clearActionModal()
    await load()
    toastSuccess(type === 'ban' ? 'User banned' : 'User suspended')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}

async function action(item: UserRow, actionType: 'ban' | 'suspend' | 'activate') {
  try {
    await usersAdminApi.userAction(item.id, { action: actionType })
    await load()
    toastSuccess(actionType === 'activate' ? 'User activated' : actionType === 'ban' ? 'User banned' : 'User suspended')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}
</script>
