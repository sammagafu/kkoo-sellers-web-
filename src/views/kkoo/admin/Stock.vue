<template>
  <VerticalLayout>
    <b-card title="Stock & inventory">
      <p class="text-muted mb-3">
        Product and SKU stock levels. Low-stock items may need reordering. Open a product to edit SKU quantities. Stock appears here when the API returns <code>skus</code> in the product list.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search products..." class="w-auto" style="max-width: 220px;" @input="debouncedLoad" />
        <b-form-select v-model="lowStockOnly" :options="[{ value: false, text: 'All products' }, { value: true, text: 'Low stock only' }]" class="w-auto" @change="load" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
      </div>
      <b-alert v-if="error" variant="danger" dismissible show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(title)="row">
          <router-link :to="{ name: 'admin.catalog.products.detail', params: { slug: row.item.slug ?? String(row.item.id) } }">
            {{ row.item.title }}
          </router-link>
        </template>
        <template #cell(stock)="row">
          <span v-if="getStockSummary(row.item).total === null" class="text-muted">—</span>
          <template v-else>
            <span :class="getStockSummary(row.item).low ? 'text-warning fw-semibold' : ''">{{ getStockSummary(row.item).text }}</span>
          </template>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
      <p v-if="items.length" class="text-muted small mt-2">Showing {{ displayItems.length }} product(s)</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { catalogAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const LOW_THRESHOLD = 5

interface Sku {
  id?: number
  sku_code?: string
  stock_quantity?: number
}
interface ProductRow {
  id?: number
  title?: string
  slug?: string
  skus?: Sku[]
  seller?: string
}

const items = ref<ProductRow[]>([])
const loading = ref(false)
const error = ref('')
const search = ref('')
const lowStockOnly = ref(false)
let debounce: ReturnType<typeof setTimeout> | null = null

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Product' },
  { key: 'stock', label: 'Stock' },
  { key: 'seller', label: 'Seller' },
]

function getStockSummary(item: ProductRow): { total: number | null; text: string; low: boolean } {
  const skus = item.skus
  if (!Array.isArray(skus) || skus.length === 0) return { total: null, text: '—', low: false }
  const total = skus.reduce((sum, s) => sum + (Number(s.stock_quantity) || 0), 0)
  const low = total <= LOW_THRESHOLD
  return { total, text: `${total} total (${skus.length} SKU(s))`, low }
}

const displayItems = computed(() => {
  let list = items.value
  if (lowStockOnly.value) {
    list = list.filter((p) => {
      const s = getStockSummary(p)
      return s.total !== null && s.low
    })
  }
  const q = search.value.trim().toLowerCase()
  if (!q) return list
  return list.filter((p) => (p.title ?? '').toLowerCase().includes(q) || (p.slug ?? '').toLowerCase().includes(q))
})

function debouncedLoad() {
  if (debounce) clearTimeout(debounce)
  debounce = setTimeout(load, 350)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await catalogAdminApi.listProducts({
      search: search.value.trim() || undefined,
      page_size: 200,
    })
    const raw = Array.isArray(data) ? data : (data as { results?: ProductRow[] })?.results ?? []
    items.value = raw as ProductRow[]
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load products')
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
