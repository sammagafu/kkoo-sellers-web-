<template>
  <VerticalLayout>
    <b-button variant="outline-secondary" size="sm" class="mb-3" :to="{ name: 'admin.sellers' }">
      ← Back to Sellers
    </b-button>

    <template v-if="loading">
      <p class="text-muted">Loading seller…</p>
    </template>
    <template v-else-if="error">
      <b-alert variant="danger" show>{{ error }}</b-alert>
    </template>
    <template v-else-if="seller">
      <b-card title="Seller details" class="mb-4">
        <b-row>
          <b-col md="6">
            <h6 class="text-muted mb-2">User</h6>
            <p class="mb-1"><strong>ID</strong> {{ seller.id }}</p>
            <p class="mb-1" v-if="seller.user?.phone_number"><strong>Phone</strong> {{ seller.user.phone_number }}</p>
            <p class="mb-1" v-if="seller.user?.email"><strong>Email</strong> {{ seller.user.email }}</p>
            <p class="mb-1" v-if="userName"><strong>Name</strong> {{ userName }}</p>
          </b-col>
          <b-col md="6">
            <h6 class="text-muted mb-2">Business</h6>
            <p class="mb-1"><strong>Business name</strong> {{ seller.business_name || '—' }}</p>
            <p class="mb-1" v-if="seller.tin_number"><strong>TIN</strong> {{ seller.tin_number }}</p>
            <p class="mb-1" v-if="seller.business_license_number"><strong>License number</strong> {{ seller.business_license_number }}</p>
            <p class="mb-1" v-if="seller.business_license_expiry"><strong>License expiry</strong> {{ seller.business_license_expiry }}</p>
            <p class="mb-1" v-if="storeLink">
              <strong>Link to store</strong>
              <a :href="storeLink" target="_blank" rel="noopener noreferrer" class="ms-2">Open store</a>
            </p>
          </b-col>
        </b-row>
        <template v-if="seller.bio || sellerLogoUrl || hasSocialLinks">
          <hr />
          <h6 class="text-muted mb-2">Company / public profile</h6>
          <b-row>
            <b-col md="6" v-if="seller.bio">
              <p class="mb-1"><strong>Bio</strong></p>
              <p class="text-muted mb-0">{{ seller.bio }}</p>
            </b-col>
            <b-col md="6" v-if="sellerLogoUrl">
              <p class="mb-1"><strong>Logo</strong></p>
              <img :src="sellerLogoUrl" alt="Logo" class="rounded" style="max-height: 80px; max-width: 160px; object-fit: contain;" />
            </b-col>
          </b-row>
          <b-row class="mt-2">
            <b-col cols="12" class="mt-2" v-if="hasSocialLinks">
              <strong class="d-block mb-1">Social</strong>
              <a v-if="seller.instagram_url" :href="ensureHttp(seller.instagram_url)" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm me-1 mb-1">Instagram</a>
              <a v-if="seller.facebook_url" :href="ensureHttp(seller.facebook_url)" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm me-1 mb-1">Facebook</a>
              <a v-if="seller.twitter_url" :href="ensureHttp(seller.twitter_url)" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm me-1 mb-1">Twitter</a>
              <a v-if="seller.tiktok_url" :href="ensureHttp(seller.tiktok_url)" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm me-1 mb-1">TikTok</a>
              <a v-if="seller.linkedin_url" :href="ensureHttp(seller.linkedin_url)" target="_blank" rel="noopener" class="btn btn-outline-secondary btn-sm me-1 mb-1">LinkedIn</a>
            </b-col>
          </b-row>
        </template>
        <hr />
        <p class="mb-0">
          <b-badge :variant="verificationBadgeVariant">
            {{ verificationBadgeText }}
          </b-badge>
          <span v-if="seller.rejection_reason" class="text-muted ms-2">Reason: {{ seller.rejection_reason }}</span>
        </p>
      </b-card>

      <b-card title="Uploaded documents" class="mb-4">
        <p class="text-muted small mb-3">Review documents submitted by the seller.</p>
        <template v-if="documentList.length">
          <b-list-group>
            <b-list-group-item v-for="(doc, idx) in documentList" :key="doc.url + '-' + idx" class="d-flex align-items-center justify-content-between">
              <span>
                <strong>{{ doc.label }}</strong>
                <span v-if="doc.name" class="text-muted ms-2">{{ doc.name }}</span>
              </span>
              <b-button size="sm" variant="outline-primary" :href="doc.url" target="_blank" rel="noopener">View</b-button>
            </b-list-group-item>
          </b-list-group>
        </template>
        <p v-else class="text-muted mb-0">No documents uploaded.</p>
      </b-card>

      <b-card v-if="!seller.is_verified && seller.verification_status !== 'rejected'" title="Review & decision" class="mb-4">
        <p class="text-muted small mb-3">After reviewing the documents, approve or reject this seller.</p>
        <div class="d-flex gap-2">
          <b-button variant="success" :disabled="actionLoading" @click="approve">Approve seller</b-button>
          <b-button variant="danger" :disabled="actionLoading" @click="openRejectModal">Reject</b-button>
        </div>
      </b-card>
    </template>

    <b-modal v-model="rejectModalShow" title="Reject seller verification" @ok="onRejectOk" @hidden="clearReject">
      <p class="text-muted small">Provide a reason so the seller knows why they are not verified.</p>
      <b-form-textarea v-model="rejectReason" placeholder="Reason (why not verified)..." rows="3" />
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { sellersAdminApi } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserRef {
  id?: number
  phone_number?: string
  email?: string
  first_name?: string
  last_name?: string
}

interface DocItem {
  label: string
  url: string
  name?: string
}

interface SellerDetail {
  id: number
  user?: UserRef
  business_name?: string
  tin_number?: string
  business_license_number?: string
  business_license_expiry?: string
  is_verified?: boolean
  verification_status?: string
  rejection_reason?: string
  documents?: { document_type?: string; label?: string; file?: string; url?: string; name?: string }[]
  business_license_document?: string
  id_document?: string
  menu_slug?: string
  bio?: string
  logo_url?: string
  logo?: string
  contact_phone?: string
  instagram_url?: string
  facebook_url?: string
  twitter_url?: string
  tiktok_url?: string
  linkedin_url?: string
  [k: string]: unknown
}

/** API error shape for consistent message extraction. */
interface ApiError {
  response?: { data?: { detail?: string } }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Document keys to check on seller for legacy/flat document fields. */
const FLAT_DOC_KEYS: { key: string; label: string }[] = [
  { key: 'business_license_document', label: 'Business license' },
  { key: 'id_document', label: 'ID document' },
  { key: 'business_license_file', label: 'Business license (file)' },
  { key: 'tin_certificate', label: 'TIN certificate' },
]

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const route = useRoute()
const seller = ref<SellerDetail | null>(null)
const loading = ref(true)
const error = ref('')
const actionLoading = ref(false)
const rejectModalShow = ref(false)
const rejectReason = ref('')

const sellerId = computed(() => Number(route.params.id))

const userName = computed(() => {
  const u = seller.value?.user
  if (!u) return ''
  return [u.first_name, u.last_name].filter(Boolean).join(' ') || ''
})

/** Build list of document items from seller (documents array + flat legacy fields). */
function buildDocumentList(s: SellerDetail): DocItem[] {
  const list: DocItem[] = []
  if (Array.isArray(s.documents)) {
    for (const d of s.documents) {
      const url = d.url || d.file
      if (url) {
        const resolvedUrl = resolveAssetUrl(url) || url
        list.push({
          label: d.label || d.document_type || 'Document',
          url: resolvedUrl,
          name: d.name,
        })
      }
    }
  }
  for (const { key, label } of FLAT_DOC_KEYS) {
    const val = s[key]
    if (typeof val === 'string' && val.trim()) {
      const resolvedUrl = resolveAssetUrl(val) || val
      if (!list.some((x) => x.url === resolvedUrl)) {
        list.push({ label, url: resolvedUrl })
      }
    }
  }
  return list
}

function getApiErrorDetail(e: unknown): string {
  const err = e as ApiError
  return err.response?.data?.detail ?? 'Operation failed'
}

const documentList = computed(() => (seller.value ? buildDocumentList(seller.value) : []))

/** Public store microsite URL (this app). */
const storeLink = computed(() => {
  const s = seller.value
  if (!s?.id) return ''
  const slugOrId = (s.menu_slug as string)?.trim() || s.id
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${basePath}/store/${encodeURIComponent(String(slugOrId))}`
})

const sellerLogoUrl = computed(() => {
  const s = seller.value
  if (!s) return null
  const raw = (s.logo_url ?? s.logo) as string | undefined
  return resolveAssetUrl(raw ?? '') || null
})

const contactPhone = computed(() => {
  const s = seller.value
  return (s?.contact_phone ?? s?.user?.phone_number ?? '')?.trim() || ''
})

const hasSocialLinks = computed(() => {
  const s = seller.value
  if (!s) return false
  return !!(s.instagram_url || s.facebook_url || s.twitter_url || s.tiktok_url || s.linkedin_url)
})

/** Badge variant for verification status: success (verified), danger (rejected), warning (pending). */
const verificationBadgeVariant = computed(() => {
  const s = seller.value
  if (!s) return 'secondary'
  if (s.is_verified) return 'success'
  if (s.verification_status === 'rejected') return 'danger'
  return 'warning'
})

/** Human-readable verification status for the badge. */
const verificationBadgeText = computed(() => {
  const s = seller.value
  if (!s) return '—'
  if (s.is_verified) return 'Verified'
  if (s.verification_status === 'rejected') return 'Rejected'
  return 'Pending'
})

/**
 * Normalize URL for external link: ensure it has a scheme. Returns '#' if empty (safe fallback).
 */
function ensureHttp(url: string | undefined): string {
  const u = (url ?? '').trim()
  if (!u) return '#'
  if (/^https?:\/\//i.test(u)) return u
  return `https://${u}`
}

async function load() {
  const id = sellerId.value
  if (!id || Number.isNaN(id)) {
    error.value = 'Invalid seller ID'
    loading.value = false
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await sellersAdminApi.get(id)
    const raw = data as Record<string, unknown>
    seller.value = {
      ...raw,
      verification_status: raw.kyc_status ?? raw.verification_status,
      is_verified: (raw.kyc_status as string) === 'approved',
      rejection_reason: raw.kyc_rejection_reason ?? raw.rejection_reason,
    } as SellerDetail
  } catch (e: unknown) {
    error.value = getApiErrorDetail(e) || 'Failed to load seller'
    seller.value = null
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(sellerId, load)

function onRejectOk(ev: Event) {
  ev.preventDefault()
  confirmReject()
}

async function approve() {
  if (!seller.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await sellersAdminApi.approve(seller.value.id)
    await load()
  } catch (e: unknown) {
    error.value = getApiErrorDetail(e) || 'Approve failed'
  } finally {
    actionLoading.value = false
  }
}

function openRejectModal() {
  rejectReason.value = ''
  rejectModalShow.value = true
}

function clearReject() {
  rejectReason.value = ''
}

async function confirmReject() {
  if (!seller.value) return
  actionLoading.value = true
  error.value = ''
  try {
    await sellersAdminApi.reject(seller.value.id, rejectReason.value.trim() || undefined)
    rejectModalShow.value = false
    clearReject()
    await load()
  } catch (e: unknown) {
    error.value = getApiErrorDetail(e) || 'Reject failed'
  } finally {
    actionLoading.value = false
  }
}
</script>
