<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.purchase-orders' }">← Back to Purchase Orders</b-button>
    <b-card v-if="po" title="Purchase order detail">
      <b-row>
        <b-col md="6">
          <p class="mb-1"><strong>PO #</strong> {{ po.po_number || '—' }}</p>
          <p class="mb-1"><strong>Supplier ID</strong> {{ po.supplier_id ?? '—' }}</p>
          <p class="mb-1"><strong>Total</strong> {{ formatCurrency(po.total) }}</p>
          <p class="mb-1"><strong>Status</strong> <b-badge :variant="poStatusVariant(po.status)">{{ po.status || 'draft' }}</b-badge></p>
        </b-col>
        <b-col md="6">
          <p class="mb-1"><strong>Order date</strong> {{ po.order_date || '—' }}</p>
          <p class="mb-1"><strong>Expected date</strong> {{ po.expected_date || '—' }}</p>
          <p class="mb-1"><strong>Notes</strong> {{ po.notes || '—' }}</p>
        </b-col>
      </b-row>

      <template v-if="poItems.length">
        <h6 class="mt-3">Line items</h6>
        <b-table :items="poItems" :fields="itemFields" striped responsive size="sm" class="mb-3">
          <template #cell(unit_cost)="data">{{ formatCurrency(data.item.unit_cost) }}</template>
          <template #cell(total)="data">{{ formatCurrency(data.item.total) }}</template>
        </b-table>
      </template>

      <template v-if="canReceive">
        <hr />
        <h6 class="mb-2">Receive stock</h6>
        <b-alert v-if="receiveError" variant="danger" show>{{ receiveError }}</b-alert>
        <b-table :items="receiveRows" :fields="receiveFields" striped responsive size="sm" class="mb-2">
          <template #cell(product_id)="data">{{ data.item.product_id ?? data.item.product_name ?? '—' }}</template>
          <template #cell(quantity)="data">{{ data.item.quantity }}</template>
          <template #cell(received_quantity)="data">
            <b-form-input v-model.number="data.item.received_quantity" type="number" min="0" step="0.01" size="sm" style="max-width: 100px;" />
          </template>
        </b-table>
        <b-button variant="primary" size="sm" :disabled="receiveSaving" @click="submitReceive">Receive</b-button>
      </template>
    </b-card>
    <b-card v-else-if="loading" title="Purchase order detail"><p class="text-muted">Loading…</p></b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Purchase order not found" />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { crmApi } from '@/api'

const route = useRoute()
const po = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const receiveError = ref('')
const receiveSaving = ref(false)

const id = computed<string | undefined>(() => { const p = route.params.id; return Array.isArray(p) ? p[0] : (p ?? undefined) })

const poItems = computed(() => {
  const data = po.value
  if (!data) return []
  const items = (data.items ?? data.purchase_order_items ?? data.line_items) as Record<string, unknown>[] | undefined
  return Array.isArray(items) ? items : []
})

const receiveRows = ref<{ id: number; product_id?: unknown; quantity: number; received_quantity: number }[]>([])

const canReceive = computed(() => {
  const status = String(po.value?.status ?? '').toLowerCase()
  return status === 'ordered' && receiveRows.value.length > 0
})

function buildReceiveRows() {
  const items = poItems.value
  receiveRows.value = items.map((row) => ({
    id: Number(row.id),
    product_id: row.product_id,
    quantity: Number(row.quantity) || 0,
    received_quantity: Number(row.received_quantity ?? row.quantity) || 0,
  }))
}

const itemFields = [
  { key: 'product_id', label: 'Product ID' },
  { key: 'quantity', label: 'Quantity' },
  { key: 'unit_cost', label: 'Unit cost' },
  { key: 'total', label: 'Total' },
  { key: 'received_quantity', label: 'Received' },
]

const receiveFields = [
  { key: 'product_id', label: 'Product' },
  { key: 'quantity', label: 'Ordered' },
  { key: 'received_quantity', label: 'Received qty' },
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

async function submitReceive() {
  if (!id.value) return
  receiveError.value = ''
  const items = receiveRows.value.map((row) => ({
    id: row.id,
    received_quantity: Number(row.received_quantity) || 0,
  }))
  if (items.length === 0) {
    receiveError.value = 'No line items to receive.'
    return
  }
  try {
    receiveSaving.value = true
    await crmApi.receivePurchaseOrder(id.value, { items })
    load()
  } catch (e: unknown) {
    receiveError.value = (e as { message?: string }).message ?? 'Failed to record receipt'
  } finally {
    receiveSaving.value = false
  }
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  receiveError.value = ''
  po.value = null
  try {
    const { data } = await crmApi.getPurchaseOrder(id.value)
    po.value = (data ?? {}) as Record<string, unknown>
    buildReceiveRows()
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load purchase order'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
