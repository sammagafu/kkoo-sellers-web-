<template>
  <VerticalLayout>
    <b-card title="Push & promo campaigns">
      <p class="text-muted small mb-3">
        Two creative formats:
        <strong>In-app advert</strong> / full-screen web carousel (1080×1350 portrait) and
        <strong>Promotion banner</strong> strip placements (1920×786).
        Choose delivery: buyer web, buyers app, carousel slider, or push.
        Link a flash sale, promotion, or <strong>preorder product</strong> so taps open the right deal.
      </p>
      <div class="campaign-size-cheat mb-3">
        <div v-for="row in CAMPAIGN_IMAGE_SIZE_SUMMARY" :key="row.size" class="campaign-size-cheat__row">
          <strong class="campaign-size-cheat__size">{{ row.size }}</strong>
          <span class="campaign-size-cheat__use">{{ row.use }}</span>
          <code class="campaign-size-cheat__placements">{{ row.placements }}</code>
        </div>
      </div>
      <div class="d-flex flex-wrap gap-2 mb-3">
        <b-button variant="primary" @click="openCreate">Create campaign</b-button>
        <b-button variant="outline-secondary" :disabled="loading" @click="load">Refresh</b-button>
        <router-link class="btn btn-outline-warning btn-sm" :to="{ name: 'admin.flash-sales' }">
          Flash sales
        </router-link>
      </div>
      <b-alert v-if="error" variant="danger" show dismissible>{{ error }}</b-alert>
      <b-alert v-if="pushMsg" variant="success" show dismissible>{{ pushMsg }}</b-alert>

      <b-table v-if="items.length" :items="items" :fields="fields" striped responsive>
        <template #cell(placement)="row">
          <code>{{ row.item.placement }}</code>
          <div v-if="row.item.badge || row.item.badge_label" class="mt-1">
            <b-badge variant="info">{{ row.item.badge_label || row.item.badge }}</b-badge>
          </div>
        </template>
        <template #cell(channels)="row">
          <span class="small">{{ row.item.delivery_channels || 'all surfaces' }}</span>
        </template>
        <template #cell(deal)="row">
          <span class="small">
            <template v-if="row.item.action_type === 'preorder'">
              Preorder
              <template v-if="row.item.product_id"> · product #{{ row.item.product_id }}</template>
              <template v-if="row.item.remaining_stock != null">
                · {{ Number(row.item.remaining_stock).toLocaleString() }} left
              </template>
            </template>
            <template v-else>
              <template v-if="row.item.flash_sale_id">FS #{{ row.item.flash_sale_id }}</template>
              <template v-if="row.item.flash_sale_id && row.item.promotion_id"> · </template>
              <template v-if="row.item.promotion_id">Promo #{{ row.item.promotion_id }}</template>
              <template v-if="!row.item.flash_sale_id && !row.item.promotion_id">—</template>
            </template>
          </span>
        </template>
        <template #cell(window)="row">
          <span class="small">{{ row.item.start_at }} → {{ row.item.end_at }}</span>
        </template>
        <template #cell(active)="row">
          <b-badge :variant="row.item.is_active ? 'success' : 'secondary'">
            {{ row.item.is_active ? 'Yes' : 'No' }}
          </b-badge>
        </template>
        <template #cell(actions)="row">
          <b-button size="sm" variant="outline-success" class="me-1" :disabled="pushingId === row.item.id" @click="pushNow(row.item)">
            {{ pushingId === row.item.id ? 'Pushing…' : 'Push' }}
          </b-button>
          <b-button size="sm" variant="outline-primary" class="me-1" @click="openEdit(row.item)">Edit</b-button>
          <b-button size="sm" variant="outline-danger" @click="remove(row.item)">Delete</b-button>
        </template>
      </b-table>
      <p v-else-if="!loading" class="text-muted mb-0">No campaigns yet.</p>
    </b-card>

    <b-card title="Announce product deal" class="mt-3">
      <p class="text-muted small mb-3">
        Broadcast a one-off sale push to users subscribed to <code>sale</code> (Promotions &amp; Offers in the buyers app).
        Include flash sale / promotion IDs so taps open the deal.
      </p>
      <b-alert v-if="announceMsg" variant="success" show dismissible>{{ announceMsg }}</b-alert>
      <b-form @submit.prevent="announceDeal">
        <b-row>
          <b-col md="6">
            <b-form-group label="Title" class="mb-2">
              <b-form-input v-model="announce.title" required placeholder="Weekend flash deals" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Target app" class="mb-2">
              <b-form-select v-model="announce.target_app" :options="appKeyOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Message" class="mb-2">
          <b-form-textarea v-model="announce.message" rows="2" required placeholder="Up to 40% off selected products — tap to shop" />
        </b-form-group>
        <b-row>
          <b-col md="4">
            <b-form-group label="Flash sale" class="mb-2">
              <b-form-select v-model="announce.flash_sale_id" :options="flashSaleOptions" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Promotion" class="mb-2">
              <b-form-select v-model="announce.promotion_id" :options="promotionOptions" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Slug (optional)" class="mb-2">
              <b-form-input v-model="announce.slug" placeholder="spring-clearance" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-button type="submit" variant="success" :disabled="announcing">
          {{ announcing ? 'Sending…' : 'Send deal push' }}
        </b-button>
      </b-form>
    </b-card>

    <b-modal v-model="showModal" :title="editingId ? 'Edit campaign' : 'Create campaign'" size="lg" @ok="save">
      <b-form>
        <b-form-group label="Title" class="mb-2">
          <b-form-input v-model="form.title" required />
        </b-form-group>
        <b-form-group label="Subtitle / message" class="mb-2">
          <b-form-input v-model="form.subtitle" />
        </b-form-group>
        <b-form-group label="Promo label (chip on buyer carousel)" class="mb-2">
          <b-form-select v-model="form.badge" :options="badgeOptions" />
          <p class="text-muted small mb-0 mt-1">
            Shown as a chip above the title (Preorder, Limited offer, Flash, New item, Trending, …).
            Leave as Auto to infer from action / flash sale / gift.
          </p>
        </b-form-group>
        <b-form-group label="Image URL" class="mb-2">
          <b-form-input v-model="form.image_url" placeholder="https://… or /media/…" />
          <div class="campaign-image-helper mt-2">
            <div class="campaign-image-helper__meta">
              <span class="campaign-image-helper__badge">{{ activeCreative.label }}</span>
              <span class="campaign-image-helper__aspect">{{ activeCreative.aspectLabel }}</span>
            </div>
            <p class="campaign-image-helper__hint mb-2">{{ imageSpecHint }}</p>
            <div
              class="campaign-image-helper__frame"
              :class="{ 'campaign-image-helper__frame--portrait': activeCreative.isPortrait }"
              :style="{ aspectRatio: imageAspectCss(form.placement) }"
              aria-hidden="true"
            >
              <span>{{ activeCreative.width }} × {{ activeCreative.height }}</span>
            </div>
            <p class="text-muted small mb-0 mt-2">
              Optional if a flash sale, promotion, or product is linked — buyer web can fall back to those covers
              and show up to 6 product thumbnails on the carousel.
            </p>
          </div>
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Placement" class="mb-2">
              <b-form-select v-model="form.placement" :options="placementOptions" />
              <p class="text-muted small mb-0 mt-1">
                Size for this placement: <strong>{{ imageSizeBadge(form.placement) }}</strong>
              </p>
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Target app" class="mb-2">
              <b-form-select v-model="form.target_app_key" :options="appKeyOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="Delivery channels" class="mb-2">
          <div class="d-flex flex-wrap gap-3">
            <b-form-checkbox v-for="ch in channelOptions" :key="ch.value" v-model="channels[ch.value]">
              {{ ch.text }}
            </b-form-checkbox>
          </div>
          <p class="text-muted small mb-0 mt-1">
            Check <strong>Push notification</strong> for FCM/inbox. Advert / web carousel = portrait (1080×1350). Strip banners = 1920×786.
          </p>
        </b-form-group>
        <b-row>
          <b-col md="6">
            <b-form-group label="Linked flash sale" class="mb-2">
              <b-form-select v-model="form.flash_sale_id" :options="flashSaleOptions" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Linked promotion" class="mb-2">
              <b-form-select v-model="form.promotion_id" :options="promotionOptions" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-form-group label="Action type" class="mb-2">
              <b-form-select v-model="form.action_type" :options="actionTypeOptions" />
              <p class="text-muted small mb-0 mt-1">
                Choose <strong>Preorder</strong> to tie this campaign to a capped SKU product (stock shown on buyer web/app).
              </p>
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Product ID (preorder)" class="mb-2">
              <b-form-input
                v-model.number="form.product_id"
                type="number"
                min="0"
                placeholder="e.g. 146"
                :disabled="form.action_type !== 'preorder'"
              />
              <p v-if="form.action_type === 'preorder' && editingId && form.remaining_stock != null" class="text-muted small mb-0 mt-1">
                Remaining stock: {{ Number(form.remaining_stock).toLocaleString() }}
              </p>
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-form-group label="Gift voucher ID (optional)" class="mb-2">
              <b-form-input v-model.number="form.gift_voucher_id" type="number" min="0" placeholder="Voucher ID" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="Gift label" class="mb-2">
              <b-form-input v-model="form.gift_label" placeholder="Claim TZS 5,000 gift" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-form-group label="Start (RFC3339)" class="mb-2">
              <b-form-input v-model="form.start_at" placeholder="2026-05-20T00:00:00Z" />
            </b-form-group>
          </b-col>
          <b-col md="6">
            <b-form-group label="End (RFC3339)" class="mb-2">
              <b-form-input v-model="form.end_at" placeholder="2026-06-20T00:00:00Z" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-group label="CTA label" class="mb-2">
          <b-form-input v-model="form.cta_label" />
        </b-form-group>
        <b-form-group label="CTA route (buyer web / app)" class="mb-2">
          <b-form-input v-model="form.cta_route" placeholder="/product/s/mkt-preorder-mega or /flash-sales" />
          <p class="text-muted small mb-0 mt-1">
            Preorder: <code>/product/s/{slug}</code>. Deals: <code>/flash-sales</code>, <code>/rewards</code>.
            Leave blank when a flash sale / promotion / product is linked.
          </p>
        </b-form-group>
        <b-form-group label="CTA external URL (optional)" class="mb-2">
          <b-form-input v-model="form.cta_external_url" />
        </b-form-group>
        <b-row>
          <b-col md="4">
            <b-form-group label="Priority (lower first)" class="mb-2">
              <b-form-input v-model.number="form.priority" type="number" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Max impressions / user" class="mb-2">
              <b-form-input v-model.number="form.max_impressions_per_user" type="number" />
            </b-form-group>
          </b-col>
          <b-col md="4">
            <b-form-group label="Cooldown (hours)" class="mb-2">
              <b-form-input v-model.number="form.cooldown_hours" type="number" />
            </b-form-group>
          </b-col>
        </b-row>
        <b-form-checkbox v-model="form.is_active">Active</b-form-checkbox>
      </b-form>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import {
  campaignsAdminApi,
  pushAnnouncementsApi,
  promotionsAdminApi,
  adminListFlashSales,
  type AppCampaignPayload,
} from '@/api'
import { formatApiError } from '@/utils/formatApiError'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'
import {
  CAMPAIGN_IMAGE_SIZE_SUMMARY,
  creativeSpecForPlacement,
  imageAspectCss,
  imageSizeBadge,
  imageUploadHint,
} from '@/utils/campaignCreative'

type CampaignRow = AppCampaignPayload & { id: number }

const items = ref<CampaignRow[]>([])
const loading = ref(false)
const error = ref('')
const pushMsg = ref('')
const announceMsg = ref('')
const pushingId = ref<number | null>(null)
const announcing = ref(false)
const showModal = ref(false)
const editingId = ref<number | null>(null)

const flashSaleOptions = ref<{ value: number | null; text: string }[]>([
  { value: null, text: '— None —' },
])
const promotionOptions = ref<{ value: number | null; text: string }[]>([
  { value: null, text: '— None —' },
])

const placementOptions = [
  { value: 'inapp_advert', text: 'Full screen — in-app advert (1080×1350 popup)' },
  { value: 'home_hero', text: 'Home — full-screen hero carousel (1080×1350 web)' },
  { value: 'promo_banner', text: 'Home — promo strip below hero (1920×786)' },
  { value: 'promo_carousel', text: 'Home — promo carousel (1080×1350 full-screen web)' },
  { value: 'food_tab_top', text: 'Eat tab — top banner on restaurant list (1920×786)' },
  { value: 'grocery_tab_top', text: 'Grocery tab — top banner on store list (1920×786)' },
  { value: 'cart_top', text: 'Cart — top banner before line items (1920×786)' },
  { value: 'checkout_top', text: 'Checkout — top banner before payment (1920×786)' },
  { value: 'rewards_top', text: 'Rewards — top banner (1920×786)' },
]
const actionTypeOptions = [
  { value: '', text: 'None — open CTA route / linked deal' },
  { value: 'preorder', text: 'Preorder — capped product stock' },
]
const badgeOptions = [
  { value: '', text: 'Auto (from action / deal)' },
  { value: 'preorder', text: 'Preorder' },
  { value: 'limited', text: 'Limited offer' },
  { value: 'flash', text: 'Flash' },
  { value: 'new', text: 'New item' },
  { value: 'trending', text: 'Trending' },
  { value: 'gift', text: 'Gift' },
  { value: 'sale', text: 'Sale' },
  { value: 'hot', text: 'Hot' },
  { value: 'exclusive', text: 'Exclusive' },
  { value: 'clearance', text: 'Clearance' },
]
const appKeyOptions = [
  { value: 'all', text: 'all' },
  { value: 'marketplace', text: 'marketplace' },
]
const channelOptions = [
  { value: 'web_advert', text: 'Buyer web — in-app advert (1080×1350)' },
  { value: 'app_advert', text: 'Buyers app — in-app advert (1080×1350)' },
  { value: 'web_banner', text: 'Buyer web — full-screen carousel (1080×1350) / strip (1920×786)' },
  { value: 'app_banner', text: 'Buyers app — promo banner (1920×786)' },
  { value: 'push', text: 'Push notification' },
] as const

const channels = reactive<Record<string, boolean>>({
  web_advert: false,
  app_advert: false,
  web_banner: true,
  app_banner: false,
  push: false,
})

const imageSpecHint = computed(() => imageUploadHint(form.placement))
const activeCreative = computed(() => creativeSpecForPlacement(form.placement))

const fields = [
  { key: 'title', label: 'Title' },
  { key: 'placement', label: 'Placement' },
  { key: 'channels', label: 'Channels' },
  { key: 'deal', label: 'Deal' },
  { key: 'window', label: 'Window' },
  { key: 'priority', label: 'Priority' },
  { key: 'active', label: 'Active' },
  { key: 'actions', label: '' },
]

const form = reactive<AppCampaignPayload & { is_active?: boolean }>({
  title: '',
  subtitle: '',
  placement: 'promo_banner',
  delivery_channels: 'web_banner',
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

const announce = reactive({
  title: '',
  message: '',
  target_app: 'marketplace',
  flash_sale_id: null as number | null,
  promotion_id: null as number | null,
  slug: '',
})

function channelsToString() {
  return channelOptions
    .filter((ch) => channels[ch.value])
    .map((ch) => ch.value)
    .join(',')
}

function applyChannelsFromString(raw?: string) {
  channelOptions.forEach((ch) => {
    channels[ch.value] = false
  })
  const parts = String(raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  if (!parts.length) {
    channels.web_banner = true
    return
  }
  parts.forEach((p) => {
    if (p in channels) channels[p] = true
  })
}

function resetForm() {
  editingId.value = null
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
}

function openCreate() {
  resetForm()
  showModal.value = true
}

function openEdit(row: CampaignRow) {
  editingId.value = row.id
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
  showModal.value = true
}

async function loadDealOptions() {
  try {
    const fs = await adminListFlashSales({ page_size: 100 })
    flashSaleOptions.value = [
      { value: null, text: '— None —' },
      ...(fs.results ?? []).map((s) => ({
        value: s.id,
        text: `#${s.id} ${s.name}${s.is_active ? '' : ' (inactive)'}`,
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
      ...results.map((p) => ({
        value: p.id,
        text: `#${p.id} ${p.name}`,
      })),
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
    const results = (data as { results?: CampaignRow[] }).results ?? []
    items.value = results
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load campaigns')
    items.value = []
  } finally {
    loading.value = false
  }
}

async function save(ev: Event) {
  ev.preventDefault()
  if (!form.title?.trim() || !form.start_at || !form.end_at) {
    error.value = 'Title, start_at, and end_at are required (RFC3339).'
    return
  }
  if (form.action_type === 'preorder' && !(form.product_id && form.product_id > 0)) {
    error.value = 'Preorder campaigns require a product ID (capped SKU product).'
    return
  }
  try {
    const payload: AppCampaignPayload & { is_active?: boolean } = {
      ...form,
      delivery_channels: channelsToString(),
      gift_voucher_id: form.gift_voucher_id && form.gift_voucher_id > 0 ? form.gift_voucher_id : null,
      flash_sale_id: form.flash_sale_id && form.flash_sale_id > 0 ? form.flash_sale_id : null,
      promotion_id: form.promotion_id && form.promotion_id > 0 ? form.promotion_id : null,
      action_type: form.action_type === 'preorder' ? 'preorder' : '',
      product_id:
        form.action_type === 'preorder' && form.product_id && form.product_id > 0
          ? form.product_id
          : null,
      badge: form.badge || '',
    }
    delete (payload as { remaining_stock?: number | null }).remaining_stock
    delete (payload as { product_slug?: string }).product_slug
    delete (payload as { product_title?: string }).product_title
    delete (payload as { badge_label?: string }).badge_label
    if (editingId.value != null) {
      await campaignsAdminApi.patch(editingId.value, payload)
    } else {
      await campaignsAdminApi.create(payload)
    }
    showModal.value = false
    resetForm()
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
  }
}

async function pushNow(row: CampaignRow) {
  pushingId.value = row.id
  pushMsg.value = ''
  error.value = ''
  try {
    const { data } = await campaignsAdminApi.push(row.id, { targets: { mode: 'subscribers' } })
    const d = data as { message?: string; recipients?: number; estimated_recipients?: number }
    pushMsg.value = d.message ?? `Push queued${d.recipients != null ? ` (${d.recipients} recipients)` : ''}`
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Push failed')
  } finally {
    pushingId.value = null
  }
}

async function announceDeal() {
  if (!announce.title.trim() || !announce.message.trim()) {
    error.value = 'Announce title and message are required.'
    return
  }
  announcing.value = true
  announceMsg.value = ''
  error.value = ''
  try {
    const dataPayload: Record<string, unknown> = {
      notification_type: announce.flash_sale_id
        ? 'flash_sale'
        : announce.promotion_id
          ? 'promotion'
          : 'sale',
      target_app: announce.target_app,
    }
    if (announce.flash_sale_id) dataPayload.flash_sale_id = announce.flash_sale_id
    if (announce.promotion_id) dataPayload.promotion_id = announce.promotion_id
    if (announce.slug.trim()) dataPayload.slug = announce.slug.trim()

    const { data } = await pushAnnouncementsApi.announceSale({
      title: announce.title.trim(),
      message: announce.message.trim(),
      target_app: announce.target_app,
      data: dataPayload,
      targets: { mode: 'subscribers' },
    })
    const d = data as { message?: string; recipients?: number }
    announceMsg.value =
      d.message ?? `Deal push queued${d.recipients != null ? ` (${d.recipients} recipients)` : ''}`
    announce.title = ''
    announce.message = ''
    announce.flash_sale_id = null
    announce.promotion_id = null
    announce.slug = ''
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Announce failed')
  } finally {
    announcing.value = false
  }
}

async function remove(row: CampaignRow) {
  const ok = await confirmDestructiveAction({
    title: 'Delete campaign?',
    text: row.title,
  })
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
.campaign-size-cheat {
  display: grid;
  gap: 0.55rem;
  padding: 0.75rem 0.9rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 0.65rem;
  background: color-mix(in srgb, var(--bs-primary) 5%, var(--bs-body-bg));
}

.campaign-size-cheat__row {
  display: grid;
  gap: 0.15rem 0.75rem;
  grid-template-columns: auto 1fr;
  align-items: baseline;
}

@media (min-width: 768px) {
  .campaign-size-cheat__row {
    grid-template-columns: 7.5rem 1fr;
  }

  .campaign-size-cheat__placements {
    grid-column: 2;
  }
}

.campaign-size-cheat__size {
  font-variant-numeric: tabular-nums;
}

.campaign-size-cheat__use {
  color: var(--bs-secondary-color);
  font-size: 0.875rem;
}

.campaign-size-cheat__placements {
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
}

.campaign-image-helper {
  padding: 0.75rem 0.85rem;
  border: 1px dashed var(--bs-border-color);
  border-radius: 0.65rem;
  background: var(--bs-tertiary-bg, var(--bs-body-bg));
}

.campaign-image-helper__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.45rem;
  margin-bottom: 0.35rem;
}

.campaign-image-helper__badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  background: color-mix(in srgb, var(--bs-primary) 16%, transparent);
  color: var(--bs-primary);
}

.campaign-image-helper__aspect {
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
}

.campaign-image-helper__hint {
  margin: 0;
  font-size: 0.82rem;
  color: var(--bs-body-color);
}

.campaign-image-helper__frame {
  width: min(100%, 18rem);
  max-height: 8.5rem;
  display: grid;
  place-items: center;
  border-radius: 0.5rem;
  border: 1px solid var(--bs-border-color);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--bs-primary) 12%, transparent), transparent 55%),
    var(--bs-body-bg);
  color: var(--bs-secondary-color);
  font-size: 0.78rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.campaign-image-helper__frame--portrait {
  width: min(100%, 8.5rem);
  max-height: 12rem;
}
</style>
