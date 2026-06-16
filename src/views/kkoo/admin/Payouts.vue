<template>
  <VerticalLayout>
    <b-card title="Payouts">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <p class="text-muted mb-0 me-auto">List, create and update payouts.</p>
        <b-form-input v-model="filterSellerId" placeholder="Seller ID" type="number" class="w-auto" style="max-width: 120px;" @input="debouncedLoad" />
        <b-form-input v-model="search" placeholder="Search..." class="w-auto" style="max-width: 160px;" />
        <b-button variant="outline-secondary" size="sm" @click="exportCsv">Export CSV</b-button>
        <b-button variant="outline-secondary" size="sm" @click="downloadTemplate">CSV template</b-button>
        <b-button variant="outline-primary" size="sm" @click="triggerImportInput">Import CSV</b-button>
        <input ref="importInputRef" type="file" accept=".csv" class="d-none" @change="onImportFile" />
        <b-button variant="primary" @click="openCreate">Create payout</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-if="importResult" class="text-info small">{{ importResult }}</p>
      <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.payouts.detail', params: { id: String(data.item.id) } }">View</b-button>
          <b-button size="sm" variant="outline-secondary" @click="openEdit(data.item)">Edit</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else />
      <p v-if="displayItems.length" class="text-muted small mt-2">Showing {{ displayItems.length }} payout(s)</p>
    </b-card>

    <b-modal v-model="showModal" :title="editId ? 'Edit payout' : 'Create payout'" @hidden="resetForm" @ok="savePayout">
      <b-form>
        <b-form-group label="Seller ID" label-for="payout-seller">
          <b-form-input id="payout-seller" v-model.number="form.seller_id" type="number" min="1" :disabled="!!editId" />
        </b-form-group>
        <b-form-group label="Amount" label-for="payout-amount">
          <b-form-input id="payout-amount" v-model="form.amount" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Method" label-for="payout-method">
          <b-form-input id="payout-method" v-model="form.method" placeholder="e.g. bank_transfer, mpesa" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { payoutsAdminApi } from '@/api'
import { exportToCsv, downloadCsvTemplate, parseCsvFile } from '@/composables/useCsv'

interface PayoutRow {
  id: number
  seller_id?: number
  seller?: number
  amount?: number | string
  method?: string
  status?: string
  reference?: string
  created_at?: string
  processed_at?: string
}

const items = ref<PayoutRow[]>([])
const loading = ref(false)
const error = ref('')
const importResult = ref('')
const filterSellerId = ref('')
const search = ref('')
const showModal = ref(false)
const editId = ref<number | null>(null)
const form = ref({ seller_id: 0, amount: '0', method: '' })
const importInputRef = ref<HTMLInputElement | null>(null)
let loadDebounce: ReturnType<typeof setTimeout> | null = null

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'seller_id', label: 'Seller ID' },
  { key: 'seller', label: 'Seller' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
  { key: 'status', label: 'Status' },
  { key: 'reference', label: 'Reference' },
  { key: 'created_at', label: 'Created' },
  { key: 'actions', label: 'Actions' },
]

const csvColumns = [
  { key: 'seller_id', label: 'Seller ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'method', label: 'Method' },
]

const displayItems = computed(() => {
  let list = items.value
  const q = search.value.toLowerCase().trim()
  if (q) {
    list = list.filter(
      (p) =>
        String(p.amount ?? '').toLowerCase().includes(q) ||
        String(p.method ?? '').toLowerCase().includes(q) ||
        String(p.status ?? '').toLowerCase().includes(q)
    )
  }
  return list
})

function debouncedLoad() {
  if (loadDebounce) clearTimeout(loadDebounce)
  loadDebounce = setTimeout(load, 350)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const params: { seller_id?: number } = {}
    const sid = parseInt(String(filterSellerId.value), 10)
    if (!isNaN(sid) && sid > 0) params.seller_id = sid
    const { data } = await payoutsAdminApi.list(params)
    items.value = (Array.isArray(data) ? data : (data as { results?: PayoutRow[] })?.results ?? []) as PayoutRow[]
  } catch (e: unknown) {
    const err = e as { response?: { data?: { detail?: string } } }
    error.value = err.response?.data?.detail ?? 'Failed to load payouts'
  } finally {
    loading.value = false
  }
}

onMounted(load)

function exportCsv() {
  const rows = displayItems.value.map((p) => ({
    id: p.id,
    seller_id: p.seller_id ?? p.seller,
    amount: p.amount,
    method: p.method,
    status: p.status,
    reference: p.reference,
    created_at: p.created_at,
  }))
  exportToCsv(rows as unknown as Record<string, unknown>[], [...csvColumns, { key: 'status', label: 'Status' }, { key: 'reference', label: 'Reference' }, { key: 'created_at', label: 'Created' }], 'payouts-export.csv')
}

function downloadTemplate() {
  downloadCsvTemplate(csvColumns, 'payouts-import-template.csv', { seller_id: '1', amount: '100.00', method: 'bank_transfer' })
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
      const sellerId = parseInt(row['Seller ID'] ?? row['seller_id'] ?? '0', 10)
      if (!sellerId) continue
      try {
        await payoutsAdminApi.create({
          seller_id: sellerId,
          amount: parseFloat(row['Amount'] ?? row['amount'] ?? '0') || 0,
          method: (row['Method'] ?? row['method'] ?? '').trim() || undefined,
        })
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

function openCreate() {
  editId.value = null
  form.value = { seller_id: 0, amount: '0', method: '' }
  showModal.value = true
}

async function openEdit(item: PayoutRow) {
  editId.value = item.id
  try {
    const { data } = await payoutsAdminApi.get(item.id)
    const d = data as Record<string, unknown>
    form.value = {
      seller_id: Number(d.seller_id ?? d.seller ?? 0),
      amount: String(d.amount ?? '0'),
      method: String(d.method ?? ''),
    }
  } catch {
    form.value = {
      seller_id: item.seller_id ?? (item.seller as number) ?? 0,
      amount: String(item.amount ?? '0'),
      method: item.method ?? '',
    }
  }
  showModal.value = true
}

function resetForm() {
  editId.value = null
  form.value = { seller_id: 0, amount: '0', method: '' }
}

async function savePayout() {
  const amount = parseFloat(form.value.amount)
  if (editId.value) {
    try {
      await payoutsAdminApi.update(editId.value, { amount: isNaN(amount) ? 0 : amount, method: form.value.method || undefined })
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      error.value = err.response?.data?.detail ?? 'Update failed'
    }
  } else {
    if (!form.value.seller_id) return
    try {
      await payoutsAdminApi.create({
        seller_id: form.value.seller_id,
        amount: isNaN(amount) ? 0 : amount,
        method: form.value.method || undefined,
      })
      await load()
    } catch (e: unknown) {
      const err = e as { response?: { data?: { detail?: string } } }
      error.value = err.response?.data?.detail ?? 'Create failed'
    }
  }
}
</script>
