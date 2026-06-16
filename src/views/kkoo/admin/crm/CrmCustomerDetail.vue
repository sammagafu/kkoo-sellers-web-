<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.customers' }">← Back to Customers</b-button>
    <b-card v-if="customer" :title="editing ? 'Edit customer' : 'Customer detail'">
      <template v-if="!editing">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span />
          <b-button variant="outline-primary" size="sm" @click="startEdit">Edit</b-button>
        </div>
        <b-row>
          <b-col md="6">
            <p class="mb-1"><strong>Name</strong> {{ customer.name || '—' }}</p>
            <p class="mb-1"><strong>Phone</strong> {{ customer.phone || '—' }}</p>
            <p class="mb-1"><strong>Email</strong> {{ customer.email || '—' }}</p>
            <p class="mb-1"><strong>Address</strong> {{ customer.address || '—' }}</p>
          </b-col>
          <b-col md="6">
            <p class="mb-1"><strong>Credit balance</strong> {{ formatCurrency(customer.credit_balance) }}</p>
            <p class="mb-1"><strong>Notes</strong> {{ customer.notes || '—' }}</p>
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
          <b-form-group label="Email" :invalid-feedback="editErrors.email">
            <b-form-input v-model="editForm.email" type="email" />
          </b-form-group>
          <b-form-group label="Address">
            <b-form-input v-model="editForm.address" />
          </b-form-group>
          <b-form-group label="Notes">
            <b-form-textarea v-model="editForm.notes" rows="2" />
          </b-form-group>
          <div class="d-flex gap-2">
            <b-button variant="primary" size="sm" :disabled="editSaving" @click="saveEdit">Save</b-button>
            <b-button variant="outline-secondary" size="sm" :disabled="editSaving" @click="cancelEdit">Cancel</b-button>
          </div>
        </b-form>
      </template>
    </b-card>
    <b-card v-else-if="loading" title="Customer detail"><p class="text-muted">Loading…</p></b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Customer not found" />
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
const customer = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const editForm = ref({ name: '', phone: '', email: '', address: '', notes: '' })
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
  if (!customer.value) return
  editForm.value = {
    name: String(customer.value.name ?? ''),
    phone: String(customer.value.phone ?? ''),
    email: String(customer.value.email ?? ''),
    address: String(customer.value.address ?? ''),
    notes: String(customer.value.notes ?? ''),
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
    phone: editForm.value.phone?.trim() || '',
    email: editForm.value.email?.trim() || undefined,
    address: editForm.value.address?.trim() || undefined,
    notes: editForm.value.notes?.trim() || undefined,
  }
  try {
    editSaving.value = true
    await crmApi.updateCustomer(id.value, payload)
    customer.value = { ...customer.value!, ...payload }
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
  customer.value = null
  try {
    const { data } = await crmApi.getCustomer(id.value)
    customer.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load customer'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
