<template>
  <b-card title="Onboarding assistance" class="mb-3">
    <p class="text-muted small mb-3">
      Help users finish setup after registration: update their account name, buyer preferences, store profile, or rider profile.
      Enabling a role creates the empty profile if missing; then fill in details and save.
    </p>

    <b-alert v-if="globalError" variant="danger" show dismissible class="mb-3" @dismissed="globalError = ''">
      {{ globalError }}
    </b-alert>
    <b-alert v-if="globalSuccess" variant="success" show dismissible class="mb-3" @dismissed="globalSuccess = ''">
      {{ globalSuccess }}
    </b-alert>

    <!-- Account basics -->
    <b-card no-body class="mb-3 border">
      <b-card-header class="py-2 bg-body-secondary bg-opacity-50">
        <strong>Account</strong>
      </b-card-header>
      <b-card-body>
        <b-row class="g-2">
          <b-col md="4">
            <b-form-group label="First name" label-size="sm">
              <b-form-input v-model="accountForm.first_name" size="sm" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Last name" label-size="sm">
              <b-form-input v-model="accountForm.last_name" size="sm" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Email" label-size="sm">
              <b-form-input v-model="accountForm.email" type="email" size="sm" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-button size="sm" variant="primary" :disabled="savingAccount" @click="saveAccount">
          <b-spinner v-if="savingAccount" small class="me-1" />
          Save account
        </b-button>
      </b-card-body>
    </b-card>

    <!-- Buyer -->
    <b-card no-body class="mb-3 border">
      <b-card-header class="py-2 d-flex align-items-center justify-content-between bg-body-secondary bg-opacity-50">
        <strong>Buyer profile</strong>
        <b-badge :variant="hasBuyerProfile ? 'success' : 'secondary'">
          {{ hasBuyerProfile ? 'Present' : 'Will be created on save' }}
        </b-badge>
      </b-card-header>
      <b-card-body>
        <b-row class="g-2">
          <b-col md="4">
            <b-form-group label="Currency code" label-size="sm">
              <b-form-input v-model="buyerForm.currency_code" placeholder="TZS" size="sm" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Country code" label-size="sm">
              <b-form-input v-model="buyerForm.country_code" placeholder="TZ" maxlength="2" size="sm" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-button size="sm" variant="primary" :disabled="savingBuyer" @click="saveBuyer">
          <b-spinner v-if="savingBuyer" small class="me-1" />
          Save buyer profile
        </b-button>
      </b-card-body>
    </b-card>

    <!-- Store / seller -->
    <b-card no-body class="mb-3 border">
      <b-card-header class="py-2 d-flex align-items-center justify-content-between bg-body-secondary bg-opacity-50">
        <strong>Store (seller)</strong>
        <b-badge :variant="userIsSeller ? 'success' : 'secondary'">
          {{ userIsSeller ? (sellerReady ? 'Profile linked' : 'Role on — complete store') : 'Not enabled' }}
        </b-badge>
      </b-card-header>
      <b-card-body>
        <b-form-checkbox v-model="enableSeller" class="mb-3" :disabled="userIsSeller">
          Enable seller role for this user
        </b-form-checkbox>
        <template v-if="userIsSeller || enableSeller">
          <b-row class="g-2">
            <b-col md="6">
              <b-form-group label="Business / store name" label-size="sm">
                <b-form-input v-model="storeForm.business_name" required size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Store type" label-size="sm">
                <b-form-select v-model="storeForm.seller_type" :options="sellerTypeOptions" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Contact phone" label-size="sm">
                <b-form-input v-model="storeForm.contact_phone" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Contact email" label-size="sm">
                <b-form-input v-model="storeForm.contact_email" type="email" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="TIN" label-size="sm">
                <b-form-input v-model="storeForm.tin_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Business license #" label-size="sm">
                <b-form-input v-model="storeForm.business_license_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col cols="12">
              <b-form-group label="Business address" label-size="sm">
                <b-form-textarea v-model="storeForm.business_address" rows="2" size="sm" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-button size="sm" variant="primary" :disabled="savingStore" @click="saveStore">
            <b-spinner v-if="savingStore" small class="me-1" />
            {{ userIsSeller ? 'Save store profile' : 'Enable seller & save store' }}
          </b-button>
        </template>
        <p v-else class="text-muted small mb-0">Check “Enable seller role” to create a store profile for this user.</p>
      </b-card-body>
    </b-card>

    <!-- Rider -->
    <b-card no-body class="mb-0 border">
      <b-card-header class="py-2 d-flex align-items-center justify-content-between bg-body-secondary bg-opacity-50">
        <strong>Rider profile</strong>
        <b-badge :variant="hasRiderProfile ? 'success' : 'secondary'">
          {{ hasRiderProfile ? (riderDraft ? 'Draft — complete below' : 'Linked') : 'Not enabled' }}
        </b-badge>
      </b-card-header>
      <b-card-body>
        <b-form-checkbox v-model="enableRider" class="mb-3" :disabled="hasRiderProfile">
          Enable rider role (creates draft rider profile)
        </b-form-checkbox>
        <template v-if="hasRiderProfile || enableRider">
          <b-row class="g-2">
            <b-col md="6">
              <b-form-group label="Full name" label-size="sm">
                <b-form-input v-model="riderForm.full_name" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Phone" label-size="sm">
                <b-form-input v-model="riderForm.phone_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Vehicle type" label-size="sm">
                <b-form-select v-model="riderForm.vehicle_type" :options="vehicleTypeOptions" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Vehicle number" label-size="sm">
                <b-form-input v-model="riderForm.vehicle_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="License expiry (YYYY-MM-DD)" label-size="sm">
                <b-form-input v-model="riderForm.license_expiry" placeholder="2030-12-31" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="License number" label-size="sm">
                <b-form-input v-model="riderForm.license_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="NIDA number" label-size="sm">
                <b-form-input v-model="riderForm.nida_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="TIN number" label-size="sm">
                <b-form-input v-model="riderForm.tin_number" size="sm" />
              </b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Preferred zones" label-size="sm">
                <b-form-input v-model="riderForm.preferred_zones" placeholder="e.g. Dar CBD" size="sm" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-button size="sm" variant="primary" :disabled="savingRider || !resolvedRiderId" @click="saveRider">
            <b-spinner v-if="savingRider" small class="me-1" />
            {{ hasRiderProfile ? 'Save rider profile' : 'Enable rider & save profile' }}
          </b-button>
          <p v-if="!resolvedRiderId && (hasRiderProfile || enableRider)" class="text-warning small mt-2 mb-0">
            Rider record ID missing — save again after enabling the role.
          </p>
        </template>
        <p v-else class="text-muted small mb-0">Check “Enable rider role” to create a draft rider profile.</p>
      </b-card-body>
    </b-card>
  </b-card>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { usersAdminApi } from '@/api'
import { logisticsAdminApi } from '@/api/logistics'
import { formatApiError } from '@/utils/formatApiError'

const props = defineProps<{
  userId: number
  user: Record<string, unknown> | null
  sellerProfile: Record<string, unknown> | null
  sellerId: number | null
}>()

const emit = defineEmits<{
  updated: []
}>()

const globalError = ref('')
const globalSuccess = ref('')
const savingAccount = ref(false)
const savingBuyer = ref(false)
const savingStore = ref(false)
const savingRider = ref(false)

const enableSeller = ref(false)
const enableRider = ref(false)

const accountForm = ref({ first_name: '', last_name: '', email: '' })
const buyerForm = ref({ currency_code: '', country_code: 'TZ' })
const storeForm = ref({
  business_name: '',
  seller_type: 'marketplace',
  contact_phone: '',
  contact_email: '',
  tin_number: '',
  business_license_number: '',
  business_address: '',
})
const riderForm = ref({
  full_name: '',
  phone_number: '',
  vehicle_type: 'motorcycle',
  vehicle_number: '',
  license_number: '',
  license_expiry: '',
  nida_number: '',
  tin_number: '',
  preferred_zones: '',
})

const sellerTypeOptions = [
  { value: 'marketplace', text: 'Marketplace' },
  { value: 'restaurant', text: 'Restaurant' },
  { value: 'grocery', text: 'Grocery' },
  { value: 'hotel', text: 'Hotel' },
]

const vehicleTypeOptions = [
  { value: 'motorcycle', text: 'Motorcycle' },
  { value: 'car', text: 'Car' },
  { value: 'van', text: 'Van' },
  { value: 'bicycle', text: 'Bicycle' },
  { value: 'pending', text: 'Pending (draft)' },
]

const userIsSeller = computed(() => !!props.user?.is_seller)
const hasBuyerProfile = computed(() => {
  const bp = props.user?.buyer_profile
  return bp != null && typeof bp === 'object'
})
const riderProfile = computed(() => {
  const p = props.user?.rider_profile
  return p && typeof p === 'object' ? (p as Record<string, unknown>) : null
})
const hasRiderProfile = computed(() => riderProfile.value != null)
const resolvedRiderId = computed(() => {
  const id = riderProfile.value?.id
  return typeof id === 'number' ? id : null
})
const riderDraft = computed(() => {
  const r = riderProfile.value
  if (!r) return false
  return r.vehicle_type === 'pending' || String(r.license_number ?? '').startsWith('PENDING-')
})
const sellerReady = computed(() => {
  const sp = props.sellerProfile
  return !!(sp?.business_name && String(sp.business_name).trim())
})

function syncFormsFromUser() {
  const u = props.user
  if (!u) return
  accountForm.value = {
    first_name: String(u.first_name ?? ''),
    last_name: String(u.last_name ?? ''),
    email: String(u.email ?? ''),
  }
  const bp = u.buyer_profile as Record<string, unknown> | null | undefined
  if (bp && typeof bp === 'object') {
    buyerForm.value = {
      currency_code: String(bp.currency_code ?? ''),
      country_code: String(bp.country_code ?? 'TZ'),
    }
  }
  const sp = props.sellerProfile
  if (sp) {
    storeForm.value = {
      business_name: String(sp.business_name ?? ''),
      seller_type: String(sp.seller_type ?? 'marketplace'),
      contact_phone: String(sp.contact_phone ?? ''),
      contact_email: String(sp.contact_email ?? ''),
      tin_number: String(sp.tin_number ?? ''),
      business_license_number: String(sp.business_license_number ?? ''),
      business_address: String(sp.business_address ?? ''),
    }
  }
  const r = riderProfile.value
  if (r) {
    riderForm.value = {
      full_name: String(r.full_name ?? ''),
      phone_number: String(r.phone_number ?? ''),
      vehicle_type: String(r.vehicle_type ?? 'motorcycle'),
      vehicle_number: String(r.vehicle_number ?? ''),
      license_number: String(r.license_number ?? ''),
      license_expiry: formatDateOnly(r.license_expiry),
      nida_number: String(r.nida_number ?? ''),
      tin_number: String(r.tin_number ?? ''),
      preferred_zones: String(r.preferred_zones ?? ''),
    }
  } else {
    riderForm.value.phone_number = String(u.phone_number ?? '')
    const parts = [u.first_name, u.last_name].filter(Boolean).map(String)
    riderForm.value.full_name = parts.length ? parts.join(' ') : ''
  }
  enableSeller.value = false
  enableRider.value = false
}

function formatDateOnly(v: unknown): string {
  if (!v) return ''
  const s = String(v)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().slice(0, 10)
}

function trimPayload<T extends Record<string, string>>(obj: T): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(obj)) {
    const t = String(v ?? '').trim()
    if (t) out[k] = t
  }
  return out
}

async function saveAccount() {
  if (!props.userId) return
  savingAccount.value = true
  globalError.value = ''
  try {
    await usersAdminApi.patch(props.userId, trimPayload(accountForm.value))
    globalSuccess.value = 'Account details saved.'
    emit('updated')
  } catch (e: unknown) {
    globalError.value = formatApiError(e, 'Failed to save account')
  } finally {
    savingAccount.value = false
  }
}

async function saveBuyer() {
  if (!props.userId) return
  savingBuyer.value = true
  globalError.value = ''
  try {
    await usersAdminApi.patchBuyerProfile(props.userId, {
      currency_code: buyerForm.value.currency_code.trim() || undefined,
      country_code: buyerForm.value.country_code.trim() || undefined,
    })
    globalSuccess.value = 'Buyer profile saved.'
    emit('updated')
  } catch (e: unknown) {
    globalError.value = formatApiError(e, 'Failed to save buyer profile')
  } finally {
    savingBuyer.value = false
  }
}

function sellerIdFromUserPayload(data: Record<string, unknown>): number | null {
  const embedded = data.seller_profile as Record<string, unknown> | null | undefined
  if (embedded && typeof embedded.id === 'number') return embedded.id
  const sid = data.seller_id
  if (typeof sid === 'number') return sid
  return null
}

function riderIdFromUserPayload(data: Record<string, unknown>): number | null {
  const embedded = data.rider_profile as Record<string, unknown> | null | undefined
  if (embedded && typeof embedded.id === 'number') return embedded.id
  return null
}

async function saveStore() {
  if (!props.userId) return
  if (!storeForm.value.business_name.trim()) {
    globalError.value = 'Business / store name is required.'
    return
  }
  savingStore.value = true
  globalError.value = ''
  try {
    if (!userIsSeller.value || enableSeller.value) {
      await usersAdminApi.patch(props.userId, { is_seller: true })
    }
    const { data: fresh } = await usersAdminApi.get(props.userId)
    const sid = sellerIdFromUserPayload((fresh ?? {}) as Record<string, unknown>) ?? props.sellerId
    if (!sid) {
      globalError.value = 'Seller profile was created but seller ID is not available yet. Refresh and try again.'
      return
    }
    await usersAdminApi.patchSellerProfile(sid, {
      business_name: storeForm.value.business_name.trim(),
      seller_type: storeForm.value.seller_type,
      contact_phone: storeForm.value.contact_phone.trim() || undefined,
      contact_email: storeForm.value.contact_email.trim() || undefined,
      tin_number: storeForm.value.tin_number.trim() || undefined,
      business_license_number: storeForm.value.business_license_number.trim() || undefined,
      business_address: storeForm.value.business_address.trim() || undefined,
    })
    globalSuccess.value = 'Store profile saved.'
    enableSeller.value = false
    emit('updated')
  } catch (e: unknown) {
    globalError.value = formatApiError(e, 'Failed to save store profile')
  } finally {
    savingStore.value = false
  }
}

async function saveRider() {
  if (!props.userId) return
  savingRider.value = true
  globalError.value = ''
  try {
    if (!hasRiderProfile.value || enableRider.value) {
      await usersAdminApi.patch(props.userId, { is_rider: true })
    }
    const { data: fresh } = await usersAdminApi.get(props.userId)
    const rid = riderIdFromUserPayload((fresh ?? {}) as Record<string, unknown>) ?? resolvedRiderId.value
    if (!rid) {
      globalError.value = 'Rider profile was created but rider ID is missing. Refresh the page and try again.'
      return
    }
    const payload: Record<string, unknown> = {}
    const rf = riderForm.value
    if (rf.full_name.trim()) payload.full_name = rf.full_name.trim()
    if (rf.phone_number.trim()) payload.phone_number = rf.phone_number.trim()
    if (rf.vehicle_type.trim()) payload.vehicle_type = rf.vehicle_type.trim()
    if (rf.vehicle_number.trim()) payload.vehicle_number = rf.vehicle_number.trim()
    if (rf.license_number.trim()) payload.license_number = rf.license_number.trim()
    if (rf.license_expiry.trim()) payload.license_expiry = rf.license_expiry.trim()
    if (rf.nida_number.trim()) payload.nida_number = rf.nida_number.trim()
    if (rf.tin_number.trim()) payload.tin_number = rf.tin_number.trim()
    if (rf.preferred_zones.trim()) payload.preferred_zones = rf.preferred_zones.trim()
    await logisticsAdminApi.updateDriver(rid, payload)
    globalSuccess.value = 'Rider profile saved.'
    enableRider.value = false
    emit('updated')
  } catch (e: unknown) {
    globalError.value = formatApiError(e, 'Failed to save rider profile')
  } finally {
    savingRider.value = false
  }
}

watch(
  () => [props.user, props.sellerProfile, props.sellerId] as const,
  () => syncFormsFromUser(),
  { immediate: true, deep: true }
)
</script>
