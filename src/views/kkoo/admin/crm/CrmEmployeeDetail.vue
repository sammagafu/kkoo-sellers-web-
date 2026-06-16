<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.employees' }">← Back to Employees</b-button>
    <b-card v-if="employee" :title="editing ? 'Edit employee' : 'Employee detail'">
      <template v-if="!editing">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span />
          <b-button variant="outline-primary" size="sm" @click="startEdit">Edit</b-button>
        </div>
        <b-row>
          <b-col md="6">
            <p class="mb-1"><strong>Name</strong> {{ employee.name || '—' }}</p>
            <p class="mb-1"><strong>Phone</strong> {{ employee.phone || '—' }}</p>
            <p class="mb-1"><strong>Role</strong> {{ employee.role || '—' }}</p>
          </b-col>
          <b-col md="6">
            <p class="mb-1"><strong>Salary</strong> {{ formatCurrency(employee.salary) }}</p>
            <p class="mb-1"><strong>Status</strong> {{ employee.is_active ? 'Active' : 'Inactive' }}</p>
            <p class="mb-1"><strong>User ID</strong> {{ employee.user_id ?? '—' }}</p>
          </b-col>
        </b-row>
      </template>
      <template v-else>
        <b-alert v-if="editErrors._form" variant="danger" show>{{ editErrors._form }}</b-alert>
        <b-form>
          <b-form-group label="Name" :invalid-feedback="editErrors.name">
            <b-form-input v-model="editForm.name" />
          </b-form-group>
          <b-form-group label="Phone" :invalid-feedback="editErrors.phone">
            <b-form-input v-model="editForm.phone" />
          </b-form-group>
          <b-form-group label="Role" :invalid-feedback="editErrors.role">
            <b-form-input v-model="editForm.role" />
          </b-form-group>
          <b-form-group label="Salary" :invalid-feedback="editErrors.salary">
            <b-form-input v-model.number="editForm.salary" type="number" step="0.01" />
          </b-form-group>
          <b-form-group label="Active">
            <b-form-checkbox v-model="editForm.is_active" />
          </b-form-group>
          <div class="d-flex gap-2">
            <b-button variant="primary" size="sm" :disabled="editSaving" @click="saveEdit">Save</b-button>
            <b-button variant="outline-secondary" size="sm" :disabled="editSaving" @click="cancelEdit">Cancel</b-button>
          </div>
        </b-form>
      </template>
    </b-card>
    <b-card v-else-if="loading" title="Employee detail"><p class="text-muted">Loading…</p></b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Employee not found" />
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { crmApi } from '@/api'
import { getApiFieldErrors } from '@/types/crm'

const route = useRoute()
const employee = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const editForm = ref({ name: '', phone: '', role: '', salary: 0, is_active: true })
const editErrors = ref<Record<string, string>>({})
const editSaving = ref(false)

const id = computed<string | undefined>(() => { const p = route.params.id; return Array.isArray(p) ? p[0] : (p ?? undefined) })

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function startEdit() {
  if (!employee.value) return
  editForm.value = {
    name: String(employee.value.name ?? ''),
    phone: String(employee.value.phone ?? ''),
    role: String(employee.value.role ?? ''),
    salary: Number(employee.value.salary) || 0,
    is_active: Boolean(employee.value.is_active),
  }
  editErrors.value = {}
  editing.value = true
}

function cancelEdit() {
  editing.value = false
  editErrors.value = {}
}

async function saveEdit() {
  if (!id.value) return
  editErrors.value = {}
  const payload = {
    name: editForm.value.name?.trim() || '',
    phone: editForm.value.phone?.trim() || undefined,
    role: editForm.value.role?.trim() || undefined,
    salary: editForm.value.salary != null ? Number(editForm.value.salary) : undefined,
    is_active: editForm.value.is_active,
  }
  try {
    editSaving.value = true
    await crmApi.updateEmployee(id.value, payload)
    employee.value = { ...employee.value!, ...payload }
    editing.value = false
  } catch (e: unknown) {
    editErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(editErrors.value).length === 0 && msg) editErrors.value = { _form: msg }
  } finally {
    editSaving.value = false
  }
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  employee.value = null
  try {
    const { data } = await crmApi.getEmployee(id.value)
    employee.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load employee'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
