<template>
  <VerticalLayout>
    <div class="product-post">
      <header class="product-post__header">
        <p class="product-post__kind-banner">{{ addingBanner }}</p>
        <p class="product-post__kicker">
          {{ t('catalog.editProduct.stepKicker', { step, total: 3 }) }}
          · {{ kindShort }}
        </p>
        <h1 class="product-post__title">{{ stepTitle }}</h1>
        <p v-if="stepLede" class="product-post__lede">{{ stepLede }}</p>
        <div
          class="product-post__progress"
          role="progressbar"
          :aria-valuenow="stepProgress"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div class="product-post__bar">
            <div class="product-post__bar-fill" :style="{ width: `${stepProgress}%` }" />
          </div>
        </div>
        <nav class="product-post__dots" aria-label="Steps">
          <span
            v-for="dot in stepDots"
            :key="dot.n"
            class="product-post__dot"
            :class="{ 'product-post__dot--active': step === dot.n, 'product-post__dot--done': step > dot.n }"
          >
            {{ dot.label }}
          </span>
        </nav>
      </header>

      <p v-if="error" class="product-post__error">{{ error }}</p>
      <p v-else-if="!loaded" class="product-post__lede">{{ t('common.loading') }}</p>

      <template v-else>
        <!-- 1: Images -->
        <div v-show="step === 1" class="product-post__stage">
          <button
            v-if="!coverPreviewUrl"
            type="button"
            class="product-post__photo-empty"
            @click="triggerGallery"
            @dragover.prevent
            @drop.prevent="onDrop"
          >
            <span class="product-post__photo-icon" aria-hidden="true">
              <i class="bx bx-image-add" />
            </span>
            <strong>{{ t('catalog.addProduct.photoTitle') }}</strong>
            <span>{{ t('catalog.addProduct.photoHint') }}</span>
          </button>
          <div v-else class="product-post__photo-filled">
            <img :src="coverPreviewUrl" :alt="form.title || t('catalog.addProduct.photoTitle')" />
            <button type="button" class="product-post__photo-clear" @click="triggerGallery">
              {{ t('catalog.addProduct.changePhoto') }}
            </button>
          </div>

          <div class="product-post__photo-actions">
            <button type="button" class="product-post__chip" @click="triggerCamera">
              <i class="bx bx-camera" aria-hidden="true" />
              {{ t('catalog.addProduct.takePhoto') }}
            </button>
            <button type="button" class="product-post__chip" @click="triggerGallery">
              <i class="bx bx-images" aria-hidden="true" />
              {{ t('catalog.addProduct.fromGallery') }}
            </button>
          </div>
          <p class="product-post__cover-note">{{ t('catalog.addProduct.coverNote') }}</p>
          <input
            ref="cameraInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="d-none"
            @change="onCoverFileChange"
          />
          <input
            ref="galleryInput"
            type="file"
            accept="image/*"
            multiple
            class="d-none"
            @change="onCoverFileChange"
          />
        </div>

        <!-- 2: Details -->
        <div v-show="step === 2" class="product-post__fields">
          <label class="product-post__field">
            <span>{{ copy('nameLabel') }}</span>
            <input
              v-model="form.title"
              type="text"
              maxlength="160"
              :placeholder="copy('namePlaceholder')"
              autocomplete="off"
              inputmode="text"
            />
          </label>

          <label class="product-post__field">
            <span>{{ copy('captionLabel') }}</span>
            <textarea
              v-model="form.description"
              rows="4"
              maxlength="500"
              :placeholder="copy('captionPlaceholder')"
            />
          </label>

          <label class="product-post__field">
            <span>{{ t('catalog.addProduct.priceLabel') }}</span>
            <div class="product-post__price">
              <span class="product-post__currency">TZS</span>
              <input
                v-model="priceDisplay"
                type="text"
                inputmode="numeric"
                :placeholder="t('catalog.addProduct.pricePlaceholder')"
                @input="onPriceInput"
              />
            </div>
          </label>

          <label class="product-post__field">
            <span>{{ copy('optionsLabel') }}</span>
            <input
              v-model="form.optionsText"
              type="text"
              :placeholder="copy('optionsPlaceholder')"
              autocomplete="off"
            />
            <small>{{ t('catalog.addProduct.optionsHint') }}</small>
          </label>

          <label class="product-post__field">
            <span>{{ copy('weightLabel') }}</span>
            <input
              v-model="weightDisplay"
              type="text"
              inputmode="decimal"
              :placeholder="t('catalog.addProduct.weightPlaceholder')"
              @input="onWeightInput"
            />
            <small>{{ t('catalog.addProduct.weightHint') }}</small>
          </label>

          <button type="button" class="product-post__more-toggle" @click="showMore = !showMore">
            {{ showMore ? t('catalog.addProduct.hideMore') : t('catalog.addProduct.showMore') }}
            <i :class="showMore ? 'bx bx-chevron-up' : 'bx bx-chevron-down'" aria-hidden="true" />
          </button>

          <div v-if="showMore" class="product-post__more">
            <label class="product-post__field">
              <span>{{ t('catalog.addProduct.stockLabel') }}</span>
              <input v-model.number="form.stock" type="number" min="0" step="1" inputmode="numeric" />
            </label>
            <label class="product-post__check">
              <input v-model="form.available_on_marketplace" type="checkbox" />
              <span>{{ t('catalog.editProduct.showMarketplace') }}</span>
            </label>
            <label class="product-post__check">
              <input v-model="form.available_on_microsite" type="checkbox" />
              <span>{{ t('catalog.editProduct.showMicrosite') }}</span>
            </label>
          </div>
        </div>

        <!-- 3: Where buyers find it -->
        <div v-show="step === 3" class="product-post__fields">
          <p class="product-post__field-hint">{{ t('catalog.addProduct.categoryHint') }}</p>
          <CatalogCategoryPicker
            v-model="form.categories"
            :use-admin-categories="isAdmin"
          />
        </div>

        <p v-if="submitError" class="product-post__error">{{ submitError }}</p>

        <div class="product-post__actions">
          <button
            v-if="!isLastStep"
            type="button"
            class="product-post__cta"
            :disabled="!canAdvance"
            @click="nextStep"
          >
            {{ t('common.continue') }}
          </button>
          <template v-else>
            <button
              type="button"
              class="product-post__cta"
              :disabled="submitting || !canPublish"
              @click="submitProduct(false)"
            >
              {{ submitting ? t('catalog.editProduct.saving') : t('catalog.editProduct.save') }}
            </button>
            <button
              type="button"
              class="product-post__ghost"
              :disabled="submitting || !form.title.trim()"
              @click="submitProduct(true)"
            >
              {{ t('catalog.editProduct.saveDraft') }}
            </button>
          </template>
          <button v-if="step > 1" type="button" class="product-post__ghost" @click="prevStep">
            {{ t('common.back') }}
          </button>
        </div>

        <p class="product-post__foot">{{ t('catalog.addProduct.reviewNote') }}</p>
      </template>
    </div>

    <ImageUploadProgressBar
      :visible="imageUploadActive"
      :subtitle="t('catalog.addProduct.uploading')"
      :percent="imageUploadPercent"
      :pulse-striped="imageUploadPulse"
    />
  </VerticalLayout>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import CatalogCategoryPicker from '@/components/kkoo/CatalogCategoryPicker.vue'
import ImageUploadProgressBar from '@/components/ImageUploadProgressBar.vue'
import { catalogSellerApi, catalogAdminApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { sellerOwnsProduct } from '@/utils/catalogProductAccess'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { useMultipartUploadProgress } from '@/composables/useMultipartUploadProgress'
import { brandSlugFromProduct, categorySlugsFromProduct } from '@/utils/catalogProductApi'
import { formatApiError } from '@/utils/formatApiError'
import { parseVariantAttributes } from '@/utils/skuDisplay'
import { toastError, toastSuccess } from '@/utils/toast'
import { useProductListingKind } from '@/composables/useProductListingKind'

const DEFAULT_STOCK = 99
const { t } = useI18n()
const { copy, addingBanner, kindShort } = useProductListingKind()
const router = useRouter()
const route = useRoute()
const slugParam = computed(() => (route.params.slug as string) || '')
const isAdmin = computed(() => route.path.startsWith('/admin/catalog'))

const loaded = ref(false)
const error = ref('')
const submitError = ref('')
const submitting = ref(false)
const showMore = ref(false)
const step = ref(1)
const priceDisplay = ref('')
const weightDisplay = ref('')
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const galleryUrlByFile = new WeakMap<File, string>()
let coverObjectUrl: string | null = null

const {
  uploadActive: imageUploadActive,
  uploadPercent: imageUploadPercent,
  uploadPulse: imageUploadPulse,
  beginUpload: beginImageUpload,
  onUploadProgress: onImageUploadProgress,
  endUpload: endImageUpload,
} = useMultipartUploadProgress()

const form = reactive({
  title: '',
  description: '',
  categories: [] as string[],
  brand: '',
  course_type: '',
  base_price: 0 as number,
  discount_price: null as number | null,
  weight_kg: null as number | null,
  available_on_marketplace: true,
  available_on_microsite: true,
  allow_preorder: false,
  preorder_requires_stock: false,
  preorder_eta: '',
  preorder_note: '',
  requires_prescription: false,
  optionsText: '',
  stock: DEFAULT_STOCK,
  cover_image: '',
  cover_file: null as File | null,
  gallery_files: [] as File[],
  existingSkus: [] as Array<{
    sku_code: string
    stock_quantity: number
    price_override?: number | null
    variant_attributes?: Record<string, string>
  }>,
})

const hasCover = computed(() => !!form.cover_file || !!form.cover_image?.trim())
const TOTAL_STEPS = 3
const stepProgress = computed(() => Math.round((step.value / TOTAL_STEPS) * 100))
const isLastStep = computed(() => step.value >= TOTAL_STEPS)

const stepDots = computed(() => [
  { n: 1, label: t('catalog.addProduct.stepDot1') },
  { n: 2, label: t('catalog.addProduct.stepDot2') },
  { n: 3, label: t('catalog.addProduct.stepDot3') },
])

const stepTitle = computed(() => {
  if (step.value === 1) return copy('step1Title')
  if (step.value === 2) return copy('step2Title')
  return t('catalog.editProduct.step3Title')
})

const stepLede = computed(() => {
  if (step.value === 1) return copy('step1Lede')
  if (step.value === 2) return copy('step2Lede')
  return t('catalog.addProduct.step3Lede')
})

const canAdvance = computed(() => {
  if (step.value === 1) return hasCover.value
  if (step.value === 2) return !!form.title.trim() && Number(form.base_price) > 0
  if (step.value === 3) return form.categories.length > 0
  return true
})

const canPublish = computed(() => {
  return !!form.title.trim() && Number(form.base_price) > 0 && hasCover.value && form.categories.length > 0
})

const coverPreviewUrl = ref('')

watch(
  () => [form.cover_file, form.cover_image] as const,
  () => {
    if (coverObjectUrl) {
      URL.revokeObjectURL(coverObjectUrl)
      coverObjectUrl = null
    }
    if (form.cover_file) {
      coverObjectUrl = URL.createObjectURL(form.cover_file)
      coverPreviewUrl.value = coverObjectUrl
    } else {
      coverPreviewUrl.value = resolveAssetUrl(form.cover_image || '') ?? ''
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('paste', onPasteImage)
  if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl)
  for (const file of form.gallery_files) {
    const url = galleryUrlByFile.get(file)
    if (url) URL.revokeObjectURL(url)
  }
})

function formatPriceDisplay(n: number): string {
  if (!Number.isFinite(n) || n <= 0) return ''
  return n.toLocaleString('en-TZ')
}

function onPriceInput(ev: Event) {
  const raw = (ev.target as HTMLInputElement).value.replace(/[^\d]/g, '')
  const n = raw ? Number(raw) : 0
  form.base_price = n
  priceDisplay.value = raw ? formatPriceDisplay(n) : ''
}

function onWeightInput(ev: Event) {
  const raw = (ev.target as HTMLInputElement).value.trim().replace(',', '.')
  weightDisplay.value = raw
  if (!raw) {
    form.weight_kg = null
    return
  }
  const n = Number(raw)
  form.weight_kg = Number.isFinite(n) && n > 0 ? n : null
}

function nextStep() {
  if (!canAdvance.value || isLastStep.value) return
  step.value = Math.min(TOTAL_STEPS, step.value + 1)
}

function prevStep() {
  step.value = Math.max(1, step.value - 1)
}

function triggerCamera() {
  cameraInput.value?.click()
}
function triggerGallery() {
  galleryInput.value?.click()
}

function setCoverFile(file: File | null) {
  form.cover_file = file
  if (file) form.cover_image = ''
}

function onCoverFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  if (files.length) {
    setCoverFile(files[0])
    if (files.length > 1) form.gallery_files.push(...files.slice(1))
  }
  input.value = ''
}

function onDrop(ev: DragEvent) {
  const file = ev.dataTransfer?.files?.[0]
  if (file?.type.startsWith('image/')) setCoverFile(file)
}

function onPasteImage(ev: ClipboardEvent) {
  const item = Array.from(ev.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (!file) return
  ev.preventDefault()
  setCoverFile(file)
}

function optionValues(): string[] {
  return form.optionsText
    .split(/[,/|]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12)
}

function caption(): string {
  const desc = form.description.trim()
  return desc || form.title.trim()
}

function buildSkus() {
  const stock = Math.max(0, Number(form.stock) || 0)
  const options = optionValues()
  if (options.length > 0) {
    return options.map((opt) => ({
      stock_quantity: stock || DEFAULT_STOCK,
      variant_attributes: { option: opt },
    }))
  }
  if (form.existingSkus.length) {
    return form.existingSkus.map((s) => ({
      sku_code: s.sku_code,
      stock_quantity: stock,
      price_override: s.price_override ?? null,
      variant_attributes: s.variant_attributes || {},
    }))
  }
  return [{ stock_quantity: stock || DEFAULT_STOCK, variant_attributes: {} }]
}

function buildPayload(asDraft: boolean): Record<string, unknown> {
  return {
    title: form.title.trim(),
    description: caption(),
    category_slugs: [...form.categories],
    brand: form.brand || undefined,
    course_type: form.course_type || undefined,
    base_price: Number(form.base_price) || 0,
    discount_price: form.discount_price,
    weight_kg: form.weight_kg ?? undefined,
    available_on_marketplace: form.available_on_marketplace,
    available_on_microsite: form.available_on_microsite,
    allow_preorder: form.allow_preorder,
    preorder_requires_stock: form.preorder_requires_stock,
    preorder_note: form.allow_preorder ? form.preorder_note || undefined : '',
    preorder_eta: form.allow_preorder && form.preorder_eta ? form.preorder_eta : '',
    requires_prescription: form.requires_prescription,
    skus: buildSkus(),
    status: asDraft ? 'draft' : 'published',
    ...(form.cover_image?.trim() && !form.cover_file ? { cover_image: form.cover_image.trim() } : {}),
  }
}

function validateBeforeSubmit(asDraft: boolean): string | null {
  if (!form.title.trim()) return t('catalog.addProduct.needName')
  if (form.title.trim().length > 160) return t('catalog.addProduct.nameTooLong')
  const price = Number(form.base_price)
  if (!asDraft && (!Number.isFinite(price) || price <= 0)) return t('catalog.addProduct.needPrice')
  if (!asDraft && !hasCover.value) return t('catalog.addProduct.needPhoto')
  if (!asDraft && !form.categories.length) return t('catalog.addProduct.needCategory')
  return null
}

async function submitProduct(asDraft: boolean) {
  if (submitting.value) return
  submitError.value = ''
  const slug = slugParam.value
  if (!slug) {
    submitError.value = 'Invalid product'
    return
  }
  const validationError = validateBeforeSubmit(asDraft)
  if (validationError) {
    submitError.value = validationError
    toastError(validationError)
    return
  }

  const payload = buildPayload(asDraft)
  submitting.value = true
  try {
    if (form.cover_file || form.gallery_files.length) {
      const fd = new FormData()
      fd.append('title', String(payload.title))
      fd.append('description', String(payload.description))
      fd.append('base_price', String(payload.base_price))
      fd.append('status', asDraft ? 'draft' : 'published')
      fd.append('skus', JSON.stringify(payload.skus || []))
      fd.append('available_on_marketplace', form.available_on_marketplace ? 'true' : 'false')
      fd.append('available_on_microsite', form.available_on_microsite ? 'true' : 'false')
      fd.append('allow_preorder', form.allow_preorder ? 'true' : 'false')
      fd.append('preorder_requires_stock', form.preorder_requires_stock ? 'true' : 'false')
      fd.append('requires_prescription', form.requires_prescription ? 'true' : 'false')
      if (form.categories?.length) fd.append('category_slugs', JSON.stringify(form.categories))
      if (form.brand) fd.append('brand', form.brand)
      if (form.course_type) fd.append('course_type', form.course_type)
      if (form.cover_file) fd.append('cover_image', form.cover_file)
      else if (form.gallery_files.length) fd.append('cover_image', form.gallery_files[0])
      form.gallery_files.forEach((file, i) => {
        if (form.cover_file) fd.append('images', file)
        else if (i > 0) fd.append('images', file)
      })
      beginImageUpload()
      try {
        if (isAdmin.value) await catalogAdminApi.updateProductWithCover(slug, fd, { onUploadProgress: onImageUploadProgress })
        else await catalogSellerApi.updateProductWithCover(slug, fd, { onUploadProgress: onImageUploadProgress })
      } finally {
        endImageUpload()
      }
    } else {
      if (isAdmin.value) await catalogAdminApi.updateProduct(slug, payload)
      else await catalogSellerApi.updateProduct(slug, payload)
    }
    toastSuccess(asDraft ? t('catalog.editProduct.draftSaved') : t('catalog.editProduct.updated'))
    await router.push(isAdmin.value ? { name: 'admin.catalog.products' } : { name: 'seller.products' })
  } catch (e: unknown) {
    submitError.value = formatApiError(e, t('catalog.editProduct.saveFailed'))
    toastError(submitError.value)
  } finally {
    submitting.value = false
  }
}

function parseExistingSkus(skus: unknown) {
  if (!Array.isArray(skus)) return []
  return skus.map((s: Record<string, unknown>) => {
    const va = parseVariantAttributes(s.variant_attributes)
    return {
      sku_code: String(s.sku_code ?? ''),
      stock_quantity: Number(s.stock_quantity ?? 0),
      price_override: s.price_override != null ? Number(s.price_override) : null,
      variant_attributes: va,
    }
  })
}

function optionsTextFromSkus(
  skus: Array<{ variant_attributes?: Record<string, string> }>,
): string {
  const opts = skus
    .map((s) => s.variant_attributes?.option || s.variant_attributes?.size || s.variant_attributes?.color || '')
    .map((s) => s.trim())
    .filter(Boolean)
  return [...new Set(opts)].join(', ')
}

onMounted(async () => {
  window.addEventListener('paste', onPasteImage)
  if (!slugParam.value) {
    error.value = 'Invalid product'
    return
  }
  try {
    const res = isAdmin.value
      ? await catalogAdminApi.getProductBySlug(slugParam.value)
      : await catalogSellerApi.getMyProductBySlug(slugParam.value)
    const d = res.data as Record<string, unknown>
    const auth = useAuthStore()
    if (!isAdmin.value && !sellerOwnsProduct(d, auth.user?.id)) {
      error.value = t('catalog.productAccessDenied')
      await router.push({ name: 'seller.products' })
      return
    }
    form.title = String(d.title ?? '')
    form.description = String(d.description ?? '')
    form.categories = categorySlugsFromProduct(d)
    form.brand = brandSlugFromProduct(d)
    form.course_type = String(d.course_type ?? '')
    form.base_price = Number(d.base_price ?? 0)
    form.discount_price = d.discount_price != null ? Number(d.discount_price) : null
    form.weight_kg = d.weight_kg != null ? Number(d.weight_kg) : null
    weightDisplay.value = form.weight_kg != null ? String(form.weight_kg) : ''
    form.available_on_marketplace = d.available_on_marketplace !== false
    form.available_on_microsite = d.available_on_microsite !== false
    form.allow_preorder = Boolean(d.allow_preorder)
    form.preorder_requires_stock = Boolean(d.preorder_requires_stock)
    form.preorder_note = String(d.preorder_note ?? '')
    form.preorder_eta = d.preorder_eta ? String(d.preorder_eta).slice(0, 10) : ''
    form.requires_prescription = Boolean(d.requires_prescription)
    const images = d.images as string[] | undefined
    const cover = (d.cover_image ?? d.image ?? d.thumbnail ?? d.cover ?? images?.[0]) as string | undefined
    form.cover_image = cover ?? ''
    form.existingSkus = parseExistingSkus(d.skus)
    form.stock = form.existingSkus[0]?.stock_quantity ?? DEFAULT_STOCK
    form.optionsText = optionsTextFromSkus(form.existingSkus)
    priceDisplay.value = formatPriceDisplay(form.base_price)
    loaded.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load product')
  }
})
</script>

<style scoped>
.product-post {
  max-width: 32rem;
  margin: 0 auto;
  padding: 0 0 var(--kkoo-spacing-2xl, 3.4rem);
}
.product-post__header {
  margin-bottom: var(--kkoo-spacing-lg, 1.3rem);
}
.product-post__kind-banner {
  display: inline-flex;
  align-items: center;
  margin: 0 0 0.55rem;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: rgba(92, 48, 143, 0.1);
  color: var(--kkoo-primary, #5c308f);
  font-size: 0.85rem;
  font-weight: 700;
}
.product-post__kicker {
  margin: 0 0 0.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--kkoo-primary, #5c308f);
}
.product-post__title {
  margin: 0 0 0.35rem;
  font-family: var(--kkoo-font-display, Poppins, sans-serif);
  font-size: 1.75rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--kkoo-text-dark, #111827);
}
.product-post__lede {
  margin: 0;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.95rem;
  line-height: 1.45;
}
.product-post__progress {
  display: block;
  margin-top: var(--kkoo-spacing-md, 0.8rem);
}
.product-post__dots {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.75rem;
}
.product-post__dot {
  min-height: 36px;
  padding: 0.3rem 0.75rem;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: 999px;
  background: #fff;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.8rem;
  font-weight: 600;
}
.product-post__dot--active {
  background: var(--kkoo-primary, #5c308f);
  border-color: var(--kkoo-primary, #5c308f);
  color: #fff;
}
.product-post__dot--done:not(.product-post__dot--active) {
  border-color: rgba(92, 48, 143, 0.35);
  color: var(--kkoo-primary, #5c308f);
}
.product-post__field-hint {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--kkoo-text-muted, #6a4c86);
}
.product-post__bar {
  height: 0.4rem;
  border-radius: 999px;
  background: rgba(92, 48, 143, 0.12);
  overflow: hidden;
}
.product-post__bar-fill {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #5c308f, #f7a829);
  transition: width 0.35s ease;
}
.product-post__stage {
  margin: var(--kkoo-spacing-lg, 1.3rem) 0;
}
.product-post__cover-note {
  margin: 0.65rem 0 0;
  font-size: 0.8rem;
  color: var(--kkoo-text-muted, #6a4c86);
}
.product-post__photo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  width: 100%;
  min-height: 16rem;
  padding: 1.5rem;
  border: 2px dashed rgba(92, 48, 143, 0.28);
  border-radius: var(--kkoo-radius-lg, 21px);
  background:
    linear-gradient(180deg, rgba(248, 242, 236, 0.9), #fff 55%),
    radial-gradient(circle at 20% 0%, rgba(247, 168, 41, 0.18), transparent 42%);
  color: var(--kkoo-primary, #5c308f);
  text-align: center;
  cursor: pointer;
}
.product-post__photo-empty strong {
  font-size: 1.05rem;
}
.product-post__photo-empty span:last-child {
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.875rem;
}
.product-post__photo-icon {
  font-size: 2.25rem;
  line-height: 1;
}
.product-post__photo-filled {
  position: relative;
  overflow: hidden;
  border-radius: var(--kkoo-radius-lg, 21px);
  background: #111;
  aspect-ratio: 1;
}
.product-post__photo-filled img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.product-post__photo-clear {
  position: absolute;
  right: 0.75rem;
  bottom: 0.75rem;
  min-height: 44px;
  padding: 0.5rem 0.9rem;
  border: 0;
  border-radius: 999px;
  background: rgba(17, 24, 39, 0.78);
  color: #fff;
  font-weight: 600;
  font-size: 0.85rem;
}
.product-post__photo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
}
.product-post__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.45rem 0.9rem;
  border: 1px solid rgba(92, 48, 143, 0.18);
  border-radius: 999px;
  background: #fff;
  color: var(--kkoo-primary, #5c308f);
  font-weight: 600;
  font-size: 0.9rem;
  cursor: pointer;
}
.product-post__fields {
  margin-bottom: 0.5rem;
}
.product-post__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin-bottom: 1rem;
}
.product-post__field > span:first-child {
  font-weight: 600;
  font-size: 0.9rem;
  color: var(--kkoo-text-dark, #111827);
}
.product-post__field input,
.product-post__field textarea {
  width: 100%;
  min-height: 48px;
  padding: 0.7rem 0.9rem;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: var(--kkoo-radius-md, 13px);
  background: #fff;
  font-size: 1rem;
}
.product-post__field textarea {
  min-height: 5.5rem;
  resize: vertical;
}
.product-post__field input:focus,
.product-post__field textarea:focus {
  outline: 2px solid var(--kkoo-primary, #5c308f);
  outline-offset: 1px;
  border-color: transparent;
}
.product-post__field small {
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.8rem;
}
.product-post__price {
  display: flex;
  align-items: stretch;
  border: 1px solid rgba(92, 48, 143, 0.16);
  border-radius: var(--kkoo-radius-md, 13px);
  background: #fff;
  overflow: hidden;
}
.product-post__price input {
  border: 0;
  border-radius: 0;
  min-height: 48px;
  flex: 1;
}
.product-post__price input:focus {
  outline: none;
}
.product-post__price:focus-within {
  outline: 2px solid var(--kkoo-primary, #5c308f);
  outline-offset: 1px;
  border-color: transparent;
}
.product-post__currency {
  display: flex;
  align-items: center;
  padding: 0 0.85rem;
  background: var(--kkoo-canvas, #f8f2ec);
  color: var(--kkoo-primary, #5c308f);
  font-weight: 700;
  font-size: 0.85rem;
}
.product-post__more-toggle {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0.25rem 0 1rem;
  padding: 0;
  border: 0;
  background: none;
  color: var(--kkoo-primary, #5c308f);
  font-weight: 600;
  min-height: 44px;
}
.product-post__more {
  padding-top: 0.25rem;
}
.product-post__check {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  margin-bottom: 0.75rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--kkoo-text-dark, #111827);
}
.product-post__error {
  color: #b42318;
  font-size: 0.9rem;
  margin: 0 0 0.75rem;
}
.product-post__actions {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.product-post__cta,
.product-post__ghost {
  min-height: 48px;
  border-radius: var(--kkoo-radius-md, 13px);
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
}
.product-post__cta {
  border: 0;
  background: var(--kkoo-primary, #5c308f);
  color: #fff;
  box-shadow: var(--kkoo-shadow-primary, 0 2px 10px rgba(92, 48, 143, 0.22));
}
.product-post__cta:disabled {
  background: #9b86b5;
  box-shadow: none;
  cursor: not-allowed;
}
.product-post__ghost {
  border: 1px solid rgba(92, 48, 143, 0.2);
  background: transparent;
  color: var(--kkoo-primary, #5c308f);
}
.product-post__foot {
  margin: 0.85rem 0 0;
  text-align: center;
  color: var(--kkoo-text-muted, #6a4c86);
  font-size: 0.8rem;
}
.product-post__chip:focus-visible,
.product-post__photo-empty:focus-visible,
.product-post__cta:focus-visible,
.product-post__ghost:focus-visible,
.product-post__more-toggle:focus-visible {
  outline: 2px solid var(--kkoo-primary, #5c308f);
  outline-offset: 2px;
}
.product-post__chip i {
  font-size: 1.15rem;
}
</style>
