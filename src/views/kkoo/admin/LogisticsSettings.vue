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

        <b-card v-if="!endpointUnavailable && settings" title="Passenger ride pricing" class="mb-4">
          <p class="text-muted mb-3">
            Per-kilometre rates by fuel type for ride quotes. Set each type separately — fuel, gas/LPG, and EV should not share the same rate.
            Leave at <strong>0</strong> to fall back to the zone per-km from Delivery Zones.
          </p>
          <b-form @submit.prevent="savePassengerPricing">
            <b-row>
              <b-col md="4">
                <b-form-group label="Per km — fuel (petrol/diesel)" label-for="per-km-fuel">
                  <b-form-input
                    id="per-km-fuel"
                    v-model.number="passengerForm.passenger_per_km_fuel"
                    type="number"
                    min="0"
                    step="1"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Per km — gas / LPG" label-for="per-km-gas">
                  <b-form-input
                    id="per-km-gas"
                    v-model.number="passengerForm.passenger_per_km_gas"
                    type="number"
                    min="0"
                    step="1"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Per km — electric (EV)" label-for="per-km-ev">
                  <b-form-input
                    id="per-km-ev"
                    v-model.number="passengerForm.passenger_per_km_ev"
                    type="number"
                    min="0"
                    step="1"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <p class="text-muted small mb-2">Vehicle fare multipliers (optional; 0 = system default)</p>
            <b-row>
              <b-col md="4">
                <b-form-group label="Boda multiplier" label-for="mult-boda">
                  <b-form-input
                    id="mult-boda"
                    v-model.number="passengerForm.passenger_vehicle_mult_boda"
                    type="number"
                    min="0"
                    max="3"
                    step="0.01"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Bajaj multiplier" label-for="mult-bajaj">
                  <b-form-input
                    id="mult-bajaj"
                    v-model.number="passengerForm.passenger_vehicle_mult_bajaj"
                    type="number"
                    min="0"
                    max="3"
                    step="0.01"
                  />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Car multiplier" label-for="mult-car">
                  <b-form-input
                    id="mult-car"
                    v-model.number="passengerForm.passenger_vehicle_mult_car"
                    type="number"
                    min="0"
                    max="3"
                    step="0.01"
                  />
                </b-form-group>
              </b-col>
            </b-row>
            <b-button type="submit" variant="primary" :disabled="passengerSaving">Save passenger pricing</b-button>
            <b-alert v-if="passengerSaveError" variant="danger" show class="mt-2">{{ passengerSaveError }}</b-alert>
          </b-form>
        </b-card>

        <b-card v-if="!endpointUnavailable && settings" title="Send me distance pricing" class="mb-4">
          <p class="text-muted mb-3">
            How far from the buyer’s delivery point a store can be before a per-km surcharge applies on Send me catalog picks.
          </p>
          <b-form @submit.prevent="saveBuyForMePricing">
            <b-row>
              <b-col md="6">
                <b-form-group label="Free radius (metres)" label-for="bfm-free-radius">
                  <b-form-input
                    id="bfm-free-radius"
                    v-model.number="buyForMeForm.buy_for_me_free_radius_meters"
                    type="number"
                    min="0"
                    step="100"
                  />
                  <small class="text-muted">Stores within this distance have no distance surcharge.</small>
                </b-form-group>
              </b-col>
              <b-col md="6">
                <b-form-group label="Per km surcharge (TZS)" label-for="bfm-per-km">
                  <b-form-input
                    id="bfm-per-km"
                    v-model.number="buyForMeForm.buy_for_me_per_km_surcharge_tzs"
                    type="number"
                    min="0"
                    step="50"
                  />
                  <small class="text-muted">Charged for each km beyond the free radius.</small>
                </b-form-group>
              </b-col>
            </b-row>
            <b-button type="submit" variant="primary" :disabled="buyForMeSaving">Save Send me pricing</b-button>
            <b-alert v-if="buyForMeSaveError" variant="danger" show class="mt-2">{{ buyForMeSaveError }}</b-alert>
          </b-form>
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
  passenger_per_km_fuel?: number
  passenger_per_km_gas?: number
  passenger_per_km_ev?: number
  passenger_vehicle_mult_boda?: number
  passenger_vehicle_mult_bajaj?: number
  passenger_vehicle_mult_car?: number
  buy_for_me_free_radius_meters?: number
  buy_for_me_per_km_surcharge_tzs?: number
  updated_at?: string
} | null>(null)

const form = reactive({
  delivery_commission_percent: 0,
  payout_every_n_rides: 1,
  free_rides_before_payout: 0,
  min_payout_amount: 0,
})

const passengerForm = reactive({
  passenger_per_km_fuel: 0,
  passenger_per_km_gas: 0,
  passenger_per_km_ev: 0,
  passenger_vehicle_mult_boda: 0,
  passenger_vehicle_mult_bajaj: 0,
  passenger_vehicle_mult_car: 0,
})
const passengerSaving = ref(false)
const passengerSaveError = ref('')

const buyForMeForm = reactive({
  buy_for_me_free_radius_meters: 2000,
  buy_for_me_per_km_surcharge_tzs: 500,
})
const buyForMeSaving = ref(false)
const buyForMeSaveError = ref('')

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
    passengerForm.passenger_per_km_fuel = settings.value?.passenger_per_km_fuel ?? 0
    passengerForm.passenger_per_km_gas = settings.value?.passenger_per_km_gas ?? 0
    passengerForm.passenger_per_km_ev = settings.value?.passenger_per_km_ev ?? 0
    passengerForm.passenger_vehicle_mult_boda = settings.value?.passenger_vehicle_mult_boda ?? 0
    passengerForm.passenger_vehicle_mult_bajaj = settings.value?.passenger_vehicle_mult_bajaj ?? 0
    passengerForm.passenger_vehicle_mult_car = settings.value?.passenger_vehicle_mult_car ?? 0
    buyForMeForm.buy_for_me_free_radius_meters = settings.value?.buy_for_me_free_radius_meters ?? 2000
    buyForMeForm.buy_for_me_per_km_surcharge_tzs = settings.value?.buy_for_me_per_km_surcharge_tzs ?? 500
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

async function saveBuyForMePricing() {
  buyForMeSaveError.value = ''
  buyForMeSaving.value = true
  try {
    await logisticsAdminApi.updateSettings({
      buy_for_me_free_radius_meters: buyForMeForm.buy_for_me_free_radius_meters,
      buy_for_me_per_km_surcharge_tzs: buyForMeForm.buy_for_me_per_km_surcharge_tzs,
    })
    await load()
  } catch (e: unknown) {
    buyForMeSaveError.value = formatApiError(e, 'Failed to save Send me pricing')
  } finally {
    buyForMeSaving.value = false
  }
}

async function savePassengerPricing() {
  passengerSaveError.value = ''
  passengerSaving.value = true
  try {
    await logisticsAdminApi.updateSettings({
      passenger_per_km_fuel: passengerForm.passenger_per_km_fuel,
      passenger_per_km_gas: passengerForm.passenger_per_km_gas,
      passenger_per_km_ev: passengerForm.passenger_per_km_ev,
      passenger_vehicle_mult_boda: passengerForm.passenger_vehicle_mult_boda || undefined,
      passenger_vehicle_mult_bajaj: passengerForm.passenger_vehicle_mult_bajaj || undefined,
      passenger_vehicle_mult_car: passengerForm.passenger_vehicle_mult_car || undefined,
    })
    await load()
  } catch (e: unknown) {
    passengerSaveError.value = formatApiError(e, 'Failed to save passenger pricing')
  } finally {
    passengerSaving.value = false
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
