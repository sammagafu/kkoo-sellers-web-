<template>
  <VerticalLayout>
    <b-row>
      <b-col>
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.logistics.zones' }">Back to Delivery Zones</b-button>
        </div>
        <b-card title="Logistics Settings" class="mb-4">
          <p class="text-muted">Commission, payout rules, and minimum payout. Changes apply to rider earnings calculation.</p>
          <b-alert v-if="endpointUnavailable" variant="info" show class="mb-0">
            <strong>Endpoint not available.</strong> The backend does not yet expose
            <code>GET /api/v1/logistics/settings/</code> (and <code>PUT /api/v1/logistics/settings/</code>).
            Add these routes in kkoo-fiber to enable this page. Expected: return an object with
            <code>delivery_commission_percent</code>, <code>payout_every_n_rides</code>,
            <code>free_rides_before_payout</code>, <code>min_payout_amount</code>, and optional
            <code>updated_at</code> / <code>updated_by</code>.
          </b-alert>
          <b-form v-else-if="settings" @submit.prevent="save">
            <b-row>
              <b-col md="6">
                <b-form-group label="Delivery commission (%)" label-for="commission">
                  <b-form-input
                    id="commission"
                    v-model.number="form.delivery_commission_percent"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Payout every N rides" label-for="payout-every">
                  <b-form-input
                    id="payout-every"
                    v-model.number="form.payout_every_n_rides"
                    type="number"
                    min="1"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="6">
                <b-form-group label="Free rides before first payout" label-for="free-rides">
                  <b-form-input
                    id="free-rides"
                    v-model.number="form.free_rides_before_payout"
                    type="number"
                    min="0"
                  />
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Minimum payout amount" label-for="min-payout">
                  <b-form-input
                    id="min-payout"
                    v-model.number="form.min_payout_amount"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <p v-if="settings.updated_at" class="text-muted small">Last updated: {{ settings.updated_at }}</p>
            <b-button type="submit" variant="primary" :disabled="saving">Save</b-button>
            <b-alert v-if="saveError" variant="danger" show class="mt-2">{{ saveError }}</b-alert>
          </b-form>
          <p v-else-if="loading" class="text-muted">Loading…</p>
          <p v-else-if="error" class="text-danger">{{ error }}</p>
        </b-card>

        <b-card title="Smart Dispatch Rules">
          <p class="text-muted">
            Control directed offers, search radius, reassignment pacing, and same-route bundle tolerance.
          </p>
          <p v-if="dispatchLoading" class="text-muted">Loading dispatch rules…</p>
          <b-alert v-else-if="dispatchError" variant="danger" show class="mb-0">{{ dispatchError }}</b-alert>
          <b-form v-else @submit.prevent="saveDispatch">
            <b-row>
              <b-col md="6">
                <b-form-group label="Directed offers" label-for="dispatch-directed">
                  <b-form-checkbox id="dispatch-directed" v-model="dispatchForm.dispatch_directed_offers_enabled" switch>
                    Auto-offer work to the best rider before falling back
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Bundling enabled" label-for="dispatch-bundle">
                  <b-form-checkbox id="dispatch-bundle" v-model="dispatchForm.dispatch_bundle_enabled" switch>
                    Allow same-direction bundle offers when pickup and dropoff stay close
                  </b-form-checkbox>
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="4">
                <b-form-group label="Default search radius (m)" label-for="dispatch-default-radius">
                  <b-form-input
                    id="dispatch-default-radius"
                    v-model.number="dispatchForm.default_search_radius_meters"
                    type="number"
                    min="200"
                    step="100"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Max search radius (m)" label-for="dispatch-max-radius">
                  <b-form-input
                    id="dispatch-max-radius"
                    v-model.number="dispatchForm.max_search_radius_meters"
                    type="number"
                    min="200"
                    step="100"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Offer timeout (sec)" label-for="dispatch-timeout">
                  <b-form-input
                    id="dispatch-timeout"
                    v-model.number="dispatchForm.offer_timeout_seconds"
                    type="number"
                    min="4"
                    step="1"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="4">
                <b-form-group label="Max reassignments" label-for="dispatch-reassignments">
                  <b-form-input
                    id="dispatch-reassignments"
                    v-model.number="dispatchForm.max_reassignments"
                    type="number"
                    min="0"
                    step="1"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Bundle pickup radius (m)" label-for="dispatch-bundle-pickup">
                  <b-form-input
                    id="dispatch-bundle-pickup"
                    v-model.number="dispatchForm.bundle_pickup_radius_meters"
                    type="number"
                    min="0"
                    step="50"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Bundle dropoff radius (m)" label-for="dispatch-bundle-dropoff">
                  <b-form-input
                    id="dispatch-bundle-dropoff"
                    v-model.number="dispatchForm.bundle_dropoff_radius_meters"
                    type="number"
                    min="0"
                    step="50"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <b-row>
              <b-col md="4">
                <b-form-group label="Max added ETA for bundle (min)" label-for="dispatch-bundle-eta">
                  <b-form-input
                    id="dispatch-bundle-eta"
                    v-model.number="dispatchForm.bundle_max_added_eta_minutes"
                    type="number"
                    min="0"
                    step="1"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <p v-if="dispatchUpdatedAt" class="text-muted small">Last updated: {{ dispatchUpdatedAt }}</p>
            <b-button type="submit" variant="primary" :disabled="dispatchSaving">Save dispatch rules</b-button>
          </b-form>
        </b-card>
      </b-col>
    </b-row>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, reactive, onMounted } from 'vue'
import { logisticsAdminApi, type DispatchRulesPayload } from '@/api'
import { formatApiError } from '@/utils/formatApiError'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const saveError = ref('')
const dispatchLoading = ref(false)
const dispatchSaving = ref(false)
const dispatchError = ref('')
/** True when backend returns 404/405 for GET settings (endpoint not implemented). */
const endpointUnavailable = ref(false)
const settings = ref<{
  delivery_commission_percent?: number
  payout_every_n_rides?: number
  free_rides_before_payout?: number
  min_payout_amount?: number
  updated_at?: string
} | null>(null)

const form = reactive({
  delivery_commission_percent: 0,
  payout_every_n_rides: 1,
  free_rides_before_payout: 0,
  min_payout_amount: 0,
})

const dispatchForm = reactive<DispatchRulesPayload>({
  dispatch_directed_offers_enabled: true,
  dispatch_bundle_enabled: true,
  default_search_radius_meters: 2500,
  max_search_radius_meters: 7000,
  offer_timeout_seconds: 12,
  max_reassignments: 4,
  bundle_pickup_radius_meters: 700,
  bundle_dropoff_radius_meters: 1500,
  bundle_max_added_eta_minutes: 12,
})
const dispatchUpdatedAt = ref('')

async function load() {
  loading.value = true
  error.value = ''
  endpointUnavailable.value = false
  try {
    const { data } = await logisticsAdminApi.getSettings()
    settings.value = (data ?? {}) as typeof settings.value
    form.delivery_commission_percent = settings.value?.delivery_commission_percent ?? 0
    form.payout_every_n_rides = settings.value?.payout_every_n_rides ?? 1
    form.free_rides_before_payout = settings.value?.free_rides_before_payout ?? 0
    form.min_payout_amount = settings.value?.min_payout_amount ?? 0
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number } })?.response?.status
    if (status === 404 || status === 405) {
      endpointUnavailable.value = true
    } else {
      error.value = formatApiError(e, 'Failed to load settings')
    }
  } finally {
    loading.value = false
  }
}

function assignDispatchForm(src: DispatchRulesPayload) {
  dispatchForm.dispatch_directed_offers_enabled = src.dispatch_directed_offers_enabled ?? true
  dispatchForm.dispatch_bundle_enabled = src.dispatch_bundle_enabled ?? true
  dispatchForm.default_search_radius_meters = src.default_search_radius_meters ?? 2500
  dispatchForm.max_search_radius_meters = src.max_search_radius_meters ?? 7000
  dispatchForm.offer_timeout_seconds = src.offer_timeout_seconds ?? 12
  dispatchForm.max_reassignments = src.max_reassignments ?? 4
  dispatchForm.bundle_pickup_radius_meters = src.bundle_pickup_radius_meters ?? 700
  dispatchForm.bundle_dropoff_radius_meters = src.bundle_dropoff_radius_meters ?? 1500
  dispatchForm.bundle_max_added_eta_minutes = src.bundle_max_added_eta_minutes ?? 12
  dispatchUpdatedAt.value = src.updated_at ?? ''
}

async function loadDispatchRules() {
  dispatchLoading.value = true
  dispatchError.value = ''
  try {
    const { data } = await logisticsAdminApi.getDispatchRules()
    assignDispatchForm((data ?? {}) as DispatchRulesPayload)
  } catch (e: unknown) {
    dispatchError.value = formatApiError(e, 'Failed to load dispatch rules')
  } finally {
    dispatchLoading.value = false
  }
}

async function save() {
  saveError.value = ''
  saving.value = true
  try {
    await logisticsAdminApi.updateSettings({
      delivery_commission_percent: form.delivery_commission_percent,
      payout_every_n_rides: form.payout_every_n_rides,
      free_rides_before_payout: form.free_rides_before_payout,
      min_payout_amount: form.min_payout_amount,
    })
    await load()
  } catch (e: unknown) {
    saveError.value = formatApiError(e, 'Failed to save settings')
  } finally {
    saving.value = false
  }
}

async function saveDispatch() {
  dispatchSaving.value = true
  dispatchError.value = ''
  try {
    const { data } = await logisticsAdminApi.updateDispatchRules({
      dispatch_directed_offers_enabled: Boolean(dispatchForm.dispatch_directed_offers_enabled),
      dispatch_bundle_enabled: Boolean(dispatchForm.dispatch_bundle_enabled),
      default_search_radius_meters: Number(dispatchForm.default_search_radius_meters) || 2500,
      max_search_radius_meters: Number(dispatchForm.max_search_radius_meters) || 7000,
      offer_timeout_seconds: Number(dispatchForm.offer_timeout_seconds) || 12,
      max_reassignments: Number(dispatchForm.max_reassignments) || 0,
      bundle_pickup_radius_meters: Number(dispatchForm.bundle_pickup_radius_meters) || 0,
      bundle_dropoff_radius_meters: Number(dispatchForm.bundle_dropoff_radius_meters) || 0,
      bundle_max_added_eta_minutes: Number(dispatchForm.bundle_max_added_eta_minutes) || 0,
    })
    assignDispatchForm((data ?? {}) as DispatchRulesPayload)
  } catch (e: unknown) {
    dispatchError.value = formatApiError(e, 'Failed to save dispatch rules')
  } finally {
    dispatchSaving.value = false
  }
}

onMounted(() => {
  load()
  loadDispatchRules()
})
</script>
