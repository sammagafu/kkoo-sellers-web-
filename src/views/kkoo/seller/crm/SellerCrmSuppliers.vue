<template>
  <VerticalLayout>
    <b-card title="Suppliers">
      <div v-if="hasMultipleBusinesses" class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <span class="text-muted">Business:</span>
        <b-form-select v-model="selectedBusinessId" :options="businessOptions" value-field="id" text-field="name" size="sm" class="w-auto" style="max-width: 220px;" @change="load" />
      </div>
      <p class="text-muted mb-3">Supplier contacts: name, phone, email, address.</p>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" @click="load">Refresh</b-button>
        <b-button variant="primary" size="sm" @click="showAddModal = true">Add Supplier</b-button>
      </div>
      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(actions)="data">
          <b-button size="sm" variant="outline-primary" :to="{ name: 'seller.crm.suppliers.detail', params: { id: String(data.item.id) } }">View</b-button>
        </template>
      </b-table>
      <p v-else-if="loading">Loading…</p>
      <EmptyState v-else title="No suppliers" message="Add suppliers in CRM when the API is available. CRM is configured by your platform administrator. Contact support if you need access." />
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

    <b-modal v-model="showAddModal" title="Add Supplier" @hide="resetAddForm" @ok="onAddOk">
      <b-alert v-if="addErrors._form" variant="danger" show>{{ addErrors._form }}</b-alert>
      <b-form>
        <b-form-group label="Name" :invalid-feedback="addErrors.name">
          <b-form-input v-model="addForm.name" />
        </b-form-group>
        <b-form-group label="Phone" :invalid-feedback="addErrors.phone">
          <b-form-input v-model="addForm.phone" />
        </b-form-group>
        <b-form-group label="Email" :invalid-feedback="addErrors.email">
          <b-form-input v-model="addForm.email" type="email" />
        </b-form-group>
        <b-form-group label="Address">
          <b-form-input v-model="addForm.address" />
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
import { crmApi } from '@/api'
import { useCrmList } from '@/composables/useCrmList'
import { useCrmBusinessSwitcher } from '@/composables/useCrmBusinessSwitcher'
import { getApiFieldErrors } from '@/types/crm'

const switcher = useCrmBusinessSwitcher()
const { selectedBusinessId, hasMultipleBusinesses, loadBusinesses, businesses } = switcher
const businessOptions = computed(() => businesses.value.map((b) => ({ id: Number(b.id), name: (b.name as string) || `Business ${b.id}` })))

const showAddModal = ref(false)
const addForm = ref({ name: '', phone: '', email: '', address: '', notes: '' })
const addErrors = ref<Record<string, string>>({})

const { items, total, page, pageSize, loading, error, hasPagination, setPage, load } = useCrmList(
  (params) => crmApi.getSuppliers({ ...params, business_id: switcher.selectedBusinessId.value ?? undefined }),
  {}
)
const fields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Actions' },
]

function resetAddForm() {
  addForm.value = { name: '', phone: '', email: '', address: '', notes: '' }
  addErrors.value = {}
}

async function onAddOk(event: Event) {
  event.preventDefault()
  addErrors.value = {}
  const payload = {
    name: addForm.value.name?.trim() || '',
    phone: addForm.value.phone?.trim() || undefined,
    email: addForm.value.email?.trim() || undefined,
    address: addForm.value.address?.trim() || undefined,
    notes: addForm.value.notes?.trim() || undefined,
  }
  try {
    await crmApi.createSupplier(payload)
    showAddModal.value = false
    resetAddForm()
    load()
  } catch (e: unknown) {
    addErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(addErrors.value).length === 0 && msg) addErrors.value = { _form: msg }
  }
}

watch(() => switcher.selectedBusinessId.value, () => load())
onMounted(async () => {
  await loadBusinesses()
  load()
})
</script>
