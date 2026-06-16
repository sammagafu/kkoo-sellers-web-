<template>
  <VerticalLayout>
    <b-card title="Ride / delivery promotions">
      <p class="text-muted">Promo codes that apply to delivery/ride fees.</p>
      <b-alert v-if="endpointUnavailable" variant="info" show class="mb-3">
        <strong>Endpoint not available.</strong> The backend does not yet expose
        <code>GET /api/v1/promotions/admin/ride-promotions/</code>. Add this route in kkoo-fiber to list and manage ride/delivery promotions.
      </b-alert>
      <template v-else>
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <b-form-select v-model="activeFilter" :options="[{ value: '', text: 'All' }, { value: 'true', text: 'Active' }, { value: 'false', text: 'Inactive' }]" class="w-auto" @change="load" />
          <b-button variant="primary" @click="openCreate">Create ride promotion</b-button>
        </div>
        <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
          <template #cell(actions)="row">
            <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(row.item)">Edit</b-button>
          </template>
        </b-table>
        <p v-else-if="loading" class="text-muted">Loading…</p>
        <p v-else-if="error" class="text-danger">{{ error }}</p>
        <EmptyState v-else />
      </template>

      <b-modal v-model="showModal" :title="editId ? 'Edit ride promotion' : 'Create ride promotion'" @ok="onSave">
        <b-form>
          <b-form-group label="Code"><b-form-input v-model="form.code" /></b-form-group>
          <b-form-group label="Discount type"><b-form-select v-model="form.discount_type" :options="[{ value: 'percent', text: 'Percent' }, { value: 'fixed', text: 'Fixed' }]" /></b-form-group>
          <b-form-group label="Discount value"><b-form-input v-model.number="form.discount_value" type="number" step="0.01" /></b-form-group>
          <b-form-group label="Min delivery fee"><b-form-input v-model.number="form.min_delivery_fee" type="number" step="0.01" /></b-form-group>
          <b-form-group label="Valid from"><b-form-input v-model="form.valid_from" type="datetime-local" /></b-form-group>
          <b-form-group label="Valid until"><b-form-input v-model="form.valid_until" type="datetime-local" /></b-form-group>
          <b-form-group label="Max uses"><b-form-input v-model.number="form.max_uses" type="number" min="0" /></b-form-group>
          <b-form-checkbox v-model="form.is_active">Active</b-form-checkbox>
        </b-form>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, reactive, onMounted } from 'vue'
import { promotionsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const endpointUnavailable = ref(false)
const activeFilter = ref('')
const items = ref<Record<string, unknown>[]>([])
const showModal = ref(false)
const editId = ref<number | null>(null)
const form = reactive({
  code: '',
  discount_type: 'percent',
  discount_value: 0,
  min_delivery_fee: 0,
  valid_from: '',
  valid_until: '',
  max_uses: null as number | null,
  is_active: true,
})

const fields = [
  { key: 'id', label: 'ID' },
  { key: 'code', label: 'Code' },
  { key: 'discount_type', label: 'Type' },
  { key: 'discount_value', label: 'Value' },
  { key: 'min_delivery_fee', label: 'Min fee' },
  { key: 'valid_from', label: 'Valid from' },
  { key: 'valid_until', label: 'Valid until' },
  { key: 'uses_count', label: 'Uses' },
  { key: 'is_active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

async function load() {
  loading.value = true
  error.value = ''
  endpointUnavailable.value = false
  try {
    const { data } = await promotionsAdminApi.listRidePromotions(
      activeFilter.value ? { is_active: activeFilter.value === 'true' } : undefined
    )
    const raw = (data as { results?: unknown[] })?.results ?? (Array.isArray(data) ? data : [])
    items.value = raw as Record<string, unknown>[]
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 405) {
      endpointUnavailable.value = true
    } else {
      error.value = formatApiError(e, 'Failed to load ride promotions')
    }
    items.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editId.value = null
  form.code = ''
  form.discount_type = 'percent'
  form.discount_value = 0
  form.min_delivery_fee = 0
  form.valid_from = ''
  form.valid_until = ''
  form.max_uses = null
  form.is_active = true
  showModal.value = true
}

function openEdit(item: Record<string, unknown>) {
  editId.value = item.id as number
  form.code = String(item.code ?? '')
  form.discount_type = String(item.discount_type ?? 'percent')
  form.discount_value = Number(item.discount_value ?? 0)
  form.min_delivery_fee = Number(item.min_delivery_fee ?? 0)
  form.valid_from = item.valid_from ? String(item.valid_from).slice(0, 16) : ''
  form.valid_until = item.valid_until ? String(item.valid_until).slice(0, 16) : ''
  form.max_uses = item.max_uses != null ? Number(item.max_uses) : null
  form.is_active = Boolean(item.is_active)
  showModal.value = true
}

async function save(): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      code: form.code,
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      min_delivery_fee: form.min_delivery_fee,
      valid_from: form.valid_from || undefined,
      valid_until: form.valid_until || undefined,
      max_uses: form.max_uses ?? undefined,
      is_active: form.is_active,
    }
    if (editId.value) await promotionsAdminApi.updateRidePromotion(editId.value, payload)
    else await promotionsAdminApi.createRidePromotion(payload)
    await load()
    return true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
    return false
  }
}

function onSave(ev: Event) {
  save().then((ok) => {
    if (!ok && ev) (ev as { preventDefault?: () => void }).preventDefault?.()
  })
}

onMounted(load)
</script>
