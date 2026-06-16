<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.debts' }">← Back to Debts</b-button>
    <b-card v-if="debt" title="Debt detail">
      <template v-if="!editing">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span />
          <span class="d-flex gap-2">
            <b-button v-if="debt.status !== 'paid'" variant="outline-warning" size="sm" :disabled="reminderSending" @click="sendReminder">Send reminder</b-button>
            <b-button variant="outline-primary" size="sm" @click="startEdit">Edit</b-button>
          </span>
        </div>
        <b-row>
          <b-col md="6">
            <p class="mb-1"><strong>Customer ID</strong> {{ debt.customer_id ?? '—' }}</p>
            <p class="mb-1"><strong>Amount</strong> {{ formatCurrency(debt.amount) }}</p>
            <p class="mb-1"><strong>Due date</strong> {{ debt.due_date || '—' }}</p>
          </b-col>
          <b-col md="6">
            <p class="mb-1"><strong>Status</strong> <b-badge :variant="statusVariant(debt.status)">{{ debt.status || 'pending' }}</b-badge></p>
            <p class="mb-1"><strong>Invoice ID</strong> {{ debt.invoice_id ?? '—' }}</p>
            <p class="mb-1"><strong>Notes</strong> {{ debt.notes || '—' }}</p>
          </b-col>
        </b-row>
      </template>
      <template v-else>
        <b-alert v-if="editErrors._form" variant="danger" show>{{ editErrors._form }}</b-alert>
        <b-form>
          <b-form-group label="Amount" :invalid-feedback="editErrors.amount">
            <b-form-input v-model.number="editForm.amount" type="number" step="0.01" />
          </b-form-group>
          <b-form-group label="Due date" :invalid-feedback="editErrors.due_date">
            <b-form-input v-model="editForm.due_date" type="date" />
          </b-form-group>
          <b-form-group label="Notes">
            <b-form-textarea v-model="editForm.notes" rows="2" />
          </b-form-group>
          <div class="d-flex gap-2">
            <b-button variant="primary" size="sm" :disabled="editSaving" @click="saveEdit">Save</b-button>
            <b-button variant="outline-secondary" size="sm" @click="cancelEdit">Cancel</b-button>
          </div>
        </b-form>
      </template>

      <hr />
      <h6 class="mb-2">Record payment</h6>
      <b-alert v-if="paymentErrors._form" variant="danger" show>{{ paymentErrors._form }}</b-alert>
      <b-form class="row g-2 align-items-end">
        <b-col md="3">
          <b-form-group label="Amount" label-for="pay-amount">
            <b-form-input id="pay-amount" v-model.number="paymentAmount" type="number" min="0" step="0.01" placeholder="0" />
          </b-form-group>
        </b-col>
        <b-col md="4">
          <b-form-group label="Notes" label-for="pay-notes">
            <b-form-input id="pay-notes" v-model="paymentNotes" placeholder="Optional" />
          </b-form-group>
        </b-col>
        <b-col md="3">
          <b-button variant="primary" :disabled="paymentSaving" @click="recordPayment">Record payment</b-button>
        </b-col>
      </b-form>
      <b-alert v-if="reminderMessage" variant="info" show class="mt-3">{{ reminderMessage }}</b-alert>
    </b-card>
    <b-card v-else-if="loading" title="Debt detail"><p class="text-muted">Loading…</p></b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Debt not found" />
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
const debt = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const paymentAmount = ref<number>(0)
const paymentNotes = ref('')
const paymentErrors = ref<Record<string, string>>({})
const paymentSaving = ref(false)
const editing = ref(false)
const editForm = ref({ amount: 0, due_date: '', notes: '' })
const editErrors = ref<Record<string, string>>({})
const editSaving = ref(false)
const reminderSending = ref(false)
const reminderMessage = ref('')

const id = computed<string | undefined>(() => { const p = route.params.id; return Array.isArray(p) ? p[0] : (p ?? undefined) })

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function statusVariant(s: unknown): string {
  const status = String(s ?? '').toLowerCase()
  if (status === 'paid') return 'success'
  if (status === 'overdue') return 'danger'
  if (status === 'partial') return 'warning'
  return 'secondary'
}

function startEdit() {
  if (!debt.value) return
  editForm.value = {
    amount: Number(debt.value.amount ?? 0),
    due_date: String(debt.value.due_date ?? ''),
    notes: String(debt.value.notes ?? ''),
  }
  editErrors.value = {}
  editing.value = true
}

function cancelEdit() {
  editing.value = false
}

async function saveEdit() {
  if (!id.value) return
  editErrors.value = {}
  try {
    editSaving.value = true
    await crmApi.updateDebt(id.value, {
      amount: editForm.value.amount,
      due_date: editForm.value.due_date?.trim() || undefined,
      notes: editForm.value.notes?.trim() || undefined,
    })
    debt.value = { ...debt.value!, ...editForm.value }
    editing.value = false
  } catch (e: unknown) {
    editErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(editErrors.value).length === 0 && msg) editErrors.value = { _form: msg }
  } finally {
    editSaving.value = false
  }
}

async function sendReminder() {
  if (!id.value) return
  reminderSending.value = true
  reminderMessage.value = ''
  try {
    const { data } = await crmApi.sendDebtReminder(id.value)
    const res = (data ?? {}) as Record<string, unknown>
    const msg = res.suggested_message ?? res.message ?? 'Reminder sent. You can share with the customer.'
    reminderMessage.value = String(msg)
  } catch (e: unknown) {
    reminderMessage.value = (e as { message?: string }).message ?? 'Failed to send reminder'
  } finally {
    reminderSending.value = false
  }
}

async function recordPayment() {
  paymentErrors.value = {}
  const amount = Number(paymentAmount.value)
  if (!(amount > 0)) {
    paymentErrors.value = { _form: 'Enter a positive amount.' }
    return
  }
  if (!id.value) return
  try {
    paymentSaving.value = true
    await crmApi.recordPayment(id.value, { amount, notes: paymentNotes.value?.trim() || undefined })
    paymentAmount.value = 0
    paymentNotes.value = ''
    load()
  } catch (e: unknown) {
    paymentErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(paymentErrors.value).length === 0 && msg) paymentErrors.value = { _form: msg }
  } finally {
    paymentSaving.value = false
  }
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  debt.value = null
  try {
    const { data } = await crmApi.getDebt(id.value)
    debt.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load debt'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
