<template>
  <VerticalLayout>
    <b-card v-if="error" class="mb-0">
      <p class="text-danger mb-0">{{ error }}</p>
      <b-button variant="outline-secondary" class="mt-2" @click="goBack">Back</b-button>
    </b-card>
    <b-card v-else-if="!loaded" class="mb-0">
      <p class="text-muted mb-0">Loading product…</p>
    </b-card>
    <template v-else>
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" @click="goBack">
          {{ isSellerRoute ? 'Back to My Products' : 'Back to Products' }}
        </b-button>
        <b-button
          v-if="isSellerRoute && product.slug"
          variant="primary"
          size="sm"
          :to="{ name: 'seller.products.edit', params: { slug: product.slug } }"
        >
          Edit product
        </b-button>
        <b-button
          v-if="isAdminCatalogRoute && product.slug"
          variant="primary"
          size="sm"
          :to="{ name: 'admin.catalog.products.edit', params: { slug: product.slug } }"
        >
          Edit product
        </b-button>
      </div>
      <b-card :title="product.title || 'Product detail'" class="mb-0">
        <b-row>
          <b-col md="4" class="mb-3">
            <div v-if="imageSlides.length" class="product-detail-slider-wrap mb-3">
              <Swiper
                :modules="[Navigation, Pagination]"
                :navigation="{ nextEl: '.product-detail-slider-next', prevEl: '.product-detail-slider-prev' }"
                :pagination="{ clickable: true, el: '.product-detail-slider-pagination' }"
                :loop="imageSlides.length > 1"
                class="product-detail-swiper rounded"
              >
                <SwiperSlide v-for="(url, idx) in imageSlides" :key="idx">
                  <div class="product-detail-slide">
                    <img :src="url" :alt="`Image ${idx + 1}`" class="product-detail-slide-img" />
                  </div>
                </SwiperSlide>
                <div class="swiper-button-next product-detail-slider-next" aria-label="Next"></div>
                <div class="swiper-button-prev product-detail-slider-prev" aria-label="Previous"></div>
                <div class="swiper-pagination product-detail-slider-pagination"></div>
              </Swiper>
            </div>
            <p v-else class="text-muted">No images</p>
            <b-list-group v-if="product.verification_status" class="mb-2">
              <b-list-group-item>
                <strong>Status</strong>
                <b-badge
                  :variant="product.verification_status === 'approved' ? 'success' : product.verification_status === 'rejected' ? 'danger' : 'secondary'"
                  class="ms-2"
                >
                  {{ product.verification_status }}
                </b-badge>
              </b-list-group-item>
            </b-list-group>
          </b-col>
          <b-col md="8">
            <b-list-group class="mb-3">
              <b-list-group-item><strong>ID</strong> {{ product.id }}</b-list-group-item>
              <b-list-group-item><strong>Category</strong> {{ categoryDisplayFromProduct(product) }}</b-list-group-item>
              <b-list-group-item><strong>Brand</strong> {{ brandDisplayFromProduct(product) }}</b-list-group-item>
              <b-list-group-item><strong>Base price</strong> {{ formatPrice(product.base_price) }}</b-list-group-item>
              <b-list-group-item v-if="product.discount_price != null">
                <strong>Discount price</strong> {{ formatPrice(product.discount_price) }}
              </b-list-group-item>
              <b-list-group-item v-if="product.weight_kg != null"><strong>Weight</strong> {{ product.weight_kg }} kg</b-list-group-item>
              <b-list-group-item v-if="product.seller"><strong>Seller</strong> {{ product.seller }}</b-list-group-item>
            </b-list-group>
            <b-card-title tag="h6" class="mb-2">Description</b-card-title>
            <p class="text-muted mb-3">{{ product.description || '—' }}</p>
            <template v-if="product.specification && typeof product.specification === 'object' && Object.keys(product.specification).length">
              <b-card-title tag="h6" class="mb-2">Specification</b-card-title>
              <pre class="bg-light p-3 rounded small mb-3">{{ JSON.stringify(product.specification, null, 2) }}</pre>
            </template>
            <template v-if="product.dimensions">
              <b-card-title tag="h6" class="mb-2">Dimensions</b-card-title>
              <p class="text-muted mb-3">{{ product.dimensions }}</p>
            </template>
          </b-col>
        </b-row>
        <b-card-title tag="h6" class="mt-3 mb-2">SKUs</b-card-title>
        <b-table
          v-if="skus.length"
          :items="skus"
          :fields="skuFields"
          striped
          responsive
          small
        >
          <template #cell(variant_attributes)="data">
            {{ data.value && typeof data.value === 'object' ? JSON.stringify(data.value) : (data.value ?? '—') }}
          </template>
        </b-table>
        <p v-else class="text-muted">No SKUs.</p>
      </b-card>
    </template>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
import { Swiper, SwiperSlide } from 'swiper/vue'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { catalogAdminApi, catalogSellerApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { productCoverUrl, productImageUrls } from '@/utils/assetUrl'
import { sellerOwnsProduct } from '@/utils/catalogProductAccess'
import {
  brandDisplayFromProduct,
  categoryDisplayFromProduct,
} from '@/utils/catalogProductApi'
import { formatApiError } from '@/utils/formatApiError'

const route = useRoute()
const router = useRouter()
// Slug from params; fallback to last path segment when params are missing (e.g. direct URL load)
const slug = computed(() => {
  const p = route.params.slug
  if (p && typeof p === 'string' && p.trim()) return p.trim()
  const path = route.path
  const base = route.path.startsWith('/seller/') ? '/seller/products/' : '/admin/catalog/products/'
  if (path.startsWith(base) && path !== base && path !== base.replace(/\/$/, '')) {
    const segment = path.slice(base.length).split('/')[0]
    if (segment && segment !== 'create') return segment
  }
  return ''
})
const isAdminCatalogRoute = computed(() => route.name === 'admin.catalog.products.detail')
const loaded = ref(false)
const error = ref('')
const product = ref<Record<string, unknown>>({})

const isSellerRoute = computed(() => route.name === 'seller.products.detail' || route.path.startsWith('/seller/'))

const coverUrl = computed(() => productCoverUrl(product.value))
const imageSlides = computed(() => productImageUrls(product.value))

const skus = computed(() => {
  const s = product.value.skus
  if (Array.isArray(s)) return s as Record<string, unknown>[]
  if (s && typeof s === 'object' && 'results' in s) return (s as { results: unknown[] }).results as Record<string, unknown>[]
  return []
})

const skuFields = [
  { key: 'id', label: 'ID' },
  { key: 'sku_code', label: 'Code' },
  { key: 'stock_quantity', label: 'Stock' },
  { key: 'price_override', label: 'Price override' },
  { key: 'variant_attributes', label: 'Variants' },
]

function formatPrice(val: unknown): string {
  if (val == null) return '—'
  const n = Number(val)
  return isNaN(n) ? String(val) : n.toFixed(2)
}

function goBack() {
  if (isSellerRoute.value) router.push({ name: 'seller.products' })
  else router.push({ name: 'admin.catalog.products' })
}

async function loadProduct() {
  if (!slug.value) {
    error.value = 'Invalid product slug'
    loaded.value = false
    return
  }
  loaded.value = false
  error.value = ''
  try {
    const res = isAdminCatalogRoute.value
      ? await catalogAdminApi.getProductBySlug(slug.value)
      : await catalogSellerApi.getMyProductBySlug(slug.value)
    const data = (res.data ?? {}) as Record<string, unknown>
    const auth = useAuthStore()
    if (
      isSellerRoute.value &&
      !auth.isAdminOrStaff &&
      !sellerOwnsProduct(data, auth.user?.id)
    ) {
      error.value = t('catalog.productAccessDenied')
      loaded.value = false
      return
    }
    product.value = data
    loaded.value = true
  } catch (e: unknown) {
    loaded.value = false
    error.value = formatApiError(e, 'Failed to load product')
  }
}

onMounted(loadProduct)
watch(slug, loadProduct)
</script>

<style scoped>
.product-detail-slider-wrap {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--bs-border-color, #dee2e6);
  background: var(--bs-light, #f8f9fa);
  position: relative;
}
.product-detail-swiper {
  --swiper-navigation-size: 28px;
  min-height: 200px;
}
.product-detail-slide {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bs-light, #f8f9fa);
  min-height: 200px;
}
.product-detail-slide-img {
  width: 100%;
  max-height: 320px;
  object-fit: contain;
  display: block;
}
.product-detail-slider-next,
.product-detail-slider-prev {
  color: var(--bs-body-color, #212529);
}
.product-detail-slider-pagination :deep(.swiper-pagination-bullet-active) {
  background: var(--bs-primary, #5C308F);
}
</style>
