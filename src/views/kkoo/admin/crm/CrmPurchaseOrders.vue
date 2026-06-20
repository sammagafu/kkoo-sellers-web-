<template>
  <VerticalLayout>
    <b-card title="Purchase Orders">
      <p class="text-muted mb-3">Track stock purchased from suppliers. PO status: draft, ordered, received, cancelled. On receive, stock is updated.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="applyFilter" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(total)="data">
          {{ formatCurrency(data.item.total) }}
        </template>
        <template #cell(status)="data">
          <b-badge :variant="poStatusVariant(data.item.status)">{{ data.item.status || 'draft' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'admin.crm.purchase-orders.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No purchase orders" message="No purchase orders yet." />
      <b-pagination
        v-if="hasPagination"
        :model-value="page"
        :total-rows="total"
        :per-page="pageSize"
        size="sm"
        class="mt-3"
        @update:model-value="(v: unknown) => setPage(Number(v))"
      />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'

const statusFilter = ref('')

const {
  items,
  total,
  page,
  pageSize,
  loading,
  error,
  hasPagination,
  setPage,
  load,
} = useCrmList(
  (params) => crmApi.getPurchaseOrders({ ...params, status: statusFilter.value || undefined }),
  {}
)

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'draft', text: 'Draft' },
  { value: 'ordered', text: 'Ordered' },
  { value: 'received', text: 'Received' },
  { value: 'cancelled', text: 'Cancelled' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'po_number', label: 'PO #' },
  { key: 'supplier_id', label: 'Supplier ID' },
  { key: 'total', label: 'Total' },
  { key: 'status', label: 'Status' },
  { key: 'order_date', label: 'Order date' },
  { key: 'expected_date', label: 'Expected' },
  { key: 'actions', label: 'Actions' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function poStatusVariant(s: unknown): string {
  const status = String(s ?? '').toLowerCase()
  if (status === 'received') return 'success'
  if (status === 'cancelled') return 'danger'
  if (status === 'ordered') return 'info'
  return 'secondary'
}

function applyFilter() {
  setPage(1)
}

watch(statusFilter, () => setPage(1))

onMounted(load)
</script>
