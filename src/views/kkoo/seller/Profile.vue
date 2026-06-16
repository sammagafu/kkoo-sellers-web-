<template>
  <VerticalLayout class="seller-profile-page">
    <div class="d-flex flex-column flex-lg-row gap-4">
      <!-- Main content: tab panels -->
      <div class="flex-grow-1 min-w-0">
        <b-card class="seller-profile-card">
          <p v-if="verificationStatusLabel" class="mb-2 small" aria-label="Verification status"><strong>Verification:</strong> {{ verificationStatusLabel }}</p>
          <!-- Your store link – prominent at top -->
          <div v-if="loaded" class="mb-4 p-3 rounded border" :class="storeLink ? 'border-primary border-opacity-25 bg-light' : 'border-secondary border-opacity-25'">
            <h6 class="section-label mb-2">Your store link</h6>
            <p v-if="storeLink" class="mb-2 small text-muted">Share this link so customers can view your store or menu (no login required).</p>
            <div v-if="storeLink" class="d-flex align-items-center gap-2 flex-wrap">
              <b-form-input :value="storeLink" readonly class="flex-grow-1" style="max-width: 360px;" aria-label="Store link URL" />
              <b-button size="sm" variant="primary" @click="copyStoreLink">Copy</b-button>
              <a
                :href="storeLink"
                target="_blank"
                rel="noopener noreferrer"
                class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              >
                <Icon icon="solar:monitor-bold" class="me-1" />
                Open
              </a>
            </div>
            <p v-else class="mb-0 small text-muted">Set a Menu / store slug below and save to get your store link.</p>
          </div>
          <p class="text-muted small mb-3">Finalize your business, store contact, and payout details. Save each section when ready; you can complete the rest later.</p>
          <b-alert v-if="successMessage" variant="success" dismissible show class="mb-3">{{ successMessage }}</b-alert>
          <b-alert v-if="error" variant="danger" show class="mb-3">{{ error }}</b-alert>

          <template v-if="loaded">
            <!-- Tab 1: Company & public profile -->
            <div v-show="activeTab === 'company'" class="seller-profile-tab-pane">
              <h6 class="section-label mb-3">Company & public profile</h6>
              <b-row>
                <b-col cols="12">
                  <b-form-group label="Bio" label-for="bio" description="Short description of your company (shown on your store).">
                    <b-form-textarea id="bio" v-model="form.bio" rows="3" placeholder="Tell customers about your business..." />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Company logo" description="Upload a logo or paste its URL. Shown on your store and microsite.">
                    <div class="d-flex flex-wrap align-items-start gap-2">
                      <input
                        ref="logoFileInput"
                        type="file"
                        accept="image/*"
                        class="d-none"
                        @change="onLogoFileSelect"
                      />
                      <b-button
                        variant="outline-primary"
                        size="sm"
                        :disabled="logoUploading"
                        @click="triggerLogoUpload"
                      >
                        {{ logoUploading ? 'Uploading…' : 'Upload logo' }}
                      </b-button>
                    </div>
                    <p class="small text-muted mt-1 mb-1">PNG or JPG, max 2 MB. Suggested: 200×80 (horizontal) or 160×160 (square).</p>
                    <p class="small text-muted mb-2">Or paste logo URL:</p>
                    <b-form-input id="logo_url" v-model="form.logo_url" placeholder="https://... or path from your uploads" />
                    <b-form-invalid-feedback :state="!logoUploadError">{{ logoUploadError }}</b-form-invalid-feedback>
                  </b-form-group>
                  <div v-if="logoPreview" class="mt-2">
                    <img :src="logoPreview" alt="Logo preview" class="rounded" style="max-height: 80px; max-width: 160px; object-fit: contain;" @error="onLogoPreviewError" />
                  </div>
                </b-col>
                <b-col md="6">
                  <p class="small text-muted mb-2">Use the store contact phone for customer support.</p>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Instagram" label-for="instagram_url">
                    <b-form-input id="instagram_url" v-model="form.instagram_url" placeholder="https://instagram.com/..." />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Facebook" label-for="facebook_url">
                    <b-form-input id="facebook_url" v-model="form.facebook_url" placeholder="https://facebook.com/..." />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Twitter / X" label-for="twitter_url">
                    <b-form-input id="twitter_url" v-model="form.twitter_url" placeholder="https://twitter.com/..." />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="TikTok" label-for="tiktok_url">
                    <b-form-input id="tiktok_url" v-model="form.tiktok_url" placeholder="https://tiktok.com/..." />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="LinkedIn" label-for="linkedin_url">
                    <b-form-input id="linkedin_url" v-model="form.linkedin_url" placeholder="https://linkedin.com/..." />
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" class="mt-3" :disabled="saving" @click="save">Save this section</b-button>
            </div>

            <!-- Tab 2: Business & payout -->
            <div v-show="activeTab === 'business'" class="seller-profile-tab-pane">
              <h6 class="section-label mb-3">Business & payout</h6>
              <b-row>
                <b-col md="6">
                  <b-form-group label="Business name" label-for="business_name">
                    <b-form-input id="business_name" v-model="form.business_name" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="TIN number" label-for="tin_number">
                    <b-form-input id="tin_number" v-model="form.tin_number" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Business license number" label-for="business_license_number">
                    <b-form-input id="business_license_number" v-model="form.business_license_number" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Business license expiry" label-for="business_license_expiry">
                    <b-form-input id="business_license_expiry" v-model="form.business_license_expiry" type="date" />
                  </b-form-group>
                </b-col>
                <b-col cols="12">
                  <b-form-group label="Cash withdrawal method" description="Choose how you want to receive payouts. Options are set by admin.">
                    <b-form-select
                      id="withdrawal_method"
                      v-model="payoutMethodType"
                      :options="withdrawalMethodOptions"
                      value-field="value"
                      text-field="text"
                      class="w-auto"
                    />
                  </b-form-group>
                </b-col>
                <template v-if="payoutMethodType === 'bank'">
                  <b-col md="6">
                    <b-form-group label="Bank" label-for="payout_bank">
                      <b-form-select
                        id="payout_bank"
                        v-model="payoutBankId"
                        :options="availableBanksOptions"
                        value-field="id"
                        text-field="name"
                        placeholder="Select bank"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col md="6">
                    <b-form-group label="Account number" label-for="payout_account_number">
                      <b-form-input id="payout_account_number" v-model="payoutAccountNumber" placeholder="Account number" />
                    </b-form-group>
                  </b-col>
                  <b-col md="6">
                    <b-form-group label="Account name" label-for="payout_account_name">
                      <b-form-input id="payout_account_name" v-model="payoutAccountName" placeholder="Account holder name" />
                    </b-form-group>
                  </b-col>
                </template>
                <template v-else-if="payoutMethodType === 'mobile_money'">
                  <b-col md="6">
                    <b-form-group label="Mobile money provider" label-for="payout_provider">
                      <b-form-select
                        id="payout_provider"
                        v-model="payoutProviderId"
                        :options="availableProvidersOptions"
                        value-field="id"
                        text-field="name"
                        placeholder="Select provider"
                      />
                    </b-form-group>
                  </b-col>
                  <b-col md="6">
                    <b-form-group label="Phone number" label-for="payout_phone">
                      <b-form-input id="payout_phone" v-model="payoutPhoneNumber" type="tel" placeholder="e.g. 0712345678" />
                    </b-form-group>
                  </b-col>
                </template>
                <template v-else-if="payoutMethodType === 'selcom'">
                  <b-col cols="12">
                    <p class="text-muted small mb-0">You will complete Selcom setup when requesting a payout. No extra details needed here.</p>
                  </b-col>
                </template>
                <b-col v-if="!availableMethodsLoaded && (form.preferred_payout_method || form.payout_account_details)" cols="12">
                  <b-form-group label="Payout account details (fallback)" description="Used if payment methods API is unavailable.">
                    <b-form-textarea id="payout_account_details" v-model="form.payout_account_details" rows="2" placeholder='e.g. {"bank_name":"...","account":"..."}' />
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" class="mt-3" :disabled="saving" @click="save">Save this section</b-button>
            </div>

            <!-- Tab 3: Store contact -->
            <div v-show="activeTab === 'contact'" class="seller-profile-tab-pane">
              <h6 class="section-label mb-3">Store contact (for buyers and delivery)</h6>
              <b-row>
                <b-col md="6">
                  <b-form-group label="Contact phone" label-for="contact_phone">
                    <b-form-input id="contact_phone" v-model="form.contact_phone" type="tel" placeholder="+255712345678" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Contact email" label-for="contact_email">
                    <b-form-input id="contact_email" v-model="form.contact_email" type="email" />
                  </b-form-group>
                </b-col>
                <b-col cols="12">
                  <b-form-group label="Business address" label-for="business_address">
                    <b-form-input id="business_address" v-model="form.business_address" placeholder="Store or business address" />
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" class="mt-3" :disabled="saving" @click="save">Save this section</b-button>
            </div>

            <!-- Tab 4: Merchant type -->
            <div v-show="activeTab === 'merchant'" class="seller-profile-tab-pane">
              <h6 class="section-label mb-3">Merchant type (optional: for food/grocery)</h6>
              <b-row>
                <b-col md="6">
                  <b-form-group label="Seller type" label-for="seller_type">
                    <b-form-select id="seller_type" v-model="form.seller_type" :options="SELLER_TYPE_OPTIONS" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Prep time (minutes)" label-for="prep_time_minutes">
                    <b-form-input id="prep_time_minutes" v-model.number="form.prep_time_minutes" type="number" min="0" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Opening hours" label-for="opening_hours">
                    <b-form-input id="opening_hours" v-model="form.opening_hours" placeholder="e.g. 08:00–20:00" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Min order amount" label-for="min_order_amount">
                    <b-form-input id="min_order_amount" v-model.number="form.min_order_amount" type="number" min="0" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Delivery radius (km)" label-for="delivery_radius_km">
                    <b-form-input id="delivery_radius_km" v-model.number="form.delivery_radius_km" type="number" min="0" step="0.1" />
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" class="mt-3" :disabled="saving" @click="save">Save this section</b-button>
            </div>

            <!-- Tab 5: Store link & menu -->
            <div v-show="activeTab === 'store'" class="seller-profile-tab-pane">
              <h6 class="section-label mb-3">Your store link</h6>
              <div v-if="storeLink" class="mb-4 p-3 bg-light rounded border border-primary border-opacity-25">
                <p class="mb-2 small text-muted">Share this link so customers can view your store or menu (no login required).</p>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <b-form-input :value="storeLink" readonly class="flex-grow-1" style="max-width: 400px;" />
                  <b-button size="sm" variant="primary" @click="copyStoreLink">Copy</b-button>
                  <router-link
                    v-if="storePreviewSlugOrId"
                    :to="{ name: 'preview.store', params: { slugOrId: storePreviewSlugOrId } }"
                    class="btn btn-sm btn-outline-primary"
                  >
                    Preview site
                  </router-link>
                  <a
                    v-if="storeLink"
                    :href="storeLink"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                  >
                    <Icon icon="solar:monitor-bold" class="me-1" />
                    Open
                  </a>
                </div>
              </div>
              <p v-else class="mb-4 small text-muted">Set a Menu / store slug below and save to get your store link.</p>

              <h6 class="section-label mb-2 mt-4">Menu / store slug</h6>
              <p class="text-muted small mb-2">Friendly URL for your store or menu (e.g. my-kitchen). Used in your store link above.</p>
              <b-row>
                <b-col md="6">
                  <b-form-group label="Menu / store slug" label-for="menu_slug">
                    <b-form-input id="menu_slug" v-model="form.menu_slug" placeholder="e.g. my-store" />
                  </b-form-group>
                </b-col>
              </b-row>

              <h6 class="section-label mb-2 mt-4">Menu display (restaurant)</h6>
              <p class="text-muted small mb-2">Customize card colors for your public menu page.</p>
              <b-row>
                <b-col md="6">
                  <b-form-group label="Menu card primary color" label-for="menu_card_primary_color">
                    <b-form-input id="menu_card_primary_color" v-model="form.menu_card_primary_color" type="color" class="w-auto" />
                    <b-form-input v-model="form.menu_card_primary_color" size="sm" class="mt-1" placeholder="#5C308F" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Menu card accent color" label-for="menu_card_accent_color">
                    <b-form-input id="menu_card_accent_color" v-model="form.menu_card_accent_color" type="color" class="w-auto" />
                    <b-form-input v-model="form.menu_card_accent_color" size="sm" class="mt-1" placeholder="#F7A829" />
                  </b-form-group>
                </b-col>
              </b-row>
              <b-button variant="primary" class="mt-3" :disabled="saving" @click="save">Save this section</b-button>
            </div>
          </template>
          <p v-else-if="loading" class="mb-0">Loading…</p>
        </b-card>
      </div>

      <!-- Tabs on the right -->
      <div class="seller-profile-nav flex-shrink-0">
        <nav class="nav flex-lg-column nav-pills">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            type="button"
            class="nav-link text-start"
            :class="{ active: activeTab === tab.id }"
            @click="activeTab = tab.id"
          >
            <span class="nav-link-icon-wrap">
              <Icon :icon="tab.icon" class="nav-link-icon" />
            </span>
            <span class="nav-link-text">{{ tab.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { Icon } from '@iconify/vue'
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { authApi, userApi, payoutsSellerApi, type PayoutMethodOption } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'

const auth = useAuthStore()
const verificationStatusLabel = computed(() => {
  const v = auth.user && (auth.user as { is_verified?: boolean }).is_verified
  return v === true ? 'Approved' : 'Pending'
})

const tabs = [
  { id: 'company', label: 'Company & public profile', icon: 'solar:buildings-2-bold-duotone' },
  { id: 'business', label: 'Business & payout', icon: 'solar:wallet-money-bold-duotone' },
  { id: 'contact', label: 'Store contact', icon: 'solar:phone-calling-bold-duotone' },
  { id: 'merchant', label: 'Merchant type', icon: 'solar:shop-2-bold-duotone' },
  { id: 'store', label: 'Store link & menu', icon: 'solar:link-bold-duotone' },
] as const

type TabId = (typeof tabs)[number]['id']
const activeTab = ref<TabId>('company')

interface ApiError {
  response?: { data?: { detail?: string } }
  message?: string
}

interface SellerProfileForm {
  bio: string
  logo_url: string
  instagram_url: string
  facebook_url: string
  twitter_url: string
  tiktok_url: string
  linkedin_url: string
  business_name: string
  tin_number: string
  business_license_number: string
  business_license_expiry: string
  preferred_payout_method: string
  payout_account_details: string
  contact_phone: string
  contact_email: string
  business_address: string
  seller_type: string
  prep_time_minutes: number | undefined
  opening_hours: string
  min_order_amount: number | undefined
  delivery_radius_km: number | undefined
  menu_slug: string
  menu_card_primary_color: string
  menu_card_accent_color: string
}

const SELLER_TYPE_OPTIONS = [
  { value: '', text: 'Marketplace (default)' },
  { value: 'marketplace', text: 'Marketplace' },
  { value: 'restaurant', text: 'Restaurant' },
  { value: 'grocery', text: 'Grocery' },
] as const

const loading = ref(false)
const loaded = ref(false)
const error = ref('')
const successMessage = ref('')
const saving = ref(false)
const profileId = ref<number | string | null>(null)
const logoPreviewError = ref(false)
const logoFileInput = ref<HTMLInputElement | null>(null)
const logoUploading = ref(false)
const logoUploadError = ref('')

const availableBanks = ref<PayoutMethodOption[]>([])
const availableProviders = ref<PayoutMethodOption[]>([])
const selcomEnabled = ref(false)
const availableMethodsLoaded = ref(false)
const payoutMethodType = ref<'bank' | 'mobile_money' | 'selcom'>('bank')
const payoutBankId = ref<string | number | null>(null)
const payoutAccountNumber = ref('')
const payoutAccountName = ref('')
const payoutProviderId = ref<string | number | null>(null)
const payoutPhoneNumber = ref('')

const form = reactive<SellerProfileForm>({
  bio: '',
  logo_url: '',
  instagram_url: '',
  facebook_url: '',
  twitter_url: '',
  tiktok_url: '',
  linkedin_url: '',
  business_name: '',
  tin_number: '',
  business_license_number: '',
  business_license_expiry: '',
  preferred_payout_method: '',
  payout_account_details: '',
  contact_phone: '',
  contact_email: '',
  business_address: '',
  seller_type: '',
  prep_time_minutes: undefined,
  opening_hours: '',
  min_order_amount: undefined,
  delivery_radius_km: undefined,
  menu_slug: '',
  menu_card_primary_color: '#5C308F',
  menu_card_accent_color: '#F7A829',
})

const storePreviewSlugOrId = computed(() => {
  const slugOrId = form.menu_slug?.trim() || profileId.value
  if (slugOrId == null || slugOrId === '') return ''
  return String(slugOrId)
})

const storeLink = computed(() => {
  const slug = storePreviewSlugOrId.value
  if (!slug) return ''
  const basePath = (import.meta.env.BASE_URL || '/').replace(/\/$/, '')
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  return `${origin}${basePath}/store/${encodeURIComponent(slug)}`
})

const logoPreview = computed(() => {
  const url = form.logo_url?.trim()
  if (!url || logoPreviewError.value) return null
  return resolveAssetUrl(url)
})


const withdrawalMethodOptions = computed(() => {
  const opts: { value: 'bank' | 'mobile_money' | 'selcom'; text: string }[] = []
  if (availableBanks.value.some((b) => b.is_available !== false)) opts.push({ value: 'bank', text: 'Bank' })
  if (availableProviders.value.some((p) => p.is_available !== false)) opts.push({ value: 'mobile_money', text: 'Mobile money' })
  if (selcomEnabled.value) opts.push({ value: 'selcom', text: 'Selcom' })
  if (opts.length === 0) opts.push({ value: 'bank', text: 'Bank' }, { value: 'mobile_money', text: 'Mobile money' }, { value: 'selcom', text: 'Selcom' })
  return opts
})
const availableBanksOptions = computed(() =>
  availableBanks.value.filter((b) => b.is_available !== false)
)
const availableProvidersOptions = computed(() =>
  availableProviders.value.filter((p) => p.is_available !== false)
)

function toString(v: unknown): string {
  return v != null ? String(v) : ''
}

function toOptionalNumber(v: unknown): number | undefined {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  if (v != null) {
    const n = Number(v)
    return Number.isNaN(n) ? undefined : n
  }
  return undefined
}

function applyProfileToForm(d: Record<string, unknown>): void {
  profileId.value = (d.id != null ? d.id : d.user_id != null ? d.user_id : null) as number | string | null
  form.bio = toString(d.bio)
  form.logo_url = toString(d.logo_url ?? d.logo)
  form.instagram_url = toString(d.instagram_url)
  form.facebook_url = toString(d.facebook_url)
  form.twitter_url = toString(d.twitter_url)
  form.tiktok_url = toString(d.tiktok_url)
  form.linkedin_url = toString(d.linkedin_url)
  form.business_name = toString(d.business_name)
  form.tin_number = toString(d.tin_number)
  form.menu_slug = toString(d.menu_slug)
  form.menu_card_primary_color = toString(d.menu_card_primary_color) || '#5C308F'
  form.menu_card_accent_color = toString(d.menu_card_accent_color) || '#F7A829'
  form.business_license_number = toString(d.business_license_number)
  form.business_license_expiry = d.business_license_expiry ? String(d.business_license_expiry).slice(0, 10) : ''
  form.preferred_payout_method = toString(d.preferred_payout_method)
  form.payout_account_details =
    typeof d.payout_account_details === 'string'
      ? d.payout_account_details
      : d.payout_account_details != null
        ? JSON.stringify(d.payout_account_details)
        : ''
  const method = (form.preferred_payout_method || 'bank') as 'bank' | 'mobile_money' | 'selcom'
  if (['bank', 'mobile_money', 'selcom'].includes(method)) payoutMethodType.value = method
  let details: Record<string, unknown> = {}
  try {
    details = form.payout_account_details ? JSON.parse(form.payout_account_details) : {}
  } catch {}
  payoutBankId.value = details.bank_id != null ? (details.bank_id as string | number) : null
  payoutAccountNumber.value = toString(details.account_number)
  payoutAccountName.value = toString(details.account_name)
  payoutProviderId.value = details.provider_id != null ? (details.provider_id as string | number) : null
  payoutPhoneNumber.value = toString(details.phone_number)
  form.contact_phone = toString(d.contact_phone)
  form.contact_email = toString(d.contact_email)
  form.business_address = toString(d.business_address)
  form.seller_type = toString(d.seller_type) || ''
  form.prep_time_minutes = toOptionalNumber(d.prep_time_minutes)
  form.opening_hours = toString(d.opening_hours)
  form.min_order_amount = toOptionalNumber(d.min_order_amount)
  form.delivery_radius_km = toOptionalNumber(d.delivery_radius_km)
}

function buildSavePayload(): Record<string, unknown> {
  const trim = (s: string) => s?.trim() || undefined
  const payload: Record<string, unknown> = {
    bio: trim(form.bio),
    logo_url: trim(form.logo_url),
    instagram_url: trim(form.instagram_url),
    facebook_url: trim(form.facebook_url),
    twitter_url: trim(form.twitter_url),
    tiktok_url: trim(form.tiktok_url),
    linkedin_url: trim(form.linkedin_url),
    business_name: trim(form.business_name) ?? undefined,
    tin_number: trim(form.tin_number) ?? undefined,
    business_license_number: trim(form.business_license_number) ?? undefined,
    business_license_expiry: trim(form.business_license_expiry) ?? undefined,
    preferred_payout_method: availableMethodsLoaded.value ? (payoutMethodType.value || undefined) : (trim(form.preferred_payout_method) ?? undefined),
    contact_phone: trim(form.contact_phone) ?? undefined,
    contact_email: trim(form.contact_email) ?? undefined,
    business_address: trim(form.business_address) ?? undefined,
    seller_type: trim(form.seller_type) ?? undefined,
    prep_time_minutes: form.prep_time_minutes,
    opening_hours: trim(form.opening_hours) ?? undefined,
    min_order_amount: form.min_order_amount,
    delivery_radius_km: form.delivery_radius_km,
    menu_slug: trim(form.menu_slug),
    menu_card_primary_color: trim(form.menu_card_primary_color) || undefined,
    menu_card_accent_color: trim(form.menu_card_accent_color) || undefined,
  }
  if (availableMethodsLoaded.value) {
    if (payoutMethodType.value === 'bank') {
      payload.payout_account_details = {
        bank_id: payoutBankId.value ?? undefined,
        account_number: payoutAccountNumber.value?.trim() || undefined,
        account_name: payoutAccountName.value?.trim() || undefined,
      }
    } else if (payoutMethodType.value === 'mobile_money') {
      payload.payout_account_details = {
        provider_id: payoutProviderId.value ?? undefined,
        phone_number: payoutPhoneNumber.value?.trim() || undefined,
      }
    } else if (payoutMethodType.value === 'selcom') {
      payload.payout_account_details = {}
    }
  } else if (form.payout_account_details) {
    try {
      payload.payout_account_details = JSON.parse(form.payout_account_details)
    } catch {
      payload.payout_account_details = form.payout_account_details
    }
  }
  return payload
}

function getApiErrorDetail(e: unknown): string {
  const err = e as ApiError
  return err.response?.data?.detail ?? err.message ?? ''
}

function copyStoreLink(): void {
  const link = storeLink.value
  if (!link) return
  navigator.clipboard
    .writeText(link)
    .then(() => {
      successMessage.value = 'Store link copied to clipboard.'
      setTimeout(() => { successMessage.value = '' }, 3000)
    })
    .catch(() => {
      error.value = 'Could not copy to clipboard. Try selecting the link manually.'
    })
}

function onLogoPreviewError(): void {
  logoPreviewError.value = true
}

function triggerLogoUpload(): void {
  logoFileInput.value?.click()
}

const MAX_LOGO_SIZE = 2 * 1024 * 1024 // 2 MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

async function onLogoFileSelect(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement
  const file = input?.files?.[0]
  if (!file) return
  logoUploadError.value = ''
  if (!ACCEPTED_TYPES.includes(file.type)) {
    logoUploadError.value = 'Please choose a PNG, JPG, GIF or WebP image.'
    input.value = ''
    return
  }
  if (file.size > MAX_LOGO_SIZE) {
    logoUploadError.value = 'Image must be 2 MB or smaller.'
    input.value = ''
    return
  }
  logoUploading.value = true
  try {
    const formData = new FormData()
    formData.append('logo', file)
    const { data } = await userApi.uploadSellerProfileLogo(formData)
    const url = data?.logo_url ?? (data as { url?: string })?.url
    if (url) {
      form.logo_url = url
      logoPreviewError.value = false
      successMessage.value = 'Logo uploaded. Save this section to keep it.'
      setTimeout(() => { successMessage.value = '' }, 3000)
    } else {
      logoUploadError.value = 'Upload succeeded but no logo URL was returned.'
    }
  } catch (err: unknown) {
    logoUploadError.value = getApiErrorDetail(err) || 'Upload failed.'
  } finally {
    logoUploading.value = false
    input.value = ''
  }
}

watch(() => form.logo_url, () => { logoPreviewError.value = false })

async function loadAvailablePayoutMethods(): Promise<void> {
  try {
    const res = await payoutsSellerApi.getAvailablePayoutMethods()
    const d = (res?.data ?? res ?? {}) as { banks?: PayoutMethodOption[]; mobile_money_providers?: PayoutMethodOption[]; selcom_enabled?: boolean }
    availableBanks.value = Array.isArray(d.banks) ? d.banks : []
    availableProviders.value = Array.isArray(d.mobile_money_providers) ? d.mobile_money_providers : []
    selcomEnabled.value = Boolean(d.selcom_enabled)
  } catch {
    availableBanks.value = []
    availableProviders.value = []
    selcomEnabled.value = false
  } finally {
    availableMethodsLoaded.value = true
  }
}

onMounted(async () => {
  loading.value = true
  error.value = ''
  logoPreviewError.value = false
  loadAvailablePayoutMethods()
  try {
    const { data } = await authApi.getSellerProfile()
    const d = (data ?? {}) as Record<string, unknown>
    applyProfileToForm(d)
    loaded.value = true
  } catch (e: unknown) {
    error.value = getApiErrorDetail(e) || 'Failed to load profile'
  } finally {
    loading.value = false
  }
})

async function save(): Promise<void> {
  error.value = ''
  successMessage.value = ''
  saving.value = true
  try {
    const payload = buildSavePayload()
    await authApi.updateSellerProfile(payload)
    successMessage.value = 'Profile saved successfully.'
  } catch (e: unknown) {
    error.value = getApiErrorDetail(e) || 'Save failed'
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.seller-profile-page .section-label {
  font-weight: 600;
  font-size: 1rem;
  color: var(--bs-headings-color);
}
.seller-profile-nav {
  width: 100%;
  max-width: 280px;
}
@media (min-width: 992px) {
  .seller-profile-nav { width: auto; min-width: 220px; }
}
.seller-profile-nav .nav {
  gap: 0.25rem;
}
.seller-profile-nav .nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.85rem;
  border-radius: 12px;
  color: var(--bs-body-color);
  border: 1px solid transparent;
}
.seller-profile-nav .nav-link:hover {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.08);
  color: var(--bs-primary);
}
.seller-profile-nav .nav-link.active {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.12);
  color: var(--bs-primary);
  border-color: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.3);
}
.nav-link-icon-wrap {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.1);
}
.seller-profile-nav .nav-link.active .nav-link-icon-wrap {
  background: rgba(var(--bs-primary-rgb, 92, 48, 143), 0.2);
}
.nav-link-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--bs-primary);
}
.seller-profile-tab-pane {
  min-height: 200px;
}
</style>
