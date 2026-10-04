<template>
  <VerticalLayout>
    <div class="d-flex flex-wrap gap-2 mb-3">
      <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.crm.invoices' }">← Invoices</b-button>
      <b-button variant="outline-primary" size="sm" :to="{ name: 'admin.crm.recurring' }">Repeat billing</b-button>
    </div>

    <b-card>
      <div class="mb-3">
        <h1 class="h4 mb-1">New invoice</h1>
        <p class="text-muted mb-0">
          Pick the client, type the service (saved ones fill in with their price), change the price if you need to, then create the bill.
        </p>
      </div>

      <b-alert v-if="formErrors._form" variant="danger" show>{{ formErrors._form }}</b-alert>
      <b-alert v-if="catalogError" variant="warning" show>{{ catalogError }}</b-alert>
      <b-alert v-if="repeatNote" variant="success" show>{{ repeatNote }}</b-alert>

      <section class="inv-block mb-4">
        <h2 class="h6 mb-2">1. Who is this for?</h2>
        <CrmCustomerPicker
          v-model="form.customer_id"
          allow-empty
          empty-label="— Walk-in (no client) —"
          placeholder="Search client by name or phone…"
        />
        <b-button size="sm" variant="link" class="px-0 mt-1" @click="showNewClient = !showNewClient">
          {{ showNewClient ? 'Cancel' : '+ New client' }}
        </b-button>
        <div v-if="showNewClient" class="inv-inline mt-2">
          <b-row class="g-2">
            <b-col md="5">
              <b-form-input v-model="newClient.name" placeholder="Client name *" size="sm" />
            </b-col>
            <b-col md="4">
              <b-form-input v-model="newClient.phone" placeholder="Phone" size="sm" />
            </b-col>
            <b-col md="3">
              <b-button size="sm" variant="primary" class="w-100" :disabled="savingClient" @click="createClient">
                {{ savingClient ? '…' : 'Save client' }}
              </b-button>
            </b-col>
          </b-row>
          <p v-if="newClientError" class="text-danger small mb-0 mt-2">{{ newClientError }}</p>
        </div>
      </section>

      <section class="inv-block mb-4">
        <h2 class="h6 mb-1">2. What are you charging?</h2>
        <p class="text-muted small mb-3">
          Start typing a service you billed before. Pick it and the usual price fills in. You can change the price before adding it.
          A new name is saved so it shows up next time.
        </p>
        <div class="inv-inline mb-3">
          <b-row class="g-2 align-items-end">
            <b-col md="3">
              <label class="form-label small mb-1">Type</label>
              <b-form-select v-model="quick.item_type" :options="itemTypeOptions" size="sm" />
            </b-col>
            <b-col md="4">
              <label class="form-label small mb-1">Service or product</label>
              <div class="position-relative">
              <b-form-input
                v-model="quick.name"
                size="sm"
                placeholder="e.g. Haircut, Delivery, Rent"
                autocomplete="off"
                @focus="showSuggestions = true"
                @input="onServiceInput"
              />
              <div v-if="showSuggestions && serviceSuggestions.length" class="inv-suggest border rounded bg-body shadow-sm">
                <button
                  v-for="p in serviceSuggestions"
                  :key="p.id"
                  type="button"
                  class="inv-suggest__item"
                  @mousedown.prevent="pickService(p)"
                >
                  <span class="fw-semibold">{{ p.name }}</span>
                  <span class="text-muted small ms-2">{{ p.item_type === 'service' ? 'Service' : 'Product' }} · {{ formatCurrency(p.selling_price) }}</span>
                </button>
              </div>
              </div>
            </b-col>
            <b-col md="2">
              <label class="form-label small mb-1">Price (TZS)</label>
              <b-form-input v-model.number="quick.amount" type="number" min="0" step="1" size="sm" />
            </b-col>
            <b-col md="3">
              <b-button size="sm" variant="primary" class="w-100" :disabled="savingQuick" @click="addQuickCharge">
                {{ savingQuick ? 'Saving…' : 'Add to invoice' }}
              </b-button>
            </b-col>
          </b-row>
          <p v-if="quickError" class="text-danger small mb-0 mt-2">{{ quickError }}</p>
          <p v-else-if="matchedProduct && Number(quick.amount) !== matchedProduct.selling_price" class="text-muted small mb-0 mt-2">
            This updates the saved price for {{ matchedProduct.name }} so the next bill starts at {{ formatCurrency(quick.amount) }}.
          </p>
        </div>

        <div v-if="form.items.length" class="inv-lines">
          <div v-for="(row, index) in form.items" :key="index" class="inv-line">
            <div class="inv-line__main">
              <strong>{{ productMeta(row.product_id)?.name || 'Item' }}</strong>
              <span class="text-muted small">{{ productMeta(row.product_id)?.item_type === 'service' ? 'Service' : 'Product' }}</span>
            </div>
            <div>
              <label class="form-label small mb-1">Qty</label>
              <b-form-input v-model.number="row.quantity" type="number" min="0.01" step="1" size="sm" />
            </div>
            <div>
              <label class="form-label small mb-1">Price</label>
              <b-form-input v-model.number="row.unit_price" type="number" min="0" step="1" size="sm" />
            </div>
            <div class="inv-line__total">{{ formatCurrency(lineTotal(row)) }}</div>
            <div class="d-flex flex-column gap-1">
              <b-button
                v-if="priceDiffers(row)"
                size="sm"
                variant="link"
                class="p-0"
                :disabled="savingPriceId === row.product_id"
                @click="saveUsualPrice(row)"
              >
                Save usual price
              </b-button>
              <b-button size="sm" variant="outline-danger" @click="removeItem(index)">Remove</b-button>
            </div>
          </div>
        </div>
        <p v-else class="text-muted small mb-0">Nothing added yet.</p>

        <div class="inv-total mt-3">
          <span>Total</span>
          <strong>{{ formatCurrency(runningTotal) }}</strong>
        </div>
      </section>

      <section class="inv-block mb-4">
        <h2 class="h6 mb-2">3. When and how they pay</h2>
        <b-row class="g-2">
          <b-col md="4">
            <label class="form-label small mb-1">Due date</label>
            <b-form-input v-model="form.due_date" type="date" size="sm" />
          </b-col>
          <b-col md="4">
            <label class="form-label small mb-1">Payment</label>
            <b-form-select v-model="form.payment_method" :options="paymentMethodOptions" size="sm" />
          </b-col>
          <b-col md="4">
            <label class="form-label small mb-1">Note</label>
            <b-form-input v-model="form.notes" size="sm" placeholder="Optional" />
          </b-col>
        </b-row>
      </section>

      <section class="inv-block mb-4">
        <h2 class="h6 mb-1">Repeat this bill</h2>
        <p class="text-muted small mb-2">
          Saves these services and prices, then bills the same client on a schedule. You can still create today’s invoice separately.
        </p>
        <div class="d-flex flex-wrap gap-2 align-items-center">
          <b-button
            v-for="opt in frequencyOptions"
            :key="opt.value"
            size="sm"
            :variant="repeatFrequency === opt.value ? 'primary' : 'outline-secondary'"
            @click="repeatFrequency = opt.value"
          >
            {{ opt.text }}
          </b-button>
          <b-button size="sm" variant="outline-primary" :disabled="savingRepeat" @click="startRepeat">
            {{ savingRepeat ? 'Saving…' : 'Start repeat billing' }}
          </b-button>
        </div>
      </section>

      <div class="d-flex flex-wrap gap-2">
        <b-button variant="primary" :disabled="saving" @click="submit">
          {{ saving ? 'Creating…' : 'Create invoice' }}
        </b-button>
        <b-button variant="outline-secondary" :to="{ name: 'admin.crm.invoices' }">Cancel</b-button>
      </div>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import CrmCustomerPicker from '@/components/crm/CrmCustomerPicker.vue'
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { crmApi } from '@/api'
import { useCrmWorkspace } from '@/composables/useCrmWorkspace'
import { getApiFieldErrors } from '@/types/crm'
import { formatApiError } from '@/utils/formatApiError'

type CatalogProduct = {
  id: number
  name: string
  description: string
  selling_price: number
  item_type: string
  stock_quantity: number
  unit: string
  sku: string
  barcode: string
  cost_price: number
  reorder_level: number
}

type LineItem = { product_id: number | null; quantity: number; unit_price: number; discount: number }

const router = useRouter()
const { activeBusinessId } = useCrmWorkspace()

function defaultDueDate() {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  return d.toISOString().slice(0, 10)
}

const form = reactive<{
  customer_id: number | null
  due_date: string
  payment_method: string
  notes: string
  items: LineItem[]
}>({
  customer_id: null,
  due_date: defaultDueDate(),
  payment_method: 'credit',
  notes: '',
  items: [],
})

const formErrors = ref<Record<string, string>>({})
const saving = ref(false)
const catalogError = ref('')
const products = ref<CatalogProduct[]>([])

const showNewClient = ref(false)
const savingClient = ref(false)
const newClientError = ref('')
const newClient = reactive({ name: '', phone: '' })

const savingQuick = ref(false)
const quickError = ref('')
const showSuggestions = ref(false)
const quick = reactive({
  item_type: 'service',
  name: '',
  amount: 0 as number,
  matchedId: null as number | null,
})

const repeatFrequency = ref('monthly')
const savingRepeat = ref(false)
const repeatNote = ref('')
const savingPriceId = ref<number | null>(null)

const itemTypeOptions = [
  { value: 'service', text: 'Service' },
  { value: 'product', text: 'Product' },
]
const paymentMethodOptions = [
  { value: 'credit', text: 'Pay later (credit)' },
  { value: 'cash', text: 'Cash' },
  { value: 'mpesa', text: 'M-Pesa' },
  { value: 'tigo', text: 'Tigo Pesa' },
  { value: 'airtel', text: 'Airtel Money' },
  { value: 'bank', text: 'Bank' },
]
const frequencyOptions = [
  { value: 'weekly', text: 'Weekly' },
  { value: 'monthly', text: 'Monthly' },
  { value: 'quarterly', text: 'Every 3 months' },
]

const productsById = computed(() => {
  const map: Record<number, CatalogProduct> = {}
  for (const p of products.value) map[p.id] = p
  return map
})

const matchedProduct = computed(() => {
  if (quick.matchedId == null) return null
  return productsById.value[quick.matchedId] ?? null
})

const serviceSuggestions = computed(() => {
  const q = quick.name.trim().toLowerCase()
  if (!q) return products.value.slice(0, 8)
  return products.value.filter((p) => p.name.toLowerCase().includes(q)).slice(0, 8)
})

function productMeta(id: number | null | undefined) {
  if (id == null) return null
  return productsById.value[id] ?? null
}

function lineTotal(row: LineItem) {
  const qty = Number(row.quantity) || 0
  const price = Number(row.unit_price) || 0
  const discount = Number(row.discount) || 0
  return Math.max(0, qty * price - discount)
}

const runningTotal = computed(() =>
  form.items.reduce((sum, row) => sum + (row.product_id != null ? lineTotal(row) : 0), 0),
)

function formatCurrency(v: unknown): string {
  if (v == null || v === '') return '—'
  const n = typeof v === 'number' ? v : Number(v)
  return Number.isNaN(n)
    ? '—'
    : new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(n)
}

function priceDiffers(row: LineItem) {
  const p = productMeta(row.product_id)
  if (!p) return false
  return Number(row.unit_price) !== Number(p.selling_price)
}

function findByName(name: string) {
  const q = name.trim().toLowerCase()
  return products.value.find((p) => p.name.trim().toLowerCase() === q) ?? null
}

function onServiceInput() {
  showSuggestions.value = true
  const hit = findByName(quick.name)
  quick.matchedId = hit?.id ?? null
}

function pickService(p: CatalogProduct) {
  quick.name = p.name
  quick.amount = p.selling_price
  quick.item_type = p.item_type === 'service' ? 'service' : 'product'
  quick.matchedId = p.id
  showSuggestions.value = false
}

function removeItem(index: number) {
  form.items.splice(index, 1)
}

function pushLine(productId: number, unitPrice: number, qty = 1) {
  form.items.push({
    product_id: productId,
    quantity: qty,
    unit_price: unitPrice,
    discount: 0,
  })
}

function mapProducts(list: Record<string, unknown>[]): CatalogProduct[] {
  return list.map((p) => ({
    id: Number(p.id),
    name: String(p.name ?? p.id),
    description: p.description ? String(p.description) : '',
    selling_price: Number(p.selling_price) || 0,
    item_type: String(p.item_type ?? 'product'),
    stock_quantity: Number(p.stock_quantity) || 0,
    unit: p.unit ? String(p.unit) : 'pcs',
    sku: p.sku ? String(p.sku) : '',
    barcode: p.barcode ? String(p.barcode) : '',
    cost_price: Number(p.cost_price) || 0,
    reorder_level: Number(p.reorder_level) || 0,
  }))
}

function productPayload(p: CatalogProduct, sellingPrice: number) {
  return {
    name: p.name,
    description: p.description,
    item_type: p.item_type,
    sku: p.sku,
    barcode: p.barcode,
    cost_price: p.cost_price,
    selling_price: sellingPrice,
    stock_quantity: p.stock_quantity,
    reorder_level: p.reorder_level,
    unit: p.unit || 'pcs',
  }
}

function invoiceItems() {
  return form.items
    .filter((row) => row.product_id != null && row.quantity > 0)
    .map((row) => ({
      product_id: row.product_id!,
      quantity: Number(row.quantity) || 0,
      unit_price: Number(row.unit_price) || 0,
      discount: Number(row.discount) || 0,
    }))
}

async function loadOptions() {
  catalogError.value = ''
  try {
    const { data } = await crmApi.getProducts({
      page_size: 500,
      business_id: activeBusinessId.value ?? undefined,
    })
    const prodData = data as { results?: Record<string, unknown>[] }
    const prodList = Array.isArray(prodData?.results) ? prodData.results : []
    products.value = mapProducts(prodList)
  } catch (e: unknown) {
    products.value = []
    catalogError.value = formatApiError(e, 'Could not load saved services')
  }
}

async function createClient() {
  newClientError.value = ''
  const name = newClient.name.trim()
  if (!name) {
    newClientError.value = 'Enter a client name.'
    return
  }
  const payload: Record<string, unknown> = {
    name,
    phone: newClient.phone.trim() || undefined,
  }
  if (activeBusinessId.value != null) payload.business_id = activeBusinessId.value
  try {
    savingClient.value = true
    const { data } = await crmApi.createCustomer(payload)
    const created = data as { id?: number }
    if (created?.id != null) {
      form.customer_id = created.id
      showNewClient.value = false
      newClient.name = ''
      newClient.phone = ''
    }
  } catch (e: unknown) {
    newClientError.value = formatApiError(e, 'Could not save client')
  } finally {
    savingClient.value = false
  }
}

async function addQuickCharge() {
  quickError.value = ''
  const name = quick.name.trim()
  if (!name) {
    quickError.value = 'Enter what you are charging for.'
    return
  }
  if (!(Number(quick.amount) > 0)) {
    quickError.value = 'Enter a price greater than zero.'
    return
  }
  const price = Number(quick.amount)
  const existing = findByName(name)
  try {
    savingQuick.value = true
    if (existing) {
      if (price !== existing.selling_price) {
        const { data } = await crmApi.updateProduct(existing.id, productPayload(existing, price))
        const mapped = mapProducts([data as Record<string, unknown>])[0]
        if (mapped) {
          products.value = products.value.map((p) => (p.id === mapped.id ? mapped : p))
        } else {
          existing.selling_price = price
        }
      }
      pushLine(existing.id, price)
    } else {
      const payload: Record<string, unknown> = {
        name,
        item_type: quick.item_type,
        selling_price: price,
        stock_quantity: 0,
      }
      if (activeBusinessId.value != null) payload.business_id = activeBusinessId.value
      const { data } = await crmApi.createProduct(payload)
      const mapped = mapProducts([data as Record<string, unknown>])[0]
      if (mapped) {
        products.value = [mapped, ...products.value.filter((p) => p.id !== mapped.id)]
        pushLine(mapped.id, mapped.selling_price)
      }
    }
    quick.name = ''
    quick.amount = 0
    quick.matchedId = null
    showSuggestions.value = false
  } catch (e: unknown) {
    quickError.value = formatApiError(e, 'Could not save this service')
  } finally {
    savingQuick.value = false
  }
}

async function saveUsualPrice(row: LineItem) {
  const p = productMeta(row.product_id)
  if (!p) return
  const price = Number(row.unit_price) || 0
  if (!(price > 0)) {
    formErrors.value = { _form: 'Enter a price greater than zero before saving it.' }
    return
  }
  savingPriceId.value = p.id
  formErrors.value = {}
  try {
    const { data } = await crmApi.updateProduct(p.id, productPayload(p, price))
    const mapped = mapProducts([data as Record<string, unknown>])[0]
    if (mapped) products.value = products.value.map((item) => (item.id === mapped.id ? mapped : item))
  } catch (e: unknown) {
    formErrors.value = { _form: formatApiError(e, 'Could not update the saved price') }
  } finally {
    savingPriceId.value = null
  }
}

async function startRepeat() {
  formErrors.value = {}
  repeatNote.value = ''
  if (!form.customer_id) {
    formErrors.value = { _form: 'Pick a client before starting repeat billing.' }
    return
  }
  const items = invoiceItems()
  if (!items.length) {
    formErrors.value = { _form: 'Add at least one service before starting repeat billing.' }
    return
  }
  const first = productMeta(items[0].product_id)
  const label = first ? `${first.name} repeat` : 'Repeat bill'
  savingRepeat.value = true
  try {
    const templatePayload: Record<string, unknown> = {
      name: label,
      default_notes: form.notes?.trim() || '',
      default_due_days: 30,
      items: items.map((row) => ({
        product_id: row.product_id,
        quantity: row.quantity,
        unit_price: row.unit_price,
      })),
    }
    if (activeBusinessId.value != null) templatePayload.business_id = activeBusinessId.value
    const { data: tpl } = await crmApi.createInvoiceTemplate(templatePayload)
    const templateId = Number((tpl as { id?: number }).id)
    if (!templateId) throw new Error('Template was not saved')
    await crmApi.createRecurringInvoice({
      business_id: activeBusinessId.value ?? undefined,
      customer_id: form.customer_id,
      template_id: templateId,
      frequency: repeatFrequency.value,
      label,
    })
    const how = frequencyOptions.find((o) => o.value === repeatFrequency.value)?.text ?? 'Monthly'
    repeatNote.value = `Repeat billing is on (${how}). Open Repeat billing to pause it or bill now.`
  } catch (e: unknown) {
    formErrors.value = { _form: formatApiError(e, 'Could not start repeat billing') }
  } finally {
    savingRepeat.value = false
  }
}

async function submit() {
  formErrors.value = {}
  const items = invoiceItems()
  if (items.length === 0) {
    formErrors.value = { _form: 'Add at least one service.' }
    return
  }
  const payload: Record<string, unknown> = {
    customer_id: form.customer_id || undefined,
    due_date: form.due_date || undefined,
    payment_method: form.payment_method || 'credit',
    notes: form.notes?.trim() || undefined,
    business_id: activeBusinessId.value ?? undefined,
    items,
  }
  try {
    saving.value = true
    const { data } = await crmApi.createInvoice(payload)
    const created = data as { id?: number }
    if (created?.id != null) {
      router.push({ name: 'admin.crm.invoices.detail', params: { id: String(created.id) } })
    } else {
      router.push({ name: 'admin.crm.invoices' })
    }
  } catch (e: unknown) {
    formErrors.value = getApiFieldErrors(e)
    const msg = formatApiError(e, 'Could not create invoice')
    if (Object.keys(formErrors.value).length === 0) formErrors.value = { _form: msg }
  } finally {
    saving.value = false
  }
}

watch(activeBusinessId, () => {
  void loadOptions()
})

onMounted(loadOptions)
</script>

<style scoped>
.inv-block {
  border: 1px solid var(--bs-border-color, #e6e8ec);
  border-radius: 12px;
  padding: 1rem 1.1rem;
  background: var(--bs-body-bg, #fff);
}
.inv-inline {
  border: 1px dashed var(--bs-border-color, #d0d5dd);
  border-radius: 10px;
  padding: 0.85rem;
  background: var(--bs-tertiary-bg, #f8f9fa);
}
.inv-suggest {
  position: absolute;
  z-index: 20;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 220px;
  overflow: auto;
}
.inv-suggest__item {
  display: flex;
  align-items: baseline;
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
}
.inv-suggest__item:hover {
  background: color-mix(in srgb, var(--bs-primary, #5c308f) 8%, transparent);
}
.inv-lines {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.inv-line {
  display: grid;
  grid-template-columns: 1fr 4.5rem 7rem auto auto;
  gap: 0.5rem;
  align-items: end;
  padding: 0.65rem 0.75rem;
  border: 1px solid var(--bs-border-color, #eef0f3);
  border-radius: 10px;
}
.inv-line__main {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.inv-line__total {
  font-weight: 700;
  text-align: right;
  padding-bottom: 0.35rem;
}
.inv-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.9rem;
  border-radius: 10px;
  background: #f3f7ff;
  font-size: 1.05rem;
}
@media (max-width: 700px) {
  .inv-line {
    grid-template-columns: 1fr 1fr;
  }
  .inv-line__main {
    grid-column: 1 / -1;
  }
}
</style>
