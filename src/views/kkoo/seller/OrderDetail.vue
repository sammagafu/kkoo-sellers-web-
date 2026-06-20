<template>
  <VerticalLayout>
    <b-card v-if="error && !order" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'seller.orders' }">Back to Orders</b-button>
    </b-card>
    <b-card v-else-if="!loaded" class="mb-0">
      <p class="text-muted mb-0">Loading order…</p>
    </b-card>
    <template v-else-if="order">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'seller.orders' }">Back to Orders</b-button>
        <b-button v-if="subOrder" variant="outline-primary" size="sm" @click="openStatusModal">Update status</b-button>
      </div>
      <b-card :title="`Order #${order.order_number ?? order.id}`" class="mb-0">
        <b-list-group class="mb-3">
          <b-list-group-item><strong>Order status</strong> {{ order.status ?? '—' }}</b-list-group-item>
          <b-list-group-item v-if="subOrder"><strong>Your store status</strong> {{ subOrder.status ?? '—' }}</b-list-group-item>
          <b-list-group-item v-if="subOrder?.seller_notes"><strong>Note to buyer</strong> {{ subOrder.seller_notes }}</b-list-group-item>
          <b-list-group-item v-if="subOrder?.estimated_ready_at"><strong>Estimated ready</strong> {{ formatDate(subOrder.estimated_ready_at) }}</b-list-group-item>
          <b-list-group-item><strong>Total</strong> {{ formatMoney(order.final_total ?? order.total_amount ?? order.total) }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ formatDate(order.created_at) }}</b-list-group-item>
          <b-list-group-item v-if="order.delivery_type"><strong>Delivery</strong> {{ order.delivery_type }}</b-list-group-item>
        </b-list-group>
        <div v-if="tracking" class="mb-3">
          <h6 class="mb-2">Delivery tracking</h6>
          <p class="mb-1"><strong>Status</strong> {{ tracking.status ?? '—' }}</p>
          <a v-if="tracking.gps_track_link" :href="tracking.gps_track_link" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">Open track link</a>
        </div>
        <b-button v-else-if="!trackingError" variant="outline-secondary" size="sm" class="mb-3" :disabled="trackingLoading" @click="loadTracking">
          {{ trackingLoading ? 'Loading…' : 'Track delivery' }}
        </b-button>
        <p v-if="trackingError" class="text-muted small mb-3">{{ trackingError }}</p>
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
                Upload uses <strong>POST /users/seller/profile/logo/</strong> (updates your company logo in Seller profile) and sets this invoice to that URL. Or paste any public URL. Recommended: 200×80 or 160×160 px, max 500 KB.
              </p>
              <div class="d-flex flex-wrap align-items-start gap-3">
                <div v-if="invoiceLogoPreview" class="invoice-logo-preview-wrap">
                  <img :src="invoiceLogoPreview" alt="Logo preview" class="invoice-logo-preview" />
                </div>
                <div class="flex-grow-1 min-w-0">
                  <input
                    ref="invoiceLogoInputRef"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    class="form-control mb-2"
                    @change="onInvoiceLogoFileChange"
                  />
                  <b-form-input v-model="invoiceCustom.logo_url" placeholder="Or paste logo URL (https://... or /media/...)" class="mb-1" />
                  <b-button v-if="sellerStoreLogoUrl" size="sm" variant="outline-secondary" class="mt-1" @click="invoiceCustom.logo_url = sellerStoreLogoUrl">Use store logo</b-button>
                </div>
              </div>
              <p v-if="invoiceLogoUploadError" class="small text-danger mb-0 mt-1">{{ invoiceLogoUploadError }}</p>
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
        <p class="small text-muted">The API records that the invoice was sent. Share the invoice link with your customer.</p>
      </b-modal>

      <b-modal v-model="showStatusModal" title="Update your store status" hide-footer>
        <p v-if="statusError" class="text-danger small mb-2">{{ statusError }}</p>
        <b-form-group label="Status">
          <b-form-select v-model="selectedStatus" :options="subOrderStatusOptions" />
        </b-form-group>
        <b-form-group label="Note to buyer">
          <b-form-textarea v-model="sellerNotes" rows="2" placeholder="Optional message for the customer" />
        </b-form-group>
        <b-form-group v-if="selectedStatus === 'cancelled'" label="Cancel reason">
          <b-form-textarea v-model="cancelReason" rows="2" placeholder="Why this portion is cancelled" />
        </b-form-group>
        <div class="d-flex justify-content-end gap-2 mt-3">
          <b-button variant="secondary" @click="showStatusModal = false">Close</b-button>
          <b-button variant="primary" :disabled="statusUpdating || !selectedStatus" @click="submitStatus">
            {{ statusUpdating ? 'Saving…' : 'Save' }}
          </b-button>
        </div>
      </b-modal>
    </template>
  </VerticalLayout>
</template>

<style scoped>
.invoice-logo-preview-wrap {
  flex-shrink: 0;
  width: 200px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  background: var(--kkoo-panel-muted);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--kkoo-panel-border);
}
.invoice-logo-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ordersUserApi, logisticsBuyerApi, authApi } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { resolveOrderRef } from '@/utils/orderRef'
import type { OrderInvoiceResponse, OrderInvoiceCustomization } from '@/api'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()
const orderRefParam = computed(() => {
  const raw = route.params.id
  const s = Array.isArray(raw) ? raw[0] : raw
  const ref = typeof s === 'string' ? s.trim() : s != null ? String(s).trim() : ''
  return ref && ref !== 'undefined' ? ref : ''
})
const loaded = ref(false)
const error = ref('')
const order = ref<Record<string, unknown> | null>(null)
const tracking = ref<{ status?: string; gps_track_link?: string } | null>(null)
const trackingLoading = ref(false)
const trackingError = ref('')

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
  accent_color: '',
  footer_text: '',
  currency_code: 'TZS',
})
const invoiceLogoInputRef = ref<HTMLInputElement | null>(null)
const invoiceLogoUploadError = ref('')
const invoiceLogoObjectUrl = ref('')
const sellerStoreLogoUrl = ref('')
const subOrder = ref<Record<string, unknown> | null>(null)
const showStatusModal = ref(false)
const selectedStatus = ref('')
const sellerNotes = ref('')
const cancelReason = ref('')
const statusUpdating = ref(false)
const statusError = ref('')

const sellerId = computed(() => Number((auth.user as { id?: number })?.id) || 0)
const orderRef = computed(() => resolveOrderRef(order.value) ?? orderRefParam.value)

const subOrderStatusOptions = [
  { value: 'confirmed', text: 'Confirmed' },
  { value: 'preparing', text: 'Preparing' },
  { value: 'ready', text: 'Ready' },
  { value: 'shipped', text: 'Shipped' },
  { value: 'delivered', text: 'Delivered' },
  { value: 'cancelled', text: 'Cancelled' },
]

const invoiceLogoPreview = computed(() => {
  const url = invoiceCustom.value.logo_url?.trim()
  if (invoiceLogoObjectUrl.value) return invoiceLogoObjectUrl.value
  return url ? (resolveAssetUrl(url) ?? url) : ''
})

const orderItems = computed(() => {
  const o = order.value
  const items = o?.items ?? o?.order_items
  if (Array.isArray(items)) return items as Record<string, unknown>[]
  return []
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
  if (!orderRefParam.value) return
  invoiceError.value = ''
  try {
    const { data } = await ordersUserApi.getInvoice(orderRefParam.value)
    invoice.value = data ?? null
    const custom = (data as { customization?: OrderInvoiceCustomization })?.customization
    if (custom) {
      invoiceCustom.value = { ...invoiceCustom.value, ...custom }
      invoiceLogoObjectUrl.value = ''
    }
  } catch (e: unknown) {
    const err = e as { response?: { status?: number } }
    if (err.response?.status === 404) invoice.value = null
    else invoiceError.value = formatApiError(e, 'Failed to load invoice')
  }
}

async function loadSellerStoreLogo() {
  try {
    const { data } = await authApi.getSellerProfile().catch(() => ({ data: null }))
    const d = (data ?? {}) as Record<string, unknown>
    const raw = typeof d.logo_url === 'string' ? d.logo_url.trim() : typeof d.logo === 'string' ? d.logo.trim() : ''
    sellerStoreLogoUrl.value = raw
  } catch {
    sellerStoreLogoUrl.value = ''
  }
}

async function onInvoiceLogoFileChange(ev: Event) {
  invoiceLogoUploadError.value = ''
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (file.size > 500 * 1024) {
    invoiceLogoUploadError.value = 'File too large. Use an image under 500 KB.'
    input.value = ''
    return
  }
  if (invoiceLogoObjectUrl.value) URL.revokeObjectURL(invoiceLogoObjectUrl.value)
  invoiceLogoObjectUrl.value = URL.createObjectURL(file)
  const formData = new FormData()
  formData.append('logo', file)
  try {
    const { data } = await ordersUserApi.uploadInvoiceLogo(orderRefParam.value, formData)
    const url = data?.logo_url
    if (url) {
      invoiceCustom.value.logo_url = url
      URL.revokeObjectURL(invoiceLogoObjectUrl.value)
      invoiceLogoObjectUrl.value = ''
    }
  } catch (e: unknown) {
    invoiceLogoUploadError.value = formatApiError(e, 'Upload failed. Use a logo URL instead, or try a smaller image.')
  }
  input.value = ''
}

function copyShareUrl() {
  const url = invoice.value?.share_url
  if (!url) return
  navigator.clipboard.writeText(url).catch(() => {})
}

async function createOrUpdateInvoice() {
  if (!orderRefParam.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    const { data } = await ordersUserApi.createOrUpdateInvoice(orderRefParam.value, invoiceCustom.value)
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
  if (!orderRefParam.value || !invoice.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    const { data } = await ordersUserApi.sendInvoice(orderRefParam.value, { delivery_method: 'link' })
    if (data?.share_url) invoice.value = { ...invoice.value!, share_url: data.share_url, sent_at: data.sent_at ?? undefined, delivery_method: 'link' }
  } catch (e: unknown) {
    invoiceError.value = formatApiError(e, 'Failed to send invoice')
  } finally {
    invoiceLoading.value = false
  }
}

async function sendInvoiceEmail() {
  if (!orderRefParam.value || !invoice.value) return
  invoiceLoading.value = true
  invoiceError.value = ''
  try {
    const { data } = await ordersUserApi.sendInvoice(orderRefParam.value, { delivery_method: 'email', to_email: invoiceSendToEmail.value || undefined })
    if (data) invoice.value = { ...invoice.value!, sent_at: data.sent_at ?? undefined, delivery_method: 'email', sent_to_email: data.sent_to_email ?? undefined }
    showSendEmailModal.value = false
    invoiceSendToEmail.value = ''
  } catch (e: unknown) {
    invoiceError.value = formatApiError(e, 'Failed to send invoice')
  } finally {
    invoiceLoading.value = false
  }
}

async function loadSubOrder() {
  if (!orderRef.value || !sellerId.value) {
    subOrder.value = null
    return
  }
  try {
    const { data } = await ordersUserApi.listSubOrders(orderRef.value)
    const list = Array.isArray(data?.sub_orders) ? (data.sub_orders as Record<string, unknown>[]) : []
    subOrder.value = list.find((so) => Number(so.seller_id) === sellerId.value) ?? null
  } catch {
    subOrder.value = null
  }
}

function openStatusModal() {
  selectedStatus.value = String(subOrder.value?.status ?? '')
  sellerNotes.value = String(subOrder.value?.seller_notes ?? '')
  cancelReason.value = String(subOrder.value?.cancel_reason ?? '')
  statusError.value = ''
  showStatusModal.value = true
}

async function submitStatus() {
  if (!orderRef.value || !sellerId.value || !selectedStatus.value) return
  statusUpdating.value = true
  statusError.value = ''
  try {
    const payload: { status: string; seller_notes?: string; cancel_reason?: string } = {
      status: selectedStatus.value,
    }
    if (sellerNotes.value.trim()) payload.seller_notes = sellerNotes.value.trim()
    if (selectedStatus.value === 'cancelled' && cancelReason.value.trim()) {
      payload.cancel_reason = cancelReason.value.trim()
    }
    const { data } = await ordersUserApi.updateSubOrderStatus(orderRef.value, sellerId.value, payload)
    const updated = (data as { sub_order?: Record<string, unknown> })?.sub_order
    if (updated) subOrder.value = updated
    showStatusModal.value = false
    const { data: orderData } = await ordersUserApi.get(orderRefParam.value)
    order.value = (orderData ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    statusError.value = formatApiError(e, 'Failed to update status')
  } finally {
    statusUpdating.value = false
  }
}

async function load() {
  if (!orderRefParam.value) return
  loaded.value = false
  error.value = ''
  try {
    const { data } = await ordersUserApi.get(orderRefParam.value)
    order.value = (data ?? {}) as Record<string, unknown>
    loaded.value = true
    await Promise.all([loadInvoice(), loadSubOrder()])
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load order')
    order.value = null
    subOrder.value = null
  }
}

async function loadTracking() {
  if (!orderRefParam.value) return
  trackingLoading.value = true
  trackingError.value = ''
  tracking.value = null
  try {
    const { data } = await logisticsBuyerApi.getTracking(orderRefParam.value)
    tracking.value = data ?? null
  } catch {
    trackingError.value = 'Tracking not available for this order.'
  } finally {
    trackingLoading.value = false
  }
}

onMounted(load)
watch(orderRefParam, load)
watch(showCustomize, (visible) => {
  if (visible && !sellerStoreLogoUrl.value) loadSellerStoreLogo()
})
</script>
