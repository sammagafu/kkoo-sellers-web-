<template>
  <VerticalLayout>
    <b-card>
      <div class="d-flex flex-wrap align-items-start gap-3 mb-3">
        <div class="me-auto">
          <h1 class="h4 mb-1">Push &amp; promo campaigns</h1>
          <p class="text-muted mb-0">
            Three easy steps: write the offer → pick who gets it → send a test, then send for real.
          </p>
        </div>
        <b-button variant="primary" @click="openCreate">Create campaign</b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
        <router-link class="btn btn-outline-warning btn-sm" :to="{ name: 'admin.flash-sales' }">Flash sales</router-link>
        <router-link class="btn btn-outline-secondary btn-sm" :to="{ name: 'admin.promotions' }">Discount promos</router-link>
      </div>

      <b-alert v-if="error" variant="danger" show dismissible>{{ error }}</b-alert>
      <b-alert v-if="pushMsg" variant="success" show dismissible>{{ pushMsg }}</b-alert>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(placement)="row">
          <span class="small">{{ placementLabel(row.item.placement) }}</span>
        </template>
        <template #cell(channels)="row">
          <span class="small">{{ channelSummary(row.item.delivery_channels) }}</span>
        </template>
        <template #cell(window)="row">
          <span class="small">{{ formatWindow(row.item.start_at, row.item.end_at) }}</span>
        </template>
        <template #cell(active)="row">
          <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">
            {{ row.item.is_active ? 'On' : 'Off' }}
          </b-badge>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="success" class="me-1" @click="openSend(row.item)">Send</b-button>
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(row.item)">Edit</b-button>
          <b-button size="sm" variant="outline-danger" @click="remove(row.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="loading" class="text-muted mb-0">Loading…</p>
      <EmptyState
        v-else
        title="No campaigns yet"
        message="Create one to show a banner or send a push about a deal."
      />
    </b-card>

    <!-- Create / Edit wizard -->
    <b-modal
      v-model="showModal"
      :title="editingId ? 'Edit campaign' : 'Create campaign'"
      size="lg"
      hide-footer
      @hidden="onModalHidden"
    >
      <nav class="camp-steps mb-3" aria-label="Campaign steps">
        <button
          v-for="s in stepMeta"
          :key="s.n"
          type="button"
          class="camp-steps__btn"
          :class="{ 'camp-steps__btn--active': wizardStep === s.n, 'camp-steps__btn--done': wizardStep > s.n }"
          @click="wizardStep = s.n"
        >
          <span class="camp-steps__num">{{ s.n }}</span>
          {{ s.label }}
        </button>
      </nav>

      <b-alert v-if="modalError" variant="danger" show class="mb-3">{{ modalError }}</b-alert>

      <!-- Step 1: What -->
      <div v-show="wizardStep === 1">
        <h2 class="h6 mb-2">What are you promoting?</h2>
        <b-form-group label="Title" class="mb-2">
          <b-form-input v-model="form.title" placeholder="Weekend flash deals" required />
        </b-form-group>
        <b-form-group label="Short message" class="mb-2">
          <b-form-input v-model="form.subtitle" placeholder="Up to 40% off — tap to shop" />
        </b-form-group>
        <b-form-group label="Photo" class="mb-2">
          <img v-if="imagePreview" :src="imagePreview" alt="Preview" class="campaign-image-preview mb-2" />
          <input type="file" accept="image/*" class="form-control mb-2" @change="onImageFileChange" />
          <b-form-input v-model="form.image_url" placeholder="Or paste image URL" />
          <p class="text-muted small mt-1 mb-0">
            Suggested size: <strong>{{ imageSizeBadge(form.placement) }}</strong> — {{ imageSpecHint }}
          </p>
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Where it shows" class="mb-2">
              <b-form-select v-model="form.placement" :options="placementOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="App / vertical" class="mb-2">
              <b-form-select v-model="form.target_app_key" :options="appKeyOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Also send as" class="mb-2">
          <div class="d-flex flex-wrap gap-3">
            <b-form-checkbox v-model="channels.web_banner">Website banner</b-form-checkbox>
            <b-form-checkbox v-model="channels.app_banner">App banner</b-form-checkbox>
            <b-form-checkbox v-model="channels.web_advert">Website popup</b-form-checkbox>
            <b-form-checkbox v-model="channels.app_advert">App popup</b-form-checkbox>
            <b-form-checkbox v-model="channels.push">Push notification</b-form-checkbox>
          </div>
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Link flash sale" class="mb-2">
              <b-form-select v-model="form.flash_sale_id" :options="flashSaleOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Link discount promo" class="mb-2">
              <b-form-select v-model="form.promotion_id" :options="promotionOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-form-group label="Starts" class="mb-2">
              <b-form-input v-model="startLocal" type="datetime-local" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Ends" class="mb-2">
              <b-form-input v-model="endLocal" type="datetime-local" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Button text" class="mb-2">
          <b-form-input v-model="form.cta_label" placeholder="View offer" />
        </b-form-group>
        <details class="mb-2">
          <summary class="text-muted small">More options</summary>
          <b-form-group label="Promo chip" class="mb-2 mt-2">
            <b-form-select v-model="form.badge" :options="badgeOptions" />
          </b-form-group>
          <b-form-group label="Open this path" class="mb-2">
            <b-form-input v-model="form.cta_route" placeholder="/flash-sales" />
          </b-form-group>
          <b-form-group label="External link" class="mb-2">
            <b-form-input v-model="form.cta_external_url" />
          </b-form-group>
          <b-form-group label="Action" class="mb-2">
            <b-form-select v-model="form.action_type" :options="actionTypeOptions" />
          </b-form-group>
          <template v-if="form.action_type === 'preorder'">
            <b-form-group label="Preorder product ID" class="mb-2">
              <b-form-input v-model.number="manualProductId" type="number" min="1" @change="applyManualProductId" />
            </b-form-group>
            <b-form-input
              v-model="productSearchQuery"
              placeholder="Search product…"
              class="mb-2"
              @input="debouncedSearchProducts"
            />
            <div v-if="productSearchResults.length" class="campaign-product-results mb-2">
              <button
                v-for="prod in productSearchResults"
                :key="String(prod.id)"
                type="button"
                class="campaign-product-results__item"
                @click="selectProduct(prod)"
              >
                <span class="campaign-product-results__title">#{{ prod.id }} · {{ prod.title }}</span>
              </button>
            </div>
          </template>
          <b-row>
            <b-col md="4">
              <b-form-group label="Priority" class="mb-2">
                <b-form-input v-model.number="form.priority" type="number" />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Max views / person" class="mb-2">
                <b-form-input v-model.number="form.max_impressions_per_user" type="number" />
              </b-form-group>
            </b-col>
            <b-col md="4">
              <b-form-group label="Cooldown (hours)" class="mb-2">
                <b-form-input v-model.number="form.cooldown_hours" type="number" />
              </b-form-group>
            </b-col>
          </b-row>
          <b-form-checkbox v-model="form.is_active">Turn on when saved</b-form-checkbox>
        </details>
      </div>

      <!-- Step 2: Who -->
      <div v-show="wizardStep === 2">
        <h2 class="h6 mb-2">Who should get this?</h2>
        <p class="text-muted small mb-3">Pick a group. You can still change this when you press Send.</p>
        <div class="camp-audience mb-3">
          <label
            v-for="opt in audiencePresets"
            :key="opt.value"
            class="camp-audience__opt"
            :class="{ 'camp-audience__opt--on': audiencePreset === opt.value }"
          >
            <input v-model="audiencePreset" type="radio" class="d-none" :value="opt.value" />
            <strong>{{ opt.title }}</strong>
            <span>{{ opt.hint }}</span>
          </label>
        </div>

        <div v-if="audiencePreset === 'shops'" class="mb-3">
          <b-form-group label="Find shops" class="mb-2">
            <b-form-input v-model="shopSearch" placeholder="Search shop name…" @input="debouncedShopSearch" />
          </b-form-group>
          <div v-if="shopResults.length" class="campaign-product-results mb-2">
            <button
              v-for="shop in shopResults"
              :key="shop.userId"
              type="button"
              class="campaign-product-results__item"
              @click="toggleShop(shop)"
            >
              <span class="campaign-product-results__title">
                {{ selectedShopIds.includes(shop.userId) ? '✓ ' : '' }}{{ shop.name }}
              </span>
              <span class="campaign-product-results__slug">Owner user #{{ shop.userId }}</span>
            </button>
          </div>
          <p v-if="selectedShopIds.length" class="small mb-0">
            Selected: {{ selectedShopIds.length }} shop(s)
            <b-button size="sm" variant="link" class="py-0" @click="selectedShopIds = []">Clear</b-button>
          </p>
        </div>

        <div v-if="audiencePreset === 'test'" class="mb-3">
          <b-form-group label="Test user IDs" class="mb-0">
            <b-form-input v-model="testUserIdsText" placeholder="e.g. 12, 45, 90" />
            <small class="text-muted">Comma-separated user IDs — send only to these people.</small>
          </b-form-group>
        </div>

        <h3 class="h6 mb-2">Device</h3>
        <div class="d-flex flex-wrap gap-3 mb-2">
          <b-form-checkbox v-model="deviceAndroid">Android</b-form-checkbox>
          <b-form-checkbox v-model="deviceIos">iPhone / iOS</b-form-checkbox>
        </div>
        <p class="text-muted small mb-0">Leave both unchecked to include every device.</p>
      </div>

      <!-- Step 3: Send -->
      <div v-show="wizardStep === 3">
        <h2 class="h6 mb-2">Save &amp; send</h2>
        <ol class="small text-muted mb-3 ps-3">
          <li>Save the campaign</li>
          <li>Optional: send a test to yourself</li>
          <li>Check how many people match, then send</li>
        </ol>
        <div class="camp-summary mb-3">
          <p class="mb-1"><strong>{{ form.title || 'Untitled' }}</strong></p>
          <p class="small text-muted mb-1">{{ form.subtitle || 'No message' }}</p>
          <p class="small mb-0">
            {{ audiencePresetLabel }} · {{ deviceLabel }} · {{ placementLabel(form.placement) }}
          </p>
        </div>
        <p v-if="estimateText" class="fw-semibold mb-3">{{ estimateText }}</p>
        <div class="d-flex flex-wrap gap-2 mb-2">
          <b-button variant="outline-primary" :disabled="saving" @click="saveOnly">
            {{ saving ? 'Saving…' : editingId ? 'Save changes' : 'Save campaign' }}
          </b-button>
          <b-button variant="outline-secondary" :disabled="!canPush || sending" @click="runEstimate">
            Estimate audience
          </b-button>
          <b-button variant="outline-success" :disabled="!canPush || sending" @click="runSendTest">
            Send test
          </b-button>
          <b-button variant="success" :disabled="!canPush || sending" @click="runSendLive">
            {{ sending ? 'Sending…' : 'Send now' }}
          </b-button>
        </div>
        <b-form-group v-if="audiencePreset !== 'test'" label="Test user IDs (for Send test)" class="mb-0">
          <b-form-input v-model="testUserIdsText" placeholder="Your user ID, e.g. 1" />
        </b-form-group>
      </div>

      <div class="d-flex flex-wrap gap-2 mt-4">
        <b-button v-if="wizardStep > 1" variant="outline-secondary" @click="wizardStep -= 1">Back</b-button>
        <b-button v-if="wizardStep < 3" variant="primary" @click="nextStep">Continue</b-button>
        <b-button variant="outline-secondary" class="ms-auto" @click="showModal = false">Close</b-button>
      </div>
    </b-modal>

    <!-- Send existing campaign -->
    <b-modal v-model="sendShow" title="Send campaign" hide-footer @hidden="clearSend">
      <p v-if="sendTarget" class="mb-3">
        <strong>{{ sendTarget.title }}</strong>
      </p>
      <b-alert v-if="sendError" variant="danger" show>{{ sendError }}</b-alert>
      <b-alert v-if="sendInfo" variant="success" show>{{ sendInfo }}</b-alert>

      <div class="camp-audience mb-3">
        <label
          v-for="opt in audiencePresets"
          :key="'s-' + opt.value"
          class="camp-audience__opt"
          :class="{ 'camp-audience__opt--on': audiencePreset === opt.value }"
        >
          <input v-model="audiencePreset" type="radio" class="d-none" :value="opt.value" />
          <strong>{{ opt.title }}</strong>
          <span>{{ opt.hint }}</span>
        </label>
      </div>

      <div v-if="audiencePreset === 'shops'" class="mb-3">
        <b-form-input v-model="shopSearch" placeholder="Search shop…" class="mb-2" @input="debouncedShopSearch" />
        <div v-if="shopResults.length" class="campaign-product-results mb-2">
          <button
            v-for="shop in shopResults"
            :key="'send-' + shop.userId"
            type="button"
            class="campaign-product-results__item"
            @click="toggleShop(shop)"
          >
            <span class="campaign-product-results__title">
              {{ selectedShopIds.includes(shop.userId) ? '✓ ' : '' }}{{ shop.name }}
            </span>
          </button>
        </div>
      </div>

      <div v-if="audiencePreset === 'test'" class="mb-3">
        <b-form-input v-model="testUserIdsText" placeholder="User IDs, e.g. 12, 45" />
      </div>

      <div class="d-flex flex-wrap gap-3 mb-3">
        <b-form-checkbox v-model="deviceAndroid">Android</b-form-checkbox>
        <b-form-checkbox v-model="deviceIos">iPhone / iOS</b-form-checkbox>
      </div>

      <p v-if="estimateText" class="fw-semibold">{{ estimateText }}</p>

      <div class="d-flex flex-wrap gap-2 mt-3">
        <b-button variant="outline-secondary" :disabled="sending" @click="runEstimate">Estimate</b-button>
        <b-button variant="outline-success" :disabled="sending" @click="runSendTest">Send test</b-button>
        <b-button variant="success" :disabled="sending" @click="runSendLive">Send now</b-button>
        <b-button variant="outline-secondary" class="ms-auto" @click="sendShow = false">Close</b-button>
      </div>
      <b-form-group v-if="audiencePreset !== 'test'" label="Test user IDs" class="mt-3 mb-0">
        <b-form-input v-model="testUserIdsText" placeholder="Your user ID" />
      </b-form-group>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import {
  campaignsAdminApi,
  promotionsAdminApi,
  adminListFlashSales,
  catalogAdminApi,
  sellersAdminApi,
  type AppCampaignPayload,
  type CampaignPushPayload,
} from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import {
  imageSizeBadge,
  imageUploadHint,
} from '@/utils/campaignCreative'

type CampaignRow = AppCampaignPayload & { id: number }
type ShopHit = { userId: number; name: string }

const items = ref<CampaignRow[]>([])
const loading = ref(false)
const error = ref('')
const modalError = ref('')
const saving = ref(false)
const sending = ref(false)
const pushMsg = ref('')
const showModal = ref(false)
const editingId = ref<number | null>(null)
const wizardStep = ref(1)
const imageFile = ref<File | null>(null)
const imagePreview = ref('')
const startLocal = ref('')
const endLocal = ref('')

const productSearchQuery = ref('')
const productSearchResults = ref<Array<{ id: number; title: string; slug: string }>>([])
const manualProductId = ref<number | null>(null)
let productSearchDebounce: ReturnType<typeof setTimeout> | null = null
let shopSearchDebounce: ReturnType<typeof setTimeout> | null = null

const flashSaleOptions = ref<{ value: number | null; text: string }[]>([{ value: null, text: '— None —' }])
const promotionOptions = ref<{ value: number | null; text: string }[]>([{ value: null, text: '— None —' }])

const audiencePreset = ref<'subscribers' | 'buyers' | 'sellers' | 'shops' | 'test'>('subscribers')
const deviceAndroid = ref(false)
const deviceIos = ref(false)
const testUserIdsText = ref('')
const shopSearch = ref('')
const shopResults = ref<ShopHit[]>([])
const selectedShopIds = ref<number[]>([])
const estimateText = ref('')

const sendShow = ref(false)
const sendTarget = ref<CampaignRow | null>(null)
const sendError = ref('')
const sendInfo = ref('')

const stepMeta = [
  { n: 1, label: 'Offer' },
  { n: 2, label: 'Who' },
  { n: 3, label: 'Send' },
]

const audiencePresets = [
  { value: 'subscribers', title: 'Deal subscribers', hint: 'People who opted into Promotions & Offers' },
  { value: 'buyers', title: 'All buyers', hint: 'Active buyer accounts' },
  { value: 'sellers', title: 'All shops', hint: 'Every seller / shop owner' },
  { value: 'shops', title: 'Specific shops', hint: 'Pick one or more shops by name' },
  { value: 'test', title: 'Test people', hint: 'Only the user IDs you type' },
] as const

const placementOptions = [
  { value: 'inapp_advert', text: 'Full-screen popup' },
  { value: 'home_hero', text: 'Home hero' },
  { value: 'promo_banner', text: 'Home promo strip' },
  { value: 'promo_carousel', text: 'Home carousel' },
  { value: 'food_tab_top', text: 'Food tab banner' },
  { value: 'grocery_tab_top', text: 'Grocery tab banner' },
  { value: 'cart_top', text: 'Cart banner' },
  { value: 'checkout_top', text: 'Checkout banner' },
  { value: 'rewards_top', text: 'Rewards banner' },
]
const actionTypeOptions = [
  { value: '', text: 'Open link / linked deal' },
  { value: 'preorder', text: 'Preorder product' },
]
const badgeOptions = [
  { value: '', text: 'Auto' },
  { value: 'preorder', text: 'Preorder' },
  { value: 'limited', text: 'Limited offer' },
  { value: 'flash', text: 'Flash' },
  { value: 'new', text: 'New' },
  { value: 'sale', text: 'Sale' },
  { value: 'hot', text: 'Hot' },
]
const appKeyOptions = [
  { value: 'all', text: 'All apps' },
  { value: 'marketplace', text: 'Marketplace' },
  { value: 'food', text: 'Food' },
  { value: 'grocery', text: 'Grocery' },
]

const channels = reactive<Record<string, boolean>>({
  web_advert: false,
  app_advert: false,
  web_banner: true,
  app_banner: false,
  push: true,
})

const form = reactive<AppCampaignPayload & { is_active?: boolean }>({
  title: '',
  subtitle: '',
  placement: 'promo_banner',
  delivery_channels: 'web_banner,push',
  gift_voucher_id: undefined,
  gift_label: '',
  flash_sale_id: null,
  promotion_id: null,
  action_type: '',
  product_id: null,
  remaining_stock: null,
  badge: '',
  start_at: '',
  end_at: '',
  cta_label: 'View offer',
  cta_route: '/flash-sales',
  cta_external_url: '',
  image_url: '',
  priority: 10,
  max_impressions_per_user: 5,
  cooldown_hours: 24,
  target_app_key: 'marketplace',
  is_active: true,
})

const imageSpecHint = computed(() => imageUploadHint(form.placement))
const canPush = computed(() => editingId.value != null || !!sendTarget.value)

const audiencePresetLabel = computed(() => {
  const hit = audiencePresets.find((p) => p.value === audiencePreset.value)
  return hit?.title ?? 'Audience'
})

const deviceLabel = computed(() => {
  if (deviceAndroid.value && deviceIos.value) return 'Android + iPhone'
  if (deviceAndroid.value) return 'Android only'
  if (deviceIos.value) return 'iPhone only'
  return 'All devices'
})

const fields = [
  { key: 'title', label: 'Title' },
  { key: 'placement', label: 'Shows on' },
  { key: 'channels', label: 'Channels' },
  { key: 'window', label: 'When' },
  { key: 'active', label: 'Status' },
  { key: 'actions', label: '' },
]

watch(
  () => form.image_url,
  (url) => {
    if (!imageFile.value) imagePreview.value = resolveAssetUrl(url) ?? ''
  },
)

function placementLabel(raw?: string) {
  return placementOptions.find((p) => p.value === raw)?.text ?? raw ?? '—'
}

function channelSummary(raw?: string) {
  const parts = String(raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) return 'Default surfaces'
  return parts
    .map((p) => {
      if (p === 'push') return 'Push'
      if (p.includes('banner')) return 'Banner'
      if (p.includes('advert')) return 'Popup'
      return p
    })
    .join(', ')
}

function formatWindow(start?: string, end?: string) {
  const a = start ? new Date(start) : null
  const b = end ? new Date(end) : null
  const fmt = (d: Date) =>
    Number.isNaN(d.getTime()) ? '—' : d.toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  if (!a && !b) return '—'
  return `${a ? fmt(a) : '?'} → ${b ? fmt(b) : '?'}`
}

function channelsToString() {
  return (['web_advert', 'app_advert', 'web_banner', 'app_banner', 'push'] as const)
    .filter((ch) => channels[ch])
    .join(',')
}

function applyChannelsFromString(raw?: string) {
  ;(['web_advert', 'app_advert', 'web_banner', 'app_banner', 'push'] as const).forEach((ch) => {
    channels[ch] = false
  })
  const parts = String(raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) {
    channels.web_banner = true
    channels.push = true
    return
  }
  parts.forEach((p) => {
    if (p in channels) channels[p] = true
  })
}

function toLocalInput(iso: string) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function localToRfc3339(local: string) {
  const s = String(local ?? '').trim()
  if (!s) return ''
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return s
  return d.toISOString()
}

function parseUserIds(text: string): number[] {
  return String(text ?? '')
    .split(/[,\s]+/)
    .map((x) => Number(x.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
}

function buildTargets(forTest = false): CampaignPushPayload['targets'] {
  const platforms: string[] = []
  if (deviceAndroid.value) platforms.push('android')
  if (deviceIos.value) platforms.push('ios')

  if (forTest || audiencePreset.value === 'test') {
    const ids = parseUserIds(testUserIdsText.value)
    return {
      mode: 'users',
      user_ids: ids,
      platforms: platforms.length ? platforms : undefined,
    }
  }
  if (audiencePreset.value === 'subscribers') {
    return {
      mode: 'subscribers',
      platforms: platforms.length ? platforms : undefined,
    }
  }
  if (audiencePreset.value === 'buyers') {
    return {
      mode: 'users',
      include_buyers: true,
      include_sellers: false,
      require_push: platforms.length > 0,
      platforms: platforms.length ? platforms : undefined,
    }
  }
  if (audiencePreset.value === 'sellers') {
    return {
      mode: 'users',
      include_buyers: false,
      include_sellers: true,
      require_push: platforms.length > 0,
      platforms: platforms.length ? platforms : undefined,
    }
  }
  return {
    mode: 'users',
    include_buyers: false,
    include_sellers: false,
    seller_user_ids: [...selectedShopIds.value],
    platforms: platforms.length ? platforms : undefined,
  }
}

function syncDatesFromLocal() {
  form.start_at = localToRfc3339(startLocal.value)
  form.end_at = localToRfc3339(endLocal.value)
}

function nextStep() {
  modalError.value = ''
  if (wizardStep.value === 1) {
    syncDatesFromLocal()
    if (!form.title?.trim() || !form.start_at || !form.end_at) {
      modalError.value = 'Add a title, start time, and end time.'
      return
    }
  }
  if (wizardStep.value === 2) {
    if (audiencePreset.value === 'shops' && !selectedShopIds.value.length) {
      modalError.value = 'Pick at least one shop, or choose another group.'
      return
    }
    if (audiencePreset.value === 'test' && !parseUserIds(testUserIdsText.value).length) {
      modalError.value = 'Enter at least one test user ID.'
      return
    }
  }
  wizardStep.value += 1
}

function resetAudience() {
  audiencePreset.value = 'subscribers'
  deviceAndroid.value = false
  deviceIos.value = false
  testUserIdsText.value = ''
  shopSearch.value = ''
  shopResults.value = []
  selectedShopIds.value = []
  estimateText.value = ''
}

function resetForm() {
  editingId.value = null
  wizardStep.value = 1
  Object.assign(form, {
    title: '',
    subtitle: '',
    placement: 'promo_banner',
    delivery_channels: 'web_banner,push',
    gift_voucher_id: undefined,
    gift_label: '',
    flash_sale_id: null,
    promotion_id: null,
    action_type: '',
    product_id: null,
    remaining_stock: null,
    badge: '',
    start_at: '',
    end_at: '',
    cta_label: 'View offer',
    cta_route: '/flash-sales',
    cta_external_url: '',
    image_url: '',
    priority: 10,
    max_impressions_per_user: 5,
    cooldown_hours: 24,
    target_app_key: 'marketplace',
    is_active: true,
  })
  applyChannelsFromString('web_banner,push')
  imageFile.value = null
  imagePreview.value = ''
  const now = new Date()
  const week = new Date(now.getTime() + 7 * 24 * 3600 * 1000)
  startLocal.value = toLocalInput(now.toISOString())
  endLocal.value = toLocalInput(week.toISOString())
  manualProductId.value = null
  productSearchQuery.value = ''
  productSearchResults.value = []
  resetAudience()
  modalError.value = ''
}

function openCreate() {
  resetForm()
  showModal.value = true
}

function openEdit(row: CampaignRow) {
  editingId.value = row.id
  wizardStep.value = 1
  modalError.value = ''
  Object.assign(form, {
    title: row.title ?? '',
    subtitle: row.subtitle ?? '',
    placement: row.placement ?? 'promo_banner',
    delivery_channels: row.delivery_channels ?? '',
    gift_voucher_id: row.gift_voucher_id ?? undefined,
    gift_label: row.gift_label ?? '',
    flash_sale_id: row.flash_sale_id ?? null,
    promotion_id: row.promotion_id ?? null,
    action_type: row.action_type ?? '',
    product_id: row.product_id ?? null,
    remaining_stock: row.remaining_stock ?? null,
    badge: row.badge ?? '',
    start_at: String(row.start_at ?? ''),
    end_at: String(row.end_at ?? ''),
    cta_label: row.cta_label ?? '',
    cta_route: row.cta_route ?? '',
    cta_external_url: row.cta_external_url ?? '',
    image_url: row.image_url ?? '',
    priority: row.priority ?? 10,
    max_impressions_per_user: row.max_impressions_per_user ?? 5,
    cooldown_hours: row.cooldown_hours ?? 24,
    target_app_key: row.target_app_key ?? 'marketplace',
    is_active: row.is_active !== false,
  })
  applyChannelsFromString(row.delivery_channels)
  startLocal.value = toLocalInput(String(row.start_at ?? ''))
  endLocal.value = toLocalInput(String(row.end_at ?? ''))
  manualProductId.value = row.product_id ?? null
  imagePreview.value = resolveAssetUrl(row.image_url ?? '') ?? ''
  imageFile.value = null
  resetAudience()
  showModal.value = true
}

function openSend(row: CampaignRow) {
  sendTarget.value = row
  sendError.value = ''
  sendInfo.value = ''
  estimateText.value = ''
  resetAudience()
  sendShow.value = true
}

function clearSend() {
  sendTarget.value = null
  sendError.value = ''
  sendInfo.value = ''
}

function onModalHidden() {
  if (!showModal.value) resetForm()
}

function onImageFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  imageFile.value = file
  imagePreview.value = file ? URL.createObjectURL(file) : resolveAssetUrl(form.image_url) ?? ''
}

function applyManualProductId() {
  const id = Number(manualProductId.value)
  if (Number.isFinite(id) && id > 0) form.product_id = id
}

function selectProduct(prod: { id: number; title: string; slug: string }) {
  form.product_id = prod.id
  manualProductId.value = prod.id
  productSearchQuery.value = ''
  productSearchResults.value = []
  if (!form.cta_route?.trim() || form.cta_route.startsWith('/product/s/')) {
    form.cta_route = `/product/s/${prod.slug}`
  }
}

function debouncedSearchProducts() {
  if (productSearchDebounce) clearTimeout(productSearchDebounce)
  productSearchDebounce = setTimeout(searchProducts, 300)
}

async function searchProducts() {
  const q = productSearchQuery.value.trim()
  if (!q) {
    productSearchResults.value = []
    return
  }
  try {
    const { data } = await catalogAdminApi.listProducts({ search: q, page_size: 12 })
    const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
    productSearchResults.value = (raw as Record<string, unknown>[])
      .map((row) => ({
        id: Number(row.id),
        title: String(row.title ?? row.name ?? ''),
        slug: String(row.slug ?? ''),
      }))
      .filter((row) => row.id > 0 && row.title)
  } catch {
    productSearchResults.value = []
  }
}

function debouncedShopSearch() {
  if (shopSearchDebounce) clearTimeout(shopSearchDebounce)
  shopSearchDebounce = setTimeout(searchShops, 300)
}

async function searchShops() {
  const q = shopSearch.value.trim().toLowerCase()
  try {
    const { data } = await sellersAdminApi.list()
    const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
    shopResults.value = (raw as Record<string, unknown>[])
      .map((row) => {
        const user = (row.user as Record<string, unknown> | undefined) ?? {}
        const userId = Number(user.id ?? row.user_id ?? 0)
        const name = String(row.business_name ?? user.phone_number ?? `Shop #${row.id}`)
        return { userId, name }
      })
      .filter((s) => s.userId > 0 && (!q || s.name.toLowerCase().includes(q)))
      .slice(0, 20)
  } catch {
    shopResults.value = []
  }
}

function toggleShop(shop: ShopHit) {
  if (selectedShopIds.value.includes(shop.userId)) {
    selectedShopIds.value = selectedShopIds.value.filter((id) => id !== shop.userId)
  } else {
    selectedShopIds.value = [...selectedShopIds.value, shop.userId]
  }
}

function appendFormToFormData(fd: FormData) {
  syncDatesFromLocal()
  fd.append('title', form.title)
  fd.append('subtitle', form.subtitle ?? '')
  fd.append('image_url', form.image_url ?? '')
  fd.append('placement', form.placement ?? 'promo_banner')
  fd.append('delivery_channels', channelsToString())
  if (form.gift_voucher_id && form.gift_voucher_id > 0) fd.append('gift_voucher_id', String(form.gift_voucher_id))
  fd.append('gift_label', form.gift_label ?? '')
  if (form.flash_sale_id && form.flash_sale_id > 0) fd.append('flash_sale_id', String(form.flash_sale_id))
  if (form.promotion_id && form.promotion_id > 0) fd.append('promotion_id', String(form.promotion_id))
  fd.append('action_type', form.action_type === 'preorder' ? 'preorder' : '')
  fd.append(
    'product_id',
    form.action_type === 'preorder' && form.product_id && form.product_id > 0 ? String(form.product_id) : '',
  )
  fd.append('badge', form.badge ?? '')
  fd.append('cta_label', form.cta_label ?? '')
  fd.append('cta_route', form.cta_route ?? '')
  fd.append('cta_external_url', form.cta_external_url ?? '')
  fd.append('priority', String(form.priority ?? 10))
  fd.append('start_at', form.start_at)
  fd.append('end_at', form.end_at)
  fd.append('target_app_key', form.target_app_key ?? 'marketplace')
  fd.append('max_impressions_per_user', String(form.max_impressions_per_user ?? 5))
  fd.append('cooldown_hours', String(form.cooldown_hours ?? 24))
  fd.append('is_active', String(form.is_active !== false))
}

async function persistCampaign(): Promise<number | null> {
  syncDatesFromLocal()
  modalError.value = ''
  if (!form.title?.trim() || !form.start_at || !form.end_at) {
    modalError.value = 'Add a title, start time, and end time.'
    return null
  }
  if (form.action_type === 'preorder') {
    applyManualProductId()
    if (!(form.product_id && form.product_id > 0)) {
      modalError.value = 'Preorder needs a product ID.'
      return null
    }
  }
  saving.value = true
  try {
    if (imageFile.value) {
      const fd = new FormData()
      appendFormToFormData(fd)
      fd.append('image', imageFile.value)
      if (editingId.value != null) {
        await campaignsAdminApi.patchWithImage(editingId.value, fd)
        return editingId.value
      }
      const { data } = await campaignsAdminApi.createWithImage(fd)
      const id = Number((data as { id?: number })?.id)
      if (id > 0) editingId.value = id
      return id > 0 ? id : null
    }
    const payload: AppCampaignPayload & { is_active?: boolean } = {
      ...form,
      start_at: form.start_at,
      end_at: form.end_at,
      delivery_channels: channelsToString(),
      gift_voucher_id: form.gift_voucher_id && form.gift_voucher_id > 0 ? form.gift_voucher_id : null,
      flash_sale_id: form.flash_sale_id && form.flash_sale_id > 0 ? form.flash_sale_id : null,
      promotion_id: form.promotion_id && form.promotion_id > 0 ? form.promotion_id : null,
      action_type: form.action_type === 'preorder' ? 'preorder' : '',
      product_id:
        form.action_type === 'preorder' && form.product_id && form.product_id > 0 ? form.product_id : null,
      badge: form.badge || '',
    }
    delete (payload as { remaining_stock?: number | null }).remaining_stock
    delete (payload as { product_slug?: string }).product_slug
    delete (payload as { product_title?: string }).product_title
    delete (payload as { badge_label?: string }).badge_label
    if (editingId.value != null) {
      await campaignsAdminApi.patch(editingId.value, payload)
      return editingId.value
    }
    const { data } = await campaignsAdminApi.create(payload)
    const id = Number((data as { id?: number })?.id)
    if (id > 0) editingId.value = id
    return id > 0 ? id : null
  } catch (e: unknown) {
    modalError.value = formatApiError(e, 'Save failed')
    return null
  } finally {
    saving.value = false
  }
}

async function saveOnly() {
  const id = await persistCampaign()
  if (id) {
    pushMsg.value = 'Campaign saved'
    await load()
  }
}

async function campaignIdForPush(): Promise<number | null> {
  if (sendTarget.value?.id) return sendTarget.value.id
  if (editingId.value) return editingId.value
  return persistCampaign()
}

async function runEstimate() {
  const id = await campaignIdForPush()
  if (!id) return
  sending.value = true
  estimateText.value = ''
  sendError.value = ''
  try {
    const { data } = await campaignsAdminApi.push(id, { dry_run: true, targets: buildTargets(false) })
    const d = data as { estimated_recipients?: number }
    estimateText.value = `About ${d.estimated_recipients ?? 0} people match this audience`
    sendInfo.value = estimateText.value
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Estimate failed')
    modalError.value = msg
    sendError.value = msg
  } finally {
    sending.value = false
  }
}

async function runSendTest() {
  if (!parseUserIds(testUserIdsText.value).length) {
    const msg = 'Enter test user ID(s) first.'
    modalError.value = msg
    sendError.value = msg
    return
  }
  const id = await campaignIdForPush()
  if (!id) return
  sending.value = true
  try {
    const { data } = await campaignsAdminApi.push(id, { dry_run: false, targets: buildTargets(true) })
    const d = data as { message?: string; recipients?: number }
    const msg = d.message ?? `Test sent to ${d.recipients ?? 0} user(s)`
    pushMsg.value = msg
    sendInfo.value = msg
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Test send failed')
    modalError.value = msg
    sendError.value = msg
  } finally {
    sending.value = false
  }
}

async function runSendLive() {
  const id = await campaignIdForPush()
  if (!id) return
  if (audiencePreset.value === 'shops' && !selectedShopIds.value.length) {
    const msg = 'Pick at least one shop.'
    modalError.value = msg
    sendError.value = msg
    return
  }
  sending.value = true
  try {
    const { data } = await campaignsAdminApi.push(id, { dry_run: false, targets: buildTargets(false) })
    const d = data as { message?: string; recipients?: number }
    const msg = d.message ?? `Sent${d.recipients != null ? ` to ${d.recipients}` : ''}`
    pushMsg.value = msg
    sendInfo.value = msg
    await load()
  } catch (e: unknown) {
    const msg = formatApiError(e, 'Send failed')
    modalError.value = msg
    sendError.value = msg
  } finally {
    sending.value = false
  }
}

async function loadDealOptions() {
  try {
    const fs = await adminListFlashSales({ page_size: 100 })
    flashSaleOptions.value = [
      { value: null, text: '— None —' },
      ...(fs.results ?? []).map((s) => ({
        value: s.id,
        text: `#${s.id} ${s.name}${s.is_active ? '' : ' (off)'}`,
      })),
    ]
  } catch {
    flashSaleOptions.value = [{ value: null, text: '— None —' }]
  }
  try {
    const { data } = await promotionsAdminApi.list({ is_active: true })
    const results = ((data as { results?: { id: number; name: string }[] }).results ??
      (Array.isArray(data) ? data : [])) as { id: number; name: string }[]
    promotionOptions.value = [
      { value: null, text: '— None —' },
      ...results.map((p) => ({ value: p.id, text: `#${p.id} ${p.name}` })),
    ]
  } catch {
    promotionOptions.value = [{ value: null, text: '— None —' }]
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await campaignsAdminApi.list()
    items.value = (data as { results?: CampaignRow[] }).results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Could not load campaigns')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function remove(row: CampaignRow) {
  const ok = await confirmDestructiveAction({ title: 'Delete campaign?', text: row.title })
  if (!ok) return
  try {
    await campaignsAdminApi.delete(row.id)
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

onMounted(async () => {
  await Promise.all([load(), loadDealOptions()])
})
</script>

<style scoped>
.camp-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.camp-steps__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid #e6e8ec;
  background: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.75rem;
  font-size: 0.85rem;
}
.camp-steps__btn--active {
  border-color: #2f6fed;
  background: #f3f7ff;
  font-weight: 600;
}
.camp-steps__btn--done {
  border-color: #b7e0c2;
}
.camp-steps__num {
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: #eef0f3;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
}
.camp-audience {
  display: grid;
  gap: 0.5rem;
}
@media (min-width: 700px) {
  .camp-audience {
    grid-template-columns: 1fr 1fr;
  }
}
.camp-audience__opt {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  padding: 0.75rem 0.9rem;
  cursor: pointer;
  background: #fff;
}
.camp-audience__opt span {
  font-size: 0.82rem;
  color: #5c6570;
}
.camp-audience__opt--on {
  border-color: #2f6fed;
  background: #f3f7ff;
}
.camp-summary {
  border: 1px solid #e6e8ec;
  border-radius: 10px;
  padding: 0.85rem 1rem;
  background: #fafbfc;
}
.campaign-image-preview {
  display: block;
  width: min(100%, 18rem);
  max-height: 10rem;
  object-fit: cover;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border-color);
}
.campaign-product-results {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-height: 12rem;
  overflow: auto;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  padding: 0.35rem;
}
.campaign-product-results__item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
  width: 100%;
  padding: 0.45rem 0.55rem;
  border: 0;
  border-radius: 0.4rem;
  background: transparent;
  text-align: left;
}
.campaign-product-results__item:hover {
  background: rgba(0, 0, 0, 0.04);
}
.campaign-product-results__title {
  font-size: 0.86rem;
  font-weight: 600;
}
.campaign-product-results__slug {
  font-size: 0.75rem;
  color: #5c6570;
}
</style>
