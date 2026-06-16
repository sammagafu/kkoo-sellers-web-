<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'seller.crm.invoices' }">← Back to Invoices</b-button>
    <b-card title="Create invoice">
      <b-alert v-if="formErrors._form" variant="danger" show>{{ formErrors._form }}</b-alert>
      <b-form>
        <b-row>
          <b-col md="6">
            <b-form-group label="Customer (optional)" label-for="customer_id">
              <b-form-select id="customer_id" v-model="form.customer_id" :options="customerOptions" value-field="id" text-field="name" />
            </b-form-group>
            <b-form-group label="Due date" label-for="due_date">
              <b-form-input id="due_date" v-model="form.due_date" type="date" />
            </b-form-group>
            <b-form-group label="Payment method" label-for="payment_method">
              <b-form-select id="payment_method" v-model="form.payment_method" :options="paymentMethodOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Notes">
              <b-form-textarea v-model="form.notes" rows="3" />
            </b-form-group>
          </b-col>
        </b-row>
        <h6 class="mt-3">Line items</h6>
        <b-table :items="form.items" :fields="itemFields" striped responsive class="mb-2">
          <template #cell(product_id)="data">
            <b-form-select v-model="data.item.product_id" :options="productOptions" value-field="id" text-field="name" size="sm" class="w-100" />
          </template>
          <template #cell(quantity)="data">
            <b-form-input v-model.number="data.item.quantity" type="number" min="0.01" step="0.01" size="sm" />
          </template>
          <template #cell(unit_price)="data">
            <b-form-input v-model.number="data.item.unit_price" type="number" min="0" step="0.01" size="sm" />
          </template>
          <template #cell(discount)="data">
            <b-form-input v-model.number="data.item.discount" type="number" min="0" step="0.01" size="sm" />
          </template>
          <template #cell(actions)="data">
            <b-button size="sm" variant="outline-danger" @click="removeItem(data.index)">Remove</b-button>
          </template>
        </b-table>
        <b-button size="sm" variant="outline-primary" class="mb-3" @click="addItem">Add line</b-button>
        <div class="d-flex gap-2">
          <b-button variant="primary" :disabled="saving" @click="submit">Create invoice</b-button>
          <b-button variant="outline-secondary" :to="{ name: 'seller.crm.invoices' }">Cancel</b-button>
        </div>
      </b-form>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { crmApi } from '@/api'
import { getApiFieldErrors } from '@/types/crm'

const router = useRouter()
const form = reactive<{
  customer_id: number | null
  due_date: string
  payment_method: string
  notes: string
  items: { product_id: number | null; quantity: number; unit_price: number; discount: number }[]
}>({
  customer_id: null,
  due_date: '',
  payment_method: 'cash',
  notes: '',
  items: [{ product_id: null, quantity: 1, unit_price: 0, discount: 0 }],
})
const formErrors = ref<Record<string, string>>({})
const saving = ref(false)
const customerOptions = ref<{ id: number | null; name: string }[]>([{ id: null, name: '— Walk-in —' }])
const productOptions = ref<{ id: number; name: string }[]>([])
const paymentMethodOptions = [
  { value: 'cash', text: 'Cash' },
  { value: 'mpesa', text: 'M-Pesa' },
  { value: 'tigo', text: 'Tigo Pesa' },
  { value: 'airtel', text: 'Airtel Money' },
  { value: 'bank', text: 'Bank' },
  { value: 'credit', text: 'Credit' },
]
const itemFields = [
  { key: 'product_id', label: 'Product' },
  { key: 'quantity', label: 'Qty' },
  { key: 'unit_price', label: 'Unit price' },
  { key: 'discount', label: 'Discount' },
  { key: 'actions', label: '' },
]

function addItem() {
  form.items.push({ product_id: null, quantity: 1, unit_price: 0, discount: 0 })
}

function removeItem(index: number) {
  if (form.items.length > 1) form.items.splice(index, 1)
}

async function loadOptions() {
  try {
    const [custRes, prodRes] = await Promise.all([
      crmApi.getCustomers({ page_size: 500 }),
      crmApi.getProducts({ page_size: 500 }),
    ])
    const custData = custRes.data as { results?: Record<string, unknown>[] }
    const prodData = prodRes.data as { results?: Record<string, unknown>[] }
    const custList = Array.isArray(custData?.results) ? custData.results : []
    const prodList = Array.isArray(prodData?.results) ? prodData.results : []
    customerOptions.value = [{ id: null, name: '— Walk-in —' }, ...custList.map((c) => ({ id: c.id as number, name: String(c.name ?? c.id) }))]
    productOptions.value = prodList.map((p) => ({ id: p.id as number, name: String(p.name ?? p.id) }))
  } catch {}
}

async function submit() {
  formErrors.value = {}
  const items = form.items
    .filter((row) => row.product_id != null && row.quantity > 0)
    .map((row) => ({
      product_id: row.product_id!,
      quantity: Number(row.quantity) || 0,
      unit_price: Number(row.unit_price) || 0,
      discount: Number(row.discount) || 0,
    }))
  if (items.length === 0) {
    formErrors.value = { _form: 'Add at least one line item with a product and quantity.' }
    return
  }
  const payload = {
    customer_id: form.customer_id || undefined,
    due_date: form.due_date || undefined,
    payment_method: form.payment_method || 'cash',
    notes: form.notes?.trim() || undefined,
    items,
  }
  try {
    saving.value = true
    const { data } = await crmApi.createInvoice(payload)
    const created = data as { id?: number }
    if (created?.id != null) {
      router.push({ name: 'seller.crm.invoices.detail', params: { id: String(created.id) } })
    } else {
      router.push({ name: 'seller.crm.invoices' })
    }
  } catch (e: unknown) {
    formErrors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(formErrors.value).length === 0 && msg) formErrors.value = { _form: msg }
  } finally {
    saving.value = false
  }
}

onMounted(loadOptions)
</script>
