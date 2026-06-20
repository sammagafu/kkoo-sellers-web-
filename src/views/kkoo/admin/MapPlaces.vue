<template>
  <VerticalLayout>
    <b-card title="Kkoo Maps — community places">
      <p class="text-muted mb-3">
        Review user-contributed pins before they appear in search. Approve accurate landmarks and gates;
        reject spam or unsafe labels. Merge duplicates into an existing approved pin when needed.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-form-input v-model="searchQ" placeholder="Search name or address" class="w-auto" style="min-width: 220px" @keyup.enter="load" />
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive small>
        <template #cell(name)="row">
          <strong>{{ row.item.name }}</strong>
          <div v-if="row.item.formatted_address" class="text-muted small">{{ row.item.formatted_address }}</div>
        </template>
        <template #cell(location)="row">
          <span>{{ formatCoord(row.item.latitude) }}, {{ formatCoord(row.item.longitude) }}</span>
          <div class="text-muted small">{{ row.item.ward || row.item.district || '—' }}</div>
        </template>
        <template #cell(status)="row">
          <b-badge :variant="statusVariant(row.item.status)">{{ row.item.status ?? '—' }}</b-badge>
        </template>
        <template #cell(selection_count)="row">
          {{ row.item.selection_count ?? 0 }}
        </template>
        <template #cell(actions)="row">
          <div class="d-flex flex-wrap gap-1">
            <b-button
              v-if="row.item.status !== 'approved'"
              size="sm"
              variant="outline-success"
              @click="approve(row.item)"
            >Approve</b-button>
            <b-button
              v-if="row.item.status !== 'rejected'"
              size="sm"
              variant="outline-danger"
              @click="openReject(row.item)"
            >Reject</b-button>
            <b-button
              v-if="row.item.is_public !== false"
              size="sm"
              variant="outline-secondary"
              @click="hide(row.item)"
            >Hide</b-button>
          </div>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />

      <b-modal v-model="showRejectModal" title="Reject place" @ok="confirmReject" @hidden="rejectTarget = null">
        <p v-if="rejectTarget">Reject <strong>{{ rejectTarget.name }}</strong>?</p>
        <b-form-group label="Reason (optional)">
          <b-form-input v-model="rejectReason" placeholder="Spam, inaccurate, private home, etc." />
        </b-form-group>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { logisticsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

const statusFilter = ref('pending')
const searchQ = ref('')
const statusOptions = [
  { value: 'pending', text: 'Pending review' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
  { value: '', text: 'All' },
]
const loading = ref(false)
const error = ref('')
const items = ref<Record<string, unknown>[]>([])
const showRejectModal = ref(false)
const rejectTarget = ref<Record<string, unknown> | null>(null)
const rejectReason = ref('')

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Place' },
  { key: 'location', label: 'Location' },
  { key: 'status', label: 'Status' },
  { key: 'selection_count', label: 'Uses' },
  { key: 'user_id', label: 'User' },
  { key: 'created_at', label: 'Submitted' },
  { key: 'actions', label: 'Actions' },
]

function statusVariant(s: unknown): string {
  const v = String(s ?? '').toLowerCase()
  if (v === 'approved') return 'success'
  if (v === 'rejected') return 'danger'
  return 'warning'
}

function formatCoord(v: unknown): string {
  const n = Number(v)
  return Number.isFinite(n) ? n.toFixed(5) : '—'
}

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await logisticsAdminApi.listMapPlaces({
      status: statusFilter.value || undefined,
      q: searchQ.value.trim() || undefined,
      limit: 200,
    })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load map places')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function patchPlace(id: number, body: Record<string, unknown>) {
  await logisticsAdminApi.updateMapPlace(id, body)
}

async function approve(place: Record<string, unknown>) {
  const id = Number(place.id)
  if (!id) return
  try {
    await patchPlace(id, { status: 'approved', is_public: true })
    toastSuccess('Place approved')
    await load()
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Approve failed'))
  }
}

function openReject(place: Record<string, unknown>) {
  rejectTarget.value = place
  rejectReason.value = ''
  showRejectModal.value = true
}

async function confirmReject() {
  const place = rejectTarget.value
  const id = Number(place?.id)
  if (!id) return
  try {
    await patchPlace(id, {
      status: 'rejected',
      rejected_reason: rejectReason.value.trim() || undefined,
      is_public: false,
    })
    toastSuccess('Place rejected')
    await load()
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Reject failed'))
  }
}

async function hide(place: Record<string, unknown>) {
  const id = Number(place.id)
  if (!id) return
  try {
    await patchPlace(id, { is_public: false })
    toastSuccess('Place hidden from search')
    await load()
  } catch (e: unknown) {
    toastError(formatApiError(e, 'Hide failed'))
  }
}

onMounted(load)
</script>
