<template>
  <VerticalLayout>
    <b-card v-if="error && !user" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.users' }">Back to Users</b-button>
    </b-card>
    <template v-else-if="user">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.users' }">← People</b-button>
      </div>

      <b-card class="mb-3">
        <div class="d-flex flex-wrap align-items-start gap-2 mb-3">
          <div class="me-auto">
            <h1 class="h4 mb-1">{{ userDisplayName }}</h1>
            <p class="text-muted mb-1">{{ user.phone_number || 'No phone' }}<span v-if="user.email"> · {{ user.email }}</span></p>
            <b-badge :variant="statusVariant" class="me-1">{{ statusLabel }}</b-badge>
            <span class="text-muted small">{{ rolesDisplay }}</span>
          </div>
        </div>
        <div class="d-flex flex-wrap gap-2">
          <b-button v-if="user.account_status !== 'active'" size="sm" variant="success" @click="setAccount('activate')">Turn on</b-button>
          <b-button v-if="user.account_status !== 'suspended'" size="sm" variant="outline-warning" @click="openAccountModal('suspend')">Pause</b-button>
          <b-button v-if="user.account_status !== 'banned'" size="sm" variant="outline-danger" @click="openAccountModal('ban')">Block</b-button>
          <b-button size="sm" variant="outline-primary" @click="openEditModal">Edit name and shop</b-button>
          <b-button size="sm" variant="outline-secondary" @click="openRolesModal">Admin access</b-button>
          <router-link
            v-if="sellerId"
            :to="{ name: 'admin.sellers.detail', params: { id: String(sellerId) } }"
            class="btn btn-outline-secondary btn-sm"
          >
            Shop page
          </router-link>
        </div>
        <b-alert v-if="error" variant="danger" show class="mt-3 mb-0">{{ error }}</b-alert>
        <p v-if="user.last_login" class="small text-muted mb-0 mt-3">Last sign-in {{ formatDate(user.last_login) }}</p>
      </b-card>

      <b-card title="Account" class="mb-3">
        <b-list-group flush>
          <b-list-group-item><strong>User ID</strong> {{ user.id }}</b-list-group-item>
          <b-list-group-item><strong>Phone</strong> {{ user.phone_number || '—' }}</b-list-group-item>
          <b-list-group-item><strong>Email</strong> {{ user.email || '—' }}</b-list-group-item>
          <b-list-group-item><strong>Verified</strong> {{ user.is_verified ? 'Yes' : 'No' }}</b-list-group-item>
          <b-list-group-item><strong>Seller</strong> {{ user.is_seller ? 'Yes' : 'No' }}</b-list-group-item>
          <b-list-group-item><strong>Referral code</strong> {{ user.referral_code || '—' }}</b-list-group-item>
          <b-list-group-item><strong>CRM plan</strong> {{ user.crm_subscription_plan || '—' }}</b-list-group-item>
          <b-list-group-item><strong>Created</strong> {{ user.created_at ? formatDate(user.created_at) : '—' }}</b-list-group-item>
        </b-list-group>
        <div class="d-flex flex-wrap gap-2 mt-3">
          <b-button
            v-if="user.account_status !== 'archived'"
            size="sm"
            variant="outline-secondary"
            @click="archiveThisUser"
          >
            Archive
          </b-button>
        </div>
      </b-card>

      <b-card v-if="buyerProfile" title="Buyer profile" class="mb-3">
        <p class="text-muted small mb-3">Shopping and delivery preferences.</p>
        <b-list-group flush>
          <b-list-group-item v-if="buyerProfile.id != null"><strong>Buyer ID</strong> {{ buyerProfile.id }}</b-list-group-item>
          <b-list-group-item><strong>Country</strong> {{ buyerProfile.country_code || '—' }}</b-list-group-item>
          <b-list-group-item><strong>Currency</strong> {{ buyerProfile.currency_code || '—' }}</b-list-group-item>
          <b-list-group-item><strong>Loyalty points</strong> {{ buyerProfile.loyalty_points_balance ?? 0 }}</b-list-group-item>
          <b-list-group-item><strong>Wishlist</strong> {{ buyerProfile.wishlist_count ?? 0 }}</b-list-group-item>
          <b-list-group-item><strong>Disputes</strong> {{ buyerProfile.dispute_count ?? 0 }}</b-list-group-item>
          <b-list-group-item><strong>Refunds received</strong> {{ buyerProfile.total_refunds_received ?? 0 }}</b-list-group-item>
          <b-list-group-item><strong>Referral code</strong> {{ user.referral_code || buyerProfile.referral_code || '—' }}</b-list-group-item>
          <b-list-group-item v-if="buyerProfile.default_address != null"><strong>Default address</strong> {{ formatProfileValue(buyerProfile.default_address) }}</b-list-group-item>
        </b-list-group>
      </b-card>

      <b-button size="sm" variant="link" class="px-0 mb-3" @click="showMore = !showMore">
        {{ showMore ? 'Hide shop, rider, and extra details' : 'Set up shop, rider, or extra details' }}
      </b-button>
      <template v-if="showMore">
      <UserOnboardingAssist
        :user-id="id"
        :user="user"
        :seller-profile="sellerProfile"
        :seller-id="sellerId"
        @updated="load"
      />

      <b-card v-if="user.is_seller && (sellerLoading || sellerProfile || sellerLoadError)" title="Shop" class="mb-3">
        <p v-if="sellerLoading" class="text-muted mb-0">Loading shop…</p>
        <p v-else-if="sellerLoadError" class="text-danger mb-0">{{ sellerLoadError }}</p>
        <template v-else-if="sellerProfile">
          <p class="text-muted small mb-3">Name, phone, and address customers see.</p>
          <b-row>
            <b-col md="6">
              <b-list-group flush>
                <b-list-group-item><strong>Business name</strong> {{ sellerProfile.business_name || '—' }}</b-list-group-item>
                <b-list-group-item v-if="sellerProfile.tin_number"><strong>TIN</strong> {{ sellerProfile.tin_number }}</b-list-group-item>
                <b-list-group-item v-if="sellerProfile.business_license_number"><strong>License number</strong> {{ sellerProfile.business_license_number }}</b-list-group-item>
                <b-list-group-item v-if="sellerProfile.business_license_expiry"><strong>License expiry</strong> {{ sellerProfile.business_license_expiry }}</b-list-group-item>
              </b-list-group>
            </b-col>
            <b-col md="6">
              <b-list-group flush>
                <b-list-group-item><strong>Contact phone</strong> {{ sellerProfile.contact_phone || '—' }}</b-list-group-item>
                <b-list-group-item><strong>Contact email</strong> {{ sellerProfile.contact_email || '—' }}</b-list-group-item>
                <b-list-group-item><strong>Business address</strong> {{ sellerProfile.business_address || '—' }}</b-list-group-item>
                <b-list-group-item v-if="sellerProfile.preferred_payout_method"><strong>Payout method</strong> {{ sellerProfile.preferred_payout_method }}</b-list-group-item>
              </b-list-group>
            </b-col>
          </b-row>
          <p class="mb-0 mt-2">
            <b-badge :variant="sellerProfile.is_verified ? 'success' : (sellerProfile.verification_status === 'rejected' ? 'danger' : 'warning')">
              {{ sellerProfile.is_verified ? 'Can sell' : (sellerProfile.verification_status === 'rejected' ? 'Needs a fix' : 'Waiting for approval') }}
            </b-badge>
            <span v-if="sellerProfile.rejection_reason" class="text-muted ms-2">{{ sellerProfile.rejection_reason }}</span>
          </p>
        </template>
      </b-card>
      <b-card v-else-if="user.is_seller && !sellerLoading" title="Shop" class="mb-3">
        <p class="text-muted mb-0">This person runs a shop, but the shop record did not load.</p>
      </b-card>

      <b-card v-if="riderProfile" title="Rider profile" class="mb-3">
        <p class="text-muted small mb-3">Delivery rider / driver details.</p>
        <b-list-group flush>
          <b-list-group-item v-if="riderProfile.id != null"><strong>Rider ID</strong> {{ riderProfile.id }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.status"><strong>Status</strong> <b-badge variant="secondary">{{ riderProfile.status }}</b-badge></b-list-group-item>
          <b-list-group-item v-if="riderProfile.zone != null"><strong>Zone</strong> {{ formatProfileValue(riderProfile.zone) }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.vehicle_type"><strong>Vehicle type</strong> {{ riderProfile.vehicle_type }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.energy_type"><strong>Energy type</strong> {{ riderProfile.energy_type }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.verification_status"><strong>Verification</strong> {{ riderProfile.verification_status }}</b-list-group-item>
        </b-list-group>
      </b-card>

      <b-card v-if="businessMemberships.length" title="Business memberships" class="mb-3">
        <p class="text-muted small mb-3">CRM businesses this user is a member of. Manage members from the business detail page.</p>
        <b-list-group flush>
          <b-list-group-item v-for="m in businessMemberships" :key="String(m.business_id)" class="d-flex justify-content-between align-items-center">
            <span>{{ m.business_name || `Business #${m.business_id}` }}</span>
            <span>
              <b-badge variant="secondary" class="me-2">{{ m.role ?? 'member' }}</b-badge>
              <router-link :to="{ name: 'admin.crm.businesses.detail', params: { id: String(m.business_id) } }" class="btn btn-sm btn-outline-primary">View business</router-link>
            </span>
          </b-list-group-item>
        </b-list-group>
      </b-card>
      </template>

      <b-modal v-model="showEditModal" title="Edit person" @ok="onEditOk">
        <b-alert v-if="editError" variant="danger" show>{{ editError }}</b-alert>
        <b-form-group label="First name">
          <b-form-input v-model="editForm.first_name" />
        </b-form-group>
        <b-form-group label="Last name">
          <b-form-input v-model="editForm.last_name" />
        </b-form-group>
        <b-form-group label="Account">
          <b-form-select v-model="editForm.account_status" :options="statusOptions" />
        </b-form-group>
        <b-form-checkbox v-model="editForm.is_seller">They run a shop</b-form-checkbox>
        <p class="text-muted small mb-0 mt-2">Admin access is changed with the Admin access button.</p>
      </b-modal>

      <b-modal v-model="accountModalShow" :title="accountModalTitle" @ok="onAccountOk" @hidden="accountReason = ''">
        <p class="text-muted small">Add a short reason if you want it saved with the account.</p>
        <b-form-textarea v-model="accountReason" rows="3" placeholder="Reason (optional)" />
      </b-modal>

      <b-modal v-model="showRolesModal" title="Admin access" size="lg" @ok="onRolesOk">
        <b-alert v-if="rolesError" variant="danger" show>{{ rolesError }}</b-alert>
        <b-alert v-if="!canManageSuperuser && user?.is_superuser" variant="warning" show>
          This person is a full admin. Only another full admin can change that.
        </b-alert>
        <b-alert v-if="!canManageSuperuser && !user?.is_superuser" variant="info" show>
          You can let them use this admin site. Only a full admin can give or remove full admin access.
        </b-alert>

        <template v-if="!platformRolesReadOnly">
          <b-form-group label="Admin dashboard access">
            <b-form-radio v-model="platformAccessLevel" class="mb-2" value="none">No admin access</b-form-radio>
            <b-form-radio v-model="platformAccessLevel" class="mb-2" value="staff">Admin — can use this site</b-form-radio>
            <b-form-radio v-model="platformAccessLevel" value="superuser" :disabled="!canManageSuperuser">
              Full admin — can also approve sensitive actions. Keep at least one full admin.
            </b-form-radio>
          </b-form-group>
        </template>
        <template v-else>
          <p class="mb-0"><strong>Current:</strong> Full admin. Only another full admin can change this.</p>
        </template>
      </b-modal>
    </template>
    <p v-else-if="loading" class="text-muted">Loading…</p>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import UserOnboardingAssist from '@/components/admin/UserOnboardingAssist.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usersAdminApi, sellersAdminApi } from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { toastSuccess } from '@/utils/toast'
import { useAuthStore } from '@/stores/auth'

type PlatformAccessLevel = 'none' | 'staff' | 'superuser'

const route = useRoute()
const auth = useAuthStore()
const id = computed(() => Number(route.params.id) || 0)
const loading = ref(false)
const error = ref('')
const user = ref<Record<string, unknown> | null>(null)
const showEditModal = ref(false)
const showRolesModal = ref(false)
const editForm = ref({ account_status: 'active', is_seller: false, first_name: '', last_name: '' })
const editError = ref('')
const platformAccessLevel = ref<PlatformAccessLevel>('none')
const initialPlatformAccess = ref<PlatformAccessLevel>('none')
const rolesError = ref('')
const sellerProfile = ref<Record<string, unknown> | null>(null)
const sellerLoading = ref(false)
const sellerLoadError = ref('')

const canManageSuperuser = computed(() => !!auth.user?.is_superuser || !!auth.user?.isSuperuser)

const platformRolesReadOnly = computed(() => {
  const u = user.value
  if (!u?.is_superuser) return false
  return !canManageSuperuser.value
})

const statusOptions = [
  { value: 'active', text: 'On' },
  { value: 'suspended', text: 'Paused' },
  { value: 'banned', text: 'Blocked' },
  { value: 'archived', text: 'Archived' },
]
const showMore = ref(false)
const accountModalShow = ref(false)
const accountType = ref<'ban' | 'suspend' | null>(null)
const accountReason = ref('')
const accountModalTitle = computed(() => (accountType.value === 'ban' ? 'Block this person' : 'Pause this person'))
const statusLabel = computed(() => {
  const s = String(user.value?.account_status ?? '')
  if (s === 'active') return 'On'
  if (s === 'suspended') return 'Paused'
  if (s === 'banned') return 'Blocked'
  if (s === 'archived') return 'Archived'
  return s || '—'
})

const userDisplayName = computed(() => {
  const u = user.value
  if (!u) return '—'
  const full = u.full_name
  if (typeof full === 'string' && full.trim()) return full.trim()
  const parts = [u.first_name, u.last_name].filter(Boolean).map(String)
  return parts.length ? parts.join(' ') : '—'
})

const rolesDisplay = computed(() => {
  const u = user.value
  if (!u) return '—'
  const seen = new Set<string>()
  const parts: string[] = []
  function add(label: string) {
    if (seen.has(label)) return
    seen.add(label)
    parts.push(label)
  }
  if (u.is_seller) add('Seller')
  if (u.is_staff) add('Admin')
  if (u.is_superuser) add('Full admin')
  const roles = u.roles
  if (Array.isArray(roles) && roles.length) {
    for (const r of roles) {
      const s = String(r).toLowerCase()
      if (s === 'seller') add('Seller')
      else if (s === 'staff') add('Admin')
      else if (s === 'admin' || s === 'superuser' || s === 'all') add('Full admin')
      else if (s === 'buyer') add('Buyer')
      else if (s === 'rider') add('Rider')
      else if (r) add(String(r))
    }
  }
  if (parts.length === 0) return '—'
  const order = ['Seller', 'Admin', 'Full admin', 'Rider', 'Buyer']
  const ordered = order.filter((l) => parts.includes(l))
  const rest = parts.filter((p) => !order.includes(p))
  return [...ordered, ...rest].join(', ')
})

const statusVariant = computed(() => {
  const s = user.value?.account_status as string
  if (s === 'active') return 'success'
  if (s === 'suspended') return 'warning'
  if (s === 'banned') return 'danger'
  return 'secondary'
})

const sellerId = computed(() => {
  const u = user.value
  if (!u?.is_seller) return null
  const embedded = u.seller_profile as Record<string, unknown> | null | undefined
  if (embedded && typeof (embedded as { id?: number }).id === 'number') return (embedded as { id: number }).id
  const sid = u.seller_id ?? u.seller ?? (u as { seller?: { id?: number } }).seller?.id
  if (typeof sid === 'number' && !Number.isNaN(sid)) return sid
  return (sellerProfile.value?.id as number) ?? null
})

const buyerProfile = computed(() => {
  const p = user.value?.buyer_profile
  return p && typeof p === 'object' ? (p as Record<string, unknown>) : null
})

const riderProfile = computed(() => {
  const p = user.value?.rider_profile
  return p && typeof p === 'object' ? (p as Record<string, unknown>) : null
})

interface BusinessMembership {
  business_id: number
  business_name?: string
  role?: string
}
const businessMemberships = computed((): BusinessMembership[] => {
  const raw = user.value?.business_memberships
  if (!Array.isArray(raw)) return []
  return raw as BusinessMembership[]
})

function accessLevelFromUser(u: Record<string, unknown> | null): PlatformAccessLevel {
  if (!u) return 'none'
  if (u.is_superuser === true) return 'superuser'
  if (u.is_staff === true) return 'staff'
  return 'none'
}

function syncPlatformFromUser() {
  platformAccessLevel.value = accessLevelFromUser(user.value)
}

function openEditModal() {
  editError.value = ''
  const u = user.value
  if (u) {
    editForm.value.account_status = (u.account_status as string) ?? 'active'
    editForm.value.is_seller = !!u.is_seller
    editForm.value.first_name = String(u.first_name ?? '')
    editForm.value.last_name = String(u.last_name ?? '')
  }
  showEditModal.value = true
}

function openRolesModal() {
  rolesError.value = ''
  syncPlatformFromUser()
  initialPlatformAccess.value = platformAccessLevel.value
  showRolesModal.value = true
}

async function onRolesOk(ev: Event) {
  ev.preventDefault()
  if (!id.value) return
  rolesError.value = ''
  if (platformRolesReadOnly.value) {
    showRolesModal.value = false
    return
  }
  if (platformAccessLevel.value === initialPlatformAccess.value) {
    showRolesModal.value = false
    return
  }
  if (platformAccessLevel.value === 'superuser' && !canManageSuperuser.value) {
    rolesError.value = 'Only a superuser can assign superuser access.'
    return
  }
  try {
    const ar =
      platformAccessLevel.value === 'none'
        ? 'none'
        : platformAccessLevel.value === 'staff'
          ? 'staff'
          : 'superuser'
    await usersAdminApi.patch(id.value, { admin_role: ar })
    await load()
    showRolesModal.value = false
    toastSuccess('Platform roles updated')
  } catch (e: unknown) {
    rolesError.value = formatApiError(e, 'Update failed')
  }
}

function formatDate(v: unknown): string {
  if (!v) return '—'
  const d = new Date(String(v))
  return isNaN(d.getTime()) ? String(v) : d.toLocaleString()
}

function formatProfileValue(v: unknown): string {
  if (v == null) return '—'
  if (typeof v === 'object' && v !== null && 'name' in v) return String((v as { name?: unknown }).name ?? JSON.stringify(v))
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function normalizeSellerProfile(raw: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!raw || typeof raw !== 'object') return null
  return {
    ...raw,
    verification_status: raw.kyc_status ?? raw.verification_status,
    is_verified: (raw.kyc_status as string) === 'approved',
    rejection_reason: raw.kyc_rejection_reason ?? raw.rejection_reason,
  }
}

async function loadSellerProfile() {
  const u = user.value
  if (!u?.is_seller) return
  const embedded = u.seller_profile as Record<string, unknown> | null | undefined
  if (embedded && typeof embedded === 'object') {
    sellerProfile.value = normalizeSellerProfile(embedded)
    return
  }
  let sid: number | null = Number(u.seller_id ?? u.seller ?? 0) || null
  if (!sid && (u.seller_id == null) && (u.seller == null)) {
    try {
      const { data } = await sellersAdminApi.list()
      const list = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
      const found = list.find((s: Record<string, unknown>) => Number((s.user as Record<string, unknown>)?.id ?? s.user_id) === id.value)
      if (found && found.id != null) sid = Number(found.id)
    } catch {
      sellerLoadError.value = 'Could not resolve seller.'
      return
    }
  }
  if (!sid) {
    sellerLoadError.value = 'No seller record linked to this user.'
    return
  }
  sellerLoading.value = true
  sellerLoadError.value = ''
  try {
    const { data } = await sellersAdminApi.get(sid)
    sellerProfile.value = normalizeSellerProfile((data ?? {}) as Record<string, unknown>)
  } catch (e: unknown) {
    sellerLoadError.value = formatApiError(e, 'Failed to load seller profile')
    sellerProfile.value = null
  } finally {
    sellerLoading.value = false
  }
}

async function load() {
  if (!id.value) return
  loading.value = true
  error.value = ''
  sellerProfile.value = null
  sellerLoadError.value = ''
  try {
    const { data } = await usersAdminApi.get(id.value)
    user.value = (data ?? {}) as Record<string, unknown>
    editForm.value.account_status = (user.value.account_status as string) ?? 'active'
    editForm.value.is_seller = !!user.value?.is_seller
    editForm.value.first_name = String(user.value.first_name ?? '')
    editForm.value.last_name = String(user.value.last_name ?? '')
    syncPlatformFromUser()
    if (user.value?.is_seller) {
      await loadSellerProfile()
    }
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load user')
    user.value = null
  } finally {
    loading.value = false
  }
}

async function onEditOk(ev: Event) {
  ev.preventDefault()
  if (!id.value) return
  editError.value = ''
  try {
    await usersAdminApi.patch(id.value, {
      account_status: editForm.value.account_status,
      is_seller: editForm.value.is_seller,
      first_name: editForm.value.first_name.trim(),
      last_name: editForm.value.last_name.trim(),
    })
    await load()
    showEditModal.value = false
    toastSuccess('Account updated')
  } catch (e: unknown) {
    editError.value = formatApiError(e, 'Update failed')
  }
}

function openAccountModal(type: 'ban' | 'suspend') {
  accountType.value = type
  accountReason.value = ''
  accountModalShow.value = true
}

function onAccountOk(ev: Event) {
  ev.preventDefault()
  const type = accountType.value
  if (!type) return
  accountModalShow.value = false
  void setAccount(type, accountReason.value.trim() || undefined)
}

async function archiveThisUser() {
  if (!id.value || !user.value) return
  error.value = ''
  try {
    await usersAdminApi.archive(id.value)
    await load()
    toastSuccess('User archived')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not archive this user')
  }
}

async function setAccount(type: 'ban' | 'suspend' | 'activate', reason?: string) {
  if (!id.value) return
  error.value = ''
  try {
    await usersAdminApi.userAction(id.value, { action: type, reason })
    await load()
    toastSuccess(type === 'activate' ? 'Account turned on' : type === 'ban' ? 'Account blocked' : 'Account paused')
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not update the account')
  }
}

onMounted(load)
watch(id, load)
</script>
