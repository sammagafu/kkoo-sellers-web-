<template>
  <VerticalLayout>
    <b-card title="Menu screen for TV">
      <p class="text-muted mb-3">
        Turn your menu into a looping TV screen. Pick a design, choose up to five best sellers, add combo slides, and open the fullscreen display for
        tablets, kiosks, or TVs.
      </p>

      <b-alert v-if="error" variant="danger" show>{{ error }}</b-alert>
      <b-alert v-if="successMessage" variant="success" dismissible show>{{ successMessage }}</b-alert>

      <template v-if="loaded">
        <b-card title="Live screen link" class="mb-4">
          <p class="small text-muted mb-3">
            Use this fullscreen link on a TV browser. It loops curated products instead of showing the full website.
          </p>
          <div v-if="displayUrl" class="d-flex flex-wrap align-items-center gap-2">
            <b-form-input :value="displayUrl" readonly class="flex-grow-1" />
            <b-button variant="outline-primary" @click="copyDisplayUrl">Copy link</b-button>
            <b-button variant="primary" :href="displayUrl" target="_blank" rel="noopener noreferrer">Open screen</b-button>
          </div>
          <p v-else class="text-muted mb-0">
            Set a <strong>menu slug</strong> in your <router-link :to="{ name: 'seller.profile' }">Profile</router-link> to get a cleaner screen link.
            Your seller ID is used as a fallback.
          </p>
        </b-card>

        <b-row class="g-4">
          <b-col xl="5">
            <b-card title="Screen style" class="h-100">
              <div class="d-flex flex-wrap gap-3 mb-3">
                <b-form-checkbox v-model="form.enabled">Screen live</b-form-checkbox>
                <b-form-checkbox v-model="form.randomize">Randomize order</b-form-checkbox>
                <b-form-checkbox v-model="form.use_best_sellers">Include best sellers</b-form-checkbox>
                <b-form-checkbox v-model="form.show_prices">Show prices</b-form-checkbox>
                <b-form-checkbox v-model="form.show_category">Show category</b-form-checkbox>
              </div>

              <b-row class="g-3">
                <b-col md="6">
                  <b-form-group label="Design">
                    <b-form-select v-model="form.design" :options="designOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Background preset">
                    <b-form-select v-model="form.background_preset" :options="backgroundOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Slide duration (seconds)">
                    <b-form-select v-model="form.rotation_seconds" :options="rotationOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Best sellers cap">
                    <b-form-select v-model="form.max_best_sellers" :options="bestSellerOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Combo size">
                    <b-form-select v-model="form.combo_group_size" :options="comboSizeOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="6">
                  <b-form-group label="Background image URL">
                    <b-form-input v-model="form.background_image_url" placeholder="https://..." />
                  </b-form-group>
                </b-col>
                <b-col md="4">
                  <b-form-group label="Background color">
                    <div class="d-flex align-items-center gap-2">
                      <b-form-input v-model="form.background_color" type="color" class="w-auto" />
                      <b-form-input v-model="form.background_color" />
                    </div>
                  </b-form-group>
                </b-col>
                <b-col md="4">
                  <b-form-group label="Accent color">
                    <div class="d-flex align-items-center gap-2">
                      <b-form-input v-model="form.accent_color" type="color" class="w-auto" />
                      <b-form-input v-model="form.accent_color" />
                    </div>
                  </b-form-group>
                </b-col>
                <b-col md="4">
                  <b-form-group label="Text color">
                    <div class="d-flex align-items-center gap-2">
                      <b-form-input v-model="form.text_color" type="color" class="w-auto" />
                      <b-form-input v-model="form.text_color" />
                    </div>
                  </b-form-group>
                </b-col>
                <b-col cols="12">
                  <b-form-group label="Headline">
                    <b-form-input v-model="form.headline" placeholder="Tonight's crowd favourite" />
                  </b-form-group>
                </b-col>
                <b-col cols="12">
                  <b-form-group label="Subheadline">
                    <b-form-textarea v-model="form.subheadline" rows="3" placeholder="Fresh from the kitchen. Perfect for the same table or route." />
                  </b-form-group>
                </b-col>
              </b-row>

              <div class="screen-style-preview mt-4" :style="previewStyle">
                <div class="screen-style-preview__kicker">Preview mood</div>
                <div class="screen-style-preview__headline">{{ form.headline || 'One product at a time, made for the big screen.' }}</div>
                <div class="screen-style-preview__copy">
                  {{ form.subheadline || 'Use spotlight slides for heroes and combo slides for grouped orders going to the same place.' }}
                </div>
              </div>

              <div class="d-flex flex-wrap gap-2 mt-4">
                <b-button variant="primary" :disabled="saving" @click="saveScreen">Save screen setup</b-button>
                <b-button variant="outline-secondary" :disabled="saving" @click="resetToDefaults">Reset fields</b-button>
              </div>
            </b-card>
          </b-col>

          <b-col xl="7">
            <b-card title="Choose products to show" class="h-100">
              <div class="d-flex flex-wrap gap-2 align-items-center mb-3">
                <b-form-input v-model="search" placeholder="Search products to display..." class="flex-grow-1" />
                <span class="text-muted small">{{ filteredProducts.length }} product(s)</span>
              </div>

              <div class="selection-toolbar">
                <div>
                  <h6 class="mb-1">Spotlight products</h6>
                  <p class="small text-muted mb-0">Shown one at a time. If none are picked, the screen falls back to best sellers or the first menu items.</p>
                </div>
                <b-button size="sm" variant="outline-secondary" @click="form.product_ids = []">Clear</b-button>
              </div>
              <div class="product-selection-grid mb-4">
                <button
                  v-for="product in filteredProducts"
                  :key="`spotlight-${product.id}`"
                  type="button"
                  class="product-pick-card"
                  :class="{ active: isSelected(form.product_ids, product.id) }"
                  @click="toggleProduct(form.product_ids, product.id)"
                >
                  <img v-if="product.image" :src="product.image" :alt="product.title || ''" class="product-pick-card__image" />
                  <div v-else class="product-pick-card__placeholder">No image</div>
                  <div class="product-pick-card__body">
                    <div class="product-pick-card__title">{{ product.title || 'Untitled product' }}</div>
                    <div class="product-pick-card__meta">
                      <span>{{ product.category_name || 'Menu item' }}</span>
                      <strong>{{ formatPrice(product.price) }}</strong>
                    </div>
                  </div>
                </button>
              </div>

              <div class="selection-toolbar">
                <div>
                  <h6 class="mb-1">Combo slide products</h6>
                  <p class="small text-muted mb-0">Grouped into combo slides so friends can see different items on one screen.</p>
                </div>
                <b-button size="sm" variant="outline-secondary" @click="form.combo_product_ids = []">Clear</b-button>
              </div>
              <div class="product-selection-grid">
                <button
                  v-for="product in filteredProducts"
                  :key="`combo-${product.id}`"
                  type="button"
                  class="product-pick-card product-pick-card--combo"
                  :class="{ active: isSelected(form.combo_product_ids, product.id) }"
                  @click="toggleProduct(form.combo_product_ids, product.id)"
                >
                  <img v-if="product.image" :src="product.image" :alt="product.title || ''" class="product-pick-card__image" />
                  <div v-else class="product-pick-card__placeholder">No image</div>
                  <div class="product-pick-card__body">
                    <div class="product-pick-card__title">{{ product.title || 'Untitled product' }}</div>
                    <div class="product-pick-card__meta">
                      <span>{{ product.category_name || 'Menu item' }}</span>
                      <strong>{{ formatPrice(product.price) }}</strong>
                    </div>
                  </div>
                </button>
              </div>
            </b-card>
          </b-col>
        </b-row>
      </template>
      <p v-else-if="loading" class="text-muted mb-0">Loading menu screen setup…</p>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { authApi, catalogPublicApi } from '@/api'
import { productCoverUrl, resolveAssetUrl } from '@/utils/assetUrl'

type ScreenTheme = {
  enabled: boolean
  design: string
  rotation_seconds: number
  randomize: boolean
  use_best_sellers: boolean
  max_best_sellers: number
  product_ids: number[]
  combo_product_ids: number[]
  combo_group_size: number
  background_preset: string
  background_image_url: string
  background_color: string
  accent_color: string
  text_color: string
  headline: string
  subheadline: string
  show_prices: boolean
  show_category: boolean
}

type StorefrontTheme = Record<string, unknown> & {
  menu?: Record<string, unknown> & { screen?: Partial<ScreenTheme> }
  screen?: Partial<ScreenTheme>
}

type SellerProduct = {
  id: number
  title?: string
  category_name?: string
  cover_image?: string
  image?: string
  thumbnail?: string
  price?: number
  base_price?: number
}

type SellerProductRow = Omit<SellerProduct, 'image'> & {
  image: string | null
}

const loading = ref(false)
const loaded = ref(false)
const saving = ref(false)
const error = ref('')
const successMessage = ref('')
const profileId = ref<number | string | null>(null)
const menuSlug = ref('')
const search = ref('')
const products = ref<SellerProductRow[]>([])
const themeDocument = ref<StorefrontTheme>({})

const form = reactive<ScreenTheme>(defaultScreenTheme())

const basePath = computed(() => (import.meta.env.BASE_URL || '/').replace(/\/$/, ''))
const displaySlugOrId = computed(() => menuSlug.value.trim() || (profileId.value != null ? String(profileId.value) : ''))
const displayUrl = computed(() => {
  if (!displaySlugOrId.value || typeof window === 'undefined') return ''
  return `${window.location.origin}${basePath.value}/menu/display/${encodeURIComponent(displaySlugOrId.value)}`
})

const filteredProducts = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return products.value
  return products.value.filter((product) => {
    return `${product.title ?? ''} ${product.category_name ?? ''}`.toLowerCase().includes(query)
  })
})

const previewStyle = computed(() => {
  const backgroundImage = resolveAssetUrl(form.background_image_url)
  const background = backgroundImage
    ? `linear-gradient(135deg, rgba(14, 10, 20, 0.3), rgba(14, 10, 20, 0.55)), url(${backgroundImage})`
    : presetBackground(form.background_preset, form.background_color)
  return {
    color: form.text_color,
    background,
    backgroundColor: form.background_color,
    boxShadow: `0 24px 48px color-mix(in srgb, ${form.accent_color} 25%, transparent)`,
  }
})

const designOptions = [
  { value: 'spotlight', text: 'Spotlight' },
  { value: 'editorial', text: 'Editorial poster' },
  { value: 'combo', text: 'Combo board' },
]
const backgroundOptions = [
  { value: 'editorial-plum', text: 'Editorial plum' },
  { value: 'chalk-cream', text: 'Chalk cream' },
  { value: 'midnight-luxe', text: 'Midnight luxe' },
  { value: 'sunset-market', text: 'Sunset market' },
]
const rotationOptions = [6, 8, 10, 12, 15].map((value) => ({ value, text: `${value}s` }))
const bestSellerOptions = [1, 2, 3, 4, 5].map((value) => ({ value, text: `${value}` }))
const comboSizeOptions = [2, 3].map((value) => ({ value, text: `${value} products` }))

function defaultScreenTheme(): ScreenTheme {
  return {
    enabled: true,
    design: 'spotlight',
    rotation_seconds: 8,
    randomize: true,
    use_best_sellers: true,
    max_best_sellers: 5,
    product_ids: [],
    combo_product_ids: [],
    combo_group_size: 2,
    background_preset: 'editorial-plum',
    background_image_url: '',
    background_color: '#261338',
    accent_color: '#f0ddc7',
    text_color: '#fdf7f0',
    headline: '',
    subheadline: '',
    show_prices: true,
    show_category: true,
  }
}

function applyScreenTheme(screen?: Partial<ScreenTheme> | null) {
  const merged = { ...defaultScreenTheme(), ...(screen ?? {}) }
  form.enabled = Boolean(merged.enabled)
  form.design = String(merged.design || 'spotlight')
  form.rotation_seconds = Number(merged.rotation_seconds || 8)
  form.randomize = Boolean(merged.randomize)
  form.use_best_sellers = Boolean(merged.use_best_sellers)
  form.max_best_sellers = Math.min(5, Math.max(1, Number(merged.max_best_sellers || 5)))
  form.product_ids = Array.isArray(merged.product_ids) ? merged.product_ids.map((id) => Number(id)).filter(Boolean) : []
  form.combo_product_ids = Array.isArray(merged.combo_product_ids) ? merged.combo_product_ids.map((id) => Number(id)).filter(Boolean) : []
  form.combo_group_size = Math.min(3, Math.max(2, Number(merged.combo_group_size || 2)))
  form.background_preset = String(merged.background_preset || 'editorial-plum')
  form.background_image_url = String(merged.background_image_url || '')
  form.background_color = String(merged.background_color || '#261338')
  form.accent_color = String(merged.accent_color || '#f0ddc7')
  form.text_color = String(merged.text_color || '#fdf7f0')
  form.headline = String(merged.headline || '')
  form.subheadline = String(merged.subheadline || '')
  form.show_prices = Boolean(merged.show_prices)
  form.show_category = Boolean(merged.show_category)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const { data } = await authApi.getSellerProfile()
    const payload = (data ?? {}) as Record<string, unknown>
    profileId.value = (payload.user_id ?? payload.id ?? null) as number | string | null
    menuSlug.value = String(payload.menu_slug ?? '')
    themeDocument.value = ((payload.storefront_theme as StorefrontTheme | undefined) ?? {}) as StorefrontTheme

    const rawTheme = themeDocument.value
    const menuTheme = rawTheme.menu as (Record<string, unknown> & { screen?: Partial<ScreenTheme> }) | undefined
    applyScreenTheme(menuTheme?.screen ?? rawTheme.screen ?? null)

    const sellerId = Number(payload.user_id ?? payload.id ?? 0)
    if (sellerId > 0) {
      const productsRes = await catalogPublicApi.listProducts({ seller_id: sellerId, page_size: 100 })
      const results = Array.isArray(productsRes.data?.results) ? productsRes.data.results : []
      products.value = results.map((raw): SellerProductRow => {
        const product = (raw ?? {}) as SellerProduct
        return {
          ...product,
          id: Number(product.id),
          price: Number(product.price ?? product.base_price ?? 0),
          image: productCoverUrl(product as unknown as Record<string, unknown>),
        }
      }).filter((product) => Number.isFinite(product.id) && product.id > 0)
    } else {
      products.value = []
    }
    loaded.value = true
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load menu screen setup'
  } finally {
    loading.value = false
  }
}

function resetToDefaults() {
  applyScreenTheme(defaultScreenTheme())
}

function isSelected(list: number[], id: number) {
  return list.includes(id)
}

function toggleProduct(list: number[], id: number) {
  const index = list.indexOf(id)
  if (index >= 0) {
    list.splice(index, 1)
    return
  }
  list.push(id)
}

function copyDisplayUrl() {
  if (!displayUrl.value) return
  navigator.clipboard.writeText(displayUrl.value).then(() => {
    successMessage.value = 'Menu screen link copied.'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  })
}

function presetBackground(preset: string, fallback: string) {
  switch (preset) {
    case 'chalk-cream':
      return 'linear-gradient(135deg, #f7eee1 0%, #eadfd0 100%)'
    case 'midnight-luxe':
      return 'linear-gradient(135deg, #130b21 0%, #29123f 100%)'
    case 'sunset-market':
      return 'linear-gradient(135deg, #632b19 0%, #cb7b43 100%)'
    default:
      return `linear-gradient(135deg, ${fallback} 0%, #4a226a 100%)`
  }
}

function buildScreenPayload(): ScreenTheme {
  return {
    enabled: form.enabled,
    design: form.design,
    rotation_seconds: form.rotation_seconds,
    randomize: form.randomize,
    use_best_sellers: form.use_best_sellers,
    max_best_sellers: form.max_best_sellers,
    product_ids: [...new Set(form.product_ids)].slice(0, 20),
    combo_product_ids: [...new Set(form.combo_product_ids)].slice(0, 20),
    combo_group_size: form.combo_group_size,
    background_preset: form.background_preset,
    background_image_url: form.background_image_url.trim(),
    background_color: form.background_color,
    accent_color: form.accent_color,
    text_color: form.text_color,
    headline: form.headline.trim(),
    subheadline: form.subheadline.trim(),
    show_prices: form.show_prices,
    show_category: form.show_category,
  }
}

async function saveScreen() {
  saving.value = true
  error.value = ''
  successMessage.value = ''
  try {
    const nextTheme: StorefrontTheme = {
      ...themeDocument.value,
      menu: {
        ...((themeDocument.value.menu as Record<string, unknown> | undefined) ?? {}),
        screen: buildScreenPayload(),
      },
    }
    await authApi.patchSellerStorefrontTheme(nextTheme as Record<string, unknown>)
    themeDocument.value = nextTheme
    successMessage.value = 'Menu screen setup saved.'
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to save menu screen setup'
  } finally {
    saving.value = false
  }
}

function formatPrice(price?: number) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return 'Price not set'
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(price)
}

onMounted(load)
</script>

<style scoped>
.screen-style-preview {
  border-radius: 1.5rem;
  padding: 1.4rem;
  min-height: 210px;
  background-size: cover;
  background-position: center;
}

.screen-style-preview__kicker {
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.75;
  margin-bottom: 0.85rem;
}

.screen-style-preview__headline {
  font-size: clamp(1.15rem, 2vw, 1.65rem);
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 0.75rem;
  max-width: 22rem;
}

.screen-style-preview__copy {
  max-width: 28rem;
  opacity: 0.9;
}

.selection-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.product-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.product-pick-card {
  border: 1px solid var(--bs-border-color, #dee2e6);
  background: #fff;
  border-radius: 1rem;
  padding: 0;
  overflow: hidden;
  text-align: left;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
}

.product-pick-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 30px rgba(27, 17, 40, 0.08);
}

.product-pick-card.active {
  border-color: #5c308f;
  box-shadow: 0 0 0 2px rgba(92, 48, 143, 0.18);
}

.product-pick-card__image,
.product-pick-card__placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: #f4ede5;
}

.product-pick-card__placeholder {
  display: grid;
  place-items: center;
  color: #7a6d82;
  font-size: 0.85rem;
}

.product-pick-card__body {
  padding: 0.9rem;
}

.product-pick-card__title {
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 0.55rem;
}

.product-pick-card__meta {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: center;
  font-size: 0.82rem;
  color: #6b6073;
}

@media (max-width: 767.98px) {
  .selection-toolbar {
    flex-direction: column;
  }
}
</style>
