<template>
  <VerticalLayout>
    <b-card title="Expenses">      <p class="text-muted mb-3">Record expenses by category (rent, utilities, transport, supplies).</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-input v-model="categoryFilter" placeholder="Category" class="w-auto" style="max-width: 180px;" @keyup.enter="applyFilter" />
        <b-button variant="outline-primary" size="sm" @click="applyFilter">Filter</b-button>
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add Expense</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(amount)="data">{{ formatCurrency(data.item.amount) }}</template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No expenses" message="Expenses will appear when the CRM API is configured. CRM is configured by your platform administrator. Contact support if you need access." />
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

    <b-modal v-model="showAddModal" title="Add Expense" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Category" :invalid-feedback="addErrors.category">
          <b-form-input v-model="addForm.category" placeholder="e.g. rent, utilities" />
        </b-form-group>
        <b-form-group label="Amount" :invalid-feedback="addErrors.amount">
          <b-form-input v-model.number="addForm.amount" type="number" step="0.01" />
        </b-form-group>
        <b-form-group label="Description">
          <b-form-input v-model="addForm.description" />
        </b-form-group>
        <b-form-group label="Date" :invalid-feedback="addErrors.date">
          <b-form-input v-model="addForm.date" type="date" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'
import { getApiFieldErrors } from '@/types/crm'

const { activeBusinessId } = useCrmWorkspace()
const categoryFilter = ref('')
const showAddModal = ref(false)
const addForm = ref({ category: '', amount: 0, description: '', date: new Date().toISOString().slice(0, 10) })
const addErrors = ref<Record<string, string>>({})

const { items, total, page, pageSize, loading, error, hasPagination, setPage, load } = useCrmList(
  (params) => crmApi.getExpenses({ ...params, business_id: activeBusinessId.value ?? undefined, category: categoryFilter.value?.trim() || undefined }),
  {}
)

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'category', label: 'Category' },
  { key: 'amount', label: 'Amount' },
  { key: 'description', label: 'Description' },
  { key: 'date', label: 'Date' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n) ? '—' : new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function applyFilter() {
  setPage(1)
}

function resetAddForm() {
  addForm.value = { category: '', amount: 0, description: '', date: new Date().toISOString().slice(0, 10) }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const payload = {
    category: addForm.value.category?.trim() || '',
    amount: Number(addForm.value.amount) || 0,
    description: addForm.value.description?.trim() || undefined,
    date: addForm.value.date || new Date().toISOString().slice(0, 10),
  }
  try {
    await crmApi.createExpense(payload)
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  }
}

watch(categoryFilter, () => setPage(1))
onMounted(() => load())
</script>
