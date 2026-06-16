<template>
  <VerticalLayout>
    <b-card v-if="error && !user" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" :to="{ name: 'admin.users' }">Back to Users</b-button>
    </b-card>
    <template v-else-if="user">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.users' }">Back to Users</b-button>
        <b-button variant="outline-primary" size="sm" @click="openEditModal">Edit account</b-button>
        <b-button variant="outline-primary" size="sm" @click="openRolesModal">Platform roles</b-button>
        <router-link
          v-if="sellerId"
          :to="{ name: 'admin.sellers.detail', params: { id: String(sellerId) } }"
          class="btn btn-outline-secondary btn-sm"
        >
          View seller page →
        </router-link>
      </div>

      <b-card title="User profile" class="mb-3">
        <p class="text-muted small mb-3">Account and profile details for this user.</p>
        <b-row>
          <b-col md="6">
            <b-list-group flush>
              <b-list-group-item><strong>User ID</strong> {{ user.id ?? '—' }}</b-list-group-item>
              <b-list-group-item><strong>Name</strong> {{ userDisplayName }}</b-list-group-item>
              <b-list-group-item v-if="user.first_name != null || user.last_name != null"><strong>First name</strong> {{ user.first_name ?? '—' }}</b-list-group-item>
              <b-list-group-item v-if="user.first_name != null || user.last_name != null"><strong>Last name</strong> {{ user.last_name ?? '—' }}</b-list-group-item>
              <b-list-group-item><strong>Phone</strong> {{ user.phone_number ?? '—' }}</b-list-group-item>
              <b-list-group-item><strong>Email</strong> {{ user.email ?? '—' }}</b-list-group-item>
              <b-list-group-item v-if="user.username"><strong>Username</strong> {{ user.username }}</b-list-group-item>
              <b-list-group-item v-if="user.date_of_birth != null"><strong>Date of birth</strong> {{ formatProfileValue(user.date_of_birth) }}</b-list-group-item>
              <b-list-group-item v-if="user.language_preference"><strong>Language</strong> {{ user.language_preference }}</b-list-group-item>
              <b-list-group-item v-if="user.referral_code"><strong>Referral code</strong> {{ user.referral_code }}</b-list-group-item>
            </b-list-group>
          </b-col>
          <b-col md="6">
            <b-list-group flush>
              <b-list-group-item><strong>Account status</strong> <b-badge :variant="statusVariant">{{ user.account_status ?? '—' }}</b-badge></b-list-group-item>
              <b-list-group-item><strong>Roles</strong> {{ rolesDisplay }}</b-list-group-item>
              <b-list-group-item><strong>Created</strong> {{ formatDate(user.created_at) }}</b-list-group-item>
              <b-list-group-item v-if="user.last_login"><strong>Last login</strong> {{ formatDate(user.last_login) }}</b-list-group-item>
            </b-list-group>
          </b-col>
        </b-row>
      </b-card>

      <UserOnboardingAssist
        :user-id="id"
        :user="user"
        :seller-profile="sellerProfile"
        :seller-id="sellerId"
        @updated="load"
      />

      <b-card title="Platform access" class="mb-3">
        <p class="text-muted small mb-3">
          <strong>Staff</strong> can use the admin dashboard. <strong>Superuser</strong> can approve sensitive actions and manage superuser flags.
          Only a signed-in superuser can assign or remove superuser on another user.
        </p>
        <div class="d-flex flex-wrap align-items-center gap-2">
          <b-badge :variant="user.is_staff ? 'success' : 'secondary'">Staff: {{ user.is_staff ? 'Yes' : 'No' }}</b-badge>
          <b-badge :variant="user.is_superuser ? 'success' : 'secondary'">Superuser: {{ user.is_superuser ? 'Yes' : 'No' }}</b-badge>
          <b-button size="sm" variant="outline-primary" class="ms-auto" @click="openRolesModal">Change platform roles</b-button>
        </div>
      </b-card>

      <b-card v-if="user.is_seller && (sellerLoading || sellerProfile || sellerLoadError)" title="Seller profile" class="mb-3">
        <p v-if="sellerLoading" class="text-muted mb-0">Loading seller profile…</p>
        <p v-else-if="sellerLoadError" class="text-danger mb-0">{{ sellerLoadError }}</p>
        <template v-else-if="sellerProfile">
          <p class="text-muted small mb-3">Business and store details for this seller.</p>
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
              {{ sellerProfile.is_verified ? 'Verified' : (sellerProfile.verification_status === 'rejected' ? 'Rejected' : 'Pending') }}
            </b-badge>
            <span v-if="sellerProfile.rejection_reason" class="text-muted ms-2">{{ sellerProfile.rejection_reason }}</span>
          </p>
        </template>
      </b-card>
      <b-card v-else-if="user.is_seller && !sellerLoading" title="Seller profile" class="mb-3">
        <p class="text-muted mb-0">This user is a seller. Could not load seller record (no seller ID linked).</p>
      </b-card>

      <b-card v-if="buyerProfile" title="Buyer profile" class="mb-3">
        <p class="text-muted small mb-3">Shopping and delivery preferences.</p>
        <b-list-group flush>
          <b-list-group-item v-if="buyerProfile.default_address != null"><strong>Default address</strong> {{ formatProfileValue(buyerProfile.default_address) }}</b-list-group-item>
          <b-list-group-item v-if="buyerProfile.currency_code"><strong>Currency</strong> {{ buyerProfile.currency_code }}</b-list-group-item>
          <b-list-group-item v-if="buyerProfile.loyalty_points_balance != null"><strong>Loyalty points</strong> {{ buyerProfile.loyalty_points_balance }}</b-list-group-item>
          <b-list-group-item v-if="buyerProfile.referral_code"><strong>Referral code</strong> {{ buyerProfile.referral_code }}</b-list-group-item>
          <b-list-group-item v-if="buyerProfile.id != null"><strong>Buyer ID</strong> {{ buyerProfile.id }}</b-list-group-item>
        </b-list-group>
      </b-card>

      <b-card v-if="riderProfile" title="Rider profile" class="mb-3">
        <p class="text-muted small mb-3">Delivery rider / driver details.</p>
        <b-list-group flush>
          <b-list-group-item v-if="riderProfile.id != null"><strong>Rider ID</strong> {{ riderProfile.id }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.status"><strong>Status</strong> <b-badge variant="secondary">{{ riderProfile.status }}</b-badge></b-list-group-item>
          <b-list-group-item v-if="riderProfile.zone != null"><strong>Zone</strong> {{ formatProfileValue(riderProfile.zone) }}</b-list-group-item>
          <b-list-group-item v-if="riderProfile.vehicle_type"><strong>Vehicle type</strong> {{ riderProfile.vehicle_type }}</b-list-group-item>
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

      <b-modal v-model="showEditModal" title="Edit user" @ok="onEditOk">
        <b-alert v-if="editError" variant="danger" show>{{ editError }}</b-alert>
        <b-form-group label="Account status">
          <b-form-select v-model="editForm.account_status" :options="statusOptions" />
        </b-form-group>
        <b-form-group label="Seller role">
          <b-form-checkbox v-model="editForm.is_seller">Seller (can operate a storefront)</b-form-checkbox>
        </b-form-group>
        <p class="text-muted small mb-0">
          To change staff or superuser, use <strong>Platform roles</strong> (separate dialog) so changes stay aligned with API rules.
        </p>
      </b-modal>

      <b-modal v-model="showRolesModal" title="Platform roles" size="lg" @ok="onRolesOk">
        <b-alert v-if="rolesError" variant="danger" show>{{ rolesError }}</b-alert>
        <b-alert v-if="!canManageSuperuser && user?.is_superuser" variant="warning" show>
          This user is a superuser. Only another superuser can change or remove that access.
        </b-alert>
        <b-alert v-if="!canManageSuperuser && !user?.is_superuser" variant="info" show>
          You can grant or remove <strong>Staff</strong> (admin dashboard). Only a superuser can grant or remove <strong>Superuser</strong>.
        </b-alert>

        <template v-if="!platformRolesReadOnly">
          <b-form-group label="Admin dashboard access">
            <b-form-radio v-model="platformAccessLevel" class="mb-2" value="none">None — no staff tools</b-form-radio>
            <b-form-radio v-model="platformAccessLevel" class="mb-2" value="staff">Staff — admin dashboard &amp; moderation</b-form-radio>
            <b-form-radio v-model="platformAccessLevel" value="superuser" :disabled="!canManageSuperuser">
              Superuser — staff plus elevated approvals (promote another superuser before demoting the last one)
            </b-form-radio>
          </b-form-group>
        </template>
        <template v-else>
          <p class="mb-0"><strong>Current:</strong> Superuser (locked for your account)</p>
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
const editForm = ref({ account_status: 'active', is_seller: false })
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
  { value: 'active', text: 'Active' },
  { value: 'suspended', text: 'Suspended' },
  { value: 'banned', text: 'Banned' },
]

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
  if (u.is_staff) add('Staff')
  if (u.is_superuser) add('Superuser')
  const roles = u.roles
  if (Array.isArray(roles) && roles.length) {
    for (const r of roles) {
      const s = String(r).toLowerCase()
      if (s === 'seller') add('Seller')
      else if (s === 'staff') add('Staff')
      else if (s === 'admin' || s === 'superuser' || s === 'all') add('Superuser')
      else if (s === 'buyer') add('Buyer')
      else if (s === 'rider') add('Rider')
      else if (r) add(String(r))
    }
  }
  if (parts.length === 0) return '—'
  const order = ['Seller', 'Staff', 'Superuser', 'Rider', 'Buyer']
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
    })
    await load()
    showEditModal.value = false
    toastSuccess('Account updated')
  } catch (e: unknown) {
    editError.value = formatApiError(e, 'Update failed')
  }
}

onMounted(load)
watch(id, load)
</script>
