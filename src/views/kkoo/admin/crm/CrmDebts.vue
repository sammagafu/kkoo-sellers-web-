<template>
  <VerticalLayout>
    <b-card title="Debts (Deni)">
      <p class="text-muted mb-3">Outstanding customer credit (deni). Create standalone debt or from invoice. Record payments to reduce debt.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-select v-model="statusFilter" :options="statusOptions" class="w-auto" @change="applyFilter" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Create debt</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(amount)="data">
          {{ formatCurrency(data.item.amount) }}
        </template>
        <template #cell(status)="data">
          <b-badge :variant="debtStatusVariant(data.item.status)">{{ data.item.status || 'pending' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'admin.crm.debts.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No debts" message="Debts appear when customers buy on credit (CRM API). CRM is configured by your platform administrator or in the backend." />
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

    <b-modal v-model="showAddModal" title="Create debt" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Customer ID" :invalid-feedback="addErrors.customer_id">
          <b-form-input v-model.number="addForm.customer_id" type="number" placeholder="Required" />
        </b-form-group>
        <b-form-group label="Amount" :invalid-feedback="addErrors.amount">
          <b-form-input v-model.number="addForm.amount" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Due date">
          <b-form-input v-model="addForm.due_date" type="date" />
        </b-form-group>
        <b-form-group label="Notes">
          <b-form-textarea v-model="addForm.notes" rows="2" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { getApiFieldErrors } from '@/types/crm'

const route = useRoute()
const businessId = computed(() => (route.query.business_id ? Number(route.query.business_id) : undefined))
const statusFilter = ref('')
const showAddModal = ref(false)
const addForm = ref({ customer_id: null as number | null, amount: null as number | null, due_date: '', notes: '' })
const addErrors = ref<Record<string, string>>({})

function resetAddForm() {
  addForm.value = { customer_id: null, amount: null, due_date: '', notes: '' }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const customerId = addForm.value.customer_id
  const amount = addForm.value.amount != null ? Number(addForm.value.amount) : 0
  if (!customerId || !(amount > 0)) {
    addErrors.value = { _form: 'Customer ID and a positive amount are required.' }
    return
  }
  const payload: Record<string, unknown> = {
    customer_id: customerId,
    amount,
    due_date: addForm.value.due_date?.trim() || undefined,
    notes: addForm.value.notes?.trim() || undefined,
  }
  if (businessId.value != null) payload.business_id = businessId.value
  try {
    await crmApi.createDebt(payload as { customer_id: number; amount: number; due_date?: string; notes?: string })
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  }
}

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
  (params) => crmApi.getDebts({
    ...params,
    business_id: businessId.value,
    status: statusFilter.value || undefined,
  }),
  {}
)

const statusOptions = [
  { value: '', text: 'All statuses' },
  { value: 'pending', text: 'Pending' },
  { value: 'partial', text: 'Partial' },
  { value: 'paid', text: 'Paid' },
  { value: 'overdue', text: 'Overdue' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'customer_id', label: 'Customer ID' },
  { key: 'amount', label: 'Amount' },
  { key: 'due_date', label: 'Due date' },
  { key: 'status', label: 'Status' },
  { key: 'invoice_id', label: 'Invoice ID' },
  { key: 'notes', label: 'Notes' },
  { key: 'actions', label: 'Actions' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function debtStatusVariant(s: unknown): string {
  const status = String(s ?? '').toLowerCase()
  if (status === 'paid') return 'success'
  if (status === 'overdue') return 'danger'
  if (status === 'partial') return 'warning'
  return 'secondary'
}

function applyFilter() {
  setPage(1)
}

watch(statusFilter, () => setPage(1))

onMounted(load)
</script>
