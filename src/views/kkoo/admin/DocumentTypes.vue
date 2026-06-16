<template>
  <VerticalLayout>
    <b-card title="Document Types">
      <p class="text-muted">Global document type catalog (currency-style). Country rules reference these codes.</p>

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="roleFilter" :options="roleOptions" class="w-auto" @change="load" />
        <b-form-checkbox v-model="activeOnly" switch @change="load">Active only</b-form-checkbox>
        <b-button size="sm" variant="outline-primary" @click="load">Refresh</b-button>
        <b-button size="sm" variant="primary" class="ms-auto" @click="showCreate = true">Create</b-button>
      </div>

      <p v-if="error" class="text-danger">{{ error }}</p>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(is_active)="row">
          <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">{{ row.item.is_active ? 'active' : 'inactive' }}</b-badge>
        </template>
        <template #cell(requires_expiry)="row">
          <span>{{ row.item.requires_expiry ? 'yes' : 'no' }}</span>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-secondary" @click="openEdit(row.item)">Edit</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else title="No document types" message="Create document types to configure requirements per country." />
    </b-card>

    <b-modal v-model="showCreate" title="Create Document Type" hide-footer>
      <b-form @submit.prevent="create">
        <b-form-group label="Code">
          <b-form-input v-model="form.code" placeholder="e.g. driver_license_front" required />
        </b-form-group>
        <b-form-group label="Label">
          <b-form-input v-model="form.label" placeholder="e.g. Driving license (front)" required />
        </b-form-group>
        <b-form-group label="Role">
          <b-form-select v-model="form.role" :options="roleOptionsCreate" />
        </b-form-group>
        <b-form-group label="Category">
          <b-form-input v-model="form.category" placeholder="identity | license | vehicle | tax | business_license" />
        </b-form-group>
        <b-form-checkbox v-model="form.requires_expiry" class="mb-3">Requires expiry date</b-form-checkbox>
        <b-form-checkbox v-model="form.is_active" class="mb-3">Active</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showCreate = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Create</b-button>
        </div>
      </b-form>
    </b-modal>

    <b-modal v-model="showEdit" title="Edit Document Type" hide-footer>
      <b-form @submit.prevent="saveEdit">
        <b-form-group label="Label">
          <b-form-input v-model="editForm.label" required />
        </b-form-group>
        <b-form-group label="Role">
          <b-form-select v-model="editForm.role" :options="roleOptionsCreate" />
        </b-form-group>
        <b-form-group label="Category">
          <b-form-input v-model="editForm.category" />
        </b-form-group>
        <b-form-checkbox v-model="editForm.requires_expiry" class="mb-3">Requires expiry date</b-form-checkbox>
        <b-form-checkbox v-model="editForm.is_active" class="mb-3">Active</b-form-checkbox>
        <div class="d-flex justify-content-end gap-2">
          <b-button variant="outline-secondary" @click="showEdit = false">Cancel</b-button>
          <b-button type="submit" variant="primary" :disabled="saving">Save</b-button>
        </div>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { documentTypesAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const items = ref<Record<string, any>[]>([])

const roleFilter = ref('')
const activeOnly = ref(true)
const roleOptions = [
  { value: '', text: 'All roles' },
  { value: 'user', text: 'User' },
  { value: 'seller', text: 'Seller' },
  { value: 'rider', text: 'Rider' },
]
const roleOptionsCreate = [
  { value: '', text: 'Any (blank)' },
  { value: 'user', text: 'User' },
  { value: 'seller', text: 'Seller' },
  { value: 'rider', text: 'Rider' },
]

const fields = [
  { key: 'code', label: 'Code' },
  { key: 'label', label: 'Label' },
  { key: 'role', label: 'Role' },
  { key: 'category', label: 'Category' },
  { key: 'requires_expiry', label: 'Expiry?' },
  { key: 'is_active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

const showCreate = ref(false)
const showEdit = ref(false)
const form = ref({ code: '', label: '', role: '', category: '', requires_expiry: false, is_active: true })
const editId = ref<number | null>(null)
const editForm = ref({ label: '', role: '', category: '', requires_expiry: false, is_active: true })

function normalizeList(data: any): Record<string, any>[] {
  if (Array.isArray(data)) return data
  return (data?.results ?? []) as Record<string, any>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await documentTypesAdminApi.list({
      role: roleFilter.value || undefined,
      active: activeOnly.value ? true : undefined,
    })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load document types')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  error.value = ''
  try {
    await documentTypesAdminApi.create(form.value)
    showCreate.value = false
    form.value = { code: '', label: '', role: '', category: '', requires_expiry: false, is_active: true }
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Create failed')
  } finally {
    saving.value = false
  }
}

function openEdit(item: Record<string, any>) {
  editId.value = Number(item.id)
  editForm.value = {
    label: String(item.label ?? ''),
    role: String(item.role ?? ''),
    category: String(item.category ?? ''),
    requires_expiry: Boolean(item.requires_expiry),
    is_active: Boolean(item.is_active),
  }
  showEdit.value = true
}

async function saveEdit() {
  if (!editId.value) return
  saving.value = true
  error.value = ''
  try {
    await documentTypesAdminApi.patch(editId.value, editForm.value)
    showEdit.value = false
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

