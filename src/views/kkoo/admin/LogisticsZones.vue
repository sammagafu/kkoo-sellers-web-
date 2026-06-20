<template>
  <VerticalLayout>
    <b-card title="Delivery regions">
      <p class="text-muted">
        City-level service areas across countries. Toggle <strong>Active</strong> to unlock a county/city
        (e.g. Arusha, Nairobi). Buyers see locked cities as “coming soon” until you unlock them.
      </p>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="primary" size="sm" @click="showCreateModal = true">Add region</b-button>
        <b-button variant="outline-primary" size="sm" @click="load">Refresh</b-button>
      </div>
      <p v-if="error" class="text-danger">{{ error }}</p>
      <b-table v-if="zones.length" :items="zones" :fields="zoneFields" striped responsive>
        <template #cell(country_code)="row">
          <span>{{ row.item.country_code || 'TZ' }}</span>
        </template>
        <template #cell(is_active)="row">
          <b-form-checkbox
            switch
            :checked="row.item.is_active === true"
            :disabled="togglingId === row.item.id"
            @change="(v: boolean) => toggleActive(row.item, v)"
          />
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-primary" @click="openPricing(row.item)">Pricing</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted">Loading…</p>
      <EmptyState v-else />

      <b-modal v-model="showCreateModal" title="Add service region" @ok="createZone" @hidden="resetCreateForm">
        <b-form-group label="City name">
          <b-form-input v-model="createForm.name" placeholder="e.g. Nairobi" />
        </b-form-group>
        <b-form-group label="Code (unique slug)">
          <b-form-input v-model="createForm.code" placeholder="e.g. nairobi" />
        </b-form-group>
        <b-form-group label="Country code">
          <b-form-input v-model="createForm.country_code" placeholder="TZ, KE, UG, NG…" />
        </b-form-group>
        <b-row>
          <b-col>
            <b-form-group label="Center lat">
              <b-form-input v-model.number="createForm.center_lat" type="number" step="0.0001" />
            </b-form-group>
          </b-col>
          <b-col>
            <b-form-group label="Center lng">
              <b-form-input v-model.number="createForm.center_lng" type="number" step="0.0001" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Radius km (auto bounds)">
          <b-form-input v-model.number="createForm.radius_km" type="number" step="1" min="5" />
        </b-form-group>
        <b-row>
          <b-col>
            <b-form-group label="Base fee">
              <b-form-input v-model.number="createForm.base_fee" type="number" step="0.01" min="0" />
            </b-form-group>
          </b-col>
          <b-col>
            <b-form-group label="Per km fee">
              <b-form-input v-model.number="createForm.per_km_fee" type="number" step="0.01" min="0" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Currency">
          <b-form-input v-model="createForm.currency" placeholder="TZS, KES, UGX…" />
        </b-form-group>
        <b-form-checkbox v-model="createForm.is_active">Unlock immediately</b-form-checkbox>
      </b-modal>

      <b-modal v-model="showPricingModal" title="Region pricing" @ok="savePricing" @hidden="pricingTarget = null">
        <p v-if="pricingTarget">Region: {{ pricingTarget.name ?? pricingTarget.id }}</p>
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
const togglingId = ref<number | null>(null)
const showPricingModal = ref(false)
const showCreateModal = ref(false)
const pricingTarget = ref<Record<string, unknown> | null>(null)
const pricingForm = ref({ base_fee: 0, per_km_fee: 0, min_fee: 0, max_fee: 0, currency: 'TZS' })
const createForm = ref({
  name: '',
  code: '',
  country_code: 'TZ',
  center_lat: -6.7924,
  center_lng: 39.2083,
  radius_km: 25,
  base_fee: 3500,
  per_km_fee: 850,
  currency: 'TZS',
  is_active: false,
})

const zoneFields = [
  { key: 'name', label: 'City' },
  { key: 'country_code', label: 'Country' },
  { key: 'code', label: 'Code' },
  { key: 'is_active', label: 'Active (unlocked)' },
  { key: 'actions', label: 'Actions' },
]

function normalizeList(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) return data
  const obj = data as { results?: unknown[] }
  return (obj?.results ?? []) as Record<string, unknown>[]
}

function resetCreateForm() {
  createForm.value = {
    name: '',
    code: '',
    country_code: 'TZ',
    center_lat: -6.7924,
    center_lng: 39.2083,
    radius_km: 25,
    base_fee: 3500,
    per_km_fee: 850,
    currency: 'TZS',
    is_active: false,
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await logisticsAdminApi.listZones()
    zones.value = normalizeList(data)
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load regions')
    zones.value = []
  } finally {
    loading.value = false
  }
}

async function toggleActive(zone: Record<string, unknown>, active: boolean) {
  const id = zone.id as number
  if (!id) return
  togglingId.value = id
  error.value = ''
  try {
    await logisticsAdminApi.updateZone(id, { is_active: active })
    zone.is_active = active
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to update region')
    await load()
  } finally {
    togglingId.value = null
  }
}

async function createZone(event: Event) {
  event.preventDefault()
  error.value = ''
  try {
    await logisticsAdminApi.createZone({
      name: createForm.value.name.trim(),
      code: createForm.value.code.trim().toLowerCase(),
      country_code: createForm.value.country_code.trim().toUpperCase(),
      center_lat: createForm.value.center_lat,
      center_lng: createForm.value.center_lng,
      radius_km: createForm.value.radius_km,
      base_fee: createForm.value.base_fee,
      per_km_fee: createForm.value.per_km_fee,
      currency: createForm.value.currency.trim(),
      is_active: createForm.value.is_active,
    })
    showCreateModal.value = false
    resetCreateForm()
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to create region')
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
