<template>
  <VerticalLayout>
    <b-card title="Businesses">
      <p class="text-muted mb-3">SME businesses (multi-tenant). Each business has its own customers, products, invoices, and debts.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add business</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(name)="data">
          <router-link :to="{ name: 'admin.crm.businesses.detail', params: { id: String(data.item.id) } }" class="text-primary text-decoration-none">{{ data.item.name || '—' }}</router-link>
        </template>
        <template #cell(owner_id)="data">
          {{ data.item.owner_id ?? '—' }}
        </template>
        <template #cell(plan)="data">
          <b-badge variant="secondary">{{ data.item.plan ?? '—' }}</b-badge>
        </template>
        <template #cell(member_count)="data">
          {{ data.item.member_count ?? 0 }} / {{ data.item.max_users ?? '—' }}
        </template>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.crm.businesses.detail', params: { id: String(data.item.id) } }">View</b-button>
          <b-button size="sm" variant="outline-secondary" :to="{ name: 'admin.crm.customers', query: { business_id: data.item.id } }">Customers</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No businesses" message="CRM API may not be configured or no businesses exist yet. CRM is configured by your platform administrator or in the backend." />
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

    <b-modal v-model="showAddModal" title="Add business" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Name" :invalid-feedback="addErrors.name">
          <b-form-input v-model="addForm.name" />
        </b-form-group>
        <b-form-group label="Owner ID (user id)" :invalid-feedback="addErrors.owner_id">
          <b-form-input v-model.number="addForm.owner_id" type="number" placeholder="User ID" />
        </b-form-group>
        <b-form-group label="Location">
          <b-form-input v-model="addForm.location" />
        </b-form-group>
        <b-form-group label="Phone">
          <b-form-input v-model="addForm.phone" />
        </b-form-group>
        <b-form-group label="Currency">
          <b-form-input v-model="addForm.currency" placeholder="e.g. TZS" />
        </b-form-group>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { getApiFieldErrors } from '@/types/crm'

const showAddModal = ref(false)
const addForm = ref({ name: '', owner_id: null as number | null, location: '', phone: '', currency: 'TZS' })
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
} = useCrmList((params) => crmApi.getBusinesses(params), {})

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'plan', label: 'Plan' },
  { key: 'member_count', label: 'Members' },
  { key: 'location', label: 'Location' },
  { key: 'currency', label: 'Currency' },
  { key: 'actions', label: 'Actions' },
]

function resetAddForm() {
  addForm.value = { name: '', owner_id: null, location: '', phone: '', currency: 'TZS' }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const payload = {
    name: addForm.value.name?.trim() || '',
    owner_id: addForm.value.owner_id ?? undefined,
    location: addForm.value.location?.trim() || undefined,
    phone: addForm.value.phone?.trim() || undefined,
    currency: addForm.value.currency?.trim() || 'TZS',
  }
  try {
    await crmApi.createBusiness(payload)
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  }
}

onMounted(load)
</script>
