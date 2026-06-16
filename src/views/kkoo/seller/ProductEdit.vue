<template>
  <VerticalLayout>
    <b-card :title="isAdmin ? 'Edit product (Admin)' : 'Edit product'" class="mb-0">
      <p v-if="error" class="text-danger">{{ error }}</p>
      <p v-else-if="!loaded" class="text-muted">Loading...</p>
      <template v-else>
        <p class="text-muted">Update product information, specification, and images. You can save as draft.</p>
        <form-wizard
          ref="wizardRef"
          color="#5C308F"
          back-button-text="Back"
          next-button-text="Next"
          finish-button-text="Save product"
          @on-complete="onComplete"
        >
          <tab-content title="Product information">
            <div class="d-flex justify-content-end mb-2">
              <b-button variant="outline-secondary" size="sm" @click="saveDraft">Save as draft</b-button>
            </div>
            <b-row>
              <b-col md="6">
                <b-form-group class="mb-3">
                  <template #label>
                    <span class="d-inline-flex align-items-center">Title
                      <b-button variant="link" class="p-0 ms-1 text-secondary align-baseline" size="sm" id="help-edit-title" aria-label="What is needed"><small>ⓘ</small></b-button>
                      <b-tooltip target="help-edit-title" triggers="click" placement="top">The product name as shown to buyers (max 160 characters).</b-tooltip>
                    </span>
                  </template>
                  <b-form-input v-model="form.title" maxlength="160" required />
                </b-form-group>
              </b-col>
              <b-col cols="12">
                <b-form-group class="mb-3">
                  <template #label>
                    <span class="d-inline-flex align-items-center">Description
                      <b-button variant="link" class="p-0 ms-1 text-secondary align-baseline" size="sm" id="help-edit-desc" aria-label="What is needed"><small>ⓘ</small></b-button>
                      <b-tooltip target="help-edit-desc" triggers="click" placement="top">At least 200 characters are required to publish. You can save as draft with less.</b-tooltip>
                    </span>
                  </template>
                  <b-form-textarea v-model="form.description" rows="4" />
                  <small class="text-muted">{{ (form.description || '').length }} / 200</small>
                </b-form-group>
              </b-col>
              <b-col cols="12">
                <CatalogCategoryPicker v-model="form.categories" :use-admin-categories="isAdmin" />
              </b-col>
              <b-col md="6">
                <b-form-group label="Brand" class="mb-3">
                  <b-form-select v-model="form.brand" :options="brandOptions" value-field="slug" text-field="name">
                    <template #first><b-form-select-option :value="''">— Select —</b-form-select-option></template>
                  </b-form-select>
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Base price" class="mb-3">
                  <b-form-input v-model.number="form.base_price" type="number" step="0.01" min="0" />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Discount price" class="mb-3">
                  <b-form-input v-model.number="form.discount_price" type="number" step="0.01" min="0" />
                </b-form-group>
              </b-col>
              <b-col md="4">
                <b-form-group label="Weight (kg)" class="mb-3">
                  <b-form-input v-model.number="form.weight_kg" type="number" step="0.01" min="0" />
                </b-form-group>
              </b-col>
              <b-col cols="12">
                <h6 class="mb-2 d-inline-flex align-items-center">
                  SKUs
                  <b-button variant="link" class="p-0 ms-1 text-secondary align-baseline" size="sm" id="help-edit-skus" aria-label="What is needed"><small>ⓘ</small></b-button>
                  <b-tooltip target="help-edit-skus" triggers="click" placement="top">Each row is one SKU (code is auto-generated). Set stock and optional variant (Color, Weight, Size or custom Variant). Price override is optional.</b-tooltip>
                </h6>
                <b-form-checkbox v-model="form.useVariationTemplate" class="mb-2">
                  Use variation template (Color, Weight, Size)
                </b-form-checkbox>
                <div v-for="(sku, idx) in form.skus" :key="idx" class="border rounded p-3 mb-3">
                  <b-row>
                    <template v-if="form.useVariationTemplate">
                      <b-col md="2"><b-form-group label="Color" class="mb-2"><b-form-input v-model="sku.color" placeholder="e.g. Red" /></b-form-group></b-col>
                      <b-col md="2"><b-form-group label="Weight" class="mb-2"><b-form-input v-model="sku.weight" placeholder="e.g. 50g" /></b-form-group></b-col>
                      <b-col md="2"><b-form-group label="Size" class="mb-2"><b-form-input v-model="sku.size" placeholder="e.g. S, M, L" /></b-form-group></b-col>
                    </template>
                    <template v-else>
                      <b-col md="2"><b-form-group label="Variant" class="mb-2"><b-form-input v-model="sku.variant_text" placeholder="size:M" /></b-form-group></b-col>
                    </template>
                    <b-col md="2"><b-form-group label="Stock" class="mb-2"><b-form-input v-model.number="sku.stock_quantity" type="number" min="0" /></b-form-group></b-col>
                    <b-col md="2"><b-form-group label="Price override" class="mb-2"><b-form-input v-model.number="sku.price_override" type="number" step="0.01" min="0" /></b-form-group></b-col>
                    <b-col md="2" class="d-flex align-items-end"><b-button variant="outline-danger" size="sm" @click="removeSku(idx)">Remove</b-button></b-col>
                  </b-row>
                </div>
                <b-button variant="outline-primary" @click="addSku">+ Add SKU</b-button>
              </b-col>
            </b-row>
          </tab-content>
          <tab-content title="Specification">
            <div class="d-flex justify-content-end mb-2">
              <b-button variant="outline-secondary" size="sm" @click="saveDraft">Save as draft</b-button>
            </div>
            <p class="text-muted mb-3 d-inline-flex align-items-center">
              Add or edit specification entries (input type, label, value).
              <b-button variant="link" class="p-0 ms-1 text-secondary align-baseline" size="sm" id="help-edit-spec" aria-label="What is needed"><small>ⓘ</small></b-button>
              <b-tooltip target="help-edit-spec" triggers="click" placement="top">Optional. Key-value specs (e.g. Material: Cotton). Use Text, Number, or Long text. Label = spec name, Value = spec value.</b-tooltip>
            </p>
            <div v-for="(spec, idx) in form.specifications" :key="idx" class="border rounded p-3 mb-3">
              <b-row>
                <b-col md="3">
                  <b-form-group label="Input type" class="mb-2">
                    <b-form-select v-model="spec.input_type" :options="specInputTypeOptions" />
                  </b-form-group>
                </b-col>
                <b-col md="3">
                  <b-form-group label="Label" class="mb-2">
                    <b-form-input v-model="spec.label" />
                  </b-form-group>
                </b-col>
                <b-col md="4">
                  <b-form-group v-if="spec.input_type === 'textarea'" label="Value" class="mb-2">
                    <b-form-textarea v-model="spec.value" rows="2" />
                  </b-form-group>
                  <b-form-group v-else label="Value" class="mb-2">
                    <b-form-input v-model="spec.value" :type="spec.input_type === 'number' ? 'number' : 'text'" step="any" />
                  </b-form-group>
                </b-col>
                <b-col md="2" class="d-flex align-items-end">
                  <b-button variant="outline-danger" size="sm" @click="removeSpec(idx)">Remove</b-button>
                </b-col>
              </b-row>
            </div>
            <b-button variant="outline-primary" @click="addSpec">+ Add specification</b-button>
          </tab-content>
          <tab-content title="Images &amp; cover">
            <div class="d-flex justify-content-end mb-2">
              <b-button variant="outline-secondary" size="sm" @click="saveDraft">Save as draft</b-button>
            </div>
            <p class="text-muted mb-2 d-inline-flex align-items-center">
              Cover and gallery images (file or URL).
              <b-button variant="link" class="p-0 ms-1 text-secondary align-baseline" size="sm" id="help-edit-images" aria-label="What is needed"><small>ⓘ</small></b-button>
              <b-tooltip target="help-edit-images" triggers="click" placement="top">Optional. Upload a cover image or paste a URL. Add more images for the gallery. One URL per line in the text area.</b-tooltip>
            </p>
            <b-form-group label="Cover image" class="mb-3">
              <div v-if="coverPreviewUrl" class="mb-2">
                <img :src="coverPreviewUrl" alt="Cover" class="product-wizard-cover-preview" />
              </div>
              <b-form-input v-model="form.cover_image" placeholder="Cover image URL" class="mb-2" />
              <input type="file" accept="image/*" class="form-control mb-2" @change="onCoverFileChange" />
            </b-form-group>
            <b-form-group label="Gallery images (multi upload)">
              <input type="file" accept="image/*" multiple class="form-control mb-2" @change="onGalleryFilesChange" />
              <div v-if="form.gallery_files.length" class="d-flex flex-wrap gap-2 mt-2">
                <div v-for="(file, i) in form.gallery_files" :key="i" class="gallery-thumb-wrap">
                  <img :src="galleryPreview(file)" alt="" class="gallery-thumb" />
                  <b-button size="sm" variant="outline-danger" class="mt-1" @click="removeGalleryFile(i)">Remove</b-button>
                </div>
              </div>
            </b-form-group>
            <b-form-group label="Additional image URLs (one per line)">
              <b-form-textarea v-model="form.additional_images_text" rows="2" placeholder="https://..." />
            </b-form-group>
            <p v-if="submitError" class="text-danger mt-2 mb-0">{{ submitError }}</p>
          </tab-content>
        </form-wizard>
        <ImageUploadProgressBar
          :visible="imageUploadActive"
          subtitle="Uploading images…"
          :percent="imageUploadPercent"
          :pulse-striped="imageUploadPulse"
        />
      </template>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

const { t } = useI18n()
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import CatalogCategoryPicker from '@/components/kkoo/CatalogCategoryPicker.vue'
import ImageUploadProgressBar from '@/components/ImageUploadProgressBar.vue'
import { FormWizard, TabContent } from 'vue3-form-wizard'
import 'vue3-form-wizard/dist/style.css'
import { catalogPublicApi, catalogSellerApi, catalogAdminApi } from '@/api'
import { useAuthStore } from '@/stores/auth'
import { sellerOwnsProduct } from '@/utils/catalogProductAccess'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { useMultipartUploadProgress } from '@/composables/useMultipartUploadProgress'
import {
  brandSlugFromProduct,
  categorySlugsFromProduct,
} from '@/utils/catalogProductApi'
import { formatApiError } from '@/utils/formatApiError'
import { toastError, toastSuccess } from '@/utils/toast'

const route = useRoute()
const router = useRouter()
const slugParam = computed(() => (route.params.slug as string) || '')
const isAdmin = computed(() => route.path.startsWith('/admin/catalog'))
const loaded = ref(false)
const error = ref('')
const submitError = ref('')
const submitting = ref(false)
const brandOptions = ref<{ slug: string; name: string }[]>([])
const galleryUrlByFile = new WeakMap<File, string>()
let coverObjectUrl: string | null = null
const wizardRef = ref<InstanceType<typeof FormWizard> | null>(null)
const {
  uploadActive: imageUploadActive,
  uploadPercent: imageUploadPercent,
  uploadPulse: imageUploadPulse,
  beginUpload: beginImageUpload,
  onUploadProgress: onImageUploadProgress,
  endUpload: endImageUpload,
} = useMultipartUploadProgress()

const specInputTypeOptions = [
  { value: 'text', text: 'Text' },
  { value: 'number', text: 'Number' },
  { value: 'textarea', text: 'Long text' },
]

const form = reactive({
  title: '',
  slug: '',
  description: '',
  categories: [] as string[],
  brand: '',
  base_price: 0 as number,
  discount_price: null as number | null,
  weight_kg: null as number | null,
  useVariationTemplate: false,
  skus: [] as { sku_code: string; stock_quantity: number; price_override?: number | null; variant_text?: string; color?: string; weight?: string; size?: string }[],
  specifications: [] as { input_type: string; label: string; value: string }[],
  cover_image: '',
  cover_file: null as File | null,
  gallery_files: [] as File[],
  additional_images_text: '',
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
  { immediate: true }
)

onBeforeUnmount(() => {
  if (coverObjectUrl) URL.revokeObjectURL(coverObjectUrl)
  for (const file of form.gallery_files) {
    const url = galleryUrlByFile.get(file)
    if (url) URL.revokeObjectURL(url)
  }
})

function addSku() {
  form.skus.push({
    sku_code: '',
    stock_quantity: 0,
    price_override: null,
    variant_text: '',
    color: '',
    weight: '',
    size: '',
  })
}
function removeSku(idx: number) {
  form.skus.splice(idx, 1)
}
function addSpec() {
  form.specifications.push({ input_type: 'text', label: '', value: '' })
}
function removeSpec(idx: number) {
  form.specifications.splice(idx, 1)
}
function onCoverFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  form.cover_file = input.files?.[0] ?? null
  if (form.cover_file) form.cover_image = ''
}
function onGalleryFilesChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const files = input.files ? Array.from(input.files) : []
  form.gallery_files.push(...files)
  input.value = ''
}
function galleryPreview(file: File): string {
  let url = galleryUrlByFile.get(file)
  if (!url) {
    url = URL.createObjectURL(file)
    galleryUrlByFile.set(file, url)
  }
  return url
}
function removeGalleryFile(idx: number) {
  const file = form.gallery_files[idx]
  const url = file ? galleryUrlByFile.get(file) : undefined
  if (url) {
    URL.revokeObjectURL(url)
    galleryUrlByFile.delete(file)
  }
  form.gallery_files.splice(idx, 1)
}

function buildSpecificationObject(): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const s of form.specifications) {
    if (s.label?.trim()) out[s.label.trim()] = s.value ?? ''
  }
  return out
}

const VARIANT_DIMENSIONS = ['color', 'weight', 'size'] as const

function buildPayload(asDraft: boolean): Record<string, unknown> {
  const variantAttrs = form.skus.map((s) => {
    if (form.useVariationTemplate) {
      const attrs: Record<string, string> = {}
      if (s.color?.trim()) attrs.color = s.color.trim()
      if (s.weight?.trim()) attrs.weight = s.weight.trim()
      if (s.size?.trim()) attrs.size = s.size.trim()
      return attrs
    }
    const attrs: Record<string, string> = {}
    if (s.variant_text) {
      const [k, v] = s.variant_text.split(':').map((x) => x.trim())
      if (k) attrs[k] = v || ''
    }
    return attrs
  })
  const specs = { ...buildSpecificationObject() }
  if (form.useVariationTemplate) (specs as Record<string, unknown>).variant_dimensions = [...VARIANT_DIMENSIONS]
  const payload: Record<string, unknown> = {
    title: form.title,
    description: form.description || '',
    category_slugs: form.categories?.length ? [...form.categories] : undefined,
    brand: form.brand || undefined,
    base_price: form.base_price,
    discount_price: form.discount_price,
    weight_kg: form.weight_kg ?? undefined,
    specification: { specs },
    skus: form.skus.map((s, i) => ({
      sku_code: s.sku_code,
      stock_quantity: Number(s.stock_quantity) || 0,
      price_override: s.price_override != null && String(s.price_override) !== '' ? Number(s.price_override) : null,
      variant_attributes: variantAttrs[i] || {},
    })),
  }
  payload.status = asDraft ? 'draft' : 'published'
  if (form.cover_image?.trim() && !form.cover_file) payload.cover_image = form.cover_image.trim()
  return payload
}

async function submitProduct(asDraft: boolean) {
  if (submitting.value) return
  submitError.value = ''
  const slug = slugParam.value
  if (!slug) {
    submitError.value = 'Invalid product'
    return
  }
  if (!form.title.trim()) {
    submitError.value = 'Product title is required.'
    toastError(submitError.value)
    return
  }
  if (form.title.trim().length > 160) {
    submitError.value = 'Product title must be at most 160 characters.'
    toastError(submitError.value)
    return
  }
  const payload = buildPayload(asDraft)
  submitting.value = true
  try {
    if (form.cover_file || form.gallery_files.length) {
      const fd = new FormData()
      fd.append('title', form.title)
      fd.append('description', form.description || '')
      fd.append('base_price', String(form.base_price))
      fd.append('specification', JSON.stringify(payload.specification || {}))
      if (form.categories?.length) fd.append('category_slugs', JSON.stringify(form.categories))
      if (form.brand) fd.append('brand', form.brand)
      if (form.cover_file) fd.append('cover_image', form.cover_file)
      else if (form.gallery_files.length) fd.append('cover_image', form.gallery_files[0])
      form.gallery_files.forEach((file, i) => {
        if (form.cover_file) fd.append('images', file)
        else if (i > 0) fd.append('images', file)
      })
      if (form.discount_price != null) fd.append('discount_price', String(form.discount_price))
      if (form.weight_kg != null) fd.append('weight_kg', String(form.weight_kg))
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
    toastSuccess(asDraft ? 'Draft saved' : 'Product updated')
    await router.push(isAdmin.value ? { name: 'admin.catalog.products' } : { name: 'seller.products' })
  } catch (e: unknown) {
    submitError.value = formatApiError(e, 'Failed to save')
    toastError(submitError.value)
  } finally {
    submitting.value = false
  }
}

async function saveDraft() {
  await submitProduct(true)
}
async function onComplete() {
  await submitProduct(false)
}

function parseSpecification(spec: unknown): { input_type: string; label: string; value: string }[] {
  if (!spec || typeof spec !== 'object') return []
  const raw = spec as Record<string, unknown>
  const specs = (raw.specs && typeof raw.specs === 'object' ? raw.specs : raw) as Record<string, unknown>
  return Object.entries(specs)
    .filter(([key]) => key !== 'variant_dimensions')
    .map(([label, value]) => ({
      input_type: typeof value === 'number' ? 'number' : 'text',
      label,
      value: String(value ?? ''),
    }))
}

function hasColorWeightSizeDimensions(spec: unknown): boolean {
  if (!spec || typeof spec !== 'object') return false
  const raw = spec as Record<string, unknown>
  const specs = (raw.specs && typeof raw.specs === 'object' ? raw.specs : raw) as Record<string, unknown>
  const dims = specs.variant_dimensions
  if (!Array.isArray(dims)) return false
  const set = new Set(dims.map((d: unknown) => String(d).toLowerCase()))
  return set.has('color') && set.has('weight') && set.has('size')
}

function parseSkus(skus: unknown): { sku_code: string; stock_quantity: number; price_override?: number | null; variant_text?: string; color?: string; weight?: string; size?: string }[] {
  if (!Array.isArray(skus)) return []
  return skus.map((s: Record<string, unknown>) => {
    const va = (s.variant_attributes && typeof s.variant_attributes === 'object' ? s.variant_attributes : {}) as Record<string, string>
    return {
      sku_code: String(s.sku_code ?? ''),
      stock_quantity: Number(s.stock_quantity ?? 0),
      price_override: s.price_override != null ? Number(s.price_override) : null,
      variant_text: Object.entries(va)
        .map(([k, v]) => `${k}:${v}`)
        .join(', '),
      color: va.color ?? '',
      weight: va.weight ?? '',
      size: va.size ?? '',
    }
  })
}

onMounted(async () => {
  try {
    const { data: brandData } = isAdmin.value
      ? await catalogAdminApi.listBrands()
      : await catalogPublicApi.listBrands()
    const brands = brandData as { results?: { slug: string; name: string }[] } | { slug: string; name: string }[]
    brandOptions.value = (Array.isArray(brands) ? brands : (brands?.results ?? [])).map((b) => ({
      slug: b.slug,
      name: b.name,
    }))
  } catch {
    brandOptions.value = []
  }
  if (!slugParam.value) {
    error.value = 'Invalid product slug'
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
      router.push({ name: 'seller.products' })
      return
    }
    form.title = (d.title as string) ?? ''
    if (d.slug) form.slug = String(d.slug)
    form.description = (d.description as string) ?? ''
    form.categories = categorySlugsFromProduct(d)
    form.brand = brandSlugFromProduct(d)
    form.base_price = Number(d.base_price ?? 0)
    form.discount_price = d.discount_price != null ? Number(d.discount_price) : null
    form.weight_kg = d.weight_kg != null ? Number(d.weight_kg) : null
    const images = d.images as string[] | undefined
    const cover = (d.cover_image ?? d.image ?? d.thumbnail ?? d.cover ?? images?.[0]) as string | undefined
    form.cover_image = cover ?? ''
    form.useVariationTemplate = hasColorWeightSizeDimensions(d.specification)
    form.specifications = parseSpecification(d.specification)
    if (form.specifications.length === 0) addSpec()
    form.skus = parseSkus(d.skus)
    if (form.skus.length === 0) addSku()
    loaded.value = true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load product')
  }
})
</script>

<style scoped>
.product-wizard-cover-preview {
  max-width: 200px;
  max-height: 140px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
.gallery-thumb-wrap {
  width: 80px;
  text-align: center;
}
.gallery-thumb {
  width: 80px;
  height: 80px;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
</style>
