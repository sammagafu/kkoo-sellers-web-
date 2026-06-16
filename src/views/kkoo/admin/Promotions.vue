<template>
  <VerticalLayout>
    <b-card title="Promotions">
      <b-tabs v-model="activeTab" content-class="pt-3">
        <b-tab title="Promotions">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <p class="text-muted mb-0 me-auto">Create, edit and delete promotions.</p>
            <b-form-input v-model="searchPromos" placeholder="Search promotions..." class="w-auto" style="max-width: 200px;" />
            <b-button variant="outline-secondary" size="sm" @click="exportPromosCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadPromosTemplate">CSV template</b-button>
            <b-button variant="primary" size="sm" @click="openPromoCreate">Create promotion</b-button>
          </div>
          <b-table v-if="filteredPromos.length" :items="filteredPromos" :fields="promoFields" striped responsive>
            <template #cell(status)="data">
              <b-badge :variant="promoStatusVariant(data.item)">{{ promoStatusLabel(data.item) }}</b-badge>
            </template>
            <template #cell(expiry)="data">
              <span>{{ formatPromoExpiry(data.item.end_datetime) }}</span>
              <b-badge v-if="isPromoExpired(data.item.end_datetime)" variant="danger" class="ms-1">Expired</b-badge>
            </template>
            <template #cell(actions)="data">
              <b-button size="sm" variant="outline-primary" class="me-1" :to="{ name: 'admin.promotions.detail', params: { id: String(promotionDetailIdParam(data.item)) } }">View</b-button>
              <b-button size="sm" variant="outline-secondary" class="me-1" @click="openPromoEdit(data.item)">Edit</b-button>
              <b-button size="sm" variant="outline-danger" @click="deletePromo(data.item)">Delete</b-button>
            </template>
          </b-table>
          <p v-else-if="loadingPromos">Loading…</p>
          <EmptyState v-else />
          <p v-if="filteredPromos.length" class="text-muted small mt-2">Showing {{ filteredPromos.length }} promotion(s)</p>
        </b-tab>
        <b-tab title="Codes">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <p class="text-muted mb-0 me-auto">Discount codes.</p>
            <b-form-input v-model="searchCodes" placeholder="Search codes..." class="w-auto" style="max-width: 200px;" />
            <b-button variant="outline-secondary" size="sm" @click="exportCodesCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadCodesTemplate">CSV template</b-button>
            <b-button variant="outline-primary" size="sm" @click="triggerCodeImportInput">Import CSV</b-button>
            <input ref="codeImportInputRef" type="file" accept=".csv" class="d-none" @change="onCodeImportFile" />
            <b-button variant="primary" size="sm" @click="openCodeCreate">Create code</b-button>
          </div>
          <p v-if="codeImportResult" class="text-info small">{{ codeImportResult }}</p>
          <b-table v-if="filteredCodes.length" :items="filteredCodes" :fields="codeFields" striped responsive>
            <template #cell(actions)="data">
              <b-button size="sm" variant="outline-primary" class="me-1" @click="openCodeEdit(data.item)">Edit</b-button>
              <b-button size="sm" variant="outline-danger" @click="deleteCode(data.item)">Delete</b-button>
            </template>
          </b-table>
          <p v-else-if="loadingCodes">Loading…</p>
          <EmptyState v-else />
          <p v-if="filteredCodes.length" class="text-muted small mt-2">Showing {{ filteredCodes.length }} code(s)</p>
        </b-tab>
        <b-tab title="Bundles">
          <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
            <p class="text-muted mb-0 me-auto">Bundle deals (linked to a promotion).</p>
            <b-form-input v-model="searchBundles" placeholder="Search bundles..." class="w-auto" style="max-width: 200px;" />
            <b-button variant="outline-secondary" size="sm" @click="exportBundlesCsv">Export CSV</b-button>
            <b-button variant="outline-secondary" size="sm" @click="downloadBundlesTemplate">CSV template</b-button>
            <b-button variant="primary" size="sm" @click="openBundleCreate">Create bundle</b-button>
          </div>
          <b-table v-if="filteredBundles.length" :items="filteredBundles" :fields="bundleFields" striped responsive>
            <template #cell(actions)="data">
              <b-button size="sm" variant="outline-primary" class="me-1" @click="openBundleEdit(data.item)">Edit</b-button>
              <b-button size="sm" variant="outline-danger" @click="deleteBundle(data.item)">Delete</b-button>
            </template>
          </b-table>
          <p v-else-if="loadingBundles">Loading…</p>
          <EmptyState v-else />
          <p v-if="filteredBundles.length" class="text-muted small mt-2">Showing {{ filteredBundles.length }} bundle(s)</p>
        </b-tab>
      </b-tabs>
      <p v-if="error" class="text-danger">{{ error }}</p>

      <b-modal v-model="showPromoModal" :title="editPromoId ? 'Edit promotion' : 'Create promotion'" size="lg" @ok="onPromoModalOk">
        <b-form>
          <p class="text-muted small mb-3">Set discount rules and limits. Optional fields can be left blank; you can edit them later on the promotion detail page.</p>
          <b-card title="Basic" class="mb-2">
            <b-form-group label="Name"><b-form-input v-model="promoForm.name" placeholder="e.g. Summer Sale" /></b-form-group>
            <b-form-group label="Type"><b-form-select v-model="promoForm.promotion_type" :options="promoTypeOptions" /></b-form-group>
            <b-form-group label="Discount % (1–70)"><b-form-input v-model.number="promoForm.discount_percent" type="number" min="1" max="70" /></b-form-group>
            <b-form-group label="Start"><b-form-input v-model="promoForm.start_datetime" type="datetime-local" /></b-form-group>
            <b-form-group label="End"><b-form-input v-model="promoForm.end_datetime" type="datetime-local" /></b-form-group>
            <b-form-group label="Description"><b-form-textarea v-model="promoForm.description" rows="2" placeholder="Optional" /></b-form-group>
            <b-form-group label="Cover image (1920×786 banner)" :description="editPromoId ? 'Upload a new image to replace (optional).' : 'Required. Image will be resized/cropped to 1920×786.'">
              <img v-if="promoForm.cover_preview" :src="promoForm.cover_preview" alt="Cover" class="promo-cover-preview mb-2" />
              <input type="file" accept="image/*" class="form-control" @change="onPromoCoverFileChange" />
            </b-form-group>
          </b-card>
          <b-card title="Order &amp; caps" class="mb-2">
            <b-form-group label="Priority" description="When several promotions could apply, the one with higher priority wins."><b-form-input v-model.number="promoForm.priority" type="number" placeholder="Optional" /></b-form-group>
            <b-form-group label="Min order amount" description="Minimum order amount (in currency) required for this promotion to apply."><b-form-input v-model.number="promoForm.min_order_amount" type="number" step="0.01" placeholder="Optional" /></b-form-group>
            <b-form-group label="Max discount cap (per order)" description="Maximum discount amount per order from this promotion (cap in currency)."><b-form-input v-model.number="promoForm.max_discount_cap" type="number" step="0.01" placeholder="Optional" /></b-form-group>
            <b-form-group label="Max total burn (lifetime)" description="Cap on total discount this promotion can give overall (lifetime)."><b-form-input v-model.number="promoForm.max_total_burn" type="number" step="0.01" placeholder="Optional" /></b-form-group>
          </b-card>
          <b-card title="Usage limits" class="mb-2">
            <b-form-group label="Max uses (total)" description="Maximum times this promotion can be used in total."><b-form-input v-model.number="promoForm.max_uses" type="number" min="0" placeholder="Optional" /></b-form-group>
            <b-form-group label="Max uses per user" description="Maximum times one user can use this promotion."><b-form-input v-model.number="promoForm.max_uses_per_user" type="number" min="0" placeholder="Optional" /></b-form-group>
          </b-card>
          <b-card title="Options" class="mb-2">
            <b-form-checkbox v-model="promoForm.allow_stacking">Allow stacking — customer can combine this with other promotions</b-form-checkbox>
            <b-form-checkbox v-model="promoForm.exclude_from_other_promos">Exclude from other promos — if used, customer cannot use other promotions</b-form-checkbox>
            <b-form-group label="Visibility boost" description="Boost in listing/search (if supported)."><b-form-input v-model.number="promoForm.visibility_boost" type="number" placeholder="Optional" /></b-form-group>
          </b-card>
        </b-form>
      </b-modal>
      <b-modal v-model="showCodeModal" :title="editCodeId ? 'Edit code' : 'Create code'" @ok="saveCode">
        <b-form>
          <b-form-group label="Code"><b-form-input v-model="codeForm.code" /></b-form-group>
          <b-form-group label="Discount amount"><b-form-input v-model="codeForm.discount_amount" type="number" step="0.01" /></b-form-group>
          <b-form-group label="Valid from"><b-form-input v-model="codeForm.valid_from" type="datetime-local" /></b-form-group>
          <b-form-group label="Valid until"><b-form-input v-model="codeForm.valid_until" type="datetime-local" /></b-form-group>
        </b-form>
      </b-modal>
      <b-modal v-model="showBundleModal" :title="editBundleId ? 'Edit bundle' : 'Create bundle'" @ok="saveBundle">
        <b-form>
          <b-form-group label="Promotion ID"><b-form-input v-model.number="bundleForm.promotion" type="number" /></b-form-group>
          <b-form-group label="Bundle price"><b-form-input v-model="bundleForm.bundle_price" type="number" step="0.01" /></b-form-group>
          <b-form-group label="Bundle SKU IDs (comma-separated)"><b-form-input v-model="bundleForm.bundle_skus_text" placeholder="1,2,3" /></b-form-group>
        </b-form>
      </b-modal>
    </b-card>
  </VerticalLayout>
</template>

<script setup lang="ts">
import VerticalLayout from '@/layouts/VerticalLayout.vue'
import EmptyState from '@/components/EmptyState.vue'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { promotionsAdminApi } from '@/api'
import { resolveAssetUrl } from '@/utils/assetUrl'
import { formatApiError } from '@/utils/formatApiError'
import { exportToCsv, downloadCsvTemplate, parseCsvFile } from '@/composables/useCsv'
import Swal from 'sweetalert2'

const router = useRouter()
const activeTab = ref(0)
const error = ref('')
const promos = ref<Record<string, unknown>[]>([])
const codes = ref<Record<string, unknown>[]>([])
const bundles = ref<Record<string, unknown>[]>([])
const searchPromos = ref('')
const searchCodes = ref('')
const searchBundles = ref('')
const codeImportResult = ref('')
const codeImportInputRef = ref<HTMLInputElement | null>(null)
const loadingPromos = ref(false)
const loadingCodes = ref(false)
const loadingBundles = ref(false)

const filteredPromos = computed(() => {
  const q = searchPromos.value.toLowerCase().trim()
  if (!q) return promos.value
  return promos.value.filter((p) => (String(p.name ?? '') + String(p.promotion_type ?? '')).toLowerCase().includes(q))
})
const filteredCodes = computed(() => {
  const q = searchCodes.value.toLowerCase().trim()
  if (!q) return codes.value
  return codes.value.filter((p) => String(p.code ?? '').toLowerCase().includes(q))
})
const filteredBundles = computed(() => {
  const q = searchBundles.value.toLowerCase().trim()
  if (!q) return bundles.value
  return bundles.value.filter((p) => String(p.promotion ?? '') === q || String(p.bundle_price ?? '').includes(q))
})
const showPromoModal = ref(false)
const showCodeModal = ref(false)
const showBundleModal = ref(false)
const editPromoId = ref<number | null>(null)
const editCodeId = ref<number | null>(null)
const editBundleId = ref<number | null>(null)
const promoTypeOptions = [
  { value: 'flash', text: 'Flash' },
  { value: 'timed', text: 'Timed' },
  { value: 'bundle', text: 'Bundle' },
  { value: 'seller', text: 'Seller' },
  { value: 'category', text: 'Category' },
]
const promoFields = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'promotion_type', label: 'Type' },
  { key: 'discount_percent', label: 'Discount %' },
  { key: 'status', label: 'Status' },
  { key: 'expiry', label: 'Expiry' },
  { key: 'actions', label: 'Actions' },
]

function promoStatusLabel(item: Record<string, unknown>): string {
  const end = item.end_datetime
  if (end && new Date(String(end)).getTime() < Date.now()) return 'Expired'
  return item.is_active ? 'Active' : 'Inactive'
}

function promoStatusVariant(item: Record<string, unknown>): string {
  const end = item.end_datetime
  if (end && new Date(String(end)).getTime() < Date.now()) return 'danger'
  return item.is_active ? 'success' : 'secondary'
}

function formatPromoExpiry(endDatetime: unknown): string {
  if (!endDatetime) return '—'
  const d = new Date(String(endDatetime))
  return isNaN(d.getTime()) ? String(endDatetime) : d.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
}

function isPromoExpired(endDatetime: unknown): boolean {
  if (!endDatetime) return false
  const d = new Date(String(endDatetime))
  return !isNaN(d.getTime()) && d.getTime() < Date.now()
}
const codeFields = [
  { key: 'id', label: 'ID' },
  { key: 'code', label: 'Code' },
  { key: 'discount_amount', label: 'Amount' },
  { key: 'valid_from', label: 'Valid from' },
  { key: 'valid_until', label: 'Valid until' },
  { key: 'actions', label: 'Actions' },
]
const bundleFields = [
  { key: 'id', label: 'ID' },
  { key: 'promotion', label: 'Promotion ID' },
  { key: 'bundle_price', label: 'Price' },
  { key: 'actions', label: 'Actions' },
]
const promoForm = reactive({
  name: '',
  promotion_type: 'timed',
  discount_percent: 10,
  start_datetime: '',
  end_datetime: '',
  description: '' as string,
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
const codeForm = reactive({ code: '', discount_amount: 0, valid_from: '', valid_until: '' })
const bundleForm = reactive({ promotion: 0, bundle_price: '0', bundle_skus_text: '' })

async function loadPromos() {
  loadingPromos.value = true
  try {
    const { data } = await promotionsAdminApi.list()
    promos.value = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load promotions')
  } finally {
    loadingPromos.value = false
  }
}
async function loadCodes() {
  loadingCodes.value = true
  try {
    const { data } = await promotionsAdminApi.listCodes()
    codes.value = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load codes')
  } finally {
    loadingCodes.value = false
  }
}
async function loadBundles() {
  loadingBundles.value = true
  try {
    const { data } = await promotionsAdminApi.listBundles()
    bundles.value = Array.isArray(data) ? data : (data as { results?: unknown[] })?.results ?? []
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Failed to load bundles')
  } finally {
    loadingBundles.value = false
  }
}
onMounted(() => {
  loadPromos()
  loadCodes()
  loadBundles()
})

function onPromoCoverFileChange(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  promoForm.cover_file = file ?? null
  promoForm.cover_preview = file ? URL.createObjectURL(file) : ''
  input.value = ''
}

function openPromoCreate() {
  editPromoId.value = null
  promoForm.name = ''
  promoForm.promotion_type = 'timed'
  promoForm.discount_percent = 10
  promoForm.start_datetime = ''
  promoForm.end_datetime = ''
  promoForm.description = ''
  promoForm.cover_image = ''
  promoForm.cover_file = null
  promoForm.cover_preview = ''
  promoForm.priority = null
  promoForm.min_order_amount = null
  promoForm.max_discount_cap = null
  promoForm.max_total_burn = null
  promoForm.max_uses = null
  promoForm.max_uses_per_user = null
  promoForm.allow_stacking = false
  promoForm.exclude_from_other_promos = false
  promoForm.visibility_boost = null
  showPromoModal.value = true
}
async function openPromoEdit(item: Record<string, unknown>) {
  editPromoId.value = item.id as number
  promoForm.cover_file = null
  const slug = typeof item.slug === 'string' && item.slug ? item.slug : null
  try {
    const { data } = await (slug ? promotionsAdminApi.getBySlug(slug) : promotionsAdminApi.get(item.id as number))
    const d = data as Record<string, unknown>
    promoForm.name = String(d.name ?? '')
    promoForm.promotion_type = String(d.promotion_type ?? 'timed')
    promoForm.discount_percent = Number(d.discount_percent ?? 10)
    promoForm.start_datetime = d.start_datetime ? String(d.start_datetime).slice(0, 16) : ''
    promoForm.end_datetime = d.end_datetime ? String(d.end_datetime).slice(0, 16) : ''
    promoForm.description = String(d.description ?? '')
    promoForm.cover_image = String(d.cover_image ?? d.cover ?? '')
    promoForm.cover_preview = promoForm.cover_image ? (resolveAssetUrl(promoForm.cover_image) ?? '') : ''
    promoForm.priority = d.priority != null ? Number(d.priority) : null
    promoForm.min_order_amount = d.min_order_amount != null ? Number(d.min_order_amount) : null
    promoForm.max_discount_cap = d.max_discount_cap != null ? Number(d.max_discount_cap) : null
    promoForm.max_total_burn = d.max_total_burn != null ? Number(d.max_total_burn) : null
    promoForm.max_uses = d.max_uses != null ? Number(d.max_uses) : null
    promoForm.max_uses_per_user = d.max_uses_per_user != null ? Number(d.max_uses_per_user) : null
    promoForm.allow_stacking = Boolean(d.allow_stacking)
    promoForm.exclude_from_other_promos = Boolean(d.exclude_from_other_promos)
    promoForm.visibility_boost = d.visibility_boost != null ? Number(d.visibility_boost) : null
  } catch {
    promoForm.name = String(item.name ?? '')
    promoForm.promotion_type = String(item.promotion_type ?? 'timed')
    promoForm.discount_percent = Number(item.discount_percent ?? 10)
    promoForm.cover_preview = item.cover_image || item.cover ? (resolveAssetUrl(String(item.cover_image ?? item.cover)) ?? '') : ''
  }
  showPromoModal.value = true
}
function appendPromoFormToFormData(fd: FormData) {
  fd.append('name', promoForm.name)
  if (promoForm.promotion_type) fd.append('promotion_type', promoForm.promotion_type)
  if (promoForm.description) fd.append('description', promoForm.description)
  if (promoForm.discount_percent != null) fd.append('discount_percent', String(promoForm.discount_percent))
  if (promoForm.priority != null) fd.append('priority', String(promoForm.priority))
  if (promoForm.start_datetime) fd.append('start_datetime', promoForm.start_datetime)
  if (promoForm.end_datetime) fd.append('end_datetime', promoForm.end_datetime)
  if (promoForm.min_order_amount != null) fd.append('min_order_amount', String(promoForm.min_order_amount))
  if (promoForm.max_discount_cap != null) fd.append('max_discount_cap', String(promoForm.max_discount_cap))
  if (promoForm.max_total_burn != null) fd.append('max_total_burn', String(promoForm.max_total_burn))
  if (promoForm.max_uses != null) fd.append('max_uses', String(promoForm.max_uses))
  if (promoForm.max_uses_per_user != null) fd.append('max_uses_per_user', String(promoForm.max_uses_per_user))
  fd.append('allow_stacking', String(promoForm.allow_stacking))
  fd.append('exclude_from_other_promos', String(promoForm.exclude_from_other_promos))
  if (promoForm.visibility_boost != null) fd.append('visibility_boost', String(promoForm.visibility_boost))
}

function onPromoModalOk(ev: Event) {
  savePromo(ev).then((ok) => {
    if (!ok && ev) (ev as { preventDefault?: () => void }).preventDefault?.()
  })
}

async function savePromo(ev?: Event): Promise<boolean> {
  try {
    error.value = ''
    const slug = editPromoId.value != null ? (promos.value.find((p) => p.id === editPromoId.value) as Record<string, unknown> | undefined)?.slug as string | undefined : undefined
    const hasCoverFile = !!promoForm.cover_file

    if (hasCoverFile) {
      const fd = new FormData()
      appendPromoFormToFormData(fd)
      fd.append('cover_image', promoForm.cover_file!)
      if (editPromoId.value != null && slug) {
        await promotionsAdminApi.updateWithCover(slug, fd)
      } else {
        await promotionsAdminApi.createWithCover(fd)
      }
    } else {
      const payload: Record<string, unknown> = {
        name: promoForm.name,
        promotion_type: promoForm.promotion_type,
        discount_percent: promoForm.discount_percent,
        start_datetime: promoForm.start_datetime || undefined,
        end_datetime: promoForm.end_datetime || undefined,
        description: promoForm.description || undefined,
        cover_image: promoForm.cover_image || undefined,
        priority: promoForm.priority ?? undefined,
        min_order_amount: promoForm.min_order_amount ?? undefined,
        max_discount_cap: promoForm.max_discount_cap ?? undefined,
        max_total_burn: promoForm.max_total_burn ?? undefined,
        max_uses: promoForm.max_uses ?? undefined,
        max_uses_per_user: promoForm.max_uses_per_user ?? undefined,
        allow_stacking: promoForm.allow_stacking,
        exclude_from_other_promos: promoForm.exclude_from_other_promos,
        visibility_boost: promoForm.visibility_boost ?? undefined,
      }
      if (editPromoId.value != null) {
        if (slug) await promotionsAdminApi.updateBySlug(slug, payload)
        else await promotionsAdminApi.update(editPromoId.value, payload)
      } else {
        if (!promoForm.name?.trim()) {
          error.value = 'Name is required.'
          return false
        }
        error.value = 'Cover image is required when creating a promotion. Please upload an image (1920×786 recommended).'
        return false
      }
    }
    await loadPromos()
    return true
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
    return false
  }
}
async function deletePromo(item: Record<string, unknown>) {
  if (!(await Swal.fire({ title: 'Delete promotion?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) return
  try {
    const slug = typeof item.slug === 'string' && item.slug ? item.slug : null
    if (slug) await promotionsAdminApi.deleteBySlug(slug)
    else await promotionsAdminApi.delete(item.id as number)
    await loadPromos()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

/** Use slug for View/API only when present and non-empty; otherwise id so backend finds the promotion. */
function promotionDetailIdParam(item: Record<string, unknown>): string | number {
  const slug = item.slug
  if (typeof slug === 'string' && slug.trim()) return slug
  return item.id as number
}

function promoSlugOrId(item: Record<string, unknown>): string | number {
  return promotionDetailIdParam(item)
}

function openCodeCreate() {
  editCodeId.value = null
  codeForm.code = ''
  codeForm.discount_amount = 0
  codeForm.valid_from = ''
  codeForm.valid_until = ''
  showCodeModal.value = true
}
async function openCodeEdit(item: Record<string, unknown>) {
  editCodeId.value = item.id as number
  try {
    const { data } = await promotionsAdminApi.getCode(item.id as number)
    const d = data as Record<string, unknown>
    codeForm.code = String(d.code ?? '')
    codeForm.discount_amount = Number(d.discount_amount ?? 0)
    codeForm.valid_from = d.valid_from ? String(d.valid_from).slice(0, 16) : ''
    codeForm.valid_until = d.valid_until ? String(d.valid_until).slice(0, 16) : ''
  } catch {
    codeForm.code = String(item.code ?? '')
    codeForm.discount_amount = Number(item.discount_amount ?? 0)
  }
  showCodeModal.value = true
}
async function saveCode() {
  try {
    const payload: Record<string, unknown> = {
      code: codeForm.code,
      discount_amount: codeForm.discount_amount,
      valid_from: codeForm.valid_from || new Date().toISOString(),
      valid_until: codeForm.valid_until || new Date(Date.now() + 86400000).toISOString(),
    }
    if (editCodeId.value) await promotionsAdminApi.updateCode(editCodeId.value, payload)
    else await promotionsAdminApi.createCode(payload)
    await loadCodes()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
  }
}
async function deleteCode(item: Record<string, unknown>) {
  if (!(await Swal.fire({ title: 'Delete code?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) return
  try {
    await promotionsAdminApi.deleteCode(item.id as number)
    await loadCodes()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

function openBundleCreate() {
  editBundleId.value = null
  bundleForm.promotion = 0
  bundleForm.bundle_price = '0'
  bundleForm.bundle_skus_text = ''
  showBundleModal.value = true
}
async function openBundleEdit(item: Record<string, unknown>) {
  editBundleId.value = item.id as number
  try {
    const { data } = await promotionsAdminApi.getBundle(item.id as number)
    const d = data as Record<string, unknown>
    bundleForm.promotion = Number(d.promotion ?? 0)
    bundleForm.bundle_price = String(d.bundle_price ?? '0')
    const skus = d.bundle_skus as number[] | undefined
    bundleForm.bundle_skus_text = skus?.length ? skus.join(',') : ''
  } catch {
    bundleForm.promotion = Number(item.promotion ?? 0)
    bundleForm.bundle_price = String(item.bundle_price ?? '0')
  }
  showBundleModal.value = true
}
async function saveBundle() {
  try {
    const skus = bundleForm.bundle_skus_text
      ? bundleForm.bundle_skus_text.split(',').map((x) => parseInt(x.trim(), 10)).filter((n) => !isNaN(n))
      : []
    const payload: Record<string, unknown> = {
      promotion: bundleForm.promotion,
      bundle_price: parseFloat(bundleForm.bundle_price) || 0,
      bundle_skus: skus,
    }
    if (editBundleId.value) await promotionsAdminApi.updateBundle(editBundleId.value, payload)
    else await promotionsAdminApi.createBundle(payload)
    await loadBundles()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Save failed')
  }
}
async function deleteBundle(item: Record<string, unknown>) {
  if (!(await Swal.fire({ title: 'Delete bundle?', icon: 'warning', showCancelButton: true, confirmButtonColor: '#d33' })).isConfirmed) return
  try {
    await promotionsAdminApi.deleteBundle(item.id as number)
    await loadBundles()
  } catch (e: unknown) {
    error.value = formatApiError(e, 'Delete failed')
  }
}

const promoCsvCols = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'promotion_type', label: 'Type' },
  { key: 'discount_percent', label: 'Discount %' },
  { key: 'start_datetime', label: 'Start' },
  { key: 'end_datetime', label: 'End' },
]
function exportPromosCsv() {
  exportToCsv(filteredPromos.value, promoCsvCols, 'promotions-export.csv')
}
function downloadPromosTemplate() {
  downloadCsvTemplate(promoCsvCols, 'promotions-template.csv', { name: 'Summer Sale', promotion_type: 'timed', discount_percent: '15', start_datetime: '', end_datetime: '' })
}

const codeCsvCols = [
  { key: 'code', label: 'Code' },
  { key: 'discount_amount', label: 'Discount amount' },
  { key: 'valid_from', label: 'Valid from' },
  { key: 'valid_until', label: 'Valid until' },
]
function exportCodesCsv() {
  exportToCsv(filteredCodes.value, codeCsvCols, 'promotion-codes-export.csv')
}
function downloadCodesTemplate() {
  downloadCsvTemplate(codeCsvCols, 'promotion-codes-template.csv', { code: 'SAVE10', discount_amount: '10', valid_from: '', valid_until: '' })
}
function triggerCodeImportInput() {
  codeImportInputRef.value?.click()
}
async function onCodeImportFile(ev: Event) {
  const input = ev.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  codeImportResult.value = ''
  try {
    const rows = await parseCsvFile(file)
    let created = 0
    let failed = 0
    for (const row of rows) {
      const code = (row['Code'] ?? row['code'] ?? '').trim()
      if (!code) continue
      try {
        await promotionsAdminApi.createCode({
          code,
          discount_amount: parseFloat(row['Discount amount'] ?? row['discount_amount'] ?? '0') || 0,
          valid_from: (row['Valid from'] ?? row['valid_from'] ?? '') || new Date().toISOString(),
          valid_until: (row['Valid until'] ?? row['valid_until'] ?? '') || new Date(Date.now() + 86400000).toISOString(),
        })
        created++
      } catch {
        failed++
      }
    }
    codeImportResult.value = `Import done: ${created} created, ${failed} failed.`
    await loadCodes()
  } catch (e) {
    codeImportResult.value = 'Import failed: ' + (e instanceof Error ? e.message : 'Invalid CSV')
  }
}

const bundleCsvCols = [
  { key: 'id', label: 'ID' },
  { key: 'promotion', label: 'Promotion ID' },
  { key: 'bundle_price', label: 'Bundle price' },
]
function exportBundlesCsv() {
  exportToCsv(filteredBundles.value, bundleCsvCols, 'bundles-export.csv')
}
function downloadBundlesTemplate() {
  downloadCsvTemplate(bundleCsvCols, 'bundles-template.csv', { promotion: '1', bundle_price: '99.00' })
}
</script>

<style scoped>
.promo-cover-preview {
  max-width: 100%;
  max-height: 180px;
  object-fit: contain;
  border-radius: 8px;
  border: 1px solid var(--bs-border-color, #dee2e6);
}
</style>
