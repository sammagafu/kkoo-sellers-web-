<template>
  <div class="menu-display" :style="screenStyle">
    <div v-if="loading" class="menu-display__state">
      <div class="spinner-border" role="status"><span class="visually-hidden">Loading…</span></div>
      <p class="mt-3 mb-0">Loading menu screen…</p>
    </div>

    <div v-else-if="error || !slides.length" class="menu-display__state">
      <h1 class="h4 mb-2">Menu screen unavailable</h1>
      <p class="mb-0">{{ error || 'No products are ready for the screen yet.' }}</p>
    </div>

    <template v-else>
      <header class="menu-display__topbar">
        <div>
          <div class="menu-display__eyebrow">Kkoo menu screen</div>
          <div class="menu-display__brand">{{ storeName }}</div>
        </div>
        <div class="menu-display__topbar-meta">
          <span class="menu-display__badge">{{ currentIndex + 1 }} / {{ slides.length }}</span>
          <span class="menu-display__badge">{{ rotationSeconds }}s</span>
          <button type="button" class="menu-display__action" @click="enterFullscreen">Fullscreen</button>
        </div>
      </header>

      <main class="menu-display__viewport">
        <section v-if="currentSlide?.kind !== 'combo'" class="menu-slide menu-slide--single" :class="`menu-slide--${currentSlide?.design || 'spotlight'}`">
          <div class="menu-slide__copy">
            <div class="menu-slide__kicker">{{ singleProduct?.category_name || 'Featured menu item' }}</div>
            <h1 class="menu-slide__title">{{ currentSlide?.headline || singleProduct?.title || storeName }}</h1>
            <p class="menu-slide__subtitle">
              {{ currentSlide?.subheadline || singleProduct?.description || 'Freshly prepared and ready for the next order.' }}
            </p>
            <div class="menu-slide__details">
              <span v-if="display.show_category && singleProduct?.category_name" class="menu-slide__pill">{{ singleProduct.category_name }}</span>
              <span v-if="singleProduct?.prep_time_minutes" class="menu-slide__pill">{{ singleProduct.prep_time_minutes }} min prep</span>
              <span v-if="display.show_prices && singleProduct?.price != null" class="menu-slide__price">{{ formatPrice(singleProduct.price) }}</span>
            </div>
          </div>

          <div class="menu-slide__visual">
            <img
              v-if="singleProductImage"
              :src="singleProductImage"
              :alt="singleProduct?.title || 'Featured product'"
              class="menu-slide__image"
            />
            <div v-else class="menu-slide__image menu-slide__image--placeholder">
              {{ singleProduct?.title || 'Menu item' }}
            </div>
          </div>
        </section>

        <section v-else class="menu-slide menu-slide--combo">
          <div class="menu-slide__copy menu-slide__copy--combo">
            <div class="menu-slide__kicker">Combo spotlight</div>
            <h1 class="menu-slide__title">{{ currentSlide?.headline || 'Different favourites, same delivery point' }}</h1>
            <p class="menu-slide__subtitle">
              {{ currentSlide?.subheadline || 'Perfect for friends ordering different items to the same location.' }}
            </p>
          </div>

          <div class="menu-slide__combo-grid">
            <article v-for="product in comboProducts" :key="product.id" class="combo-card">
              <img v-if="productImage(product)" :src="productImage(product) || ''" :alt="product.title || ''" class="combo-card__image" />
              <div v-else class="combo-card__image combo-card__image--placeholder">{{ product.title || 'Item' }}</div>
              <div class="combo-card__body">
                <div class="combo-card__title">{{ product.title || 'Untitled item' }}</div>
                <div v-if="display.show_category && product.category_name" class="combo-card__meta">{{ product.category_name }}</div>
                <div v-if="display.show_prices && product.price != null" class="combo-card__price">{{ formatPrice(product.price) }}</div>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer class="menu-display__footer">
        <div>{{ footerLine }}</div>
        <div>{{ storeContact }}</div>
      </footer>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { superAppApi, type MenuDisplayProduct, type MenuDisplayResponse, type MenuDisplaySlide } from '@/api/superApp'
import { resolveAssetUrl } from '@/utils/assetUrl'

const route = useRoute()

const loading = ref(false)
const error = ref('')
const payload = ref<MenuDisplayResponse | null>(null)
const currentIndex = ref(0)
let ticker: number | null = null

const slides = computed(() => Array.isArray(payload.value?.slides) ? payload.value?.slides ?? [] : [])
const currentSlide = computed<MenuDisplaySlide | null>(() => slides.value[currentIndex.value] ?? null)
const singleProduct = computed<MenuDisplayProduct | undefined>(() => currentSlide.value?.product)
const comboProducts = computed<MenuDisplayProduct[]>(() => Array.isArray(currentSlide.value?.products) ? currentSlide.value?.products ?? [] : [])
const display = computed(() => payload.value?.display ?? {})
const storeName = computed(() => payload.value?.store?.business_name || 'Kkoo menu')
const rotationSeconds = computed(() => Math.max(4, Number(display.value.rotation_seconds || 8)))
const singleProductImage = computed(() => productImage(singleProduct.value))
const footerLine = computed(() => {
  if (payload.value?.display?.headline) return payload.value.display.headline
  return payload.value?.display?.use_best_sellers ? 'Best sellers on repeat for the big screen.' : 'Curated one-product slides built for TV.'
})
const storeContact = computed(() => {
  const phone = payload.value?.store?.contact_phone?.trim()
  return phone || payload.value?.store?.opening_hours || 'Powered by Kkoo'
})

const screenStyle = computed(() => {
  const theme = payload.value?.storefront_theme ?? {}
  const image = resolveAssetUrl(
    String(display.value.background_image_url || theme.background_image_url || '')
  )
  const backgroundColor = String(display.value.background_color || theme.background_color || '#261338')
  const accentColor = String(display.value.accent_color || theme.accent_color || '#f0ddc7')
  const textColor = String(display.value.text_color || '#fdf7f0')
  const gradient = backgroundGradient(String(display.value.background_preset || 'editorial-plum'), backgroundColor)
  return {
    '--screen-accent': accentColor,
    '--screen-text': textColor,
    '--screen-surface': backgroundColor,
    background: image
      ? `linear-gradient(135deg, rgba(12, 8, 18, 0.35), rgba(12, 8, 18, 0.72)), url(${image}) center/cover no-repeat`
      : gradient,
  }
})

function productImage(product?: MenuDisplayProduct) {
  return resolveAssetUrl(product?.cover_image ?? '')
}

function backgroundGradient(preset: string, fallback: string) {
  switch (preset) {
    case 'chalk-cream':
      return 'linear-gradient(135deg, #f7eee1 0%, #e8d7c3 100%)'
    case 'midnight-luxe':
      return 'linear-gradient(135deg, #120a1f 0%, #2a1240 100%)'
    case 'sunset-market':
      return 'linear-gradient(135deg, #7b311c 0%, #d89055 100%)'
    default:
      return `linear-gradient(135deg, ${fallback} 0%, #4a226a 100%)`
  }
}

function startTicker() {
  stopTicker()
  if (slides.value.length <= 1) return
  ticker = window.setInterval(() => {
    currentIndex.value = (currentIndex.value + 1) % slides.value.length
  }, rotationSeconds.value * 1000)
}

function stopTicker() {
  if (ticker != null) {
    window.clearInterval(ticker)
    ticker = null
  }
}

function enterFullscreen() {
  const root = document.documentElement
  if (root.requestFullscreen) root.requestFullscreen().catch(() => {})
}

function formatPrice(price?: number) {
  if (typeof price !== 'number' || !Number.isFinite(price)) return ''
  return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', maximumFractionDigits: 0 }).format(price)
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const slugOrId = String(route.params.slugOrId || '').trim()
    const { data } = await superAppApi.getMenuDisplay(slugOrId)
    payload.value = data
    currentIndex.value = 0
  } catch (e: unknown) {
    error.value = (e as { message?: string }).message ?? 'Failed to load menu screen'
  } finally {
    loading.value = false
  }
}

watch(() => route.params.slugOrId, () => {
  load()
})

watch([slides, rotationSeconds], () => {
  startTicker()
}, { immediate: false })

onMounted(async () => {
  await load()
  startTicker()
})

onBeforeUnmount(() => {
  stopTicker()
})
</script>

<style scoped>
.menu-display {
  min-height: 100vh;
  color: var(--screen-text, #fdf7f0);
  display: flex;
  flex-direction: column;
  padding: clamp(1rem, 2.8vw, 2rem);
}

.menu-display__state {
  min-height: 100vh;
  display: grid;
  place-items: center;
  text-align: center;
}

.menu-display__topbar,
.menu-display__footer {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}

.menu-display__topbar {
  padding-bottom: 1rem;
}

.menu-display__footer {
  padding-top: 1rem;
  color: rgba(255, 248, 240, 0.78);
  font-size: 0.95rem;
}

.menu-display__eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.8rem;
  opacity: 0.72;
}

.menu-display__brand {
  font-size: clamp(1.2rem, 2vw, 1.6rem);
  font-weight: 700;
}

.menu-display__topbar-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.menu-display__badge,
.menu-display__action,
.menu-slide__pill {
  border: 1px solid rgba(255, 248, 240, 0.18);
  background: rgba(255, 248, 240, 0.08);
  color: inherit;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
}

.menu-display__action {
  cursor: pointer;
}

.menu-display__viewport {
  flex: 1;
  display: grid;
}

.menu-slide {
  min-height: 0;
  display: grid;
  align-items: stretch;
  gap: clamp(1rem, 3vw, 2rem);
}

.menu-slide--single {
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
}

.menu-slide--editorial .menu-slide__visual {
  align-self: center;
}

.menu-slide__copy {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(1rem, 2vw, 2rem) 0;
}

.menu-slide__copy--combo {
  max-width: 52rem;
}

.menu-slide__kicker {
  font-size: 0.9rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--screen-accent, #f0ddc7) 86%, white);
  margin-bottom: 1rem;
}

.menu-slide__title {
  font-size: clamp(2.6rem, 7vw, 6rem);
  line-height: 0.96;
  font-weight: 700;
  max-width: 11ch;
  margin-bottom: 1rem;
}

.menu-slide__subtitle {
  font-size: clamp(1rem, 1.8vw, 1.35rem);
  line-height: 1.45;
  max-width: 36rem;
  color: rgba(255, 248, 240, 0.84);
}

.menu-slide__details {
  display: flex;
  flex-wrap: wrap;
  gap: 0.85rem;
  margin-top: 1.4rem;
  align-items: center;
}

.menu-slide__price {
  font-size: clamp(1.25rem, 2.3vw, 2rem);
  font-weight: 700;
  color: color-mix(in srgb, var(--screen-accent, #f0ddc7) 82%, white);
}

.menu-slide__visual {
  display: grid;
  place-items: center;
}

.menu-slide__image {
  width: min(100%, 760px);
  aspect-ratio: 4 / 5;
  border-radius: 2.25rem;
  object-fit: cover;
  box-shadow: 0 24px 60px rgba(10, 6, 18, 0.35);
  background: rgba(255, 248, 240, 0.08);
}

.menu-slide__image--placeholder {
  display: grid;
  place-items: center;
  text-align: center;
  padding: 2rem;
  font-size: clamp(1.4rem, 2.4vw, 2rem);
}

.menu-slide--combo {
  grid-template-rows: auto minmax(0, 1fr);
}

.menu-slide__combo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
  align-items: stretch;
}

.combo-card {
  background: rgba(255, 248, 240, 0.08);
  border: 1px solid rgba(255, 248, 240, 0.12);
  border-radius: 1.8rem;
  overflow: hidden;
  backdrop-filter: blur(8px);
}

.combo-card__image {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  background: rgba(255, 248, 240, 0.08);
}

.combo-card__image--placeholder {
  display: grid;
  place-items: center;
  padding: 2rem;
}

.combo-card__body {
  padding: 1rem 1.1rem 1.2rem;
}

.combo-card__title {
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.15;
  margin-bottom: 0.4rem;
}

.combo-card__meta {
  color: rgba(255, 248, 240, 0.74);
  margin-bottom: 0.5rem;
}

.combo-card__price {
  font-size: 1.2rem;
  font-weight: 700;
  color: color-mix(in srgb, var(--screen-accent, #f0ddc7) 82%, white);
}

@media (max-width: 991.98px) {
  .menu-slide--single {
    grid-template-columns: 1fr;
  }

  .menu-slide__title {
    max-width: none;
  }
}

@media (max-width: 767.98px) {
  .menu-display__topbar,
  .menu-display__footer {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
