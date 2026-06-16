<template>
  <VerticalLayout>
    <b-card title="Employees">
      <p class="text-muted mb-3">Staff per business: name, phone, role, salary. Track sales by employee (created_by on invoice).</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-select v-model="activeFilter" :options="activeOptions" class="w-auto" @change="applyFilter" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add Employee</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(salary)="data">
          {{ formatCurrency(data.item.salary) }}
        </template>
        <template #cell(is_active)="data">
          <b-badge :variant="data.item.is_active ? 'success' : 'secondary'">{{ data.item.is_active ? 'Active' : 'Inactive' }}</b-badge>
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'admin.crm.employees.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No employees" message="Add employees when the CRM API is configured. CRM is configured by your platform administrator or in the backend." />
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

    <b-modal v-model="showAddModal" title="Add Employee" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Name" :invalid-feedback="addErrors.name">
          <b-form-input v-model="addForm.name" />
        </b-form-group>
        <b-form-group label="Phone" :invalid-feedback="addErrors.phone">
          <b-form-input v-model="addForm.phone" />
        </b-form-group>
        <b-form-group label="Role" :invalid-feedback="addErrors.role">
          <b-form-input v-model="addForm.role" placeholder="e.g. cashier, manager" />
        </b-form-group>
        <b-form-group label="Salary" :invalid-feedback="addErrors.salary">
          <b-form-input v-model.number="addForm.salary" type="number" step="0.01" placeholder="0" />
        </b-form-group>
        <b-form-group label="Active">
          <b-form-checkbox v-model="addForm.is_active" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { getApiFieldErrors } from '@/types/crm'

const activeFilter = ref<boolean | ''>('')
const showAddModal = ref(false)
const addForm = ref({ name: '', phone: '', role: '', salary: 0, is_active: true })
const addErrors = ref<Record<string, string>>({})

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
  (params) => {
    const p: Record<string, unknown> = { ...params }
    if (activeFilter.value !== '') p.is_active = activeFilter.value as boolean
    return crmApi.getEmployees(p as { page?: number; page_size?: number; is_active?: boolean })
  },
  {}
)

const activeOptions = [
  { value: '', text: 'All' },
  { value: true, text: 'Active only' },
  { value: false, text: 'Inactive only' },
]

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'is_active', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function applyFilter() {
  setPage(1)
}

function resetAddForm() {
  addForm.value = { name: '', phone: '', role: '', salary: 0, is_active: true }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const payload = {
    name: addForm.value.name?.trim() || '',
    phone: addForm.value.phone?.trim() || undefined,
    role: addForm.value.role?.trim() || undefined,
    salary: addForm.value.salary != null ? Number(addForm.value.salary) : undefined,
    is_active: addForm.value.is_active,
  }
  try {
    await crmApi.createEmployee(payload)
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  }
}

watch(activeFilter, () => setPage(1))

onMounted(load)
</script>
