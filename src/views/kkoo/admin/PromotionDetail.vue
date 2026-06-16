<template>
  <VerticalLayout>
    <b-card v-if="(error || notFound) && !promotion" class="mb-0">
      <p class="text-danger mb-0">
        {{ notFound ? "This promotion doesn't exist or was deleted." : error }}
        <router-link :to="{ name: 'admin.promotions' }" class="ms-1 text-decoration-underline">Back to Promotions</router-link>
      </p>
    </b-card>
    <template v-else-if="promotion">
      <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
        <b-button variant="outline-secondary" size="sm" :to="{ name: 'admin.promotions' }">Back to Promotions</b-button>
        <b-button variant="outline-primary" size="sm" @click="openEditModal">Edit promotion</b-button>
        <b-button variant="outline-danger" size="sm" @click="confirmDelete">Delete promotion</b-button>
      </div>

      <b-card :title="promotion.name || 'Promotion'" class="mb-3">
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <b-badge :variant="promoDetailStatusVariant" class="fs-6 px-2 py-1">{{ promoDetailStatusLabel }}</b-badge>
          <span v-if="promotion.end_datetime" class="text-muted small">
            Expiry: {{ formatDate(promotion.end_datetime) }}
            <b-badge v-if="isPromoExpiredDetail(promotion.end_datetime)" variant="danger" class="ms-1">Expired</b-badge>
          </span>
        </div>
        <b-row v-if="promotionCoverUrl" class="mb-3">
          <b-col><img :src="promotionCoverUrl" alt="Cover" class="promo-cover-img" /></b-col>
        </b-row>
        <b-row>
          <b-col md="6">
            <b-list-group>
              <b-list-group-item><strong>ID</strong> {{ promotion.id ?? '—' }}</b-list-group-item>
              <b-list-group-item><strong>Type</strong> {{ promotion.promotion_type ?? '—' }}</b-list-group-item>
              <b-list-group-item><strong>Discount</strong> {{ promotion.discount_percent ?? 0 }}%</b-list-group-item>
              <b-list-group-item><strong>Start</strong> {{ formatDate(promotion.start_datetime) }}</b-list-group-item>
              <b-list-group-item><strong>End</strong> {{ formatDate(promotion.end_datetime) }} <span v-if="isPromoExpiredDetail(promotion.end_datetime)" class="text-danger small">(expired)</span></b-list-group-item>
              <b-list-group-item><strong>Status</strong> <b-badge :variant="promotion.is_active ? 'success' : 'secondary'">{{ promotion.is_active ? 'Active' : 'Inactive' }}</b-badge></b-list-group-item>
              <b-list-group-item><strong>Uses</strong> {{ promotion.uses_count ?? '—' }} <span class="text-muted small">(times this promotion was applied)</span></b-list-group-item>
              <b-list-group-item><strong>Total burn</strong> {{ promotion.total_burn ?? '—' }} <span class="text-muted small">(total discount/value used so far)</span></b-list-group-item>
              <b-list-group-item><strong>Created</strong> {{ formatDate(promotion.created_at) }} <span v-if="promotion.created_by" class="text-muted small">by {{ promotion.created_by }}</span></b-list-group-item>
            </b-list-group>
          </b-col>
          <b-col md="6">
            <p v-if="promotion.description" class="mb-2"><strong>Description</strong><br /><span class="text-muted">{{ promotion.description }}</span></p>
            <b-list-group>
              <b-list-group-item><strong>Priority</strong> {{ promotion.priority ?? '—' }} <span class="text-muted small">— Higher wins when multiple promotions apply.</span></b-list-group-item>
              <b-list-group-item><strong>Min order</strong> {{ promotion.min_order_amount ?? '—' }} <span class="text-muted small">— Minimum order amount (currency) to apply.</span></b-list-group-item>
              <b-list-group-item><strong>Max discount cap</strong> {{ promotion.max_discount_cap ?? '—' }} <span class="text-muted small">— Max discount amount per order (currency).</span></b-list-group-item>
              <b-list-group-item><strong>Max total burn</strong> {{ promotion.max_total_burn ?? '—' }} <span class="text-muted small">— Cap on total discount this promotion can give (lifetime).</span></b-list-group-item>
              <b-list-group-item><strong>Max uses</strong> {{ promotion.max_uses ?? '—' }} <span class="text-muted small">— Max times this promotion can be used in total.</span></b-list-group-item>
              <b-list-group-item><strong>Max uses per user</strong> {{ promotion.max_uses_per_user ?? '—' }} <span class="text-muted small">— Max times one user can use it.</span></b-list-group-item>
              <b-list-group-item><strong>Allow stacking</strong> {{ promotion.allow_stacking ? 'Yes' : 'No' }} <span class="text-muted small">— Can combine with other promos.</span></b-list-group-item>
              <b-list-group-item><strong>Exclude from other promos</strong> {{ promotion.exclude_from_other_promos ? 'Yes' : 'No' }} <span class="text-muted small">— If used, exclude from other promotions.</span></b-list-group-item>
              <b-list-group-item><strong>Visibility boost</strong> {{ promotion.visibility_boost ?? '—' }} <span class="text-muted small">— Boost in listing/search (if supported).</span></b-list-group-item>
            </b-list-group>
          </b-col>
        </b-row>
      </b-card>

      <!-- Usage counters returned on GET promotion (no separate stats/report routes on Fiber) -->
      <b-card title="Usage" class="mb-3">
        <p class="text-muted small mb-2">
          Fiber does not expose <code>…/stats/</code> or <code>…/report/</code> for promotions. Counters below come from this promotion record.
        </p>
        <b-list-group>
          <b-list-group-item>
            <strong>Uses</strong> {{ promotion.uses_count ?? '—' }}
            <span class="text-muted small">(times applied at checkout)</span>
          </b-list-group-item>
          <b-list-group-item>
            <strong>Total burn</strong> {{ formatCurrency(promotion.total_burn) }}
            <span class="text-muted small">(discount value used)</span>
          </b-list-group-item>
        </b-list-group>
      </b-card>

      <b-card title="Products in this promotion" class="mb-3">
        <p class="small text-warning mb-2">
          Note: product targeting on promotions may require backend support—verify against kkooapp-backend-fiber before relying on add/remove in this UI.
        </p>
        <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
          <p class="text-muted mb-0 me-auto">Add or remove products.</p>
          <b-button variant="primary" size="sm" @click="openAddProductModal">Add product</b-button>
        </div>
        <p v-if="error" class="text-danger small">{{ error }}</p>
        <b-table v-if="productRows.length" :items="productRows" :fields="productFields" striped responsive>
          <template #cell(title)="data">
            {{ data.value || data.item.slug || `Product #${data.item.id}` }}
          </template>
          <template #cell(actions)="data">
            <b-button size="sm" variant="outline-danger" @click="removeProduct(data.item.id)">Remove</b-button>
          </template>
        </b-table>
        <p v-else class="text-muted">No products in this promotion yet. Click “Add product” to add some.</p>
      </b-card>
    </template>
    <p v-else class="text-muted">Loading…</p>

    <!-- Edit promotion modal - all writable fields -->
    <b-modal v-model="showEditModal" title="Edit promotion" size="lg" @ok="onEditOk">
      <b-form v-if="promotion" class="promo-edit-form">
        <b-card title="Basic" class="mb-2">
          <b-form-group label="Name"><b-form-input v-model="editForm.name" /></b-form-group>
          <b-form-group label="Type"><b-form-select v-model="editForm.promotion_type" :options="promoTypeOptions" /></b-form-group>
          <b-form-group label="Discount % (1–70)"><b-form-input v-model.number="editForm.discount_percent" type="number" min="1" max="70" /></b-form-group>
          <b-form-group label="Start"><b-form-input v-model="editForm.start_datetime" type="datetime-local" /></b-form-group>
          <b-form-group label="End"><b-form-input v-model="editForm.end_datetime" type="datetime-local" /></b-form-group>
          <b-form-group label="Description"><b-form-textarea v-model="editForm.description" rows="2" /></b-form-group>
          <b-form-group label="Replace cover image (1920×786)" description="Optional. New image will be resized/cropped to 1920×786.">
            <img v-if="editForm.cover_preview" :src="editForm.cover_preview" alt="Cover" class="promo-cover-preview mb-2" />
            <input type="file" accept="image/*" class="form-control" @change="onEditCoverFileChange" />
          </b-form-group>
        </b-card>
        <b-card title="Order &amp; caps" class="mb-2">
          <b-row>
            <b-col md="6">
              <b-form-group label="Priority" description="Higher = wins when multiple apply."><b-form-input v-model.number="editForm.priority" type="number" /></b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Min order amount"><b-form-input v-model.number="editForm.min_order_amount" type="number" step="0.01" /></b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Max discount cap (per order)"><b-form-input v-model.number="editForm.max_discount_cap" type="number" step="0.01" /></b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Max total burn (lifetime)"><b-form-input v-model.number="editForm.max_total_burn" type="number" step="0.01" /></b-form-group>
            </b-col>
          </b-row>
        </b-card>
        <b-card title="Usage limits" class="mb-2">
          <b-row>
            <b-col md="6">
              <b-form-group label="Max uses (total)"><b-form-input v-model.number="editForm.max_uses" type="number" min="0" /></b-form-group>
            </b-col>
            <b-col md="6">
              <b-form-group label="Max uses per user"><b-form-input v-model.number="editForm.max_uses_per_user" type="number" min="0" /></b-form-group>
            </b-col>
          </b-row>
        </b-card>
        <b-card title="Options" class="mb-2">
          <b-form-checkbox v-model="editForm.allow_stacking">Allow stacking (can combine with other promotions)</b-form-checkbox>
          <b-form-checkbox v-model="editForm.exclude_from_other_promos">Exclude from other promos (if used, customer cannot use others)</b-form-checkbox>
          <b-form-group label="Visibility boost"><b-form-input v-model.number="editForm.visibility_boost" type="number" /></b-form-group>
        </b-card>
      </b-form>
    </b-modal>

    <!-- Add product modal: search or by category, multi-select -->
    <b-modal v-model="showAddProductModal" title="Add products" size="lg" @ok="onAddProductOk" @hidden="onAddProductModalHidden">
      <b-tabs v-model="addProductTab" content-class="pt-2">
        <b-tab title="By search">
          <b-form-group label="Search products">
            <b-form-input v-model="addProductSearch" placeholder="Search by title or slug..." @input="debouncedSearchProducts" />
          </b-form-group>
          <p v-if="addProductLoading" class="text-muted small">Loading…</p>
          <b-table
            v-else-if="addProductCandidates.length"
            :items="addProductCandidates"
            :fields="[{ key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }]"
            striped
            small
            selectable
            select-mode="multi"
            v-model:selectedItems="selectedProductToAdd"
          />
          <p v-else-if="addProductSearch.trim()" class="text-muted small">No products found. Try another search.</p>
          <p v-else class="text-muted small">Type to search for products to add. Select multiple rows to add them all.</p>
        </b-tab>
        <b-tab title="By category">
          <b-form-group label="Category">
            <b-form-select v-model="addProductCategorySlug" :options="categoryOptions" value-field="slug" text-field="name" class="mb-2" @change="loadProductsByCategory">
              <template #first>
                <b-form-select-option :value="null">— Select category —</b-form-select-option>
              </template>
            </b-form-select>
          </b-form-group>
          <p v-if="addCategoryProductsLoading" class="text-muted small">Loading…</p>
          <b-table
            v-else-if="addCategoryProducts.length"
            :items="addCategoryProducts"
            :fields="[{ key: 'id', label: 'ID' }, { key: 'title', label: 'Title' }, { key: 'slug', label: 'Slug' }]"
            striped
            small
            selectable
            select-mode="multi"
            v-model:selectedItems="selectedCategoryProducts"
          />
          <p v-else-if="addProductCategorySlug" class="text-muted small">No products in this category.</p>
          <p v-else class="text-muted small">Select a category to list its products, then select products to add.</p>
        </b-tab>
      </b-tabs>
      <p v-if="selectedProductCount" class="small mb-0 mt-2 text-muted">{{ selectedProductCount }} product(s) selected to add.</p>
    </b-modal>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { promotionsAdminApi, catalogAdminApi, catalogPublicApi } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { confirmDestructiveAction } from '@/utils/confirmDestructiveAction'

const route = useRoute()
const router = useRouter()
const idParam = computed(() => String(route.params.id ?? ''))
const id = computed(() => {
  const n = Number(idParam.value)
  return Number.isNaN(n) ? null : n
})
const promotion = ref<Record<string, unknown> | null>(null)
const loading = ref(true)
const error = ref('')
/** True when backend returns 404 or body like {"error":"Promotion not found"}. */
const notFound = ref(false)
const showEditModal = ref(false)
const showAddProductModal = ref(false)
const addProductTab = ref(0)
const addProductSearch = ref('')
const addProductCandidates = ref<Record<string, unknown>[]>([])
const addProductLoading = ref(false)
const selectedProductToAdd = ref<Record<string, unknown>[]>([])
const addProductCategorySlug = ref<string | null>(null)
const categoryOptions = ref<{ slug: string; name: string }[]>([])
const addCategoryProducts = ref<Record<string, unknown>[]>([])
const addCategoryProductsLoading = ref(false)
const selectedCategoryProducts = ref<Record<string, unknown>[]>([])
let searchDebounce: ReturnType<typeof setTimeout> | null = null

const selectedProductCount = computed(() => {
  if (addProductTab.value === 0) return selectedProductToAdd.value.length
  return selectedCategoryProducts.value.length
})

const promoTypeOptions = [
  { value: 'flash', text: 'Flash' },
  { value: 'timed', text: 'Timed' },
  { value: 'bundle', text: 'Bundle' },
  { value: 'seller', text: 'Seller' },
  { value: 'category', text: 'Category' },
]

const editForm = reactive({
  name: '',
  promotion_type: 'timed',
  discount_percent: 10,
  start_datetime: '',
  end_datetime: '',
  description: '',
  cover_image: '' as string,
  cover_file: null as File | null,
  cover_preview: '' as string,
  priority: null as number | null,
  min_order_amount: null as number | null,
  max_discount_cap: null as number | null,
  max_total_burn: null as number | null,
  max_uses: null as number | null,
  max_uses_per_user: null as number | null,
  allow_stacking: false,
  exclude_from_other_promos: false,
  visibility_boost: null as number | null,
})

const productFields = [
  { key: 'id', label: 'ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'actions', label: 'Actions' },
]

function normalizeProducts(promo: Record<string, unknown>): { id: number; title?: string; slug?: string }[] {
  const raw = promo.products
  if (!Array.isArray(raw)) return []
  return raw.map((p) => {
    if (typeof p === 'number') return { id: p, title: undefined, slug: undefined }
    if (p && typeof p === 'object' && 'id' in p) {
      const o = p as Record<string, unknown>
      return { id: Number(o.id), title: o.title as string, slug: o.slug as string }
    }
    return { id: Number(p), title: undefined, slug: undefined }
  })
}

const productRows = computed(() => (promotion.value ? normalizeProducts(promotion.value) : []))

function formatDate(val: unknown): string {
  if (!val) return '—'
  const d = new Date(String(val))
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString()
}

function formatCurrency(val: unknown): string {
  if (val == null || val === '') return '—'
  const n = Number(val)
  if (Number.isNaN(n)) return String(val)
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n)
}

function isPromoExpiredDetail(endDatetime: unknown): boolean {
  if (!endDatetime) return false
  const d = new Date(String(endDatetime))
  return !isNaN(d.getTime()) && d.getTime() < Date.now()
}

const promoDetailStatusLabel = computed(() => {
  const p = promotion.value
  if (!p) return '—'
  if (isPromoExpiredDetail(p.end_datetime)) return 'Expired'
  return p.is_active ? 'Active' : 'Inactive'
})

const promoDetailStatusVariant = computed(() => {
  const p = promotion.value
  if (!p) return 'secondary'
  if (isPromoExpiredDetail(p.end_datetime)) return 'danger'
  return p.is_active ? 'success' : 'secondary'
})

const promotionCoverUrl = computed(() => {
  const p = promotion.value
  const raw = p?.cover_image ?? (p as Record<string, unknown> | undefined)?.cover
  if (!raw) return ''
  return resolveAssetUrl(String(raw)) ?? ''
})

async function load() {
  if (!idParam.value) return
  loading.value = true
  error.value = ''
  notFound.value = false
  try {
    const { data } = id.value != null
      ? await promotionsAdminApi.get(id.value)
      : await promotionsAdminApi.getBySlug(idParam.value)
    const body = (data ?? {}) as Record<string, unknown>
    if (body.error != null && String(body.error).toLowerCase().includes('not found')) {
      notFound.value = true
      promotion.value = null
      return
    }
    promotion.value = body
    const p = promotion.value
    editForm.name = String(p.name ?? '')
    editForm.promotion_type = String(p.promotion_type ?? 'timed')
    editForm.discount_percent = Number(p.discount_percent ?? 10)
    editForm.start_datetime = p.start_datetime ? String(p.start_datetime).slice(0, 16) : ''
    editForm.end_datetime = p.end_datetime ? String(p.end_datetime).slice(0, 16) : ''
    editForm.description = String(p.description ?? '')
    editForm.cover_image = String(p.cover_image ?? (p as Record<string, unknown>).cover ?? '')
    editForm.cover_file = null
    editForm.cover_preview = editForm.cover_image ? (resolveAssetUrl(editForm.cover_image) ?? '') : ''
    editForm.priority = p.priority != null ? Number(p.priority) : null
    editForm.min_order_amount = p.min_order_amount != null ? Number(p.min_order_amount) : null
    editForm.max_discount_cap = p.max_discount_cap != null ? Number(p.max_discount_cap) : null
    editForm.max_total_burn = p.max_total_burn != null ? Number(p.max_total_burn) : null
    editForm.max_uses = p.max_uses != null ? Number(p.max_uses) : null
    editForm.max_uses_per_user = p.max_uses_per_user != null ? Number(p.max_uses_per_user) : null
    editForm.allow_stacking = Boolean(p.allow_stacking)
    editForm.exclude_from_other_promos = Boolean(p.exclude_from_other_promos)
    editForm.visibility_boost = p.visibility_boost != null ? Number(p.visibility_boost) : null
  } catch (e: unknown) {
    const status = (e as { response?: { status?: number; data?: Record<string, unknown> } })?.response?.status
    const errData = (e as { response?: { data?: Record<string, unknown> } })?.response?.data
    const errMsg = errData && typeof errData === 'object' && errData.error != null ? String(errData.error) : ''
    if (status === 404 || (errMsg && errMsg.toLowerCase().includes('not found'))) {
      notFound.value = true
    } else {
      error.value = formatApiError(e, 'Failed to load promotion')
    }
    promotion.value = null
  } finally {
    loading.value = false
  }
}

function onEditCoverFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  editForm.cover_file = file ?? null
  editForm.cover_preview = file ? URL.createObjectURL(file) : (editForm.cover_image ? (resolveAssetUrl(editForm.cover_image) ?? '') : '')
  input.value = ''
}

function openEditModal() {
  if (promotion.value) {
    const p = promotion.value
    editForm.name = String(p.name ?? '')
    editForm.promotion_type = String(p.promotion_type ?? 'timed')
    editForm.discount_percent = Number(p.discount_percent ?? 10)
    editForm.start_datetime = p.start_datetime ? String(p.start_datetime).slice(0, 16) : ''
    editForm.end_datetime = p.end_datetime ? String(p.end_datetime).slice(0, 16) : ''
    editForm.description = String(p.description ?? '')
    editForm.cover_image = String(p.cover_image ?? (p as Record<string, unknown>).cover ?? '')
    editForm.cover_file = null
    editForm.cover_preview = editForm.cover_image ? (resolveAssetUrl(editForm.cover_image) ?? '') : ''
    editForm.priority = p.priority != null ? Number(p.priority) : null
    editForm.min_order_amount = p.min_order_amount != null ? Number(p.min_order_amount) : null
    editForm.max_discount_cap = p.max_discount_cap != null ? Number(p.max_discount_cap) : null
    editForm.max_total_burn = p.max_total_burn != null ? Number(p.max_total_burn) : null
    editForm.max_uses = p.max_uses != null ? Number(p.max_uses) : null
    editForm.max_uses_per_user = p.max_uses_per_user != null ? Number(p.max_uses_per_user) : null
    editForm.allow_stacking = Boolean(p.allow_stacking)
    editForm.exclude_from_other_promos = Boolean(p.exclude_from_other_promos)
    editForm.visibility_boost = p.visibility_boost != null ? Number(p.visibility_boost) : null
  }
  showEditModal.value = true
}

function appendEditFormToFormData(fd: FormData) {
  fd.append('name', editForm.name)
  if (editForm.promotion_type) fd.append('promotion_type', editForm.promotion_type)
  if (editForm.description) fd.append('description', editForm.description)
  if (editForm.discount_percent != null) fd.append('discount_percent', String(editForm.discount_percent))
  if (editForm.priority != null) fd.append('priority', String(editForm.priority))
  if (editForm.start_datetime) fd.append('start_datetime', editForm.start_datetime)
  if (editForm.end_datetime) fd.append('end_datetime', editForm.end_datetime)
  if (editForm.min_order_amount != null) fd.append('min_order_amount', String(editForm.min_order_amount))
  if (editForm.max_discount_cap != null) fd.append('max_discount_cap', String(editForm.max_discount_cap))
  if (editForm.max_total_burn != null) fd.append('max_total_burn', String(editForm.max_total_burn))
  if (editForm.max_uses != null) fd.append('max_uses', String(editForm.max_uses))
  if (editForm.max_uses_per_user != null) fd.append('max_uses_per_user', String(editForm.max_uses_per_user))
  fd.append('allow_stacking', String(editForm.allow_stacking))
  fd.append('exclude_from_other_promos', String(editForm.exclude_from_other_promos))
  if (editForm.visibility_boost != null) fd.append('visibility_boost', String(editForm.visibility_boost))
}

async function savePromo(): Promise<boolean> {
  if (!slugOrId.value || !promotion.value) return false
  error.value = ''
  const slug = (promotion.value as Record<string, unknown>).slug as string | undefined
  const hasCoverFile = !!editForm.cover_file

  if (hasCoverFile && slug) {
    const fd = new FormData()
    appendEditFormToFormData(fd)
    fd.append('cover_image', editForm.cover_file!)
    try {
      await promotionsAdminApi.updateWithCover(slug, fd)
      await load()
      return true
    } catch (e: unknown) {
      error.value = formatApiError(e, 'Save failed')
      return false
    }
  }

  const payload = {
    name: editForm.name,
    promotion_type: editForm.promotion_type,
    discount_percent: editForm.discount_percent,
    start_datetime: editForm.start_datetime || new Date().toISOString(),
    end_datetime: editForm.end_datetime || new Date(Date.now() + 86400000).toISOString(),
    description: editForm.description || undefined,
    cover_image: editForm.cover_image || undefined,
    priority: editForm.priority ?? undefined,
    min_order_amount: editForm.min_order_amount ?? undefined,
    max_discount_cap: editForm.max_discount_cap ?? undefined,
    max_total_burn: editForm.max_total_burn ?? undefined,
    max_uses: editForm.max_uses ?? undefined,
    max_uses_per_user: editForm.max_uses_per_user ?? undefined,
    allow_stacking: editForm.allow_stacking,
    exclude_from_other_promos: editForm.exclude_from_other_promos,
    visibility_boost: editForm.visibility_boost ?? undefined,
    products: productIdsFromPromotion(),
  }
  try {
    if (id.value != null) await promotionsAdminApi.update(id.value, payload)
    else await promotionsAdminApi.updateBySlug(idParam.value, payload)
    await load()
    return true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
    return false
  }
}

function onEditOk(ev: Event) {
  savePromo().then((ok) => {
    if (!ok && ev) (ev as { preventDefault?: () => void }).preventDefault?.()
  })
}

function productIdsFromPromotion(): number[] {
  return productRows.value.map((r) => r.id)
}

async function confirmDelete() {
  const ok = await confirmDestructiveAction({
    title: 'Delete promotion?',
    text: 'Delete this promotion? Existing orders will keep their applied discounts, but new orders will not be able to use it.',
  })
  if (!ok) return
  try {
    if (id.value != null) await promotionsAdminApi.delete(id.value)
    else await promotionsAdminApi.deleteBySlug(idParam.value)
    router.push({ name: 'admin.promotions' })
  } catch (e: unknown) {
    const st = (e as { response?: { status?: number } })?.response?.status
    error.value =
      st === 404
        ? 'Delete is not available on this API (no DELETE /promotions/admin/:slug/). Deactivate the promotion instead.'
        : formatApiError(e, 'Delete failed')
  }
}

async function openAddProductModal() {
  addProductTab.value = 0
  addProductSearch.value = ''
  addProductCandidates.value = []
  selectedProductToAdd.value = []
  addProductCategorySlug.value = null
  addCategoryProducts.value = []
  selectedCategoryProducts.value = []
  if (!categoryOptions.value.length) {
    try {
      const { data } = await catalogPublicApi.listCategories()
      const raw = Array.isArray(data) ? data : (data as { results?: { slug: string; name: string }[] })?.results ?? []
      categoryOptions.value = raw
        .map((c: { slug?: string; name?: string; path?: string }) => ({ slug: c.slug ?? (c as { path?: string }).path ?? '', name: (c as { name?: string }).name ?? c.slug ?? (c as { path?: string }).path ?? '' }))
        .filter((c) => c.slug)
    } catch {
      categoryOptions.value = []
    }
  }
  showAddProductModal.value = true
}

function onAddProductModalHidden() {
  addProductSearch.value = ''
  addProductCategorySlug.value = null
  addCategoryProducts.value = []
  selectedCategoryProducts.value = []
}

async function loadProductsByCategory() {
  const slug = addProductCategorySlug.value
  if (!slug) {
    addCategoryProducts.value = []
    return
  }
  addCategoryProductsLoading.value = true
  selectedCategoryProducts.value = []
  try {
    const { data } = await catalogAdminApi.listProducts({ category_slug: slug })
    const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
    addCategoryProducts.value = raw as Record<string, unknown>[]
  } catch {
    addCategoryProducts.value = []
  } finally {
    addCategoryProductsLoading.value = false
  }
}

function debouncedSearchProducts() {
  if (searchDebounce) clearTimeout(searchDebounce)
  searchDebounce = setTimeout(searchProducts, 300)
}

async function searchProducts() {
  const q = addProductSearch.value.trim()
  if (!q) {
    addProductCandidates.value = []
    return
  }
  addProductLoading.value = true
  try {
    const { data } = await catalogAdminApi.listProducts({ search: q })
    const raw = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
    addProductCandidates.value = raw as Record<string, unknown>[]
  } catch {
    addProductCandidates.value = []
  } finally {
    addProductLoading.value = false
  }
}

function getSelectedIdsToAdd(): number[] {
  const ids: number[] = []
  if (addProductTab.value === 0) {
    for (const row of selectedProductToAdd.value) {
      const n = Number(row.id)
      if (n) ids.push(n)
    }
  } else {
    for (const row of selectedCategoryProducts.value) {
      const n = Number(row.id)
      if (n) ids.push(n)
    }
  }
  return [...new Set(ids)]
}

async function addSelectedProduct(): Promise<boolean> {
  const toAdd = getSelectedIdsToAdd()
  if (!toAdd.length || !slugOrId.value || !promotion.value) return true
  const currentIds = productIdsFromPromotion()
  const newIds = [...currentIds]
  for (const pid of toAdd) {
    if (!newIds.includes(pid)) newIds.push(pid)
  }
  if (newIds.length === currentIds.length) return true
  error.value = ''
  try {
    if (id.value != null) await promotionsAdminApi.patch(id.value, { products: newIds })
    else await promotionsAdminApi.patchBySlug(idParam.value, { products: newIds })
    await load()
    return true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Add product failed')
    return false
  }
}

function onAddProductOk(ev: Event) {
  addSelectedProduct().then((ok) => {
    if (!ok && ev) (ev as { preventDefault?: () => void }).preventDefault?.()
  })
}

async function removeProduct(productId: number) {
  if (!slugOrId.value) return
  const currentIds = productIdsFromPromotion().filter((pid) => pid !== productId)
  error.value = ''
  try {
    if (id.value != null) await promotionsAdminApi.patch(id.value, { products: currentIds })
    else await promotionsAdminApi.patchBySlug(idParam.value, { products: currentIds })
    await load()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Remove product failed')
  }
}

onMounted(load)
watch(idParam, load)
</script>

<style scoped>
.promo-cover-img,
.promo-cover-preview {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
</style>
