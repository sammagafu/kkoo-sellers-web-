<template>
  <VerticalLayout>
    <b-card title="Delivery Zones">
      <p class="text-muted">Manage delivery zones and pricing (base fee, per km, min/max).</p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-if="zones.length" :items="zones" :fields="zoneFields" striped responsive>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" @click="openPricing(row.item)">Pricing</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />

      <b-modal v-model="showPricingModal" title="Zone pricing" @ok="savePricing" @hidden="pricingTarget = null">
        <p v-if="pricingTarget">Zone: {{ pricingTarget.name ?? pricingTarget.id }}</p>
        <b-form-group label="Base fee">
          <b-form-input v-model.number="pricingForm.base_fee" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Per km fee">
          <b-form-input v-model.number="pricingForm.per_km_fee" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Min fee">
          <b-form-input v-model.number="pricingForm.min_fee" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Max fee">
          <b-form-input v-model.number="pricingForm.max_fee" type="number" step="0.01" min="0" />
        </b-form-group>
        <b-form-group label="Currency">
          <b-form-input v-model="pricingForm.currency" placeholder="TZS" />
        </b-form-group>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, onMounted } from 'vue'
import { logisticsAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const error = ref('')
const zones = ref<Record<string, unknown>[]>([])
const showPricingModal = ref(false)
const pricingTarget = ref<Record<string, unknown> | null>(null)
const pricingForm = ref({ base_fee: 0, per_km_fee: 0, min_fee: 0, max_fee: 0, currency: 'TZS' })

const zoneFields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'code', label: 'Code' },
  { key: 'is_active', label: 'Active' },
  { key: 'actions', label: 'Actions' },
]

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await logisticsAdminApi.listZones()
    zones.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load zones')
    zones.value = []
  } finally {
    loading.value = false
  }
}

function openPricing(zone: Record<string, unknown>) {
  pricingTarget.value = zone
  pricingForm.value = { base_fee: 0, per_km_fee: 0, min_fee: 0, max_fee: 0, currency: 'TZS' }
  showPricingModal.value = true
  const id = zone.id as number
  if (id) {
    logisticsAdminApi.getZonePricing(id).then(({ data }) => {
      const d = (data ?? {}) as Record<string, unknown>
      pricingForm.value = {
        base_fee: Number(d.base_fee ?? 0),
        per_km_fee: Number(d.per_km_fee ?? 0),
        min_fee: Number(d.min_fee ?? 0),
        max_fee: Number(d.max_fee ?? 0),
        currency: String(d.currency ?? 'TZS'),
      }
    }).catch(() => {})
  }
}

async function savePricing() {
  const zone = pricingTarget.value
  const id = zone?.id as number
  if (!id) return
  try {
    await logisticsAdminApi.setZonePricing(id, {
      base_fee: pricingForm.value.base_fee,
      per_km_fee: pricingForm.value.per_km_fee,
      min_fee: pricingForm.value.min_fee,
      max_fee: pricingForm.value.max_fee,
      currency: pricingForm.value.currency || undefined,
    })
    showPricingModal.value = false
    pricingTarget.value = null
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to save pricing')
  }
}

onMounted(load)
</script>
