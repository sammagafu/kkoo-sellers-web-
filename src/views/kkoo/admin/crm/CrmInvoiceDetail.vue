<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3 invoice-no-print" :to="{ name: 'admin.crm.invoices' }">← Back to Invoices</b-button>
    <b-card v-if="invoice" :title="editing ? 'Edit invoice' : 'Invoice detail'" class="invoice-print-area">
      <template v-if="!editing">
        <div class="d-flex justify-content-between align-items-start mb-2 invoice-no-print">
          <span />
          <span class="d-flex flex-wrap gap-2">
            <b-button v-if="invoice.payment_status !== 'paid'" variant="success" size="sm" :disabled="markPaidSaving" @click="showMarkPaidModal = true">Mark as paid</b-button>
            <b-button variant="outline-warning" size="sm" :disabled="reminderSending" @click="sendReminder">Send reminder</b-button>
            <b-button variant="outline-secondary" size="sm" :disabled="pdfLoading" @click="downloadPdf">Download PDF</b-button>
            <b-button variant="outline-primary" size="sm" @click="startEdit">Edit</b-button>
            <b-button variant="outline-secondary" size="sm" @click="printInvoice">Print</b-button>
          </span>
        </div>
        <b-row>
          <b-col md="6">
            <p class="mb-1"><strong>Invoice #</strong> {{ invoice.invoice_number || '—' }}</p>
            <p class="mb-1"><strong>Customer ID</strong> {{ invoice.customer_id ?? '—' }}</p>
            <p class="mb-1"><strong>Total</strong> {{ formatCurrency(invoice.total_amount) }}</p>
            <p class="mb-1"><strong>Tax</strong> {{ formatCurrency(invoice.tax_amount) }}</p>
            <p class="mb-1"><strong>Discount</strong> {{ formatCurrency(invoice.discount_amount) }}</p>
          </b-col>
          <b-col md="6">
            <p class="mb-1"><strong>Payment status</strong> {{ invoice.payment_status || 'pending' }}</p>
            <p class="mb-1"><strong>Payment method</strong> {{ invoice.payment_method || '—' }}</p>
            <p class="mb-1"><strong>Due date</strong> {{ invoice.due_date || '—' }}</p>
            <p class="mb-1"><strong>Notes</strong> {{ invoice.notes || '—' }}</p>
          </b-col>
        </b-row>
        <template v-if="invoiceItems.length">
          <h6 class="mt-3">Items</h6>
          <b-table :items="invoiceItems" :fields="itemFields" striped responsive size="sm" />
        </template>
      </template>
      <template v-else>
        <b-alert v-if="editErrors._form" variant="danger" show>{{ editErrors._form }}</b-alert>
        <b-form>
          <b-row>
            <b-col md="6">
              <b-form-group label="Customer ID">
                <b-form-input v-model.number="editForm.customer_id" type="number" placeholder="Optional" />
              </b-form-group>
              <b-form-group label="Due date">
                <b-form-input v-model="editForm.due_date" type="date" />
              </b-form-group>
              <b-form-group label="Payment method">
                <b-form-input v-model="editForm.payment_method" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Notes">
                <b-form-textarea v-model="editForm.notes" rows="2" />
              </b-form-group>
            </b-col>
          </b-row>
          <div class="d-flex gap-2 mt-2">
            <b-button variant="primary" size="sm" :disabled="editSaving" @click="saveEdit">Save</b-button>
            <b-button variant="outline-secondary" size="sm" :disabled="editSaving" @click="cancelEdit">Cancel</b-button>
          </div>
        </b-form>
      </template>
      <b-alert v-if="reminderMessage" variant="info" show class="mt-3 invoice-no-print">{{ reminderMessage }}</b-alert>
    </b-card>
    <b-card v-else-if="loading" title="Invoice detail">
      <p class="text-muted">Loading…</p>
    </b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Invoice not found" />

    <b-modal v-model="showMarkPaidModal" title="Mark invoice as paid" @ok="onMarkPaidOk">
      <b-form>
        <b-form-group label="Payment method">
          <b-form-select v-model="markPaidMethod" :options="paymentMethodOptions" value-field="value" text-field="text" />
        </b-form-group>
      </b-form>
    </b-modal>
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
const invoice = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const editForm = ref({ customer_id: null as number | null, due_date: '', payment_method: '', notes: '' })
const editErrors = ref<Record<string, string>>({})
const editSaving = ref(false)
const showMarkPaidModal = ref(false)
const markPaidMethod = ref('cash')
const markPaidSaving = ref(false)
const reminderSending = ref(false)
const reminderMessage = ref('')
const pdfLoading = ref(false)
const paymentMethodOptions = [
  { value: 'cash', text: 'Cash' },
  { value: 'mpesa', text: 'M-Pesa' },
  { value: 'tigopesa', text: 'Tigo Pesa' },
  { value: 'airtel', text: 'Airtel Money' },
  { value: 'bank', text: 'Bank' },
  { value: 'credit', text: 'Credit' },
]

const id = computed<string | undefined>(() => { const p = route.params.id; return Array.isArray(p) ? p[0] : (p ?? undefined) })

const invoiceItems = computed(() => {
  const inv = invoice.value
  if (!inv) return []
  const items = (inv.items ?? inv.invoice_items) as Record<string, unknown>[] | undefined
  return Array.isArray(items) ? items : []
})

const itemFields = [
  { key: 'product_id', label: 'Product ID' },
  { key: 'quantity', label: 'Qty' },
  { key: 'unit_price', label: 'Unit price' },
  { key: 'total', label: 'Total' },
  { key: 'discount', label: 'Discount' },
]

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  if (Number.isNaN(n)) return '—'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function startEdit() {
  if (!invoice.value) return
  const inv = invoice.value
  editForm.value = {
    customer_id: (inv.customer_id as number) ?? null,
    due_date: String(inv.due_date ?? '').slice(0, 10),
    payment_method: String(inv.payment_method ?? 'cash'),
    notes: String(inv.notes ?? ''),
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
    customer_id: editForm.value.customer_id ?? undefined,
    due_date: editForm.value.due_date || undefined,
    payment_method: editForm.value.payment_method || undefined,
    notes: editForm.value.notes?.trim() || undefined,
  }
  try {
    editSaving.value = true
    await crmApi.updateInvoice(id.value, payload)
    if (invoice.value) {
      invoice.value = { ...invoice.value, ...payload }
    }
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
  invoice.value = null
  try {
    const { data } = await crmApi.getInvoice(id.value)
    invoice.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load invoice'
  } finally {
    loading.value = false
  }
}

function printInvoice() {
  window.print()
}

async function onMarkPaidOk(event: Event) {
  event.preventDefault()
  if (!id.value) return
  markPaidSaving.value = true
  try {
    await crmApi.markInvoicePaid(id.value, { payment_method: markPaidMethod.value })
    showMarkPaidModal.value = false
    load()
  } catch (e: unknown) {
    editErrors.value = getApiFieldErrors(e)
  } finally {
    markPaidSaving.value = false
  }
}

async function sendReminder() {
  if (!id.value) return
  reminderSending.value = true
  reminderMessage.value = ''
  try {
    const { data } = await crmApi.sendInvoiceReminder(id.value)
    const res = (data ?? {}) as Record<string, unknown>
    reminderMessage.value = String(res.suggested_message ?? res.message ?? 'Reminder sent. Share with the customer.')
  } catch (e: unknown) {
    reminderMessage.value = (e as { message?: string }).message ?? 'Failed to send reminder'
  } finally {
    reminderSending.value = false
  }
}

async function downloadPdf() {
  if (!id.value) return
  pdfLoading.value = true
  try {
    const { data } = await crmApi.getInvoicePdf(id.value)
    const blob = data as Blob
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${id.value}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to download PDF'
  } finally {
    pdfLoading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
@media print {
  .invoice-no-print {
    display: none !important;
  }
}
</style>
