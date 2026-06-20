<template>
  <VerticalLayout>
    <b-card title="Invoicing">
      <p class="text-muted mb-3">Create, customize, and send order invoices. Open an order below to manage its invoice (create, customize branding, send by link or email, track opens).</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search order #..." class="w-auto" style="max-width: 200px;" @keyup.enter="load" />
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(total)="data">
          {{ formatMoney(data.item.final_total ?? data.item.total_amount ?? data.item.total) }}
        </template>
        <template #cell(actions)="data">
          <b-button
            size="sm"
            variant="outline-primary"
            :disabled="!sellerOrderDetailRoute(data.item)"
            :to="sellerOrderDetailRoute(data.item)"
          >
            Open order & invoice
          </b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No orders" message="Orders that include your products will appear here. Open an order to create or send an invoice." />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { ordersUserApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { resolveOrderRef, sellerOrderDetailRoute } from '@/utils/orderRef'

const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'order_number', label: 'Order #' },
  { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const displayItems = computed(() => {
  const list = items.value
  const q = search.value.toLowerCase().trim()
  if (!q) return list
  return list.filter(
    (o) =>
      String(o.order_number ?? '').toLowerCase().includes(q) ||
      String(resolveOrderRef(o) ?? '').toLowerCase().includes(q)
  )
})

function formatMoney(v: unknown): string {
  if (v == null) return '—'
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : n.toLocaleString('en-TZ', { maximumFractionDigits: 2 })
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await ordersUserApi.list()
    const res = data as { results?: unknown[] }
    items.value = Array.isArray(res?.results) ? (res.results as Record<string, unknown>[]) : []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load orders')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
