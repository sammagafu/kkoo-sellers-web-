<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.crm.products' }">← Back to Products</b-button>
    <b-card v-if="product" :title="editing ? 'Edit product' : 'Product detail'">
      <template v-if="!editing">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <span />
          <b-button variant="outline-primary" size="sm" @click="startEdit">Edit</b-button>
        </div>
        <b-row>
          <b-col md="6">
            <p class="mb-1"><strong>Name</strong> {{ product.name || '—' }}</p>
            <p class="mb-1"><strong>SKU</strong> {{ product.sku || '—' }}</p>
            <p class="mb-1"><strong>Barcode</strong> {{ product.barcode || '—' }}</p>
            <p class="mb-1"><strong>Cost price</strong> {{ formatCurrency(product.cost_price) }}</p>
            <p class="mb-1"><strong>Selling price</strong> {{ formatCurrency(product.selling_price) }}</p>
          </b-col>
          <b-col md="6">
            <p class="mb-1"><strong>Stock quantity</strong> {{ product.stock_quantity ?? '—' }}</p>
            <p class="mb-1"><strong>Reorder level</strong> {{ product.reorder_level ?? '—' }}</p>
            <p class="mb-1"><strong>Unit</strong> {{ product.unit || '—' }}</p>
            <p class="mb-1"><strong>Supplier ID</strong> {{ product.supplier_id ?? '—' }}</p>
          </b-col>
        </b-row>
      </template>
      <template v-else>
        <b-alert v-if="editErrors._form" variant="danger" show>{{ editErrors._form }}</b-alert>
        <b-form>
          <b-row>
            <b-col md="6">
              <b-form-group label="Name" :invalid-feedback="editErrors.name">
                <b-form-input v-model="editForm.name" />
              </b-form-group>
              <b-form-group label="SKU" :invalid-feedback="editErrors.sku">
                <b-form-input v-model="editForm.sku" />
              </b-form-group>
              <b-form-group label="Barcode">
                <b-form-input v-model="editForm.barcode" />
              </b-form-group>
              <b-form-group label="Cost price" :invalid-feedback="editErrors.cost_price">
                <b-form-input v-model.number="editForm.cost_price" type="number" step="0.01" />
              </b-form-group>
              <b-form-group label="Selling price" :invalid-feedback="editErrors.selling_price">
                <b-form-input v-model.number="editForm.selling_price" type="number" step="0.01" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Stock quantity" :invalid-feedback="editErrors.stock_quantity">
                <b-form-input v-model.number="editForm.stock_quantity" type="number" />
              </b-form-group>
              <b-form-group label="Reorder level">
                <b-form-input v-model.number="editForm.reorder_level" type="number" />
              </b-form-group>
              <b-form-group label="Unit">
                <b-form-input v-model="editForm.unit" placeholder="e.g. pcs, kg" />
              </b-form-group>
              <b-form-group label="Supplier ID">
                <b-form-input v-model.number="editForm.supplier_id" type="number" placeholder="Optional" />
              </b-form-group>
            </b-col>
          </b-row>
          <div class="d-flex gap-2 mt-2">
            <b-button variant="primary" size="sm" :disabled="editSaving" @click="saveEdit">Save</b-button>
            <b-button variant="outline-secondary" size="sm" :disabled="editSaving" @click="cancelEdit">Cancel</b-button>
          </div>
        </b-form>
      </template>
    </b-card>
    <b-card v-else-if="loading" title="Product detail"><p class="text-muted">Loading…</p></b-card>
    <b-alert v-else-if="error" variant="danger" show>{{ error }}</b-alert>
    <EmptyState v-else title="Product not found" />
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
const product = ref<Record<string, unknown> | null>(null)
const loading = ref(false)
const error = ref('')
const editing = ref(false)
const editForm = ref({
  name: '',
  sku: '',
  barcode: '',
  cost_price: null as number | null,
  selling_price: null as number | null,
  stock_quantity: null as number | null,
  reorder_level: null as number | null,
  unit: '',
  supplier_id: null as number | null,
})
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
  if (!product.value) return
  editForm.value = {
    name: String(product.value.name ?? ''),
    sku: String(product.value.sku ?? ''),
    barcode: String(product.value.barcode ?? ''),
    cost_price: product.value.cost_price != null ? Number(product.value.cost_price) : null,
    selling_price: product.value.selling_price != null ? Number(product.value.selling_price) : null,
    stock_quantity: product.value.stock_quantity != null ? Number(product.value.stock_quantity) : null,
    reorder_level: product.value.reorder_level != null ? Number(product.value.reorder_level) : null,
    unit: String(product.value.unit ?? ''),
    supplier_id: product.value.supplier_id != null ? Number(product.value.supplier_id) : null,
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
  const payload: Record<string, unknown> = {
    name: editForm.value.name?.trim() || '',
    sku: editForm.value.sku?.trim() || undefined,
    barcode: editForm.value.barcode?.trim() || undefined,
    cost_price: editForm.value.cost_price != null ? editForm.value.cost_price : undefined,
    selling_price: editForm.value.selling_price != null ? editForm.value.selling_price : undefined,
    stock_quantity: editForm.value.stock_quantity != null ? editForm.value.stock_quantity : undefined,
    reorder_level: editForm.value.reorder_level != null ? editForm.value.reorder_level : undefined,
    unit: editForm.value.unit?.trim() || undefined,
    supplier_id: editForm.value.supplier_id != null ? editForm.value.supplier_id : undefined,
  }
  try {
    editSaving.value = true
    await crmApi.updateProduct(id.value, payload)
    product.value = { ...product.value!, ...payload }
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
  product.value = null
  try {
    const { data } = await crmApi.getProduct(id.value)
    product.value = (data ?? {}) as Record<string, unknown>
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load product'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
