<template>
  <VerticalLayout>
    <b-card title="My Orders / Sales">
      <p class="text-muted">Orders containing your products. Backend may filter by seller when you are logged in as a seller.</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search by order # or ID..." class="w-auto" style="max-width: 200px;" />
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" />
        <b-button variant="primary" @click="load">Refresh</b-button>
      </div>
      <b-table
        v-if="displayItems.length"
        :items="displayItems"
        :fields="fields"
        striped
        responsive
      >
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'seller.orders.detail', params: { id: String(row.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <p v-else-if="error" class="text-danger">{{ error }}</p>
      <EmptyState v-else title="No orders yet" message="Orders that include your products will appear here." />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} order(s)</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { ordersUserApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

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
]
const items = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const error = ref('')
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'order_number', label: 'Order #' },
  { key: 'status', label: 'Status' },
  { key: 'total_amount', label: 'Total' },
  { key: 'final_total', label: 'Final' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

const displayItems = computed(() => {
  let list = items.value
  if (statusFilter.value) {
    list = list.filter((o) => String(o.status ?? '').toLowerCase() === statusFilter.value.toLowerCase())
  }
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (o) =>
        String(o.order_number ?? '').toLowerCase().includes(q) ||
        String(o.id ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await ordersUserApi.list({ page_size: 100 })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load orders')
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
