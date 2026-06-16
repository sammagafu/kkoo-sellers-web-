<template>
  <VerticalLayout>
    <b-card title="Document Requirements (per country)">
      <p class="text-muted">Enable and require document types per role and country.</p>

      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-form-select v-model="role" :options="roleOptions" class="w-auto" @change="load" />
        <b-form-input v-model="countryCode" class="w-auto" placeholder="Country code (e.g. TZ)" @keyup.enter="load" />
        <b-button size="sm" variant="outline-primary" @click="load">Refresh</b-button>
      </div>

      <p v-if="error" class="text-danger">{{ error }}</p>

      <b-card class="mb-3 bg-light">
        <h6 class="mb-2">Add requirement</h6>
        <div class="d-flex flex-wrap gap-2">
          <b-form-select v-model="newRow.document_type" :options="documentTypeOptions" class="w-auto" />
          <b-form-input v-model="newRow.label" placeholder="Label override (optional)" class="w-auto" />
          <b-form-checkbox v-model="newRow.is_required" switch>Required</b-form-checkbox>
          <b-form-checkbox v-model="newRow.is_active" switch>Active</b-form-checkbox>
          <b-form-input v-model.number="newRow.sort_order" type="number" placeholder="Sort" class="w-auto" />
          <b-button size="sm" variant="primary" :disabled="saving || !newRow.document_type" @click="create">Add</b-button>
        </div>
      </b-card>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(is_required)="row">
          <b-form-checkbox v-model="row.item.is_required" switch @change="patch(row.item)"> </b-form-checkbox>
        </template>
        <template #cell(is_active)="row">
          <b-form-checkbox v-model="row.item.is_active" switch @change="patch(row.item)"> </b-form-checkbox>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-danger" @click="remove(row.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { documentRequirementsAdminApi, documentTypesAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const role = ref('seller')
const countryCode = ref('TZ')
const roleOptions = [
  { value: 'seller', text: 'Seller' },
  { value: 'rider', text: 'Rider' },
  { value: 'user', text: 'User' },
]

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const items = ref<Record<string, any>[]>([])
const documentTypeOptions = ref<{ value: string; text: string }[]>([{ value: '', text: 'Select document type…' }])

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'document_type', label: 'Code' },
  { key: 'label', label: 'Label' },
  { key: 'sort_order', label: 'Sort' },
  { key: 'is_required', label: 'Required' },
  { key: 'is_active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

const newRow = ref({
  document_type: '',
  label: '',
  is_required: true,
  is_active: true,
  sort_order: 0,
})

function normalizeList(data: any): Record<string, any>[] {
  if (Array.isArray(data)) return data
  return (data?.results ?? []) as Record<string, any>[]
}

async function loadDocTypes() {
  const { data } = await documentTypesAdminApi.list({ role: role.value })
  const rows = normalizeList(data)
  documentTypeOptions.value = [{ value: '', text: 'Select document type…' }].concat(
    rows.map((r: any) => ({ value: String(r.code), text: `${r.code} — ${r.label}` })),
  )
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    await loadDocTypes()
    const { data } = await documentRequirementsAdminApi.list({ role: role.value, country_code: countryCode.value })
    items.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load requirements')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function create() {
  saving.value = true
  error.value = ''
  try {
    await documentRequirementsAdminApi.create({
      role: role.value,
      country_code: countryCode.value,
      document_type: newRow.value.document_type,
      label: newRow.value.label || newRow.value.document_type,
      is_required: newRow.value.is_required,
      is_active: newRow.value.is_active,
      sort_order: newRow.value.sort_order,
    })
    newRow.value = { document_type: '', label: '', is_required: true, is_active: true, sort_order: 0 }
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Create failed')
  } finally {
    saving.value = false
  }
}

async function patch(item: any) {
  if (!item?.id) return
  saving.value = true
  error.value = ''
  try {
    await documentRequirementsAdminApi.patch(Number(item.id), {
      label: String(item.label ?? ''),
      is_required: Boolean(item.is_required),
      is_active: Boolean(item.is_active),
      sort_order: Number(item.sort_order ?? 0),
    })
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Update failed')
    await load()
  } finally {
    saving.value = false
  }
}

async function remove(item: any) {
  if (!item?.id) return
  saving.value = true
  error.value = ''
  try {
    await documentRequirementsAdminApi.remove(Number(item.id))
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>

