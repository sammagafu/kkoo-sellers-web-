<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'seller.crm.products' }">← Back to Products</b-button>
    <b-card title="Add Product (Inventory)">
      <b-alert v-if="errors._form" variant="danger" show>{{ errors._form }}</b-alert>
      <b-form>
        <b-row>
          <b-col md="6">
            <b-form-group label="Name" :invalid-feedback="errors.name">
              <b-form-input v-model="form.name" placeholder="Product name" />
            </b-form-group>
            <b-form-group label="SKU">
              <b-form-input v-model="form.sku" placeholder="Optional, unique per business" />
            </b-form-group>
            <b-form-group label="Barcode">
              <b-form-input v-model="form.barcode" placeholder="Optional, for scanning" />
            </b-form-group>
            <b-form-group label="Cost price" :invalid-feedback="errors.cost_price">
              <b-form-input v-model.number="form.cost_price" type="number" step="0.01" />
            </b-form-group>
            <b-form-group label="Selling price" :invalid-feedback="errors.selling_price">
              <b-form-input v-model.number="form.selling_price" type="number" step="0.01" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Stock quantity" :invalid-feedback="errors.stock_quantity">
              <b-form-input v-model.number="form.stock_quantity" type="number" />
            </b-form-group>
            <b-form-group label="Reorder level">
              <b-form-input v-model.number="form.reorder_level" type="number" placeholder="Alert when stock ≤ this" />
            </b-form-group>
            <b-form-group label="Unit">
              <b-form-input v-model="form.unit" placeholder="e.g. pcs, kg" />
            </b-form-group>
            <b-form-group label="Supplier ID">
              <b-form-input v-model.number="form.supplier_id" type="number" placeholder="Optional" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-button variant="primary" :disabled="saving" @click="onSubmit">Create Product</b-button>
      </b-form>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { crmApi } from '@/api'
import { useCrmBusinessSwitcher } from '@/composables/useCrmBusinessSwitcher'
import { getApiFieldErrors } from '@/types/crm'

const router = useRouter()
const switcher = useCrmBusinessSwitcher()
const form = ref({
  name: '',
  sku: '',
  barcode: '',
  cost_price: null as number | null,
  selling_price: null as number | null,
  stock_quantity: 0,
  reorder_level: null as number | null,
  unit: '',
  supplier_id: null as number | null,
})
const errors = ref<Record<string, string>>({})
const saving = ref(false)

onMounted(() => switcher.loadBusinesses())

async function onSubmit() {
  errors.value = {}
  const payload: Record<string, unknown> = {
    name: form.value.name?.trim() || '',
    sku: form.value.sku?.trim() || undefined,
    barcode: form.value.barcode?.trim() || undefined,
    cost_price: form.value.cost_price != null ? form.value.cost_price : undefined,
    selling_price: form.value.selling_price != null ? form.value.selling_price : undefined,
    stock_quantity: form.value.stock_quantity ?? 0,
    reorder_level: form.value.reorder_level != null ? form.value.reorder_level : undefined,
    unit: form.value.unit?.trim() || undefined,
    supplier_id: form.value.supplier_id != null ? form.value.supplier_id : undefined,
  }
  const bid = switcher.selectedBusinessId.value
  if (bid != null) payload.business_id = bid
  try {
    saving.value = true
    const { data } = await crmApi.createProduct(payload)
    const created = (data ?? {}) as Record<string, unknown>
    const id = created.id ?? created
    await router.replace({ name: 'seller.crm.products.detail', params: { id: String(id) } })
  } catch (e: unknown) {
    errors.value = getApiFieldErrors(e)
    const msg = (e as { message?: string }).message
    if (Object.keys(errors.value).length === 0 && msg) errors.value = { _form: msg }
  } finally {
    saving.value = false
  }
}
</script>
