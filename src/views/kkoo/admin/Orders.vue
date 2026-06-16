<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <b-card title="Orders">
          <p class="text-muted">View orders, update status, or process refunds.</p>
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <b-form-input v-model="search" placeholder="Search..." class="w-auto" style="max-width: 180px;" @keyup.enter="load" />
            <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="load" />
            <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">CSV template</b-button>
            <b-button variant="primary" @click="load">Refresh</b-button>
          </div>
          <b-table
            v-if="items.length"
            :items="items"
            :fields="fields"
            striped
            responsive
          >
            <template #cell(actions)="row">
              <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.orders.detail', params: { id: String(row.item.id) } }">View</b-button>
              <b-button size="sm" variant="outline-secondary" class="me-1" @click="openStatusModal(row.item)">Status</b-button>
              <b-button size="sm" variant="outline-danger" @click="openRefundModal(row.item)">Refund</b-button>
            </template>
          </b-table>
          <p v-else-if="loading" class="text-muted">Loading…</p>
          <p v-else-if="error" class="text-danger">{{ error }}</p>
          <EmptyState v-else />
          <p v-if="items.length" class="text-muted small mt-2">Showing {{ items.length }} order(s)</p>
        </b-card>
      </b-col>
    </b-row>
    <b-modal v-model="showStatusModal" title="Update order status" @ok="submitStatus">
      <b-form-group label="Status">
        <b-form-select v-model="selectedStatus" :options="statusOptions" />
      </b-form-group>
    </b-modal>
    <b-modal v-model="showRefundModal" title="Refund order" @ok="submitRefund">
      <p>Refund order #{{ selectedOrder?.order_number ?? selectedOrder?.id }}? This action cannot be undone.</p>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { ordersAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate } from '@/composables/useCsv'

const search = ref('')
const statusFilter = ref('')
const statusOptions = [
  { value: '', text: 'All' },
  { value: 'pending', text: 'Pending' },
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'processing', text: 'Processing' },
  { value: 'shipped', text: 'Shipped' },
  { value: 'delivered', text: 'Delivered' },
  { value: 'completed', text: 'Completed' },
  { value: 'cancelled', text: 'Cancelled' },
  { value: 'refunded', text: 'Refunded' },
]
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'order_number', label: 'Order #' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const showStatusModal = ref(false)
const showRefundModal = ref(false)
const selectedOrder = ref<Record<string, unknown> | null>(null)
const selectedStatus = ref('')

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[]; data?: unknown[] }
  return (obj?.results ?? obj?.data ?? []) as Record<string, unknown>[]
}

const orderCsvCols = [
  { key: 'id', label: 'ID' },
  { key: 'order_number', label: 'Order #' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
]
function exportCsv() {
  exportToCsv(items.value, orderCsvCols, 'orders-export.csv')
}
function downloadTemplate() {
  downloadCsvTemplate(orderCsvCols, 'orders-template.csv', { order_number: 'ORD-001', status: 'pending', total: '99.00', created_at: '' })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await ordersAdminApi.list({
      status: statusFilter.value || undefined,
      search: search.value || undefined,
    })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load orders'
  } finally {
    loading.value = false
  }
}

function openStatusModal(order: Record<string, unknown>) {
  selectedOrder.value = order
  selectedStatus.value = (order.status as string) ?? ''
  showStatusModal.value = true
}

function openRefundModal(order: Record<string, unknown>) {
  selectedOrder.value = order
  showRefundModal.value = true
}

async function submitStatus() {
  const order = selectedOrder.value
  if (!order?.id || !selectedStatus.value) return
  try {
    await ordersAdminApi.updateStatus(order.id as number, selectedStatus.value)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to update status'
  }
  showStatusModal.value = false
}

async function submitRefund() {
  const order = selectedOrder.value
  if (!order?.id) return
  try {
    await ordersAdminApi.refund(order.id as number)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to refund'
  }
  showRefundModal.value = false
}

onMounted(load)
</script>
