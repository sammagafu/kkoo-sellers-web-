<template>
  <VerticalLayout>
    <b-card title="Seller Management">
      <p class="text-muted mb-3">View sellers and approve or reject verification. When rejecting, provide a reason (why the user is not verified).</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search by name, phone, business..." class="w-auto" style="max-width: 220px;" @keyup.enter="load" />
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
        <b-dropdown
          v-if="selected.length"
          variant="primary"
          size="sm"
          :text="`Bulk (${selected.length})`"
          menu-class="shadow-sm"
        >
          <b-dropdown-item @click="bulkApproveSelected">Approve selected (pending)</b-dropdown-item>
          <b-dropdown-item @click="openBulkRejectModal">Reject selected…</b-dropdown-item>
        </b-dropdown>
      </div>
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
        <template #cell(user_display)="data">
          {{ userDisplay(data.item) }}
        </template>
        <template #cell(verification_status)="data">
          <b-badge :variant="data.item.is_verified ? 'success' : (data.item.verification_status === 'rejected' ? 'danger' : 'warning')">
            {{ data.item.is_verified ? 'Verified' : (data.item.verification_status === 'rejected' ? 'Rejected' : 'Pending') }}
          </b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.sellers.detail', params: { id: String(data.item.id) } }">View</b-button>
          <template v-if="!data.item.is_verified && data.item.verification_status !== 'rejected'">
            <b-button size="sm" variant="outline-success" class="me-1" :disabled="actionLoading === data.item.id" @click="approve(data.item)">Approve</b-button>
            <b-button size="sm" variant="outline-danger" :disabled="actionLoading === data.item.id" @click="openRejectModal(data.item)">Reject</b-button>
          </template>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} seller(s)</p>
    </b-card>

    <b-modal v-model="rejectModalShow" title="Reject seller verification" @ok="onRejectOk" @hidden="clearReject">
      <p class="text-muted small">Provide a reason so the seller knows why they are not verified.</p>
      <b-form-textarea v-model="rejectReason" placeholder="Reason (why not verified)..." rows="3" />
    </b-modal>

    <b-modal v-model="bulkRejectModalShow" title="Reject selected sellers" @ok="onBulkRejectOk" @hidden="clearBulkReject">
      <p class="text-muted small">This reason will be applied to each pending seller in your selection.</p>
      <b-form-textarea v-model="bulkRejectReason" placeholder="Reason (required)..." rows="3" required />
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { sellersAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

interface UserRef {
  id?: number
  phone_number?: string
  email?: string
  first_name?: string
  last_name?: string
}

interface SellerRow {
  id: number
  user?: UserRef
  business_name?: string
  is_verified?: boolean
  verification_status?: string
  rejection_reason?: string
}

const items = ref<SellerRow[]>([])
const selected = ref<SellerRow[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const statusFilter = ref('')
const actionLoading = ref<number | null>(null)
const rejectModalShow = ref(false)
const rejectTarget = ref<SellerRow | null>(null)
const rejectReason = ref('')
const bulkRejectModalShow = ref(false)
const bulkRejectReason = ref('')

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'user_display', label: 'User' },
  { key: 'business_name', label: 'Business' },
  { key: 'verification_status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

const displayItems = computed(() => {
  let list = items.value
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (row) =>
        userDisplay(row).toLowerCase().includes(q) ||
        String(row.business_name ?? '').toLowerCase().includes(q) ||
        String(row.id).toLowerCase().includes(q)
    )
  }
  const status = statusFilter.value.toLowerCase()
  if (status) {
    list = list.filter((row) => {
      const s = String(row.verification_status ?? '').toLowerCase()
      if (status === 'pending') return s !== 'approved' && s !== 'rejected'
      if (status === 'approved') return s === 'approved'
      if (status === 'rejected') return s === 'rejected'
      return true
    })
  }
  return list
})

function userDisplay(row: SellerRow): string {
  const u = row.user
  if (!u) return '—'
  const parts: string[] = []
  if (u.phone_number) parts.push(u.phone_number)
  if (u.email) parts.push(u.email)
  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
  if (name) parts.push(name)
  return parts.length ? parts.join(' · ') : '—'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const kycStatus = statusFilter.value ? statusFilter.value : undefined
    const { data } = await sellersAdminApi.list({ kyc_status: kycStatus })
    const rawList = (Array.isArray(data) ? data : (data as { results?: SellerRow[] })?.results ?? []) as Record<string, unknown>[]
    items.value = rawList.map((row) => ({
      ...row,
      verification_status: (row.kyc_status ?? row.verification_status) as string,
      is_verified: (row.kyc_status as string) === 'approved',
      rejection_reason: row.kyc_rejection_reason ?? row.rejection_reason,
    })) as SellerRow[]
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load sellers')
  } finally {
    loading.value = false
  }
}

onMounted(load)

async function approve(item: SellerRow) {
  actionLoading.value = item.id
  try {
    await sellersAdminApi.approve(item.id)
    await load()
    toastSuccess('Seller approved')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Approve failed')
    toastError(error.value)
  } finally {
    actionLoading.value = null
  }
}

function sellerPending(row: SellerRow): boolean {
  return !row.is_verified && row.verification_status !== 'rejected'
}

async function bulkApproveSelected() {
  const pending = selected.value.filter(sellerPending)
  if (!pending.length) {
    error.value = 'No pending sellers in the current selection.'
    toastError(error.value)
    return
  }
  error.value = ''
  let failed = 0
  for (const row of pending) {
    actionLoading.value = row.id
    try {
      await sellersAdminApi.approve(row.id)
    } catch {
      failed++
    } finally {
      actionLoading.value = null
    }
  }
  selected.value = []
  await load()
  if (failed) {
    error.value = `${failed} of ${pending.length} approve(s) failed.`
    toastError(error.value)
  } else {
    toastSuccess(`Approved ${pending.length} seller(s)`)
  }
}

function openBulkRejectModal() {
  const pending = selected.value.filter(sellerPending)
  if (!pending.length) {
    error.value = 'No pending sellers in the current selection.'
    toastError(error.value)
    return
  }
  bulkRejectReason.value = ''
  bulkRejectModalShow.value = true
}

function clearBulkReject() {
  bulkRejectReason.value = ''
}

function onBulkRejectOk(ev: Event) {
  ev.preventDefault()
  if (!bulkRejectReason.value.trim()) {
    error.value = 'A rejection reason is required.'
    toastError(error.value)
    return
  }
  void confirmBulkReject()
}

async function confirmBulkReject() {
  const reason = bulkRejectReason.value.trim()
  const pending = selected.value.filter(sellerPending)
  if (!pending.length) {
    bulkRejectModalShow.value = false
    clearBulkReject()
    return
  }
  bulkRejectModalShow.value = false
  clearBulkReject()
  error.value = ''
  let failed = 0
  for (const row of pending) {
    try {
      await sellersAdminApi.reject(row.id, reason)
    } catch {
      failed++
    }
  }
  selected.value = []
  await load()
  if (failed) {
    error.value = `${failed} of ${pending.length} reject(s) failed.`
    toastError(error.value)
  } else {
    toastSuccess(`Rejected ${pending.length} seller(s)`)
  }
}

function openRejectModal(item: SellerRow) {
  rejectTarget.value = item
  rejectReason.value = ''
  rejectModalShow.value = true
}

function clearReject() {
  rejectTarget.value = null
  rejectReason.value = ''
}

function onRejectOk(ev: Event) {
  ev.preventDefault()
  confirmReject()
}

async function confirmReject() {
  const item = rejectTarget.value
  if (!item) return
  actionLoading.value = item.id
  try {
    await sellersAdminApi.reject(item.id, rejectReason.value.trim() || undefined)
    rejectModalShow.value = false
    clearReject()
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Reject failed')
  } finally {
    actionLoading.value = null
  }
}
</script>
