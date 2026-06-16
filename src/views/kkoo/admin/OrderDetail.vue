<template>
  <VerticalLayout>
    <b-card v-if="error && !order" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.orders' }">Back to Orders</b-button>
    </b-card>
    <b-card v-else-if="!loaded" class="mb-0">
      <p class="text-muted mb-0">Loading order…</p>
    </b-card>
    <template v-else-if="order">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.orders' }">Back to Orders</b-button>
        <b-button variant="outline-primary" size="sm" @click="showStatusModal = true">Update status</b-button>
        <b-button variant="outline-danger" size="sm" @click="confirmRefund">Refund</b-button>
        <b-button v-if="orderHasDispute" variant="warning" size="sm" @click="showDisputeModal = true">Resolve dispute</b-button>
      </div>
      <b-card :title="`Order #${order.order_number ?? order.id}`" class="mb-0">
        <b-list-group class="mb-3">
          <b-list-group-item><strong>Status</strong> {{ order.status ?? '—' }}</b-list-group-item>
          <b-list-group-item><strong>Total</strong> {{ formatMoney(order.final_total ?? order.total_amount ?? order.total) }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ formatDate(order.created_at) }}</b-list-group-item>
          <b-list-group-item v-if="order.delivery_type"><strong>Delivery type</strong> {{ order.delivery_type }}</b-list-group-item>
          <b-list-group-item v-if="order.delivery_fee != null"><strong>Delivery fee</strong> {{ formatMoney(order.delivery_fee) }}</b-list-group-item>
        </b-list-group>
        <b-card-title tag="h6" class="mt-3 mb-2">Items</b-card-title>
        <b-table
          v-if="orderItems.length"
          :items="orderItems"
          :fields="itemFields"
          striped
          small
        />
        <p v-else class="text-muted">No items.</p>
      </b-card>

      <b-card title="Invoice" class="mt-3">
        <p v-if="invoiceError" class="text-warning small mb-2">{{ invoiceError }}</p>
        <template v-if="invoice">
          <b-list-group class="mb-3">
            <b-list-group-item><strong>Sent</strong> {{ invoice.sent_at ? formatDate(invoice.sent_at) : 'Not sent' }}</b-list-group-item>
            <b-list-group-item v-if="invoice.delivery_method"><strong>Delivery</strong> {{ invoice.delivery_method }}{{ invoice.sent_to_email ? ` (${invoice.sent_to_email})` : '' }}</b-list-group-item>
            <b-list-group-item><strong>Opened</strong> {{ invoice.first_opened_at ? formatDate(invoice.first_opened_at) : '—' }} ({{ invoice.open_count ?? 0 }} time(s))</b-list-group-item>
            <b-list-group-item v-if="invoice.share_url" class="d-flex align-items-center gap-2">
              <strong>Share link</strong>
              <b-form-input :value="invoice.share_url" size="sm" readonly class="flex-grow-1" />
              <b-button size="sm" variant="outline-secondary" @click="copyShareUrl">Copy</b-button>
            </b-list-group-item>
          </b-list-group>
        </template>
        <div class="d-flex flex-wrap gap-2">
          <b-button size="sm" variant="outline-primary" :disabled="invoiceLoading" @click="createOrUpdateInvoice">Create / Update invoice</b-button>
          <b-button size="sm" variant="outline-success" :disabled="!invoice || invoiceLoading" @click="sendInvoiceLink">Send (link)</b-button>
          <b-button size="sm" variant="outline-info" :disabled="!invoice || invoiceLoading" @click="showSendEmailModal = true">Send (email)</b-button>
        </div>
        <b-collapse v-if="showCustomize" class="mt-3">
          <b-card body-class="pt-0">
            <b-form-group label="Company name">
              <b-form-input v-model="invoiceCustom.company_name" />
            </b-form-group>
            <b-form-group label="Invoice logo" class="invoice-logo-group">
              <p class="small text-muted mb-2">
                Paste a public logo URL (https://… or <code>/media/…</code> on this API host). The API does not provide a separate invoice logo upload for admins—use customization only.
              </p>
              <div class="d-flex flex-wrap align-items-start gap-3">
                <div v-if="invoiceLogoPreview" class="invoice-logo-preview-wrap">
                  <img :src="invoiceLogoPreview" alt="Logo preview" class="invoice-logo-preview" />
                </div>
                <div class="flex-grow-1 min-w-0">
                  <b-form-input v-model="invoiceCustom.logo_url" placeholder="Logo URL (https://... or /media/...)" />
                </div>
              </div>
            </b-form-group>
            <b-form-group label="Primary color">
              <b-form-input v-model="invoiceCustom.primary_color" type="color" class="w-auto" />
              <b-form-input v-model="invoiceCustom.primary_color" size="sm" class="mt-1" placeholder="#5C308F" />
            </b-form-group>
            <b-form-group label="Footer text">
              <b-form-textarea v-model="invoiceCustom.footer_text" rows="2" />
            </b-form-group>
            <b-form-group label="Currency code">
              <b-form-input v-model="invoiceCustom.currency_code" placeholder="TZS" />
            </b-form-group>
            <b-button size="sm" @click="saveInvoiceCustomization">Save customization</b-button>
          </b-card>
        </b-collapse>
        <b-button v-else size="sm" variant="link" class="p-0 mt-2" @click="showCustomize = true">Customize invoice</b-button>
      </b-card>

      <b-modal v-model="showSendEmailModal" title="Send invoice by email" @ok="sendInvoiceEmail" @hidden="invoiceSendToEmail = ''">
        <b-form-group label="To email">
          <b-form-input v-model="invoiceSendToEmail" type="email" placeholder="customer@example.com" />
        </b-form-group>
        <p class="small text-muted">The API records that the invoice was sent to this address. Your system must send the actual email with the share link and optional tracking pixel.</p>
      </b-modal>

      <b-modal v-model="showStatusModal" title="Update order status" @ok="submitStatus">
        <b-form-group label="Status">
          <b-form-select v-model="selectedStatus" :options="statusOptions" />
        </b-form-group>
      </b-modal>

      <b-modal v-model="showRefundModal" title="Refund order" @ok="submitRefund">
        <p>Refund order #{{ order.order_number ?? order.id }}? This action cannot be undone.</p>
      </b-modal>

      <b-modal v-model="showDisputeModal" title="Resolve dispute" @ok="submitDispute">
        <b-form-group label="Resolution">
          <b-form-select v-model="disputeResolution" :options="disputeOptions" />
        </b-form-group>
        <b-form-group label="Admin notes">
          <b-form-textarea v-model="disputeNotes" rows="2" />
        </b-form-group>
      </b-modal>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ordersAdminApi, disputesAdminApi } from '@/api'
import type { OrderInvoiceResponse, OrderInvoiceCustomization } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import Swal from 'sweetalert2'

const route = useRoute()
const id = computed(() => Number(route.params.id) || 0)
const loaded = ref(false)
const error = ref('')
const order = ref<Record<string, unknown> | null>(null)
const showStatusModal = ref(false)
const showRefundModal = ref(false)
const showDisputeModal = ref(false)
const selectedStatus = ref('')
const disputeResolution = ref<'refund' | 'complete' | 'reject'>('refund')
const disputeNotes = ref('')

const invoice = ref<OrderInvoiceResponse | null>(null)
const invoiceLoading = ref(false)
const invoiceError = ref('')
const showCustomize = ref(false)
const showSendEmailModal = ref(false)
const invoiceSendToEmail = ref('')
const invoiceCustom = ref<OrderInvoiceCustomization>({
  company_name: '',
  logo_url: '',
  primary_color: '#5C308F',
  footer_text: '',
  currency_code: 'TZS',
})
const invoiceLogoPreview = computed(() => {
  const url = invoiceCustom.value.logo_url?.trim()
  return url ? (resolveAssetUrl(url) ?? url) : ''
})

const statusOptions = [
  { value: 'pending', text: 'Pending' },
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'processing', text: 'Processing' },
  { value: 'shipped', text: 'Shipped' },
  { value: 'delivered', text: 'Delivered' },
  { value: 'completed', text: 'Completed' },
  { value: 'cancelled', text: 'Cancelled' },
  { value: 'refunded', text: 'Refunded' },
]
const disputeOptions = [
  { value: 'refund', text: 'Refund' },
  { value: 'complete', text: 'Complete' },
  { value: 'reject', text: 'Reject' },
]

const orderItems = computed(() => {
  const o = order.value
  const items = o?.items ?? o?.order_items
  if (Array.isArray(items)) return items as Record<string, unknown>[]
  return []
})

const orderHasDispute = computed(() => {
  const o = order.value
  return o?.has_dispute === true || o?.dispute_status != null
})

const itemFields = [
  { key: 'id', label: 'ID' },
  { key: 'quantity', label: 'Qty' },
  { key: 'total_price', label: 'Total' },
  { key: 'sku', label: 'SKU' },
]

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString()
}

function formatMoney(v: unknown): string {
  if (v == null) return '—'
  const n = Number(v)
  return isNaN(n) ? String(v) : n.toFixed(2)
}

async function loadInvoice() {
  if (!id.value) return
  invoiceError.value = ''
  try {
    const { data } = await ordersAdminApi.getInvoice(id.value)
    invoice.value = data ?? null
    const custom = (data as { customization?: OrderInvoiceCustomization })?.customization
    if (custom) {
      invoiceCustom.value = { ...invoiceCustom.value, ...custom }
    }
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 404) invoice.value = null
    else invoiceError.value = formatApiError(e, 'Failed to load invoice')
  }
}

async function load() {
  if (!id.value) return
  loaded.value = false
  error.value = ''
  try {
    const { data } = await ordersAdminApi.get(id.value)
    order.value = (data ?? {}) as Record<string, unknown>
    selectedStatus.value = (order.value.status as string) ?? ''
    loaded.value = true
    await loadInvoice()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load order')
    order.value = null
  }
}

function copyShareUrl() {
  const url = invoice.value?.share_url
  if (!url) return
  navigator.clipboard.writeText(url).then(() => Swal.fire({ icon: 'success', title: 'Copied', timer: 1500, showConfirmButton: false }))
}

async function createOrUpdateInvoice() {
  if (!id.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    const { data } = await ordersAdminApi.createOrUpdateInvoice(id.value, invoiceCustom.value)
    invoice.value = data ?? null
  } catch (e: unknown) {
    invoiceError.value = formatApiError(e, 'Failed to create/update invoice')
  } finally {
    invoiceLoading.value = false
  }
}

async function saveInvoiceCustomization() {
  await createOrUpdateInvoice()
}

async function sendInvoiceLink() {
  if (!id.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    const { data } = await ordersAdminApi.sendInvoice(id.value, { delivery_method: 'link' })
    if (data?.share_url) invoice.value = { ...invoice.value!, share_url: data.share_url, sent_at: data.sent_at ?? undefined, delivery_method: 'link' }
    await loadInvoice()
  } catch (e: unknown) {
    invoiceError.value = formatApiError(e, 'Failed to send invoice')
  } finally {
    invoiceLoading.value = false
  }
}

async function sendInvoiceEmail() {
  if (!id.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    await ordersAdminApi.sendInvoice(id.value, { delivery_method: 'email', to_email: invoiceSendToEmail.value || undefined })
    await loadInvoice()
    showSendEmailModal.value = false
    invoiceSendToEmail.value = ''
  } catch (e: unknown) {
    invoiceError.value = formatApiError(e, 'Failed to send invoice')
  } finally {
    invoiceLoading.value = false
  }
}

function confirmRefund() {
  showRefundModal.value = true
}

async function submitStatus() {
  if (!order.value?.id || !selectedStatus.value) return
  try {
    await ordersAdminApi.updateStatus(order.value.id as number, selectedStatus.value)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update status')
  }
  showStatusModal.value = false
}

async function submitRefund() {
  if (!order.value?.id) return
  try {
    await ordersAdminApi.refund(order.value.id as number)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to refund')
  }
  showRefundModal.value = false
}

async function submitDispute() {
  if (!order.value?.id) return
  try {
    let disputeId = order.value.dispute_id ?? (order.value.dispute as Record<string, unknown> | undefined)?.id
    if (disputeId == null) {
      const { data } = await disputesAdminApi.list({ page_size: 500 })
      const list = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
      const match = list.find((d: Record<string, unknown>) => Number(d.order_id) === Number(order.value?.id))
      disputeId = match?.id
    }
    if (disputeId == null) {
      error.value = 'No dispute found for this order. Resolve from the Disputes page.'
      return
    }
    await disputesAdminApi.resolve(Number(disputeId), {
      resolution: disputeResolution.value,
      admin_notes: disputeNotes.value || undefined,
    })
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to resolve dispute')
  }
  showDisputeModal.value = false
}

onMounted(load)
watch(id, load)
</script>

<style scoped>
.invoice-logo-preview-wrap {
  flex-shrink: 0;
  width: 200px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #dee2e6;
}
.invoice-logo-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
