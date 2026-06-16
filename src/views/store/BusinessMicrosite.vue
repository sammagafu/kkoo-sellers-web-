<template>
  <div class="business-microsite" :class="{ 'microsite--dark': micrositeTheme === 'dark' }" :style="micrositeStyle">
    <!-- Loading -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading…</span></div>
      <p class="mt-2 text-muted small">Loading store…</p>
    </div>

    <!-- Error / not found -->
    <div v-else-if="error || !payload" class="container py-5 text-center">
      <h1 class="h4 mb-2">Store not available</h1>
      <p class="text-muted small">{{ error || 'This store link may be invalid or the store is not set up yet.' }}</p>
    </div>

    <!-- Storefront -->
    <template v-else>
      <header class="microsite-header">
        <div class="microsite-header__mesh" aria-hidden="true" />
        <div class="container microsite-header__inner">
          <div class="microsite-header__brand">
            <div class="store-logo-slot" :title="store.business_name || 'Store'">
              <img
                v-if="storeLogoUrl && !logoError"
                :src="resolveLogo(storeLogoUrl)"
                :alt="`${store.business_name || 'Store'} logo`"
                class="store-logo"
                @error="logoError = true"
              />
              <div v-else class="store-logo-fallback" aria-hidden="true">
                {{ storeInitials }}
              </div>
            </div>
            <div class="microsite-header__copy">
              <p class="microsite-header__kicker">{{ storefrontTypeLabel }}</p>
              <div class="microsite-header__title-row">
                <h1 class="microsite-header__title">{{ store.business_name || 'Store' }}</h1>
                <span v-if="isVerified" class="verified-badge" title="Verified KKOO partner">
                  <Icon icon="solar:verified-check-bold" class="verified-badge-icon" />
                  <span class="verified-badge-text">Verified</span>
                </span>
              </div>
              <p v-if="storeBio" class="microsite-bio mb-0">{{ storeBio }}</p>
            </div>
          </div>
          <button
            type="button"
            class="microsite-theme-toggle"
            :title="micrositeTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            aria-label="Toggle light or dark mode"
            @click="toggleMicrositeTheme"
          >
            <Icon v-if="micrositeTheme === 'light'" icon="solar:moon-bold" class="microsite-theme-icon" />
            <Icon v-else icon="solar:sun-bold" class="microsite-theme-icon" />
          </button>
        </div>
      </header>

      <div class="container py-3">
        <!-- Contact & social -->
        <div class="d-flex flex-wrap justify-content-center gap-3 mb-4">
          <a v-if="store.contact_phone" :href="`tel:${store.contact_phone}`" class="btn btn-outline-secondary">
            {{ store.contact_phone }}
          </a>
          <a v-if="store.contact_email" :href="`mailto:${store.contact_email}`" class="btn btn-outline-secondary">
            Email
          </a>
          <a v-if="storeAddress" :href="addressMapLink" target="_blank" rel="noopener noreferrer" class="btn btn-outline-secondary">
            Address
          </a>
          <template v-if="socialLinks.length">
            <a
              v-for="s in socialLinks"
              :key="s.name"
              :href="s.url"
              target="_blank"
              rel="noopener noreferrer"
              class="btn btn-outline-secondary"
            >
              {{ s.name }}
            </a>
          </template>
        </div>

        <!-- Promo codes & referral -->
        <section v-if="promocodes.length || referralCode" class="microsite-offers mb-4">
          <div v-if="promocodes.length" class="microsite-offers-block">
            <h2 class="microsite-offers-title">Promo codes</h2>
            <p class="microsite-offers-hint small mb-2">Apply at checkout when ordering from this store.</p>
            <div class="d-flex flex-wrap gap-2">
              <div v-for="(promo, i) in promocodes" :key="`${promo.code ?? promo.name ?? i}`" class="promo-chip">
                <span class="promo-chip-code">{{ promoLabel(promo) }}</span>
                <span v-if="promoDiscountLabel(promo)" class="promo-chip-detail">{{ promoDiscountLabel(promo) }}</span>
                <button
                  v-if="promo.code"
                  type="button"
                  class="promo-chip-copy"
                  title="Copy code"
                  @click="copyText(promo.code!)"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
          <div v-if="referralCode" class="microsite-offers-block" :class="{ 'mt-3': promocodes.length }">
            <h2 class="microsite-offers-title">Referral code</h2>
            <p class="microsite-offers-hint small mb-2">Share this code with friends when they join KKOO.</p>
            <div class="referral-chip">
              <span class="referral-chip-code">{{ referralCode }}</span>
              <button type="button" class="promo-chip-copy" @click="copyText(referralCode)">Copy</button>
            </div>
            <p v-if="copyMessage" class="text-success small mt-2 mb-0">{{ copyMessage }}</p>
          </div>
        </section>

        <!-- Menu / products with category filters (restaurant & grocery) -->
        <section v-if="allMenuItems.length" class="menu-section mb-5">
          <div class="menu-section-header mb-4">
            <p class="menu-breadcrumb mb-1">{{ store.business_name || 'Store' }} · curated picks</p>
            <h2 class="menu-section-title mb-2">
              Shop the <span class="menu-section-title-accent">{{ store.business_name || 'collection' }}</span>
            </h2>
            <p v-if="storeBio" class="menu-section-desc small mb-0">{{ storeBio }}</p>
          </div>

          <!-- Search, filters, layout -->
          <div class="menu-toolbar mb-3">
            <div class="menu-search-wrap">
              <Icon icon="solar:magnifier-bold" class="menu-search-icon" />
              <input
                v-model="searchQuery"
                type="search"
                class="menu-search-input"
                placeholder="Search products, descriptions, categories…"
                aria-label="Search products"
              />
              <button
                v-if="searchQuery"
                type="button"
                class="menu-search-clear"
                aria-label="Clear search"
                @click="searchQuery = ''"
              >
                <Icon icon="solar:close-circle-bold" />
              </button>
            </div>
            <div class="menu-advanced-filters">
              <label class="menu-filter-field">
                <span class="menu-filter-label">Sort</span>
                <select v-model="sortBy" class="menu-filter-select" aria-label="Sort products">
                  <option value="default">Featured</option>
                  <option value="name">Name A–Z</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </select>
              </label>
              <label class="menu-filter-field">
                <span class="menu-filter-label">Price</span>
                <select v-model="priceBand" class="menu-filter-select" aria-label="Filter by price">
                  <option value="all">Any price</option>
                  <option value="under_10k">Under TZS 10,000</option>
                  <option value="10k_50k">TZS 10,000 – 50,000</option>
                  <option value="over_50k">Over TZS 50,000</option>
                </select>
              </label>
              <button
                v-if="hasActiveFilters"
                type="button"
                class="menu-filter-clear"
                @click="clearAllFilters"
              >
                Clear filters
              </button>
            </div>
            <div class="menu-layout-controls">
              <span class="menu-layout-label">Layout</span>
              <div class="btn-group btn-group-sm" role="group" aria-label="Layout">
                <button
                  type="button"
                  class="btn"
                  :class="layoutMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="Grid"
                  @click="layoutMode = 'grid'"
                >
                  <Icon icon="solar:widget-4-bold" />
                </button>
                <button
                  type="button"
                  class="btn"
                  :class="layoutMode === 'rows' ? 'btn-primary' : 'btn-outline-secondary'"
                  title="List"
                  @click="layoutMode = 'rows'"
                >
                  <Icon icon="solar:list-bold" />
                </button>
              </div>
              <template v-if="layoutMode === 'grid'">
                <span class="menu-cols-label">Columns</span>
                <div class="btn-group btn-group-sm" role="group" aria-label="Columns">
                  <button
                    v-for="n in gridColOptions"
                    :key="n"
                    type="button"
                    class="btn"
                    :class="gridCols === n ? 'btn-primary' : 'btn-outline-secondary'"
                    :title="`${n} columns`"
                    @click="gridCols = n"
                  >
                    {{ n }}
                  </button>
                </div>
              </template>
            </div>
          </div>

          <!-- Categories (compact when many) -->
          <div v-if="categoriesWithCounts.length" class="menu-filters-panel mb-4">
            <div class="menu-filters-head">
              <span class="menu-filters-title">Categories</span>
              <span class="menu-filters-meta">{{ categoriesWithCounts.length }} total</span>
              <button
                v-if="hasManyCategories"
                type="button"
                class="menu-filters-toggle"
                @click="showCategoryPicker = !showCategoryPicker"
              >
                {{ showCategoryPicker ? 'Hide' : 'Browse all' }}
                <Icon :icon="showCategoryPicker ? 'solar:alt-arrow-up-bold' : 'solar:alt-arrow-down-bold'" />
              </button>
            </div>
            <div class="menu-filters-chips" role="tablist" aria-label="Product categories">
              <button
                type="button"
                class="menu-filter-pill"
                :class="{ active: activeFilter === 'all' }"
                @click="activeFilter = 'all'"
              >
                All
                <span class="menu-filter-count">{{ allMenuItems.length }}</span>
              </button>
              <button
                v-for="cat in prominentCategories"
                :key="cat.id"
                type="button"
                class="menu-filter-pill"
                :class="{ active: activeFilter === cat.id }"
                @click="activeFilter = cat.id"
              >
                {{ cat.name }}
                <span class="menu-filter-count">{{ cat.count }}</span>
              </button>
              <button
                v-if="hasManyCategories && !showCategoryPicker"
                type="button"
                class="menu-filter-pill menu-filter-pill--more"
                @click="showCategoryPicker = true"
              >
                +{{ categoriesWithCounts.length - prominentCategories.length }} more
              </button>
            </div>
            <div v-if="showCategoryPicker || !hasManyCategories" class="menu-category-picker">
              <div class="menu-category-search-wrap">
                <Icon icon="solar:magnifier-bold" class="menu-category-search-icon" />
                <input
                  v-model="categorySearch"
                  type="search"
                  class="menu-category-search"
                  placeholder="Filter categories…"
                  aria-label="Filter categories"
                />
              </div>
              <div class="menu-category-grid">
                <button
                  v-for="cat in filteredCategoryOptions"
                  :key="`pick-${cat.id}`"
                  type="button"
                  class="menu-category-option"
                  :class="{ active: activeFilter === cat.id }"
                  @click="activeFilter = cat.id"
                >
                  <span class="menu-category-option-name">{{ cat.name }}</span>
                  <span class="menu-category-option-count">{{ cat.count }}</span>
                </button>
              </div>
              <p v-if="filteredCategoryOptions.length === 0" class="small text-muted mb-0 mt-2">
                No categories match "{{ categorySearch }}".
              </p>
            </div>
          </div>

          <!-- Results summary -->
          <p v-if="hasActiveFilters || searchQuery" class="microsite-results-count small mb-3">
            <template v-if="searchFilteredItems.length > 0">
              Showing {{ searchFilteredItems.length }} of {{ allMenuItems.length }} item{{ allMenuItems.length === 1 ? '' : 's' }}
              <template v-if="searchQuery"> matching "{{ searchQuery }}"</template>
              <template v-if="activeFilter !== 'all'"> in {{ activeCategoryName }}</template>
            </template>
            <template v-else>
              No items match your filters. Try clearing search or changing category.
            </template>
          </p>

          <!-- Product vitrine -->
          <div
            class="menu-cards"
            :class="[
              layoutMode === 'grid' ? 'menu-cards--grid' : 'menu-cards--rows',
              layoutMode === 'grid' && `menu-cards--cols-${gridCols}`
            ]"
          >
            <article
              v-for="(item, i) in searchFilteredItems"
              :key="item.id ?? i"
              class="menu-card"
              :class="{ 'menu-card--row': layoutMode === 'rows' }"
              :style="{ '--card-i': i }"
            >
              <div class="menu-card-visual" @click="openProductDetail(item)">
                <div class="menu-card-image-wrap">
                  <img
                    v-if="item.cover_image && !cardImageErrors[itemKey(item, i)]"
                    :src="resolveLogo(item.cover_image)"
                    :alt="item.title || ''"
                    class="menu-card-image"
                    loading="lazy"
                    @error="onCardImageError(itemKey(item, i))"
                  />
                  <div v-else class="menu-card-image menu-card-image-placeholder">
                    <Icon icon="solar:gallery-minimalistic-bold-duotone" class="menu-card-placeholder-icon" />
                  </div>
                  <div class="menu-card-image-veil" aria-hidden="true" />
                  <span v-if="itemRequiresRx(item)" class="menu-card-rx-badge">Rx</span>
                  <span v-if="item.categoryName || item.category_name" class="menu-card-category">
                    {{ item.categoryName || item.category_name }}
                  </span>
                  <span v-if="item.price != null" class="menu-card-price-tag">{{ formatPrice(item.price) }}</span>
                  <div v-if="layoutMode === 'grid'" class="menu-card-quick" @click.stop>
                    <button type="button" class="menu-card-quick-btn" title="Add to web cart" @click="addToCart(item)">
                      <Icon icon="solar:bag-heart-bold" />
                      <span>Add</span>
                    </button>
                    <a
                      :href="appLink"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="menu-card-quick-btn menu-card-quick-btn--accent"
                      title="Order in app"
                      @click.stop
                    >
                      <Icon icon="solar:smartphone-2-bold" />
                    </a>
                  </div>
                </div>
              </div>
              <div class="menu-card-meta">
                <div class="menu-card-meta-top">
                  <div class="menu-card-meta-copy" @click="openProductDetail(item)">
                    <div v-if="itemRating(item)" class="menu-card-rating" aria-label="Rating">
                      <Icon
                        v-for="star in 5"
                        :key="star"
                        icon="solar:star-bold"
                        class="menu-card-star"
                        :class="{ filled: star <= itemRating(item) }"
                      />
                    </div>
                    <h3 class="menu-card-title">{{ item.title || 'Item' }}</h3>
                    <p v-if="item.description" class="menu-card-desc">{{ item.description }}</p>
                  </div>
                  <div v-if="layoutMode === 'rows'" class="menu-card-row-aside" @click.stop>
                    <span v-if="item.price != null" class="menu-card-price-inline">{{ formatPrice(item.price) }}</span>
                    <div class="menu-card-row-actions">
                      <button type="button" class="menu-card-quick-btn menu-card-quick-btn--row" @click="addToCart(item)">
                        <Icon icon="solar:bag-heart-bold" />
                        <span>Add</span>
                      </button>
                      <a
                        :href="appLink"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="menu-card-quick-btn menu-card-quick-btn--row menu-card-quick-btn--accent-row"
                        title="Order in app"
                      >
                        <Icon icon="solar:smartphone-2-bold" />
                        <span>Order</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-if="allMenuItems.length" class="checkout-explainer mb-5">
          <div class="commerce-model mb-4">
            <div class="checkout-explainer__header">
              <p class="checkout-explainer__eyebrow mb-2">Sell everywhere</p>
              <h2 class="checkout-explainer__title mb-2">One business. More ways to be found.</h2>
              <p class="checkout-explainer__copy mb-0">
                This is the seller's storefront. The same catalog can also show up in {{ discoveryChannelName }} — one
                KKOO checkout and escrow on every order.
              </p>
            </div>
            <div class="checkout-explainer__grid">
              <article v-for="surface in salesSurfaceCards" :key="surface.title" class="checkout-explainer__card">
                <span class="checkout-explainer__index">{{ surface.kicker }}</span>
                <h3>{{ surface.title }}</h3>
                <p>{{ surface.copy }}</p>
              </article>
            </div>
          </div>
          <div class="checkout-explainer__header">
            <p class="checkout-explainer__eyebrow mb-2">How ordering works</p>
            <h2 class="checkout-explainer__title mb-2">From browse to delivery.</h2>
            <p class="checkout-explainer__copy mb-0">
              Customers explore here first. When they're ready, they checkout through KKOO — payment protected until
              delivery is confirmed.
            </p>
          </div>
          <div class="checkout-explainer__grid">
            <article v-for="(step, index) in checkoutExplainer" :key="step.title" class="checkout-explainer__card">
              <span class="checkout-explainer__index">0{{ index + 1 }}</span>
              <h3>{{ step.title }}</h3>
              <p>{{ step.copy }}</p>
            </article>
          </div>
        </section>

        <!-- CTA -->
        <div class="text-center py-4">
          <p class="microsite-cta-desc small mb-2">Checkout on KKOO — escrow-protected until delivery is confirmed.</p>
          <div class="d-flex flex-wrap gap-2 justify-content-center">
            <a :href="buyerWebPath('/checkout')" class="btn btn-primary btn-lg">
              Open web checkout
            </a>
            <a :href="appLink" class="btn btn-outline-primary btn-lg" target="_blank" rel="noopener noreferrer">
              Order in app
            </a>
          </div>
          <p v-if="addMessage" class="text-success small mt-2 mb-0 text-center">{{ addMessage }}</p>
          <p v-if="addError" class="text-danger small mt-2 mb-0 text-center">{{ addError }}</p>
        </div>
      </div>

      <!-- Microsite footer: powered by + app buttons -->
      <footer class="microsite-footer">
        <div class="container microsite-footer__inner">
          <div class="microsite-footer__brand">
            <p class="microsite-footer-tagline mb-2">
              One ecosystem — shop, pay with escrow, and track delivery on KKOO.
            </p>
            <p class="microsite-footer-powered mb-0">
              © {{ new Date().getFullYear() }} {{ store.business_name || 'Store' }} · Storefront on
              <strong class="microsite-footer-brand">KKOO</strong>
            </p>
            <span class="microsite-footer-version" title="Storefront v1.0">v1.0</span>
          </div>
          <div class="microsite-footer-apps">
            <span class="microsite-footer-apps-label">Get the apps</span>
            <a
              :href="appLinks.marketplace.googlePlay"
              target="_blank"
              rel="noopener noreferrer"
              class="microsite-footer-btn"
            >
              KKOO for shoppers
            </a>
            <a
              :href="appLinks.eats.googlePlay"
              target="_blank"
              rel="noopener noreferrer"
              class="microsite-footer-btn"
            >
              KKOO Eats
            </a>
            <a
              :href="appLinks.rides.googlePlay"
              target="_blank"
              rel="noopener noreferrer"
              class="microsite-footer-btn microsite-footer-btn--soft"
            >
              KKOO Rides
            </a>
          </div>
        </div>
      </footer>

      <!-- Product detail modal -->
      <Teleport to="body">
        <div
          v-if="selectedProduct"
          class="microsite-detail-overlay"
          :class="{ 'microsite--dark': micrositeTheme === 'dark' }"
          role="dialog"
          aria-modal="true"
          aria-labelledby="microsite-detail-title"
          @click.self="selectedProduct = null"
        >
          <div class="microsite-detail-modal">
            <button type="button" class="microsite-detail-close" aria-label="Close" @click="selectedProduct = null">
              <Icon icon="solar:close-circle-bold" />
            </button>
            <div class="microsite-detail-content">
              <div class="microsite-detail-image-wrap">
                <img
                  v-if="selectedProduct.cover_image && !detailImageError"
                  :src="resolveLogo(selectedProduct.cover_image)"
                  :alt="selectedProduct.title || ''"
                  class="microsite-detail-image"
                  @error="detailImageError = true"
                />
                <div v-else class="microsite-detail-image microsite-detail-image-placeholder">
                  <Icon icon="solar:dish-bold-duotone" class="microsite-detail-placeholder-icon" />
                </div>
              </div>
              <div class="microsite-detail-body">
                <h2 id="microsite-detail-title" class="microsite-detail-title">
                  {{ selectedProduct.title || 'Item' }}
                  <span v-if="itemRequiresRx(selectedProduct)" class="microsite-detail-rx">Prescription required</span>
                </h2>
                <p v-if="selectedProduct.categoryName" class="microsite-detail-category text-muted small mb-2">{{ selectedProduct.categoryName }}</p>
                <div v-if="itemRating(selectedProduct)" class="microsite-detail-rating mb-2">
                  <Icon v-for="star in 5" :key="star" icon="solar:star-bold" class="menu-card-star" :class="{ filled: star <= itemRating(selectedProduct) }" />
                </div>
                <p v-if="selectedProduct.description" class="microsite-detail-desc">{{ selectedProduct.description }}</p>
                <p v-else class="microsite-detail-desc text-muted">Order on KKOO to get this item.</p>
                <div class="microsite-detail-price" v-if="selectedProduct.price != null">{{ formatPrice(selectedProduct.price) }}</div>
                <div class="microsite-detail-actions">
                  <a :href="appLink" target="_blank" rel="noopener noreferrer" class="menu-card-btn menu-card-btn-order">
                    Order on KKOO
                  </a>
                  <button type="button" class="menu-card-btn menu-card-btn-view" @click="selectedProduct = null">Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Teleport>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { Icon } from '@iconify/vue'
import { getStorePublic, type StorePromocode, type StorePublicPayload, type StorePublicProduct } from '@/api/store'
import { cartApi } from '@/api/cart'
import { useAuthStore } from '@/stores/auth'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { appLinks } from '@/config/app-links'
import { buyerWebPath } from '@/config/cross-app-links'

/** Menu item with optional category for filtering (restaurant = from category; grocery = from product). */
interface MenuItem extends StorePublicProduct {
  id?: number
  title?: string
  description?: string
  category_name?: string
  categoryId?: string
  categoryName?: string
  skus?: { id?: number; stock_quantity?: number }[]
}

const route = useRoute()
const auth = useAuthStore()
const slugOrId = computed(() => (route.params.slugOrId as string) || '')
const loading = ref(true)
const error = ref('')
const logoError = ref(false)
const payload = ref<StorePublicPayload | null>(null)
const activeFilter = ref<string>('all')
const searchQuery = ref('')
const categorySearch = ref('')
const showCategoryPicker = ref(false)
const sortBy = ref<'default' | 'name' | 'price_asc' | 'price_desc'>('default')
const priceBand = ref<'all' | 'under_10k' | '10k_50k' | 'over_50k'>('all')
const layoutMode = ref<'grid' | 'rows'>('grid')
const gridColOptions = [2, 3, 4] as const
const gridCols = ref<(typeof gridColOptions)[number]>(4)
const cardImageErrors = ref<Record<string, boolean>>({})
const selectedProduct = ref<MenuItem | null>(null)
const detailImageError = ref(false)
const addMessage = ref('')
const addError = ref('')
const copyMessage = ref('')

const MICROSITE_THEME_KEY = 'kkoo_microsite_theme'
function getInitialMicrositeTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(MICROSITE_THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}
const micrositeTheme = ref<'light' | 'dark'>(getInitialMicrositeTheme())
function toggleMicrositeTheme(): void {
  micrositeTheme.value = micrositeTheme.value === 'light' ? 'dark' : 'light'
  try {
    localStorage.setItem(MICROSITE_THEME_KEY, micrositeTheme.value)
  } catch {}
}

const store = computed(() => payload.value?.store ?? {})
const storefrontTheme = computed(() => payload.value?.storefront_theme ?? {})
/** Logo URL from theme or store object, only when present. */
const storeLogoUrl = computed(() => {
  const themeLogo = (storefrontTheme.value.logo_url as string | undefined)?.trim()
  const s = store.value
  const url = themeLogo || ((s.logo_url ?? (s as { logo?: string }).logo) as string | undefined)
  return url?.trim() || ''
})
const storeAddress = computed(() => {
  const s = store.value
  return ((s.address ?? s.business_address) as string | undefined)?.trim() || ''
})
const promocodes = computed(() => payload.value?.promocodes ?? [])
const referralCode = computed(() => (payload.value?.referral_code ?? '').trim())
/** Bio from store object, only when present. */
const storeBio = computed(() => {
  const bio = (store.value.bio ?? (store.value as { description?: string }).description) as string | undefined
  return bio?.trim() || ''
})
const storeInitials = computed(() => {
  const name = (store.value.business_name || 'Store').trim()
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
})
const isVerified = computed(() => {
  const s = store.value as { is_verified?: boolean; verified_partner?: boolean }
  return s.is_verified === true || s.verified_partner === true
})
const categories = computed(() => payload.value?.categories ?? [])
const products = computed(() => payload.value?.products ?? [])
const storefrontTypeLabel = computed(() => {
  const type = payload.value?.store_type
  if (type === 'restaurant') return 'Restaurant'
  if (type === 'grocery') return 'Store'
  if (type === 'pharmacy') return 'Pharmacy'
  if (type === 'hotel') return 'Hotel'
  return 'Seller'
})
const discoveryChannelName = computed(() => {
  const type = payload.value?.store_type
  if (type === 'restaurant') return 'KKOO Eats'
  if (type === 'grocery') return 'the KKOO marketplace'
  if (type === 'pharmacy') return 'KKOO Pharmacy'
  if (type === 'hotel') return 'KKOO Stay'
  return 'the KKOO commerce network'
})
/** Flatten restaurant categories into items with categoryId/categoryName, or use products for grocery/marketplace. */
const allMenuItems = computed((): MenuItem[] => {
  const type = payload.value?.store_type
  if ((type === 'restaurant' || type === 'hotel') && categories.value.length) {
    const items: MenuItem[] = []
    for (const cat of categories.value) {
      const list = cat.products ?? []
      for (const p of list) {
        items.push({
          ...p,
          categoryId: String(cat.id),
          categoryName: cat.name,
        })
      }
    }
    return items
  }
  return (products.value ?? []).map((p) => ({
    ...p,
    categoryId: p.category_id != null ? String(p.category_id) : undefined,
    categoryName: p.category_name,
  })) as MenuItem[]
})

/** Categories that actually have products, with counts (sorted by popularity). */
const categoriesWithCounts = computed(() => {
  const type = payload.value?.store_type
  if ((type === 'restaurant' || type === 'hotel') && categories.value.length) {
    return categories.value
      .map((c) => ({
        id: String(c.id),
        name: c.name,
        count: (c.products ?? []).length,
      }))
      .filter((c) => c.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
  }
  const counts = new Map<string, { id: string; name: string; count: number }>()
  for (const p of allMenuItems.value) {
    const id = String(p.categoryId ?? p.category_name ?? p.categoryName ?? 'other')
    const name = String(p.categoryName ?? p.category_name ?? 'Other')
    const cur = counts.get(id)
    if (cur) cur.count += 1
    else counts.set(id, { id, name, count: 1 })
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})

const hasManyCategories = computed(() => categoriesWithCounts.value.length > 10)
const prominentCategories = computed(() =>
  hasManyCategories.value ? categoriesWithCounts.value.slice(0, 8) : categoriesWithCounts.value
)
const filteredCategoryOptions = computed(() => {
  const q = categorySearch.value.trim().toLowerCase()
  if (!q) return categoriesWithCounts.value
  return categoriesWithCounts.value.filter((c) => c.name.toLowerCase().includes(q))
})
const activeCategoryName = computed(() => {
  if (activeFilter.value === 'all') return ''
  return categoriesWithCounts.value.find((c) => c.id === activeFilter.value)?.name ?? ''
})
const hasActiveFilters = computed(
  () =>
    activeFilter.value !== 'all' ||
    sortBy.value !== 'default' ||
    priceBand.value !== 'all' ||
    searchQuery.value.trim() !== ''
)

function clearAllFilters(): void {
  activeFilter.value = 'all'
  searchQuery.value = ''
  categorySearch.value = ''
  sortBy.value = 'default'
  priceBand.value = 'all'
  showCategoryPicker.value = false
}

function itemPrice(item: MenuItem): number {
  const p = item.price
  if (typeof p === 'number' && !Number.isNaN(p)) return p
  const base = (item as { base_price?: number }).base_price
  return typeof base === 'number' ? base : 0
}

function applyPriceBand(items: MenuItem[]): MenuItem[] {
  switch (priceBand.value) {
    case 'under_10k':
      return items.filter((i) => itemPrice(i) < 10000)
    case '10k_50k':
      return items.filter((i) => {
        const p = itemPrice(i)
        return p >= 10000 && p <= 50000
      })
    case 'over_50k':
      return items.filter((i) => itemPrice(i) > 50000)
    default:
      return items
  }
}

function applySort(items: MenuItem[]): MenuItem[] {
  const copy = [...items]
  switch (sortBy.value) {
    case 'price_asc':
      return copy.sort((a, b) => itemPrice(a) - itemPrice(b))
    case 'price_desc':
      return copy.sort((a, b) => itemPrice(b) - itemPrice(a))
    case 'name':
      return copy.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? ''))
    default:
      return copy
  }
}

const filteredItems = computed(() => {
  let items = allMenuItems.value
  if (activeFilter.value !== 'all') {
    items = items.filter(
      (item) =>
        String(item.categoryId) === activeFilter.value ||
        String(item.category_name) === activeFilter.value ||
        String(item.categoryName) === activeFilter.value
    )
  }
  return applyPriceBand(items)
})

/** Search + sort on top of category and price filters. */
const searchFilteredItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  let items = filteredItems.value
  if (q) {
    items = items.filter((item) => {
      const title = (item.title ?? '').toLowerCase()
      const desc = (item.description ?? '').toLowerCase()
      const cat = (item.categoryName ?? item.category_name ?? '').toLowerCase()
      return title.includes(q) || desc.includes(q) || cat.includes(q)
    })
  }
  return applySort(items)
})

function itemRequiresRx(item: StorePublicProduct): boolean {
  return (item as { requires_prescription?: boolean }).requires_prescription === true
}

function itemRating(item: StorePublicProduct): number {
  const r = (item as { rating?: number }).rating
  if (typeof r === 'number' && !Number.isNaN(r)) return Math.min(5, Math.max(0, Math.round(r)))
  return 0
}

function itemKey(item: MenuItem, index: number): string {
  return item.id != null ? String(item.id) : `idx-${index}`
}

function onCardImageError(key: string): void {
  cardImageErrors.value = { ...cardImageErrors.value, [key]: true }
}

function openProductDetail(item: MenuItem): void {
  detailImageError.value = false
  selectedProduct.value = item
}

async function addToCart(item: MenuItem) {
  addMessage.value = ''
  addError.value = ''
  const skuId = item.skus?.[0]?.id ?? item.id
  if (!skuId) {
    addError.value = 'No SKU available for this item.'
    return
  }
  if (!auth.isAuthenticated) {
    addError.value = 'Sign in to add items to your web cart.'
    return
  }
  try {
    await cartApi.add(Number(skuId), 1)
    addMessage.value = 'Added to cart. Open web checkout to finish.'
  } catch (e: any) {
    addError.value = e?.response?.data?.detail ?? 'Could not add to cart.'
  }
}

const primaryColor = computed(() => {
  const s = store.value as { menu_card_primary_color?: string }
  const theme = storefrontTheme.value as { primary_color?: string }
  return s.menu_card_primary_color || theme.primary_color || '#5C308F'
})
const accentColor = computed(() => {
  const s = store.value as { menu_card_accent_color?: string }
  const theme = storefrontTheme.value as { accent_color?: string }
  return s.menu_card_accent_color || theme.accent_color || '#F7A829'
})
const micrositeStyle = computed(() => {
  const isDark = micrositeTheme.value === 'dark'
  return {
    '--microsite-primary': primaryColor.value,
    '--microsite-accent': accentColor.value,
    '--microsite-text': isDark ? '#F3EFFA' : '#1F1B24',
    '--microsite-text-muted': isDark ? '#B8B0C8' : '#6B7280',
    '--microsite-primary-soft': isDark
      ? `color-mix(in srgb, ${primaryColor.value} 45%, #fff)`
      : primaryColor.value,
    '--microsite-bg': isDark ? '#0F0817' : '#F9F7FC',
    '--microsite-surface': isDark ? '#1c1822' : '#ffffff',
    '--microsite-border': isDark ? 'rgba(92, 48, 143, 0.25)' : 'rgba(0, 0, 0, 0.08)',
  } as Record<string, string>
})

const socialLinks = computed(() => {
  const s = store.value
  const out: { name: string; url: string }[] = []
  if (s.instagram_url) out.push({ name: 'Instagram', url: s.instagram_url })
  if (s.facebook_url) out.push({ name: 'Facebook', url: s.facebook_url })
  if (s.twitter_url) out.push({ name: 'Twitter', url: s.twitter_url })
  if (s.tiktok_url) out.push({ name: 'TikTok', url: s.tiktok_url })
  if (s.linkedin_url) out.push({ name: 'LinkedIn', url: s.linkedin_url })
  return out
})

const addressMapLink = computed(() => {
  const addr = encodeURIComponent(storeAddress.value)
  return addr ? `https://www.google.com/maps/search/?api=1&query=${addr}` : '#'
})

function promoLabel(promo: StorePromocode): string {
  if (promo.type === 'promotion' && promo.name) return promo.name
  return promo.code || promo.name || 'Deal'
}

function promoDiscountLabel(promo: StorePromocode): string {
  if (promo.discount_percent != null && promo.discount_percent > 0) {
    return `${promo.discount_percent}% off`
  }
  if (promo.discount_amount != null && promo.discount_amount > 0) {
    return formatPrice(promo.discount_amount) + ' off'
  }
  return ''
}

async function copyText(text: string): Promise<void> {
  copyMessage.value = ''
  try {
    await navigator.clipboard.writeText(text)
    copyMessage.value = 'Copied to clipboard.'
  } catch {
    copyMessage.value = text
  }
  setTimeout(() => { copyMessage.value = '' }, 2500)
}

// Buyer app/site base URL. "Order on KKOO" sends users here to complete the order.
// If the buyer app supports store deep links, we append /store/:slugOrId so they land on this store.
const buyerAppBase = import.meta.env.VITE_APP_ORIGIN || import.meta.env.VITE_BUYER_APP_URL || 'https://kkoo.com'
const appLink = computed(() => {
  const base = (buyerAppBase || '').replace(/\/$/, '')
  const slug = slugOrId.value
  if (base && slug) return `${base}/store/${encodeURIComponent(slug)}`
  return base || 'https://kkoo.com'
})

const salesSurfaceCards = computed(() => {
  const type = payload.value?.store_type
  if (type === 'restaurant') {
    return [
      {
        kicker: 'Microsite',
        title: 'Your restaurant storefront',
        copy: 'A branded page with your full menu — share the link on social, WhatsApp, or anywhere you talk to customers.',
      },
      {
        kicker: 'Eats',
        title: 'Same menu on KKOO Eats',
        copy: 'Dishes can also show up in the Eats app, where hungry customers are already browsing.',
      },
      {
        kicker: 'Checkout',
        title: 'One flow for every order',
        copy: 'Microsite or Eats — customers checkout through KKOO with the same payment and delivery rails.',
      },
    ]
  }

  if (type === 'pharmacy') {
    return [
      {
        kicker: 'Microsite',
        title: 'Your pharmacy storefront',
        copy: 'A branded page for your catalog and Rx-ready products — share one link with patients and walk-in customers.',
      },
      {
        kicker: 'Pharmacy',
        title: 'Also listed on KKOO Pharmacy',
        copy: 'The same products can appear where shoppers search for medicines and health essentials.',
      },
      {
        kicker: 'Checkout',
        title: 'One checkout behind it all',
        copy: 'Whether they start here or in the app, every order runs through one KKOO cart, payment, and delivery flow.',
      },
    ]
  }

  if (type === 'hotel') {
    return [
      {
        kicker: 'Microsite',
        title: 'Your stay storefront',
        copy: 'Show rooms, services, and add-ons on a branded page you can share before guests book.',
      },
      {
        kicker: 'Stay',
        title: 'Also discoverable on KKOO Stay',
        copy: 'The same property can appear where travellers browse and compare stays on KKOO.',
      },
      {
        kicker: 'Checkout',
        title: 'One checkout behind it all',
        copy: 'Guests complete booking and payment through KKOO — same trust layer, same support if plans change.',
      },
    ]
  }

  return [
    {
      kicker: 'Microsite',
      title: 'Your branded storefront',
      copy: 'A shareable page with your catalog and logo — link it anywhere you talk to customers.',
    },
    {
      kicker: 'Commerce',
      title: 'Listed where shoppers already browse',
      copy: 'The same products can appear in KKOO marketplace discovery, so buyers find you without hunting for a link.',
    },
    {
      kicker: 'Checkout',
      title: 'One checkout behind it all',
      copy: 'Whether they land here or in the app, shoppers use one cart, one payment flow, and one delivery experience.',
    },
  ]
})

const checkoutExplainer = [
  {
    title: 'Browse here',
    copy: 'Explore the menu or catalog, filter what you need, and add items before you checkout.',
  },
  {
    title: 'Checkout on KKOO',
    copy: 'Confirm your cart, address, and payment — escrow keeps money protected until delivery is confirmed.',
  },
  {
    title: 'Track your order',
    copy: 'Follow live updates and delivery in the KKOO app or web until your order arrives.',
  },
]

/** Resolve product/logo image URL (relative /media/ paths → same-origin or API host). */
function resolveLogo(url: string): string {
  const resolved = resolveAssetUrl(url)
  if (resolved) return resolved
  const u = url.trim()
  if (u.startsWith('/')) return u
  return ''
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(price)
}

function load() {
  if (!slugOrId.value) {
    loading.value = false
    error.value = 'Missing store identifier.'
    return
  }
  loading.value = true
  error.value = ''
  logoError.value = false
  cardImageErrors.value = {}
  activeFilter.value = 'all'
  searchQuery.value = ''
  categorySearch.value = ''
  showCategoryPicker.value = false
  sortBy.value = 'default'
  priceBand.value = 'all'
  getStorePublic(slugOrId.value)
    .then(({ data }) => {
      payload.value = data
      loading.value = false
    })
    .catch((e: { response?: { status: number }; message?: string }) => {
      loading.value = false
      if (e.response?.status === 404) error.value = 'Store not found.'
      else error.value = e.message || 'Could not load store.'
    })
}

watch(slugOrId, load)
onMounted(load)
</script>

<style scoped>
.business-microsite {
  min-height: 100vh;
  color: var(--microsite-text, #1F1B24);
  /* Light: soft purple-tinted surface; dark overridden below */
  background: var(--microsite-bg, #F9F7FC);
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--microsite-primary, #5C308F) 10%, var(--microsite-bg, #F9F7FC)) 0%, var(--microsite-bg, #F9F7FC) 22%, color-mix(in srgb, var(--microsite-primary, #5C308F) 6%, var(--microsite-bg, #F9F7FC)) 100%);
}
.business-microsite.microsite--dark {
  background: var(--microsite-bg);
  background-image: linear-gradient(180deg, color-mix(in srgb, var(--microsite-primary, #5C308F) 18%, var(--microsite-bg)) 0%, var(--microsite-bg) 25%, color-mix(in srgb, var(--microsite-primary, #5C308F) 8%, var(--microsite-bg)) 100%);
}
.microsite-header {
  position: relative;
  border-bottom: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, var(--microsite-border));
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--microsite-primary, #5C308F) 10%, var(--microsite-surface, #fff)) 0%,
      color-mix(in srgb, var(--microsite-surface, #fff) 92%, var(--microsite-bg)) 100%
    );
  overflow: hidden;
}
.microsite-header__mesh {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 70% 120% at 0% 0%, color-mix(in srgb, var(--microsite-primary, #5C308F) 16%, transparent), transparent 58%),
    radial-gradient(ellipse 55% 90% at 100% 0%, color-mix(in srgb, var(--microsite-accent, #F7A829) 12%, transparent), transparent 52%);
  opacity: 0.9;
}
.microsite-header__inner {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.35rem 0 1.5rem;
}
.microsite-header__brand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  min-width: 0;
  flex: 1;
}
@media (min-width: 768px) {
  .microsite-header__brand {
    flex-direction: row;
    align-items: center;
    gap: 1.25rem;
  }
}
.microsite-header__copy {
  min-width: 0;
  text-align: center;
}
@media (min-width: 768px) {
  .microsite-header__copy {
    text-align: left;
  }
}
.microsite-header__kicker {
  margin: 0 0 0.35rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--microsite-primary, #5C308F);
}
.microsite-header__title-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 0.5rem 0.65rem;
  margin-bottom: 0.35rem;
}
@media (min-width: 768px) {
  .microsite-header__title-row {
    justify-content: flex-start;
  }
}
.microsite-header__title {
  margin: 0;
  font-size: clamp(1.35rem, 2.4vw, 1.85rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.15;
  color: var(--microsite-text, #1F1B24);
}
.microsite-bio {
  max-width: 42rem;
  font-size: 0.92rem;
  line-height: 1.55;
  color: var(--microsite-text-muted, #6B7280);
}
.store-logo-slot {
  flex-shrink: 0;
  padding: 0.35rem;
  border-radius: 1.2rem;
  background: color-mix(in srgb, var(--microsite-surface, #fff) 88%, var(--microsite-primary, #5C308F) 12%);
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, transparent);
  box-shadow:
    0 14px 34px color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, transparent),
    inset 0 1px 0 color-mix(in srgb, #fff 70%, transparent);
}
.store-logo {
  width: 92px;
  height: 92px;
  object-fit: cover;
  border-radius: 0.95rem;
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, transparent);
  background: var(--microsite-surface, #fff);
  display: block;
}
.store-logo-fallback {
  width: 92px;
  height: 92px;
  border-radius: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.65rem;
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #fff;
  background: linear-gradient(
    145deg,
    var(--microsite-primary, #5C308F) 0%,
    color-mix(in srgb, var(--microsite-primary, #5C308F) 70%, #000 30%) 100%
  );
  border: 2px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 30%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--microsite-primary, #5C308F) 18%, transparent);
}
.object-fit-cover {
  object-fit: cover;
}
.business-microsite.microsite--dark .microsite-header {
  background:
    linear-gradient(
      180deg,
      color-mix(in srgb, var(--microsite-primary, #5C308F) 22%, var(--microsite-surface)) 0%,
      color-mix(in srgb, var(--microsite-bg) 94%, var(--microsite-primary, #5C308F) 6%) 100%
    );
}
.business-microsite.microsite--dark .store-logo-slot {
  background: color-mix(in srgb, var(--microsite-surface) 90%, var(--microsite-primary, #5C308F) 10%);
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.28);
}
.verified-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.22rem 0.55rem;
  border-radius: 999px;
  background: linear-gradient(135deg, var(--microsite-accent, #F7A829) 0%, #e09520 100%);
  color: #fff;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  box-shadow: 0 4px 14px color-mix(in srgb, var(--microsite-accent, #F7A829) 35%, transparent);
}
.verified-badge-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}
.verified-badge-text {
  white-space: nowrap;
}

.microsite-offers {
  padding: 1rem 1.25rem;
  border-radius: 16px;
  border: 1px solid var(--microsite-border);
  background: var(--microsite-surface, #fff);
}
.microsite-offers-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
  color: var(--microsite-text, #1F1B24);
}
.microsite-offers-hint {
  color: var(--microsite-text-muted, #6B7280);
}
.promo-chip,
.referral-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.75rem;
  border-radius: 10px;
  border: 1px dashed color-mix(in srgb, var(--microsite-primary, #5C308F) 35%, transparent);
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 8%, var(--microsite-surface, #fff));
  font-size: 0.85rem;
}
.promo-chip-code,
.referral-chip-code {
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--microsite-primary, #5C308F);
}
.promo-chip-detail {
  color: var(--microsite-text-muted, #6B7280);
}
.promo-chip-copy {
  border: none;
  border-radius: 6px;
  padding: 0.2rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: var(--microsite-primary, #5C308F);
  color: #fff;
  cursor: pointer;
}
.promo-chip-copy:hover {
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 85%, black);
}

/* Theme toggle */
.microsite-theme-toggle {
  flex-shrink: 0;
  width: 2.65rem;
  height: 2.65rem;
  padding: 0;
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 16%, var(--microsite-border));
  border-radius: 999px;
  background: color-mix(in srgb, var(--microsite-surface, #fff) 90%, var(--microsite-primary, #5C308F) 10%);
  color: var(--microsite-text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 20px color-mix(in srgb, var(--microsite-primary, #5C308F) 10%, transparent);
  transition: background 0.2s, color 0.2s, border-color 0.2s, transform 0.2s;
}
.microsite-theme-toggle:hover {
  color: var(--microsite-primary, #5C308F);
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, var(--microsite-surface));
  transform: translateY(-1px);
}
.microsite-theme-icon {
  width: 1.35rem;
  height: 1.35rem;
}

/* Menu toolbar: search + layout */
.menu-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem 1.25rem;
}
.menu-search-wrap {
  position: relative;
  flex: 1 1 220px;
  min-width: 200px;
  max-width: 420px;
}
.menu-search-clear {
  position: absolute;
  right: 0.45rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  padding: 0.2rem;
  color: var(--microsite-text-muted, #6B7280);
  cursor: pointer;
  display: flex;
  align-items: center;
}
.menu-search-clear .iconify {
  width: 1.15rem;
  height: 1.15rem;
}
.menu-advanced-filters {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.5rem 0.75rem;
}
.menu-filter-field {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
}
.menu-filter-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--microsite-text-muted, #6B7280);
}
.menu-filter-select {
  min-width: 9.5rem;
  padding: 0.45rem 0.65rem;
  border-radius: 10px;
  border: 1px solid var(--microsite-border);
  background: var(--microsite-surface, #fff);
  color: var(--microsite-text, #1F1B24);
  font-size: 0.88rem;
}
.menu-filter-clear {
  border: none;
  background: transparent;
  color: var(--microsite-primary, #5C308F);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0.45rem 0.25rem;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.menu-search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1.2rem;
  height: 1.2rem;
  color: var(--microsite-text-muted, #6B7280);
  pointer-events: none;
}
.menu-search-input {
  width: 100%;
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid var(--microsite-border);
  border-radius: 10px;
  font-size: 0.95rem;
  background: var(--microsite-surface, #fff);
  color: var(--microsite-text, #1F1B24);
}
.menu-search-input::placeholder {
  color: var(--microsite-text-muted, #6B7280);
}
.menu-search-input:focus {
  outline: none;
  border-color: var(--microsite-primary, #5C308F);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--microsite-primary, #5C308F) 20%, transparent);
}
.menu-layout-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.menu-layout-label,
.menu-cols-label {
  font-size: 0.8rem;
  color: var(--microsite-text-muted, #6B7280);
  margin: 0;
}
.menu-layout-controls .btn-group .btn {
  padding: 0.4rem 0.6rem;
  color: var(--microsite-text, #1F1B24);
  border-color: var(--microsite-border);
}
.menu-layout-controls .btn-group .btn:hover {
  color: var(--microsite-primary, #5C308F);
  border-color: var(--microsite-primary, #5C308F);
}
.menu-layout-controls .btn-group .btn-primary {
  background: var(--microsite-primary, #5C308F);
  border-color: var(--microsite-primary, #5C308F);
  color: #fff;
}
.menu-layout-controls .btn-group .btn .iconify {
  width: 1.1rem;
  height: 1.1rem;
}

/* Product vitrine grid */
.menu-cards {
  display: grid;
  gap: clamp(1rem, 2.5vw, 1.65rem);
}
.menu-cards--grid.menu-cards--cols-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
.menu-cards--grid.menu-cards--cols-3 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (min-width: 768px) {
  .menu-cards--grid.menu-cards--cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.menu-cards--grid.menu-cards--cols-4 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
@media (min-width: 992px) {
  .menu-cards--grid.menu-cards--cols-4 {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
.menu-cards--rows {
  grid-template-columns: 1fr;
  gap: 0.85rem;
}

/* Row layout — image left · copy center · actions right */
.menu-card--row {
  display: grid;
  grid-template-columns: 5.5rem minmax(0, 1fr) auto;
  grid-template-rows: auto;
  align-items: center;
  gap: 0 1rem;
  padding: 0.65rem 1rem 0.65rem 0.65rem;
  min-height: 5.5rem;
}
.menu-card--row .menu-card-visual {
  grid-column: 1;
  grid-row: 1;
  border-radius: 0.85rem;
  align-self: center;
}
.menu-card--row .menu-card-image-wrap {
  aspect-ratio: 1;
  width: 5.5rem;
  height: 5.5rem;
  min-height: 0;
}
.menu-card--row .menu-card-image {
  object-fit: cover;
}
.menu-card--row .menu-card-meta {
  display: contents;
}
.menu-card--row .menu-card-meta-top {
  display: contents;
}
.menu-card--row .menu-card-meta-copy {
  grid-column: 2;
  grid-row: 1;
  padding: 0.15rem 0;
  min-width: 0;
}
.menu-card--row .menu-card-row-aside {
  grid-column: 3;
  grid-row: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  gap: 0.45rem;
  flex-shrink: 0;
}
.menu-card--row .menu-card-price-tag {
  display: none;
}
.menu-card--row .menu-card-quick {
  display: none;
}
.menu-card--row .menu-card-desc {
  -webkit-line-clamp: 2;
  margin-bottom: 0;
}
.menu-card--row .menu-card-title {
  margin-bottom: 0.2rem;
}
.menu-card--row .menu-card-row-actions {
  flex-wrap: nowrap;
}
.menu-card--row .menu-card-quick-btn--row {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.45rem 0.75rem;
  border-radius: 999px;
  border: none;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 92%, #000 8%);
  color: #fff;
  transition: transform 0.2s, box-shadow 0.2s;
}
.menu-card--row .menu-card-quick-btn--row:hover {
  transform: translateY(-1px);
  color: #fff;
}
.menu-card--row .menu-card-quick-btn--accent-row {
  background: var(--microsite-accent, #F7A829);
  color: var(--microsite-primary, #5C308F);
}
@media (max-width: 767px) {
  .menu-card--row {
    grid-template-columns: 4.75rem minmax(0, 1fr);
    grid-template-rows: auto auto;
    gap: 0.65rem 0.75rem;
    padding: 0.65rem;
  }
  .menu-card--row .menu-card-image-wrap {
    width: 4.75rem;
    height: 4.75rem;
  }
  .menu-card--row .menu-card-meta-copy {
    grid-column: 2;
    grid-row: 1;
  }
  .menu-card--row .menu-card-row-aside {
    grid-column: 1 / -1;
    grid-row: 2;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding-top: 0.15rem;
    border-top: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, transparent);
  }
}

/* Menu section (Tasty Foods style) */
.menu-section-header .menu-breadcrumb {
  font-size: 0.8rem;
  color: var(--microsite-text-muted, #6B7280);
}
.menu-section-title {
  font-size: clamp(1.65rem, 2.5vw + 1rem, 2.35rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--microsite-text, #1F1B24);
}
.menu-section-title-accent {
  color: var(--microsite-primary, #5C308F);
}
.menu-section-desc {
  color: var(--microsite-text-muted, #6B7280);
}
.menu-filters-panel {
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  border: 1px solid var(--microsite-border);
  background: color-mix(in srgb, var(--microsite-surface, #fff) 92%, var(--microsite-primary, #5C308F) 8%);
}
.menu-filters-head {
  display: flex;
  align-items: center;
  gap: 0.5rem 0.75rem;
  margin-bottom: 0.65rem;
  flex-wrap: wrap;
}
.menu-filters-title {
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--microsite-text-muted, #6B7280);
}
.menu-filters-meta {
  font-size: 0.78rem;
  color: var(--microsite-text-muted, #6B7280);
}
.menu-filters-toggle {
  margin-left: auto;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  background: transparent;
  color: var(--microsite-primary, #5C308F);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.menu-filters-toggle .iconify {
  width: 1rem;
  height: 1rem;
}
.menu-filters-chips {
  display: flex;
  gap: 0.45rem;
  overflow-x: auto;
  padding-bottom: 0.15rem;
  scrollbar-width: thin;
  -webkit-overflow-scrolling: touch;
}
.menu-filters-chips::-webkit-scrollbar {
  height: 5px;
}
.menu-filter-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.42rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--microsite-border);
  background: var(--microsite-surface, #fff);
  color: var(--microsite-text, #1F1B24);
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  white-space: nowrap;
}
.menu-filter-count {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.12rem 0.45rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, var(--microsite-surface, #fff));
  color: var(--microsite-primary-soft, var(--microsite-primary, #5C308F));
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 18%, transparent);
}
.menu-filter-pill.active .menu-filter-count {
  background: rgba(255, 255, 255, 0.24);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.28);
}
.menu-filter-pill--more {
  border-style: dashed;
  color: var(--microsite-primary, #5C308F);
}
.menu-filter-pill:hover {
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 10%, var(--microsite-surface));
  border-color: var(--microsite-primary, #5C308F);
  color: var(--microsite-primary, #5C308F);
}
.menu-filter-pill.active {
  background: var(--microsite-primary, #5C308F);
  border-color: var(--microsite-primary, #5C308F);
  color: #fff;
}
.menu-category-picker {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--microsite-border);
}
.menu-category-search-wrap {
  position: relative;
  margin-bottom: 0.65rem;
}
.menu-category-search-icon {
  position: absolute;
  left: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  width: 1rem;
  height: 1rem;
  color: var(--microsite-text-muted, #6B7280);
}
.menu-category-search {
  width: 100%;
  padding: 0.45rem 0.65rem 0.45rem 2.1rem;
  border-radius: 10px;
  border: 1px solid var(--microsite-border);
  background: var(--microsite-surface, #fff);
  color: var(--microsite-text, #1F1B24);
  font-size: 0.88rem;
}
.menu-category-search::placeholder {
  color: var(--microsite-text-muted, #6B7280);
}
.menu-category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(9.5rem, 1fr));
  gap: 0.45rem;
  max-height: 12rem;
  overflow-y: auto;
  padding-right: 0.15rem;
}
.menu-category-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.35rem;
  padding: 0.4rem 0.55rem;
  border-radius: 8px;
  border: 1px solid var(--microsite-border);
  background: var(--microsite-surface, #fff);
  color: var(--microsite-text, #1F1B24);
  font-size: 0.8rem;
  cursor: pointer;
  text-align: left;
}
.menu-category-option.active {
  border-color: var(--microsite-primary, #5C308F);
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, var(--microsite-surface));
  color: var(--microsite-primary, #5C308F);
  font-weight: 600;
}
.menu-category-option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.menu-category-option-count {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, var(--microsite-surface, #fff));
  color: var(--microsite-primary-soft, var(--microsite-primary, #5C308F));
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 16%, transparent);
}
.menu-category-option.active .menu-category-option-count {
  background: rgba(255, 255, 255, 0.22);
  color: #fff;
  border-color: rgba(255, 255, 255, 0.25);
}

.menu-card {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
  border-radius: 1.35rem;
  overflow: hidden;
  background: color-mix(in srgb, var(--microsite-surface, #fff) 88%, var(--microsite-primary, #5C308F) 12%);
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, transparent);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.65) inset,
    0 18px 40px color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, transparent);
  transition:
    transform 0.45s cubic-bezier(0.22, 1, 0.36, 1),
    box-shadow 0.45s cubic-bezier(0.22, 1, 0.36, 1);
  animation: menuCardIn 0.65s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: calc(var(--card-i, 0) * 0.05s);
}
@keyframes menuCardIn {
  from {
    opacity: 0;
    transform: translateY(18px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
.menu-card:hover {
  transform: translateY(-6px);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.75) inset,
    0 28px 56px color-mix(in srgb, var(--microsite-primary, #5C308F) 22%, transparent);
}
.business-microsite.microsite--dark .menu-card {
  background: color-mix(in srgb, var(--microsite-surface, #1c1822) 92%, var(--microsite-primary, #5C308F) 8%);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.06) inset,
    0 20px 48px rgba(0, 0, 0, 0.45);
}
.menu-card-visual {
  cursor: pointer;
}
.menu-card-image-wrap {
  position: relative;
  aspect-ratio: 4 / 5;
  overflow: hidden;
  background:
    radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--microsite-accent, #F7A829) 22%, transparent), transparent 42%),
    var(--microsite-bg, #f5f5f5);
}
.business-microsite.microsite--dark .menu-card-image-wrap {
  background:
    radial-gradient(circle at 20% 15%, color-mix(in srgb, var(--microsite-accent, #F7A829) 18%, transparent), transparent 42%),
    #252030;
}
.menu-card-image-veil {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.02) 0%,
    rgba(0, 0, 0, 0) 35%,
    rgba(0, 0, 0, 0.55) 100%
  );
  pointer-events: none;
  transition: opacity 0.35s ease;
}
.menu-card:hover .menu-card-image-veil {
  opacity: 0.92;
}
.menu-card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1.02);
  transition: transform 0.65s cubic-bezier(0.22, 1, 0.36, 1);
}
.menu-card:hover .menu-card-image {
  transform: scale(1.08);
}
.menu-card-rx-badge {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  padding: 0.25rem 0.55rem;
  border-radius: 0.5rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fff;
  background: #c62828;
  box-shadow: 0 8px 20px rgba(198, 40, 40, 0.35);
}
.menu-card-category {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  z-index: 2;
  max-width: calc(100% - 1.5rem);
  padding: 0.28rem 0.65rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #fff;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 72%, #000 28%);
  backdrop-filter: blur(8px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}
.menu-card-price-tag {
  position: absolute;
  left: 0.75rem;
  bottom: 0.75rem;
  z-index: 2;
  padding: 0.35rem 0.7rem;
  border-radius: 0.75rem;
  font-size: 0.92rem;
  font-weight: 800;
  color: var(--microsite-primary, #5C308F);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.16);
}
.business-microsite.microsite--dark .menu-card-price-tag {
  color: #fff;
  background: rgba(15, 8, 23, 0.82);
}
.menu-card-quick {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  z-index: 3;
  display: flex;
  gap: 0.45rem;
  opacity: 0;
  transform: translateY(8px);
  transition:
    opacity 0.35s ease,
    transform 0.35s cubic-bezier(0.22, 1, 0.36, 1);
}
.menu-card:hover .menu-card-quick,
.menu-card:focus-within .menu-card-quick {
  opacity: 1;
  transform: translateY(0);
}
.menu-card-quick-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: 2.35rem;
  padding: 0 0.85rem;
  border: none;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
  color: #fff;
  background: var(--microsite-primary, #5C308F);
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.22);
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.menu-card-quick-btn:hover {
  transform: translateY(-2px);
  color: #fff;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 85%, #000 15%);
}
.menu-card-quick-btn--accent {
  padding: 0 0.7rem;
  background: var(--microsite-accent, #F7A829);
  color: var(--microsite-primary, #5C308F);
}
.menu-card-quick-btn--ghost {
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.22);
}
.menu-card-quick-btn .iconify {
  width: 1.05rem;
  height: 1.05rem;
}
.menu-card-meta {
  padding: 0.9rem 1rem 1rem;
}
.menu-card-meta-top {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}
.menu-card-meta-copy {
  cursor: pointer;
  min-width: 0;
}
.menu-card-price-inline {
  flex-shrink: 0;
  font-size: 1rem;
  font-weight: 800;
  color: var(--microsite-primary, #5C308F);
  line-height: 1.2;
  text-align: right;
}
.menu-card-row-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.45rem;
  flex-shrink: 0;
}
@media (max-width: 767px) {
  .menu-card-quick {
    opacity: 1;
    transform: none;
  }
}
/* Ensure muted/secondary text is readable in both themes */
.business-microsite .text-muted {
  color: var(--microsite-text-muted, #6B7280) !important;
}
.menu-card-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--microsite-primary, #5C308F) 15%, var(--microsite-surface, #fff)) 0%,
    color-mix(in srgb, var(--microsite-bg) 88%, var(--microsite-surface, #fff) 12%) 100%
  );
}
.menu-card-placeholder-icon {
  width: 3rem;
  height: 3rem;
  color: var(--microsite-primary, #5C308F);
  opacity: 0.7;
}
.menu-card-rating {
  display: flex;
  gap: 2px;
  margin-bottom: 0.35rem;
}
.menu-card-star {
  width: 1rem;
  height: 1rem;
  color: #e5e7eb;
}
.menu-card-star.filled {
  color: var(--microsite-accent, #F7A829);
}
.menu-card-title {
  font-size: clamp(1rem, 0.4vw + 0.92rem, 1.12rem);
  font-weight: 800;
  margin: 0 0 0.35rem;
  line-height: 1.25;
  letter-spacing: -0.02em;
  color: var(--microsite-text, #1F1B24);
}
.menu-card-desc {
  font-size: 0.82rem;
  margin: 0;
  line-height: 1.55;
  color: var(--microsite-text-muted, #6B7280);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.microsite-results-count,
.microsite-cta-desc {
  color: var(--microsite-text-muted, #6B7280);
}

/* Product detail modal */
.microsite-detail-overlay {
  position: fixed;
  inset: 0;
  z-index: 1050;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(0, 0, 0, 0.5);
  overflow-y: auto;
}
.microsite-detail-modal {
  position: relative;
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 2rem);
  background: #fff;
  color: #1F1B24;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.microsite-detail-overlay.microsite--dark .microsite-detail-modal {
  background: #1c1822;
  color: #EDE9F5;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}
.microsite-detail-overlay.microsite--dark .microsite-detail-title,
.microsite-detail-overlay.microsite--dark .microsite-detail-desc {
  color: #EDE9F5;
}
.microsite-detail-overlay.microsite--dark .microsite-detail-body .text-muted {
  color: #CAC4D6 !important;
}
.microsite-detail-overlay.microsite--dark .microsite-detail-image-wrap {
  background: #252030;
}
.microsite-detail-close {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  z-index: 2;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.4);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.microsite-detail-close:hover {
  background: rgba(0, 0, 0, 0.6);
}
.microsite-detail-close .iconify {
  width: 1.4rem;
  height: 1.4rem;
}
.microsite-detail-content {
  overflow-y: auto;
  display: grid;
  grid-template-columns: 1fr;
}
@media (min-width: 576px) {
  .microsite-detail-content {
    grid-template-columns: 1fr 1fr;
  }
}
.microsite-detail-image-wrap {
  aspect-ratio: 1;
  background: #f5f5f5;
}
.microsite-detail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.microsite-detail-image-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--microsite-primary, #5C308F) 15%, var(--microsite-surface, #fff)) 0%,
    color-mix(in srgb, var(--microsite-bg) 88%, var(--microsite-surface, #fff) 12%) 100%
  );
}
.microsite-detail-placeholder-icon {
  width: 4rem;
  height: 4rem;
  color: var(--microsite-primary, #5C308F);
  opacity: 0.7;
}
.microsite-detail-body {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
}
.microsite-detail-title {
  font-size: 1.35rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--microsite-text, #1F1B24);
  line-height: 1.3;
}
.microsite-detail-rx {
  display: inline-block;
  margin-left: 0.5rem;
  padding: 0.15rem 0.5rem;
  border-radius: 0.45rem;
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  vertical-align: middle;
  color: #fff;
  background: #c62828;
}
.microsite-detail-category {
  margin: 0 0 0.5rem 0;
}
.microsite-detail-rating {
  display: flex;
  gap: 2px;
}
.microsite-detail-rating .menu-card-star {
  width: 1rem;
  height: 1rem;
  color: #e5e7eb;
}
.microsite-detail-rating .menu-card-star.filled {
  color: var(--microsite-accent, #F7A829);
}
.microsite-detail-desc {
  font-size: 0.95rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
  flex: 1;
}
.microsite-detail-price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--microsite-primary, #5C308F);
  margin-bottom: 1rem;
}
.microsite-detail-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.microsite-detail-actions .menu-card-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 700;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.microsite-detail-actions .menu-card-btn-order {
  background: var(--microsite-primary, #5C308F);
  color: #fff;
}
.microsite-detail-actions .menu-card-btn-view {
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 12%, var(--microsite-surface, #fff));
  color: var(--microsite-primary, #5C308F);
}

.checkout-explainer {
  padding: 1.5rem;
  border-radius: 1.75rem;
  border: 1px solid var(--microsite-border);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--microsite-accent, #F7A829) 18%, transparent) 0%, transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--microsite-surface) 92%, var(--microsite-primary, #5C308F) 8%), var(--microsite-surface));
  box-shadow: 0 18px 50px rgba(26, 18, 36, 0.08);
}

.commerce-model {
  margin-bottom: 1.6rem;
}

.checkout-explainer__header {
  max-width: 42rem;
  margin-bottom: 1.25rem;
}

.checkout-explainer__eyebrow {
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--microsite-primary-soft, var(--microsite-primary, #5C308F));
}

.checkout-explainer__title {
  font-size: clamp(1.45rem, 2vw, 2rem);
  font-weight: 800;
  line-height: 1.08;
  color: var(--microsite-text, #1F1B24);
}

.checkout-explainer__copy {
  color: var(--microsite-text-muted, #6B7280);
  line-height: 1.7;
}

.checkout-explainer__grid {
  display: grid;
  gap: 1rem;
}

@media (min-width: 768px) {
  .checkout-explainer__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

.checkout-explainer__card {
  padding: 1.15rem;
  border-radius: 1.25rem;
  border: 1px solid var(--microsite-border);
  background: color-mix(in srgb, var(--microsite-surface, #fff) 92%, var(--microsite-bg) 8%);
}

.checkout-explainer__index {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 18%, var(--microsite-surface, #fff));
  color: var(--microsite-primary-soft, var(--microsite-primary, #5C308F));
  font-weight: 800;
  font-size: 0.82rem;
  margin-bottom: 0.85rem;
}

.checkout-explainer__card h3 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--microsite-text, #1F1B24);
}

.checkout-explainer__card p {
  margin: 0;
  color: var(--microsite-text-muted, #6B7280);
  line-height: 1.65;
  font-size: 0.92rem;
}

/* Microsite footer */
.microsite-footer {
  margin-top: 2rem;
  padding: 1.25rem 0 1.5rem;
  border-top: 1px solid var(--microsite-border);
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 6%, var(--microsite-bg));
}
.microsite-footer__inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem 1.5rem;
}
.microsite-footer__brand {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 0.75rem;
  min-width: 0;
}
.microsite-footer-tagline {
  font-size: 0.88rem;
  line-height: 1.5;
  color: var(--microsite-text-muted, #6B7280);
  margin: 0;
  max-width: 28rem;
}
.microsite-footer-powered {
  font-size: 0.84rem;
  color: var(--microsite-text-muted, #6B7280);
  margin: 0;
}
.microsite-footer-apps-label {
  display: block;
  width: 100%;
  margin-bottom: 0.35rem;
  font-size: 0.68rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--microsite-text-muted, #6B7280);
}
.microsite-footer-version {
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  font-size: 0.68rem;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: var(--microsite-primary, #5C308F);
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 10%, var(--microsite-surface, #fff));
  border: 1px solid color-mix(in srgb, var(--microsite-primary, #5C308F) 18%, transparent);
}
@media (max-width: 767px) {
  .microsite-footer__inner {
    grid-template-columns: 1fr;
    justify-items: center;
    text-align: center;
  }
  .microsite-footer__brand {
    justify-content: center;
  }
}
.microsite-footer-brand {
  color: var(--microsite-text, #1F1B24);
  font-weight: 600;
}
.business-microsite.microsite--dark .microsite-footer-brand {
  color: var(--microsite-text, #EDE9F5);
}
.microsite-footer-apps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  max-width: 22rem;
}
@media (max-width: 767px) {
  .microsite-footer-apps {
    justify-content: center;
    max-width: none;
  }
  .microsite-footer-tagline {
    max-width: none;
  }
}
.microsite-footer-btn--soft {
  background: color-mix(in srgb, var(--microsite-accent, #F7A829) 10%, var(--microsite-surface, #fff));
  border-color: color-mix(in srgb, var(--microsite-accent, #F7A829) 28%, transparent);
  color: var(--microsite-text, #1F1B24);
}
.microsite-footer-btn--soft:hover {
  background: color-mix(in srgb, var(--microsite-accent, #F7A829) 18%, var(--microsite-surface));
  border-color: var(--microsite-accent, #F7A829);
  color: var(--microsite-text, #1F1B24);
}
.microsite-footer-btn {
  display: inline-flex;
  align-items: center;
  padding: 0.5rem 1rem;
  border-radius: 10px;
  font-size: 0.9rem;
  font-weight: 600;
  text-decoration: none;
  background: var(--microsite-surface, #fff);
  color: var(--microsite-primary, #5C308F);
  border: 1px solid var(--microsite-border);
  transition: background 0.2s, color 0.2s, border-color 0.2s, box-shadow 0.2s;
}
.microsite-footer-btn:hover {
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 14%, var(--microsite-surface));
  border-color: var(--microsite-primary, #5C308F);
  color: var(--microsite-primary, #5C308F);
}
.business-microsite.microsite--dark .microsite-footer-btn {
  background: var(--microsite-surface);
  color: var(--microsite-text, #EDE9F5);
  border-color: var(--microsite-border);
}
.business-microsite.microsite--dark .microsite-footer-btn:hover {
  background: color-mix(in srgb, var(--microsite-primary, #5C308F) 25%, var(--microsite-surface));
  border-color: var(--microsite-primary, #5C308F);
  color: var(--microsite-accent, #F7A829);
}

/* —— Dark mode: fix low-contrast text & Bootstrap controls —— */
.business-microsite.microsite--dark .btn-outline-secondary {
  color: var(--microsite-text) !important;
  border-color: color-mix(in srgb, var(--microsite-text) 30%, transparent) !important;
  background-color: color-mix(in srgb, var(--microsite-surface) 90%, transparent) !important;
}
.business-microsite.microsite--dark .btn-outline-secondary:hover,
.business-microsite.microsite--dark .btn-outline-secondary:focus {
  color: var(--microsite-text) !important;
  border-color: var(--microsite-primary-soft, var(--microsite-primary)) !important;
  background-color: color-mix(in srgb, var(--microsite-primary) 20%, var(--microsite-surface)) !important;
}
.business-microsite.microsite--dark .btn-outline-primary {
  color: var(--microsite-primary-soft, var(--microsite-primary)) !important;
  border-color: color-mix(in srgb, var(--microsite-primary) 65%, #fff) !important;
  background-color: color-mix(in srgb, var(--microsite-primary) 12%, var(--microsite-surface)) !important;
}
.business-microsite.microsite--dark .btn-outline-primary:hover {
  color: var(--microsite-text) !important;
  background-color: var(--microsite-primary) !important;
  border-color: var(--microsite-primary) !important;
}
.business-microsite.microsite--dark .menu-layout-controls .btn-group .btn-outline-secondary {
  color: var(--microsite-text) !important;
  background-color: color-mix(in srgb, var(--microsite-surface) 92%, transparent) !important;
}
.business-microsite.microsite--dark .menu-layout-controls .btn-group .btn-outline-secondary:hover {
  color: var(--microsite-primary-soft, var(--microsite-primary)) !important;
}
.business-microsite.microsite--dark .menu-filter-select,
.business-microsite.microsite--dark .menu-search-input,
.business-microsite.microsite--dark .menu-category-search {
  color-scheme: dark;
}
.business-microsite.microsite--dark .checkout-explainer {
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--microsite-accent, #F7A829) 14%, transparent) 0%, transparent 28%),
    linear-gradient(180deg, color-mix(in srgb, var(--microsite-surface) 96%, var(--microsite-primary) 4%), var(--microsite-surface));
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
}
.business-microsite.microsite--dark .checkout-explainer__card {
  background: color-mix(in srgb, var(--microsite-surface) 94%, var(--microsite-bg) 6%);
}
.business-microsite.microsite--dark .checkout-explainer__index {
  background: color-mix(in srgb, var(--microsite-primary) 28%, var(--microsite-surface));
  color: var(--microsite-primary-soft, var(--microsite-primary));
}
.business-microsite.microsite--dark .menu-section-title-accent,
.business-microsite.microsite--dark .promo-chip-code,
.business-microsite.microsite--dark .referral-chip-code,
.business-microsite.microsite--dark .microsite-header__kicker {
  color: var(--microsite-primary-soft, var(--microsite-primary));
}
.business-microsite.microsite--dark .menu-card-image-placeholder,
.business-microsite.microsite--dark .microsite-detail-image-placeholder {
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--microsite-primary) 24%, var(--microsite-surface)) 0%,
    color-mix(in srgb, var(--microsite-bg) 90%, var(--microsite-surface) 10%) 100%
  );
}
.business-microsite.microsite--dark .microsite-detail-image-wrap {
  background: color-mix(in srgb, var(--microsite-surface) 88%, #000 12%);
}
.business-microsite.microsite--dark .microsite-theme-toggle {
  color: var(--microsite-text-muted);
}
.business-microsite.microsite--dark .microsite-theme-toggle:hover {
  color: var(--microsite-primary-soft, var(--microsite-primary));
}
.business-microsite.microsite--dark h1,
.business-microsite.microsite--dark h2,
.business-microsite.microsite--dark h3,
.business-microsite.microsite--dark h4 {
  color: var(--microsite-text);
}
.business-microsite.microsite--dark .menu-filter-pill:not(.active) {
  color: var(--microsite-text);
}
.business-microsite.microsite--dark .menu-filter-pill:hover:not(.active) {
  color: var(--microsite-primary-soft, var(--microsite-primary));
}
.business-microsite.microsite--dark .menu-filter-pill:not(.active) .menu-filter-count,
.business-microsite.microsite--dark .menu-category-option:not(.active) .menu-category-option-count {
  background: color-mix(in srgb, var(--microsite-primary) 24%, var(--microsite-surface));
  color: var(--microsite-text);
  border-color: color-mix(in srgb, var(--microsite-primary) 30%, transparent);
}
.business-microsite.microsite--dark .microsite-footer-btn--soft {
  color: var(--microsite-text);
}
</style>
