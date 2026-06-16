<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <b-card title="Returns">
          <p class="text-muted">Approve, reject, mark item received, or process refund for return requests.</p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
            <b-form-input v-model="search" placeholder="Search..." class="w-auto" style="max-width: 180px;" />
            <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">CSV template</b-button>
          </div>
          <b-table
            v-if="items.length"
            :items="displayItems"
            :fields="fields"
            striped
            responsive
            show-empty
          >
            <template #cell(actions)="row">
              <b-button size="sm" variant="outline-secondary" class="me-1" :to="{ name: 'admin.returns.detail', params: { id: String(row.item.id) } }">View</b-button>
              <template v-if="row.item.status === 'pending'">
                <b-button size="sm" variant="success" class="me-1" @click="approve(row.item)">Approve</b-button>
                <b-button size="sm" variant="danger" @click="reject(row.item)">Reject</b-button>
              </template>
              <template v-else-if="row.item.status === 'approved'">
                <b-button size="sm" variant="outline-primary" class="me-1" @click="markItemReceived(row.item)">Item received</b-button>
                <b-button size="sm" variant="primary" @click="processRefund(row.item)">Process refund</b-button>
              </template>
              <span v-else class="text-muted">{{ row.item.status }}</span>
            </template>
          </b-table>
          <p v-else-if="loading" class="text-muted">Loading…</p>
          <p v-else-if="error" class="text-danger">{{ error }}</p>
          <EmptyState v-else />
          <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} return(s)</p>
        </b-card>
      </b-col>
    </b-row>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { ordersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'

const statusFilter = ref('pending')
const search = ref('')
const statusOptions = [
  { value: '', text: 'All' },
  { value: 'pending', text: 'Pending' },
  { value: 'approved', text: 'Approved' },
  { value: 'rejected', text: 'Rejected' },
  { value: 'completed', text: 'Completed' },
]
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'order', label: 'Order' },
  { key: 'status', label: 'Status' },
  { key: 'reason', label: 'Reason' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const displayItems = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(
    (r) =>
      String(r.order ?? '').toLowerCase().includes(q) ||
      String(r.reason ?? '').toLowerCase().includes(q) ||
      String(r.status ?? '').toLowerCase().includes(q)
  )
})

const returnCsvCols = [
  { key: 'id', label: 'ID' },
  { key: 'order', label: 'Order' },
  { key: 'status', label: 'Status' },
  { key: 'reason', label: 'Reason' },
  { key: 'created_at', label: 'Created' },
]
function exportCsv() {
  exportToCsv(displayItems.value, returnCsvCols, 'returns-export.csv')
}
function downloadTemplate() {
  downloadCsvTemplate(returnCsvCols, 'returns-template.csv', { order: '1', status: 'pending', reason: 'Defective', created_at: '' })
}

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  const obj = data as { results?: unknown[]; data?: unknown[] }
  return (obj?.results ?? obj?.data ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await ordersAdminApi.listReturns({
      status: statusFilter.value || undefined,
    })
    items.value = normalizeList(data) as Record<string, unknown>[]
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load returns'
  } finally {
    loading.value = false
  }
}

async function approve(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await ordersAdminApi.approveReturn(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to approve'
  }
}

async function reject(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await ordersAdminApi.rejectReturn(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to reject'
  }
}

async function markItemReceived(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await ordersAdminApi.itemReceivedReturn(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to mark item received'
  }
}

async function processRefund(item: Record<string, unknown>) {
  const id = item.id as number
  if (!id) return
  try {
    await ordersAdminApi.processRefundReturn(id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to process refund'
  }
}

onMounted(load)
</script>
