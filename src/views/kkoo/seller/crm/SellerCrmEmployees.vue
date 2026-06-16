<template>
  <VerticalLayout>
    <b-card title="Employees">
      <div v-if="hasMultipleBusinesses" class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="text-muted">Business:</span>
        <b-form-select v-model="selectedBusinessId" :options="businessOptions" value-field="id" text-field="name" size="sm" class="w-auto" style="max-width: 220px;" @change="load" />
      </div>
      <p class="text-muted mb-3">Staff: name, phone, role, salary. Track sales by employee.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-select v-model="activeFilter" :options="activeOptions" class="w-auto" @change="applyFilter" />
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add Employee</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(salary)="data">{{ formatCurrency(data.item.salary) }}</template>
        <template #cell(is_active)="data">
          <b-badge :variant="data.item.is_active ? 'success' : 'secondary'">{{ data.item.is_active ? 'Active' : 'Inactive' }}</b-badge>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No employees" message="Add employees when the CRM API is configured. CRM is configured by your platform administrator. Contact support if you need access." />
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
          <b-form-input v-model.number="addForm.salary" type="number" step="0.01" />
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
import { ref, computed, onMounted, watch } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { useCrmBusinessSwitcher } from '@/composables/useCrmBusinessSwitcher'
import { getApiFieldErrors } from '@/types/crm'

const switcher = useCrmBusinessSwitcher()
const { selectedBusinessId, hasMultipleBusinesses, loadBusinesses, businesses } = switcher
const businessOptions = computed(() => businesses.value.map((b) => ({ id: Number(b.id), name: (b.name as string) || `Business ${b.id}` })))

const activeFilter = ref<boolean | ''>('')
const showAddModal = ref(false)
const addForm = ref({ name: '', phone: '', role: '', salary: 0, is_active: true })
const addErrors = ref<Record<string, string>>({})
const activeOptions = [{ value: '', text: 'All' }, { value: true, text: 'Active only' }, { value: false, text: 'Inactive only' }]
const { items, total, page, pageSize, loading, error, hasPagination, setPage, load } = useCrmList(
  (params) => {
    const p: Record<string, unknown> = { ...params, business_id: switcher.selectedBusinessId.value ?? undefined }
    if (activeFilter.value !== '') p.is_active = activeFilter.value as boolean
    return crmApi.getEmployees(p as { page?: number; page_size?: number; business_id?: number; is_active?: boolean })
  },
  {}
)
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'role', label: 'Role' },
  { key: 'salary', label: 'Salary' },
  { key: 'is_active', label: 'Status' },
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
watch(() => switcher.selectedBusinessId.value, () => load())
onMounted(async () => {
  await loadBusinesses()
  load()
})
</script>
