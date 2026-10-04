<template>
  <VerticalLayout>
    <b-card>
      <div class="mb-3">
        <h1 class="h4 mb-1">People</h1>
        <p class="text-muted mb-2">Search a person, then turn their account on, pause it, or block it.</p>
        <ol class="small text-muted ps-3 mb-0">
          <li>Search by name or phone.</li>
          <li>Open them to change their name, shop, or admin access.</li>
          <li>Use Account on the row for on, pause, or block.</li>
        </ol>
      </div>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search name or phone…" class="flex-grow-1" style="max-width: 280px;" @input="debouncedLoad" />
        <b-form-select v-model="filterStatus" :options="statusOptions" class="w-auto" @change="onFilterChange" />
        <b-form-select v-model="filterIsSeller" :options="sellerOptions" class="w-auto" @change="onFilterChange" />
        <b-dropdown variant="outline-secondary" size="sm" text="More" menu-class="shadow-sm">
          <b-dropdown-item :to="{ name: 'admin.deletion-requests' }">Deletion requests</b-dropdown-item>
          <b-dropdown-item @click="exportCsv">Export CSV</b-dropdown-item>
          <b-dropdown-item @click="downloadApiImportTemplate">Import template (API)</b-dropdown-item>
          <b-dropdown-item @click="downloadMinimalImportExample">Minimal CSV example</b-dropdown-item>
          <b-dropdown-item @click="triggerUserImport">Import users…</b-dropdown-item>
        </b-dropdown>
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
          <b-dropdown-item @click="bulkActivateSelected">Turn on selected</b-dropdown-item>
          <b-dropdown-item @click="openBulkModal('suspend')">Pause selected…</b-dropdown-item>
          <b-dropdown-item @click="openBulkModal('ban')">Block selected…</b-dropdown-item>
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
        <template #cell(person)="data">
          <router-link :to="{ name: 'admin.users.detail', params: { id: String(data.item.id) } }" class="fw-semibold text-decoration-none">
            {{ userDisplayName(data.item) }}
          </router-link>
          <div class="small text-muted">{{ data.item.phone_number || 'No phone' }}<span v-if="data.item.email"> · {{ data.item.email }}</span></div>
        </template>
        <template #cell(roles_display)="data">
          {{ rolesDisplay(data.item) }}
        </template>
        <template #cell(account_status)="data">
          <b-badge :variant="statusVariant(data.item.account_status)">{{ statusLabel(data.item.account_status) }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <div class="d-flex flex-wrap gap-1">
            <b-button size="sm" variant="primary" :to="{ name: 'admin.users.detail', params: { id: String(data.item.id) } }">Open</b-button>
            <b-dropdown size="sm" variant="outline-secondary" text="Account" no-caret>
              <b-dropdown-item v-if="data.item.account_status !== 'active'" @click="action(data.item, 'activate')">Turn on</b-dropdown-item>
              <b-dropdown-item v-if="data.item.account_status !== 'suspended'" @click="openActionModal(data.item, 'suspend')">Pause</b-dropdown-item>
              <b-dropdown-item v-if="data.item.account_status !== 'banned'" @click="openActionModal(data.item, 'ban')">Block</b-dropdown-item>
              <b-dropdown-item v-if="data.item.account_status !== 'archived'" @click="archiveUser(data.item)">Archive</b-dropdown-item>
            </b-dropdown>
          </div>
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
  actionType.value === 'ban' ? 'Block user' : actionType.value === 'suspend' ? 'Pause user' : 'User action'
)

const bulkModalTitle = computed(() => {
  const n = selected.value.length
  return bulkModalType.value === 'ban' ? `Block ${n} user(s)` : `Pause ${n} user(s)`
})

const statusOptions = [
  { value: '', text: 'Everyone' },
  { value: 'active', text: 'On' },
  { value: 'suspended', text: 'Paused' },
  { value: 'banned', text: 'Blocked' },
  { value: 'archived', text: 'Archived' },
]
const sellerOptions = [
  { value: '', text: 'All people' },
  { value: 0, text: 'Buyers only' },
  { value: 1, text: 'Sellers' },
]

const fields = [
  { key: 'person', label: 'Person' },
  { key: 'roles_display', label: 'What they do' },
  { key: 'account_status', label: 'Account' },
  { key: 'actions', label: '' },
]

function statusLabel(status?: string) {
  if (status === 'active') return 'On'
  if (status === 'suspended') return 'Paused'
  if (status === 'banned') return 'Blocked'
  if (status === 'archived') return 'Archived'
  return status || '—'
}

function statusVariant(status?: string) {
  if (status === 'active') return 'success'
  if (status === 'suspended') return 'warning'
  if (status === 'banned') return 'danger'
  return 'secondary'
}

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
  if (u.is_staff) add('Admin')
  if (u.is_superuser) add('Full admin')
  const roles = u.roles
  if (Array.isArray(roles) && roles.length) {
    for (const r of roles) {
      const s = String(r).toLowerCase()
      if (s === 'seller') add('Seller')
      else if (s === 'staff') add('Admin')
      else if (s === 'admin' || s === 'superuser' || s === 'all') add('Full admin')
      else if (s === 'buyer') add('Buyer')
      else if (s === 'rider') add('Rider')
      else if (r) add(String(r))
    }
  }
  if (parts.length === 0) return '—'
  const order = ['Seller', 'Admin', 'Full admin', 'Rider', 'Buyer']
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
    toastSuccess(type === 'ban' ? 'Selected people blocked' : 'Selected people paused')
  }
}

async function bulkActivateSelected() {
  if (!selected.value.length) return
  const ok = await confirmDestructiveAction({
    title: `Turn on ${selected.value.length} people?`,
    text: 'Each selected account will be able to sign in again.',
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
    toastSuccess('Selected people turned on')
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
    toastSuccess(type === 'ban' ? 'Account blocked' : 'Account paused')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}

async function action(item: UserRow, actionType: 'ban' | 'suspend' | 'activate') {
  try {
    await usersAdminApi.userAction(item.id, { action: actionType })
    await load()
    toastSuccess(actionType === 'activate' ? 'Account turned on' : actionType === 'ban' ? 'Account blocked' : 'Account paused')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Action failed')
    toastError(error.value)
  }
}

async function archiveUser(item: UserRow) {
  const ok = await confirmDestructiveAction({
    title: `Archive ${userDisplayName(item)}?`,
    text: 'They cannot sign in, and their public shop link is released. Turn the account on later to restore it.',
  })
  if (!ok) return
  try {
    await usersAdminApi.archive(item.id)
    await load()
    toastSuccess('User archived')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Archive failed')
    toastError(error.value)
  }
}
</script>
