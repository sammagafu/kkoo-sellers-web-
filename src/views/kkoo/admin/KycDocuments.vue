<template>
  <VerticalLayout>
    <b-card title="KYC Documents">
      <p class="text-muted">Review and approve or reject seller KYC documents. Only pending documents can be approved or rejected.</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(seller)="row">
          <router-link v-if="sellerId(row.item)" :to="{ name: 'admin.sellers.detail', params: { id: String(sellerId(row.item)) } }">
            {{ sellerId(row.item) }}
          </router-link>
          <span v-else>—</span>
        </template>
        <template #cell(status)="row">
          <b-badge :variant="statusVariant(row.item.status)">{{ row.item.status ?? '—' }}</b-badge>
        </template>
        <template #cell(actions)="row">
          <template v-if="row.item.status === 'pending'">
            <b-button size="sm" variant="outline-success" class="me-1" @click="approve(row.item)">Approve</b-button>
            <b-button size="sm" variant="outline-danger" @click="reject(row.item)">Reject</b-button>
          </template>
          <span v-else class="text-muted">{{ row.item.status }}</span>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { kycAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

const statusFilter = ref('pending')
const statusOptions = [
  { value: '', text: 'All' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
]
const loading = ref(false)
const error = ref('')
const items = ref<Record<string, unknown>[]>([])

function statusVariant(s: unknown): string {
  const v = String(s ?? '').toLowerCase()
  if (v === 'approved') return 'success'
  if (v === 'rejected') return 'danger'
  return 'warning'
}

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'document_type', label: 'Type' },
  { key: 'seller', label: 'Seller' },
  { key: 'status', label: 'Status' },
  { key: 'created_at', label: 'Submitted' },
  { key: 'actions', label: 'Actions' },
]

function sellerId(d: Record<string, unknown>): number | null {
  const s = d.seller_id ?? (d.seller as Record<string, unknown>)?.id ?? (d.seller as number)
  return s != null ? Number(s) : null
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
    const { data } = await kycAdminApi.list({ status: statusFilter.value || undefined })
    items.value = normalizeList(data)
    toastSuccess('KYC documents loaded')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load KYC documents')
    items.value = []
    toastError(error.value)
  } finally {
    loading.value = false
  }
}

async function approve(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await kycAdminApi.approve(id)
    await load()
    toastSuccess('KYC approved')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Approve failed')
    toastError(error.value)
  }
}

async function reject(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    const reason = window.prompt('Rejection reason (shown to seller):') ?? ''
    await kycAdminApi.reject(id, { reason })
    await load()
    toastSuccess('KYC rejected')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Reject failed')
    toastError(error.value)
  }
}

onMounted(load)
</script>
