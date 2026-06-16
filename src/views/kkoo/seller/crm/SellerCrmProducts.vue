<template>
  <VerticalLayout>
    <b-card title="Products (Inventory)">
      <div v-if="hasMultipleBusinesses" class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="text-muted">Business:</span>
        <b-form-select v-model="selectedBusinessId" :options="businessOptions" value-field="id" text-field="name" size="sm" class="w-auto" style="max-width: 220px;" @change="onBusinessChange" />
      </div>
      <p class="text-muted mb-3">Your inventory: name, SKU, cost, selling price, stock, reorder level.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-checkbox v-model="lowStockOnly" @change="applyFilter">Low stock only</b-form-checkbox>
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" :to="{ name: 'seller.crm.products.create' }">Add Product</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(cost_price)="data">{{ formatCurrency(data.item.cost_price) }}</template>
        <template #cell(selling_price)="data">{{ formatCurrency(data.item.selling_price) }}</template>
        <template #cell(stock_quantity)="data">
          <span :class="{ 'text-danger': isLowStock(data.item) }">{{ data.item.stock_quantity ?? 0 }}</span>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'seller.crm.products.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No products" message="Add products (inventory) in CRM when the API is available. CRM is configured by your platform administrator. Contact support if you need access." />
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
import { ref, computed, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { useCrmBusinessSwitcher } from '@/composables/useCrmBusinessSwitcher'

const switcher = useCrmBusinessSwitcher()
const { selectedBusinessId, hasMultipleBusinesses, loadBusinesses, setSelectedBusinessId, businesses } = switcher
const businessOptions = computed(() => businesses.value.map((b) => ({ id: Number(b.id), name: (b.name as string) || `Business ${b.id}` })))

const lowStockOnly = ref(false)
const { items, total, page, pageSize, loading, error, hasPagination, setPage, load } = useCrmList(
  (params) => crmApi.getProducts({
    ...params,
    business_id: switcher.selectedBusinessId.value ?? undefined,
    low_stock: lowStockOnly.value ? true : undefined,
  }),
  {}
)

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'sku', label: 'SKU' },
  { key: 'cost_price', label: 'Cost' },
  { key: 'selling_price', label: 'Selling price' },
  { key: 'stock_quantity', label: 'Stock' },
  { key: 'reorder_level', label: 'Reorder' },
  { key: 'unit', label: 'Unit' },
  { key: 'actions', label: 'Actions' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function isLowStock(item: Record<string, unknown>): boolean {
  const stock = Number(item.stock_quantity ?? 0)
  const reorder = Number(item.reorder_level ?? 0)
  return reorder > 0 && stock <= reorder
}

function applyFilter() {
  setPage(1)
  load()
}

function onBusinessChange() {
  setSelectedBusinessId(selectedBusinessId.value)
  load()
}

watch(lowStockOnly, () => setPage(1))
watch(() => switcher.selectedBusinessId.value, () => load())
onMounted(async () => {
  await loadBusinesses()
  load()
})
</script>
