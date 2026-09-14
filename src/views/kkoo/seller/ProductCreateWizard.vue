<template>
  <VerticalLayout>
    <div class="product-post">
      <header class="product-post__header">
        <p class="product-post__kind-banner">{{ addingBanner }}</p>
        <p class="product-post__kicker">
          {{ t('catalog.addProduct.stepKicker', { step, total: TOTAL_STEPS }) }}
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
          <button
            v-for="dot in stepDots"
            :key="dot.n"
            type="button"
            class="product-post__dot"
            :class="{ 'product-post__dot--active': step === dot.n, 'product-post__dot--done': step > dot.n }"
            :disabled="dot.n > step && !canJumpTo(dot.n)"
            @click="jumpTo(dot.n)"
          >
            {{ dot.label }}
          </button>
        </nav>
      </header>

      <div v-if="showResumePrompt" class="product-post__resume">
        <p>{{ t('catalog.addProduct.resumePrompt') }}</p>
        <div class="product-post__resume-actions">
          <button type="button" class="product-post__chip" @click="applyDraft">
            {{ t('catalog.addProduct.resumeContinue') }}
          </button>
          <button type="button" class="product-post__resume-dismiss" @click="dismissDraft">
            {{ t('catalog.addProduct.resumeDismiss') }}
          </button>
        </div>
      </div>

      <!-- 1: Pictures -->
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
          <strong>{{ copy('photoTitle') }}</strong>
          <span>{{ copy('photoHint') }}</span>
        </button>
        <div v-else class="product-post__photo-filled">
          <img :src="coverPreviewUrl" :alt="form.title || t('catalog.addProduct.photoTitle')" />
          <button type="button" class="product-post__photo-clear" @click="triggerGallery">
            {{ t('catalog.addProduct.addMorePhotos') }}
          </button>
        </div>

        <div v-if="photoStrip.length" class="product-post__strip" role="list">
          <div
            v-for="(item, idx) in photoStrip"
            :key="item.key"
            class="product-post__thumb"
            :class="{ 'product-post__thumb--cover': item.isCover }"
            role="listitem"
          >
            <button type="button" class="product-post__thumb-btn" @click="makeCover(idx)">
              <img :src="item.url" alt="" />
              <span v-if="item.isCover" class="product-post__thumb-badge">{{ t('catalog.addProduct.coverBadge') }}</span>
            </button>
            <button
              type="button"
              class="product-post__thumb-remove"
              :aria-label="t('catalog.addProduct.removePhoto')"
              @click="removePhoto(idx)"
            >
              ×
            </button>
          </div>
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
            <input v-model.number="form.stock" type="number" min="1" step="1" inputmode="numeric" />
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

      <p v-if="savedHint === 'saved'" class="product-post__saved">
        <i class="bx bx-check" aria-hidden="true" />
        {{ t('catalog.addProduct.autosaved') }}
      </p>
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
            {{ submitting ? t('catalog.addProduct.saving') : copy('post') }}
          </button>
          <button
            type="button"
            class="product-post__ghost"
            :disabled="submitting || !form.title.trim()"
            @click="submitProduct(true)"
          >
            {{ t('catalog.addProduct.saveLater') }}
          </button>
        </template>
        <button v-if="step > 1" type="button" class="product-post__ghost" @click="prevStep">
          {{ t('common.back') }}
        </button>
      </div>

      <p class="product-post__foot">{{ t('catalog.addProduct.reviewNote') }}</p>
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
import { useMultipartUploadProgress } from '@/composables/useMultipartUploadProgress'
import { useProductDraftAutosave } from '@/composables/useProductDraftAutosave'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'
import { useProductListingKind } from '@/composables/useProductListingKind'

const TOTAL_STEPS = 3
const DEFAULT_STOCK = 99

const { t } = useI18n()
const { copy, addingBanner, kindShort } = useProductListingKind()
const router = useRouter()
const route = useRoute()
const isAdmin = computed(() => route.path.startsWith('/admin/catalog'))
const submitError = ref('')
const submitting = ref(false)
const showMore = ref(false)
const step = ref(1)
const showResumePrompt = ref(false)
const priceDisplay = ref('')
const weightDisplay = ref('')
const cameraInput = ref<HTMLInputElement | null>(null)
const galleryInput = ref<HTMLInputElement | null>(null)
const galleryUrlByFile = new WeakMap<File, string>()
let coverObjectUrl: string | null = null
let pendingDraft: ReturnType<typeof loadDraft> | null = null

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
  base_price: '' as number | string,
  optionsText: '',
  stock: DEFAULT_STOCK,
  weight_kg: null as number | null,
  cover_file: null as File | null,
  gallery_files: [] as File[],
})

const { savedHint, loadDraft, clearDraft } = useProductDraftAutosave(form, step)

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
  return t('catalog.addProduct.step3Title')
})

const stepLede = computed(() => {
  if (step.value === 1) return copy('step1Lede')
  if (step.value === 2) return copy('step2Lede')
  return t('catalog.addProduct.step3Lede')
})

const canAdvance = computed(() => {
  if (step.value === 1) return !!form.cover_file
  if (step.value === 2) return !!form.title.trim() && Number(form.base_price) > 0
  if (step.value === 3) return form.categories.length > 0
  return true
})

const canPublish = computed(() => {
  return !!form.title.trim() && Number(form.base_price) > 0 && !!form.cover_file && form.categories.length > 0
})

const coverPreviewUrl = ref('')

type PhotoStripItem = { key: string; file: File; url: string; isCover: boolean }
const photoStrip = computed<PhotoStripItem[]>(() => {
  const items: PhotoStripItem[] = []
  if (form.cover_file) {
    items.push({
      key: `cover-${form.cover_file.name}-${form.cover_file.size}`,
      file: form.cover_file,
      url: coverPreviewUrl.value,
      isCover: true,
    })
  }
  form.gallery_files.forEach((file, i) => {
    let url = galleryUrlByFile.get(file)
    if (!url) {
      url = URL.createObjectURL(file)
      galleryUrlByFile.set(file, url)
    }
    items.push({
      key: `g-${i}-${file.name}-${file.size}`,
      file,
      url,
      isCover: false,
    })
  })
  return items
})

watch(
  () => form.cover_file,
  (file) => {
    if (coverObjectUrl) {
      URL.revokeObjectURL(coverObjectUrl)
      coverObjectUrl = null
    }
    if (file) {
      coverObjectUrl = URL.createObjectURL(file)
      coverPreviewUrl.value = coverObjectUrl
    } else {
      coverPreviewUrl.value = ''
    }
  }
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

function parsePriceInput(raw: string): number {
  const digits = raw.replace(/[^\d]/g, '')
  return digits ? Number(digits) : 0
}

function onPriceInput(ev: Event) {
  const val = (ev.target as HTMLInputElement).value
  const n = parsePriceInput(val)
  form.base_price = n
  priceDisplay.value = n > 0 ? formatPriceDisplay(n) : val.replace(/[^\d,]/g, '')
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

function canJumpTo(n: number) {
  if (n <= step.value) return true
  if (n === 2) return !!form.cover_file
  if (n === 3) return !!form.cover_file && !!form.title.trim() && Number(form.base_price) > 0
  return false
}

function jumpTo(n: number) {
  if (!canJumpTo(n)) return
  step.value = n
}

function nextStep() {
  if (!canAdvance.value || isLastStep.value) return
  if (step.value < TOTAL_STEPS) step.value += 1
}

function prevStep() {
  if (step.value > 1) step.value -= 1
}

function triggerCamera() {
  cameraInput.value?.click()
}
function triggerGallery() {
  galleryInput.value?.click()
}

function setCoverFile(file: File | null) {
  form.cover_file = file
}

function onCoverFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files ? Array.from(input.files).filter((f) => f.type.startsWith('image/')) : []
  if (files.length) {
    if (!form.cover_file) {
      setCoverFile(files[0])
      if (files.length > 1) form.gallery_files.push(...files.slice(1))
    } else {
      form.gallery_files.push(...files)
    }
  }
  input.value = ''
}

function makeCover(idx: number) {
  const item = photoStrip.value[idx]
  if (!item || item.isCover) return
  const prevCover = form.cover_file
  form.gallery_files = form.gallery_files.filter((f) => f !== item.file)
  setCoverFile(item.file)
  if (prevCover) form.gallery_files.unshift(prevCover)
}

function removePhoto(idx: number) {
  const item = photoStrip.value[idx]
  if (!item) return
  if (item.isCover) {
    const next = form.gallery_files.shift() || null
    if (item.url && item.url === coverObjectUrl) {
      /* watch will revoke */
    }
    setCoverFile(next)
  } else {
    const url = galleryUrlByFile.get(item.file)
    if (url) URL.revokeObjectURL(url)
    form.gallery_files = form.gallery_files.filter((f) => f !== item.file)
  }
}

function onDrop(ev: DragEvent) {
  const files = Array.from(ev.dataTransfer?.files ?? []).filter((f) => f.type.startsWith('image/'))
  if (!files.length) return
  if (!form.cover_file) {
    setCoverFile(files[0])
    if (files.length > 1) form.gallery_files.push(...files.slice(1))
  } else {
    form.gallery_files.push(...files)
  }
}

function onPasteImage(ev: ClipboardEvent) {
  const item = Array.from(ev.clipboardData?.items ?? []).find((i) => i.type.startsWith('image/'))
  const file = item?.getAsFile()
  if (!file) return
  ev.preventDefault()
  if (!form.cover_file) setCoverFile(file)
  else form.gallery_files.push(file)
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

function buildPayload(asDraft: boolean): Record<string, unknown> {
  const stock = Math.max(1, Number(form.stock) || DEFAULT_STOCK)
  const options = optionValues()
  const skus =
    options.length > 0
      ? options.map((opt) => ({
          stock_quantity: stock,
          variant_attributes: { option: opt },
        }))
      : [{ stock_quantity: stock, variant_attributes: {} }]
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    description: caption(),
    category_slugs: [...form.categories],
    base_price: Number(form.base_price) || 0,
    skus,
    status: asDraft ? 'draft' : 'published',
    available_on_marketplace: true,
    available_on_microsite: true,
  }
  if (form.weight_kg != null && form.weight_kg > 0) payload.weight_kg = form.weight_kg
  return payload
}

function validateBeforeSubmit(asDraft: boolean): string | null {
  if (!form.title.trim()) return t('catalog.addProduct.needName')
  if (form.title.trim().length > 160) return t('catalog.addProduct.nameTooLong')
  const price = Number(form.base_price)
  if (!asDraft && (!Number.isFinite(price) || price <= 0)) return t('catalog.addProduct.needPrice')
  if (!asDraft && !form.cover_file) return t('catalog.addProduct.needPhoto')
  if (!asDraft && !form.categories.length) return t('catalog.addProduct.needCategory')
  return null
}

async function submitProduct(asDraft: boolean) {
  if (submitting.value) return
  submitError.value = ''
  const validationError = validateBeforeSubmit(asDraft)
  if (validationError) {
    submitError.value = validationError
    toastError(validationError)
    return
  }
  const payload = buildPayload(asDraft)
  submitting.value = true
  try {
    const createRes = isAdmin.value
      ? await catalogAdminApi.createProduct(payload)
      : await catalogSellerApi.createProduct(payload)
    const data = (createRes.data ?? {}) as Record<string, unknown>
    const createdSlug = data.slug ? String(data.slug) : null
    if (!createdSlug) {
      throw new Error(t('catalog.addProduct.noSlug'))
    }
    const hasImages = form.cover_file || form.gallery_files.length
    if (hasImages) {
      const fd = new FormData()
      fd.append('title', form.title.trim())
      fd.append('description', caption())
      fd.append('base_price', String(payload.base_price))
      fd.append('status', asDraft ? 'draft' : 'published')
      if (form.categories?.length) {
        fd.append('category_slugs', JSON.stringify(form.categories))
      }
      if (form.weight_kg != null && form.weight_kg > 0) {
        fd.append('weight_kg', String(form.weight_kg))
      }
      if (form.cover_file) fd.append('cover_image', form.cover_file)
      else if (form.gallery_files.length) fd.append('cover_image', form.gallery_files[0])
      form.gallery_files.forEach((file, i) => {
        if (form.cover_file) fd.append('images', file)
        else if (i > 0) fd.append('images', file)
      })
      beginImageUpload()
      try {
        if (isAdmin.value) {
          await catalogAdminApi.updateProductWithCover(createdSlug, fd, { onUploadProgress: onImageUploadProgress })
        } else {
          await catalogSellerApi.updateProductWithCover(createdSlug, fd, { onUploadProgress: onImageUploadProgress })
        }
      } catch (imgErr: unknown) {
        toastError(formatApiError(imgErr, t('catalog.addProduct.imageFailed')))
        clearDraft()
        // Product exists without images — open edit so the seller can retry upload.
        await router.push(
          isAdmin.value
            ? { name: 'admin.catalog.products' }
            : { name: 'seller.products.edit', params: { slug: createdSlug } },
        )
        return
      } finally {
        endImageUpload()
      }
    }
    clearDraft()
    toastSuccess(asDraft ? t('catalog.addProduct.draftSaved') : t('catalog.addProduct.created'))
    await router.push(
      isAdmin.value
        ? { name: 'admin.catalog.products' }
        : { name: 'seller.products.detail', params: { slug: createdSlug }, query: { share: '1' } }
    )
  } catch (e: unknown) {
    submitError.value = formatApiError(e, t('catalog.addProduct.saveFailed'))
    toastError(submitError.value)
  } finally {
    submitting.value = false
  }
}

function applyDraft() {
  if (!pendingDraft) return
  form.title = pendingDraft.title
  form.description = pendingDraft.description
  form.categories = [...pendingDraft.categories]
  form.base_price = pendingDraft.base_price
  form.optionsText = pendingDraft.optionsText
  form.stock = pendingDraft.stock
  form.weight_kg = pendingDraft.weight_kg ?? null
  weightDisplay.value = form.weight_kg != null ? String(form.weight_kg) : ''
  step.value = Math.min(TOTAL_STEPS, Math.max(1, pendingDraft.step ?? 1))
  priceDisplay.value = formatPriceDisplay(Number(form.base_price))
  showResumePrompt.value = false
}

function dismissDraft() {
  clearDraft()
  showResumePrompt.value = false
  pendingDraft = null
}

onMounted(() => {
  window.addEventListener('paste', onPasteImage)
  const titleQ = typeof route.query.title === 'string' ? route.query.title.trim() : ''
  const descQ = typeof route.query.description === 'string' ? route.query.description.trim() : ''
  if (titleQ) form.title = titleQ.slice(0, 160)
  if (descQ) form.description = descQ.slice(0, 500)
  if (titleQ) priceDisplay.value = formatPriceDisplay(Number(form.base_price))

  pendingDraft = loadDraft()
  if (pendingDraft && (pendingDraft.title || pendingDraft.categories.length)) {
    showResumePrompt.value = true
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
  cursor: pointer;
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
.product-post__dot:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}
.product-post__field-hint {
  margin: 0 0 0.75rem;
  font-size: 0.9rem;
  color: var(--kkoo-text-muted, #6a4c86);
}
.product-post__strip {
  display: flex;
  gap: 0.55rem;
  overflow-x: auto;
  padding: 0.75rem 0 0.25rem;
  -webkit-overflow-scrolling: touch;
}
.product-post__thumb {
  position: relative;
  flex: 0 0 auto;
  width: 4.5rem;
  height: 4.5rem;
}
.product-post__thumb-btn {
  width: 100%;
  height: 100%;
  padding: 0;
  border: 2px solid transparent;
  border-radius: 12px;
  overflow: hidden;
  background: #111;
  cursor: pointer;
}
.product-post__thumb--cover .product-post__thumb-btn {
  border-color: var(--kkoo-primary, #5c308f);
}
.product-post__thumb-btn img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.product-post__thumb-badge {
  position: absolute;
  left: 0.25rem;
  bottom: 0.25rem;
  padding: 0.1rem 0.35rem;
  border-radius: 999px;
  background: rgba(92, 48, 143, 0.92);
  color: #fff;
  font-size: 0.65rem;
  font-weight: 700;
}
.product-post__thumb-remove {
  position: absolute;
  top: -0.35rem;
  right: -0.35rem;
  width: 1.5rem;
  height: 1.5rem;
  border: 0;
  border-radius: 999px;
  background: #111827;
  color: #fff;
  font-size: 1rem;
  line-height: 1;
  cursor: pointer;
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
.product-post__resume {
  margin-bottom: 1rem;
  padding: 0.85rem;
  border-radius: var(--kkoo-radius-md, 13px);
  background: rgba(247, 168, 41, 0.12);
  border: 1px solid rgba(247, 168, 41, 0.35);
}
.product-post__resume p {
  margin: 0 0 0.55rem;
  font-size: 0.9rem;
  color: var(--kkoo-text-dark, #111827);
}
.product-post__resume-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.product-post__resume-dismiss {
  min-height: 44px;
  padding: 0.45rem 0.75rem;
  border: 0;
  background: none;
  color: var(--kkoo-text-muted, #6a4c86);
  font-weight: 600;
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
.product-post__saved {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0 0 0.75rem;
  color: #047857;
  font-size: 0.85rem;
  font-weight: 600;
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
