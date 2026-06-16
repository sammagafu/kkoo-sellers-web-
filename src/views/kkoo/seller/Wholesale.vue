<template>
  <VerticalLayout>
    <b-card title="Wholesale Tiers">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">Create, edit and delete wholesale tiers (product, min quantity, unit price).</p>
        <b-form-input v-model="search" placeholder="Search product/price..." class="w-auto" style="max-width: 180px;" />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
        <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">CSV template</b-button>
        <b-button variant="outline-primary" size="sm" @click="triggerImportInput">Import CSV</b-button>
        <input ref="importInputRef" type="file" accept=".csv" class="d-none" @change="onImportFile" />
        <b-button variant="primary" @click="openCreate">Add tier</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-if="importResult" class="text-info small">{{ importResult }}</p>
      <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(data.item)">Edit</b-button>
          <b-button size="sm" variant="outline-danger" @click="confirmDelete(data.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} tier(s)</p>
    </b-card>

    <b-modal v-model="showModal" :title="editId ? 'Edit tier' : 'Add tier'" @hidden="resetForm" @ok="saveTier">
      <b-form>
        <b-form-group label="Product ID" label-for="tier-product">
          <b-form-input id="tier-product" v-model.number="form.product" type="number" min="1" required :disabled="!!editId" />
        </b-form-group>
        <b-form-group label="Min quantity" label-for="tier-min">
          <b-form-input id="tier-min" v-model.number="form.min_quantity" type="number" min="1" required />
        </b-form-group>
        <b-form-group label="Unit price" label-for="tier-price">
          <b-form-input id="tier-price" v-model="form.unit_price" type="number" step="0.01" min="0" required />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { wholesaleSellerApi } from '@/api'
import { exportToCsv, downloadCsvTemplate, parseCsvFile } from '@/composables/useCsv'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'

interface Tier {
  id: number
  product: number
  min_quantity: number
  unit_price: string | number
}

const items = ref<Tier[]>([])
const loading = ref(false)
const error = ref('')
const importResult = ref('')
const search = ref('')
const showModal = ref(false)
const editId = ref<number | null>(null)
const form = ref({ product: 0, min_quantity: 1, unit_price: '0' })
const importInputRef = ref<HTMLInputElement | null>(null)
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'product', label: 'Product ID' },
  { key: 'min_quantity', label: 'Min quantity' },
  { key: 'unit_price', label: 'Unit price' },
  { key: 'actions', label: 'Actions' },
]

const csvColumns = [
  { key: 'product', label: 'Product ID' },
  { key: 'min_quantity', label: 'Min quantity' },
  { key: 'unit_price', label: 'Unit price' },
]

const displayItems = computed(() => {
  const q = search.value.toLowerCase().trim()
  if (!q) return items.value
  return items.value.filter(
    (t) =>
      String(t.product).includes(q) ||
      String(t.min_quantity).includes(q) ||
      String(t.unit_price).toLowerCase().includes(q)
  )
})

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await wholesaleSellerApi.listTiers()
    items.value = (Array.isArray(data) ? data : (data as { results?: Tier[] })?.results ?? []) as Tier[]
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load tiers'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function openCreate() {
  editId.value = null
  form.value = { product: 0, min_quantity: 1, unit_price: '0' }
  showModal.value = true
}

async function openEdit(item: Tier) {
  editId.value = item.id
  try {
    const { data } = await wholesaleSellerApi.getTier(item.id)
    const d = data as Tier
    form.value = { product: d.product, min_quantity: d.min_quantity, unit_price: String(d.unit_price ?? '0') }
  } catch {
    form.value = { product: item.product, min_quantity: item.min_quantity, unit_price: String(item.unit_price) }
  }
  showModal.value = true
}

function resetForm() {
  editId.value = null
  form.value = { product: 0, min_quantity: 1, unit_price: '0' }
}

async function saveTier() {
  if (!form.value.product || form.value.min_quantity < 1) return
  const unitPrice = Number(form.value.unit_price)
  if (isNaN(unitPrice) || unitPrice < 0) return
  try {
    if (editId.value) {
      await wholesaleSellerApi.updateTier(editId.value, {
        min_quantity: form.value.min_quantity,
        unit_price: unitPrice,
      })
    } else {
      await wholesaleSellerApi.createTier({
        product: form.value.product,
        min_quantity: form.value.min_quantity,
        unit_price: unitPrice,
      })
    }
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Save failed'
  }
}

async function confirmDelete(item: Tier) {
  const ok = await confirmDestructiveAction({
    title: 'Delete tier?',
    text: `Delete wholesale tier for product ${item.product}, min qty ${item.min_quantity}?`,
  })
  if (!ok) return
  try {
    await wholesaleSellerApi.deleteTier(item.id)
    await load()
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Delete failed'
  }
}

function exportCsv() {
  const exportCols = [
    { key: 'id', label: 'ID' },
    { key: 'product', label: 'Product ID' },
    { key: 'min_quantity', label: 'Min quantity' },
    { key: 'unit_price', label: 'Unit price' },
  ]
  exportToCsv(items.value as unknown as Record<string, unknown>[], exportCols, 'wholesale-tiers-export.csv')
}

function downloadTemplate() {
  downloadCsvTemplate(csvColumns, 'wholesale-tiers-import-template.csv', { product: '1', min_quantity: '10', unit_price: '8.50' })
}

function triggerImportInput() {
  importInputRef.value?.click()
}

async function onImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  importResult.value = ''
  try {
    const rows = await parseCsvFile(file)
    let created = 0
    let failed = 0
    for (const row of rows) {
      const product = parseInt(row['Product ID'] ?? row['product'] ?? '0', 10)
      const minQty = parseInt(row['Min quantity'] ?? row['min_quantity'] ?? '1', 10)
      const unitPrice = parseFloat(row['Unit price'] ?? row['unit_price'] ?? '0')
      if (!product || minQty < 1) continue
      try {
        await wholesaleSellerApi.createTier({ product, min_quantity: minQty, unit_price: unitPrice })
        created++
      } catch {
        failed++
      }
    }
    importResult.value = `Import done: ${created} created, ${failed} failed.`
    await load()
  } catch (e) {
    importResult.value = 'Import failed: ' + (e instanceof Error ? e.message : 'Invalid CSV')
  }
}
</script>
