<template>
  <VerticalLayout>
    <b-card title="Customers">
      <p class="text-muted mb-3">CRM customers per business: name, phone, email, address, credit balance, notes.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-form-input v-model="search" placeholder="Search name, phone..." class="w-auto" style="max-width: 220px;" @keyup.enter="applySearch" />
        <b-button variant="outline-primary" size="sm" @click="applySearch">Search</b-button>
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add Customer</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="displayItems.length" :items="displayItems" :fields="fields" striped responsive>
        <template #cell(credit_balance)="data">
          {{ formatCurrency(data.item.credit_balance) }}
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'admin.crm.customers.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No customers" message="Add customers in CRM or ensure the API is configured. CRM is configured by your platform administrator or in the backend." />
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

    <b-modal v-model="showAddModal" title="Add Customer" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Name" label-for="add-name" :state="addErrors.name ? false : null" :invalid-feedback="addErrors.name">
          <b-form-input id="add-name" v-model="addForm.name" placeholder="Customer name" />
        </b-form-group>
        <b-form-group label="Phone" label-for="add-phone" :state="addErrors.phone ? false : null" :invalid-feedback="addErrors.phone">
          <b-form-input id="add-phone" v-model="addForm.phone" placeholder="Phone" />
        </b-form-group>
        <b-form-group label="Email" label-for="add-email" :state="addErrors.email ? false : null" :invalid-feedback="addErrors.email">
          <b-form-input id="add-email" v-model="addForm.email" type="email" placeholder="Email (optional)" />
        </b-form-group>
        <b-form-group label="Address" label-for="add-address">
          <b-form-input id="add-address" v-model="addForm.address" placeholder="Address (optional)" />
        </b-form-group>
        <b-form-group label="Notes" label-for="add-notes">
          <b-form-textarea id="add-notes" v-model="addForm.notes" placeholder="Notes (optional)" rows="2" />
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
const search = ref('')
const showAddModal = ref(false)
const addForm = ref({ name: '', phone: '', email: '', address: '', notes: '' })
const addErrors = ref<Record<string, string>>({})
const addSaving = ref(false)

const businessId = computed(() => (route.query.business_id ? Number(route.query.business_id) : undefined))

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
  (params) => crmApi.getCustomers({
    ...params,
    business_id: businessId.value,
    search: search.value?.trim() || undefined,
  }),
  {}
)

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'credit_balance', label: 'Credit balance' },
  { key: 'actions', label: 'Actions' },
]

const displayItems = computed(() => items.value)

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function applySearch() {
  setPage(1)
}

function resetAddForm() {
  addForm.value = { name: '', phone: '', email: '', address: '', notes: '' }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const payload = {
    name: addForm.value.name?.trim() || '',
    phone: addForm.value.phone?.trim() || '',
    email: addForm.value.email?.trim() || undefined,
    address: addForm.value.address?.trim() || undefined,
    notes: addForm.value.notes?.trim() || undefined,
    business_id: businessId.value,
  }
  try {
    addSaving.value = true
    await crmApi.createCustomer(payload)
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  } finally {
    addSaving.value = false
  }
}

watch(search, () => { setPage(1) })

onMounted(load)
</script>
